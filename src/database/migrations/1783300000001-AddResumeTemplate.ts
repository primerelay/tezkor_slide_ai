import { MigrationInterface, QueryRunner } from "typeorm";

/** Adds the "template" column if the resumes table pre-dates the template feature. */
export class AddResumeTemplate1783300000001 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "template" VARCHAR(20) NOT NULL DEFAULT 'classic'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "resumes" DROP COLUMN IF EXISTS "template"`);
    }

}
