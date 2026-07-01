import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReferralFieldsToUser1782929582728 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add referral tracking columns to users table
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN "referredBy" INTEGER,
            ADD COLUMN "referralCount" INTEGER NOT NULL DEFAULT 0,
            ADD COLUMN "referralCode" VARCHAR(255) UNIQUE;
        `);

        // Create index on referralCode for fast lookups
        await queryRunner.query(`
            CREATE INDEX "IDX_users_referralCode" ON "users" ("referralCode");
        `);

        // Create index on referredBy for analytics
        await queryRunner.query(`
            CREATE INDEX "IDX_users_referredBy" ON "users" ("referredBy");
        `);

        // Generate referral codes for existing users
        await queryRunner.query(`
            UPDATE "users"
            SET "referralCode" = 'ref_' || "id" || '_' || substr(md5(random()::text), 1, 8)
            WHERE "referralCode" IS NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_users_referredBy"`);
        await queryRunner.query(`DROP INDEX "IDX_users_referralCode"`);
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN "referralCode",
            DROP COLUMN "referralCount",
            DROP COLUMN "referredBy";
        `);
    }

}
