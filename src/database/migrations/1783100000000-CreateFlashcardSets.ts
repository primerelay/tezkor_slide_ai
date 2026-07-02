import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFlashcardSets1783100000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "flashcard_sets" (
                "id" SERIAL PRIMARY KEY,
                "userId" INTEGER NOT NULL,
                "title" VARCHAR(255) NOT NULL,
                "sourceContent" TEXT NOT NULL,
                "language" VARCHAR(5) NOT NULL DEFAULT 'uz',
                "cardCount" INTEGER NOT NULL DEFAULT 10,
                "status" VARCHAR(20) NOT NULL DEFAULT 'completed',
                "cards" JSONB NOT NULL DEFAULT '[]',
                "price" INTEGER NOT NULL DEFAULT 0,
                "generationCost" DECIMAL(10,6) NOT NULL DEFAULT 0,
                "errorMessage" TEXT,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "FK_flashcard_sets_userId" FOREIGN KEY ("userId")
                    REFERENCES "users"("id") ON DELETE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_flashcard_sets_userId" ON "flashcard_sets" ("userId");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_flashcard_sets_userId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "flashcard_sets"`);
    }

}
