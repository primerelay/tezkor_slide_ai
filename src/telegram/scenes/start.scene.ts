import { Scene, SceneEnter, Ctx, Action } from 'nestjs-telegraf';
import { BotContext } from '../telegram.update';
import { TelegramService } from '../telegram.service';
import { InlineKeyboards } from '../keyboards/inline.keyboards';

@Scene('start')
export class StartScene {
  constructor(private readonly telegramService: TelegramService) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: BotContext) {
    const telegramUser = ctx.from;
    if (!telegramUser) return;

    const user = await this.telegramService.findOrCreateUser({
      id: telegramUser.id,
      username: telegramUser.username,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
    });

    ctx.session.userId = user.id;
    ctx.session.language = user.language;

    const i18n = this.telegramService.getI18n(user.language);

    await ctx.reply(i18n.t('welcome', { name: user.firstName || 'User' }), {
      parse_mode: 'HTML',
      reply_markup: InlineKeyboards.mainMenu(i18n),
    });

    await ctx.scene.leave();
  }
}
