import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelMembership, MembershipStatus } from '../database/entities/channel-membership.entity';
import { User } from '../database/entities/user.entity';
import { Transaction } from '../database/entities/transaction.entity';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { I18nService } from '../common/i18n/i18n.service';

const REFERRAL_REWARD_AMOUNT = 1000; // 1000 som for joining channel

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(
    @InjectRepository(ChannelMembership)
    private readonly membershipRepository: Repository<ChannelMembership>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectBot()
    private readonly bot: Telegraf,
  ) {}

  /**
   * Handle user joining the channel - award bonus if eligible
   */
  async handleChannelJoin(
    userId: number,
    channelUsername: string,
  ): Promise<{ rewarded: boolean; amount: number }> {
    try {
      // Check if user has ever received reward for this channel
      const existingMembership = await this.membershipRepository.findOne({
        where: {
          userId,
          channelUsername,
          rewardGiven: true,
        },
      });

      // If reward already given, don't give again
      if (existingMembership) {
        this.logger.log(
          `User ${userId} already received reward for channel @${channelUsername}`,
        );

        // Update status to joined but don't give reward
        const existingRecord = await this.membershipRepository.findOne({
          where: { userId, channelUsername },
        });
        if (existingRecord) {
          existingRecord.status = 'joined';
          existingRecord.leftAt = undefined;
          existingRecord.updatedAt = new Date();
          await this.membershipRepository.save(existingRecord);
        }

        return { rewarded: false, amount: 0 };
      }

      // Check if there's a membership record (user rejoining)
      let membership = await this.membershipRepository.findOne({
        where: { userId, channelUsername },
      });

      if (membership) {
        // User is rejoining - update status but no reward
        membership.status = 'joined';
        membership.leftAt = undefined;
        membership.updatedAt = new Date();
        await this.membershipRepository.save(membership);

        this.logger.log(
          `User ${userId} rejoined channel @${channelUsername} - no reward`,
        );
        return { rewarded: false, amount: 0 };
      }

      // New member - create membership record and give reward
      membership = this.membershipRepository.create({
        userId,
        channelUsername,
        status: 'joined',
        joinedAt: new Date(),
        rewardGiven: true,
        rewardAmount: REFERRAL_REWARD_AMOUNT,
      });
      await this.membershipRepository.save(membership);

      // Add credits to user
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        this.logger.error(`User ${userId} not found when trying to award referral bonus`);
        return { rewarded: false, amount: 0 };
      }

      user.credits += REFERRAL_REWARD_AMOUNT;
      await this.userRepository.save(user);

      // Get i18n for user's language
      const i18n = new I18nService(user.language);

      // Create transaction record
      const transaction = this.transactionRepository.create({
        userId,
        type: 'topup',
        amount: REFERRAL_REWARD_AMOUNT,
        status: 'approved',
        description: i18n.t('referral.bonusDescription'),
      });
      await this.transactionRepository.save(transaction);

      // Notify user
      try {
        const message = i18n.t('referral.bonus', {
          channel: channelUsername,
          amount: REFERRAL_REWARD_AMOUNT.toLocaleString(),
          balance: user.credits.toLocaleString(),
        });

        await this.bot.telegram.sendMessage(
          user.telegramId,
          message,
          { parse_mode: 'HTML' },
        );
      } catch (error) {
        this.logger.error(`Failed to notify user ${userId} about referral bonus:`, error);
      }

      this.logger.log(
        `User ${userId} joined channel @${channelUsername} - awarded ${REFERRAL_REWARD_AMOUNT} som`,
      );

      // Award referrer if this user was invited by someone
      if (user.referredBy) {
        await this.rewardReferrer(user.referredBy, user, i18n);
      }

      return { rewarded: true, amount: REFERRAL_REWARD_AMOUNT };
    } catch (error) {
      this.logger.error(`Error handling channel join for user ${userId}:`, error);
      return { rewarded: false, amount: 0 };
    }
  }

  /**
   * Handle user leaving the channel
   */
  async handleChannelLeave(
    userId: number,
    channelUsername: string,
    status: MembershipStatus = 'left',
  ): Promise<void> {
    try {
      await this.membershipRepository.update(
        { userId, channelUsername },
        {
          status,
          leftAt: new Date(),
          updatedAt: new Date(),
        },
      );

      this.logger.log(
        `User ${userId} ${status} channel @${channelUsername}`,
      );
    } catch (error) {
      this.logger.error(`Error handling channel leave for user ${userId}:`, error);
    }
  }

  /**
   * Get membership history for a user
   */
  async getUserMembershipHistory(
    userId: number,
    channelUsername: string,
  ): Promise<ChannelMembership[]> {
    return this.membershipRepository.find({
      where: { userId, channelUsername },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Check if user is eligible for reward
   */
  async isEligibleForReward(
    userId: number,
    channelUsername: string,
  ): Promise<boolean> {
    const existingReward = await this.membershipRepository.findOne({
      where: {
        userId,
        channelUsername,
        rewardGiven: true,
      },
    });

    return !existingReward;
  }

  /**
   * Reward the referrer when their invited friend joins the channel
   */
  private async rewardReferrer(
    referrerId: number,
    invitedUser: User,
    invitedUserI18n: I18nService,
  ): Promise<void> {
    try {
      const referrer = await this.userRepository.findOne({
        where: { id: referrerId },
      });

      if (!referrer) {
        this.logger.warn(`Referrer ${referrerId} not found`);
        return;
      }

      // Add credits to referrer
      referrer.credits += REFERRAL_REWARD_AMOUNT;
      referrer.referralCount += 1;
      await this.userRepository.save(referrer);

      // Create transaction record for referrer
      const referrerI18n = new I18nService(referrer.language);
      const transaction = this.transactionRepository.create({
        userId: referrer.id,
        type: 'topup',
        amount: REFERRAL_REWARD_AMOUNT,
        status: 'approved',
        description: referrerI18n.t('referral.referrerBonusDescription', {
          name: invitedUser.firstName || 'User',
        }),
      });
      await this.transactionRepository.save(transaction);

      // Notify referrer
      try {
        const message = referrerI18n.t('referral.referrerBonus', {
          name: invitedUser.firstName || 'Do\'stingiz',
          amount: REFERRAL_REWARD_AMOUNT.toLocaleString(),
          balance: referrer.credits.toLocaleString(),
        });

        await this.bot.telegram.sendMessage(
          referrer.telegramId,
          message,
          { parse_mode: 'HTML' },
        );
      } catch (error) {
        this.logger.error(`Failed to notify referrer ${referrerId}:`, error);
      }

      this.logger.log(
        `Referrer ${referrerId} awarded ${REFERRAL_REWARD_AMOUNT} som for inviting user ${invitedUser.id}`,
      );
    } catch (error) {
      this.logger.error(`Error rewarding referrer ${referrerId}:`, error);
    }
  }
}
