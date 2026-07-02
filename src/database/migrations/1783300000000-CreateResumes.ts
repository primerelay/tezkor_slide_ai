import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateResumes1783300000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "resumes" (
                "id" SERIAL PRIMARY KEY,
                "userId" INTEGER NOT NULL,
                "language" VARCHAR(5) NOT NULL DEFAULT 'uz',
                "data" JSONB NOT NULL,
                "docxUrl" TEXT,
                "price" INTEGER NOT NULL DEFAULT 0,
                "generationCost" DECIMAL(10,6) NOT NULL DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "FK_resumes_userId" FOREIGN KEY ("userId")
                    REFERENCES "users"("id") ON DELETE CASCADE
            );
        `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_resumes_userId" ON "resumes" ("userId");`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "resumes"`);
    }

}
