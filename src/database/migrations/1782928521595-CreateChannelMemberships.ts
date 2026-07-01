import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateChannelMemberships1782928521595 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "channel_memberships" (
                "id" SERIAL PRIMARY KEY,
                "userId" INTEGER NOT NULL,
                "channelUsername" VARCHAR(255) NOT NULL,
                "status" VARCHAR(20) NOT NULL,
                "joinedAt" TIMESTAMP NOT NULL,
                "leftAt" TIMESTAMP,
                "rewardGiven" BOOLEAN NOT NULL DEFAULT false,
                "rewardAmount" INTEGER NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "FK_channel_memberships_userId" FOREIGN KEY ("userId")
                    REFERENCES "users"("id") ON DELETE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_channel_memberships_userId" ON "channel_memberships" ("userId");
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_channel_memberships_userId_channelUsername"
            ON "channel_memberships" ("userId", "channelUsername");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_channel_memberships_userId_channelUsername"`);
        await queryRunner.query(`DROP INDEX "IDX_channel_memberships_userId"`);
        await queryRunner.query(`DROP TABLE "channel_memberships"`);
    }

}
