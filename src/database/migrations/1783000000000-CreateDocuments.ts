import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDocuments1783000000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "documents" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "userId" INTEGER NOT NULL,
                "type" VARCHAR(30) NOT NULL,
                "topic" TEXT NOT NULL,
                "institution" VARCHAR(255),
                "studentName" VARCHAR(255),
                "teacherName" VARCHAR(255),
                "pageCount" INTEGER NOT NULL,
                "language" VARCHAR(5) NOT NULL DEFAULT 'uz',
                "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
                "docxUrl" TEXT,
                "price" INTEGER NOT NULL DEFAULT 0,
                "aiCost" DECIMAL(10,6),
                "generationTimeMs" INTEGER,
                "errorMessage" TEXT,
                "generatedContent" JSONB,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "FK_documents_userId" FOREIGN KEY ("userId")
                    REFERENCES "users"("id") ON DELETE CASCADE
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_documents_userId" ON "documents" ("userId");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_documents_userId"`);
        await queryRunner.query(`DROP TABLE "documents"`);
    }

}
