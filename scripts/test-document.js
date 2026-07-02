/**
 * Standalone quality test for the document feature.
 * Runs the real AI pipeline (Gemini/OpenRouter) + DOCX renderer and writes a
 * .docx to test-output/ — no Postgres/Redis/Telegram needed.
 *
 * Run:  node --env-file=.env scripts/test-document.js "Topic" mustaqil_ish 15 uz
 */
const fs = require('fs');
const path = require('path');

const { OpenRouterProvider } = require('../dist/ai/providers/openrouter.provider');
const { ImageService } = require('../dist/ai/services/image.service');
const { DocAiClient } = require('../dist/document/agents/doc-ai.client');
const { DocPlannerAgent } = require('../dist/document/agents/doc-planner.agent');
const { DocWriterAgent } = require('../dist/document/agents/doc-writer.agent');
const { DocumentPipeline } = require('../dist/document/pipeline/document.pipeline');
const { DocxRendererService } = require('../dist/document/renderer/docx-renderer.service');

// Minimal ConfigService stub mapping the dotted keys the providers read.
const config = {
  get: (key) =>
    ({
      'ai.openrouterApiKey': process.env.OPENROUTER_API_KEY,
      'storage.path': './storage',
      'images.unsplashAccessKey': process.env.UNSPLASH_ACCESS_KEY,
      'images.pexelsApiKey': process.env.PEXELS_API_KEY,
      'images.openrouterApiKey': process.env.OPENROUTER_API_KEY,
      'images.openrouterEnabled': (process.env.IMAGE_OPENROUTER_ENABLED || 'true') !== 'false',
      'images.generateModel': process.env.IMAGE_GENERATION_MODEL,
    })[key],
};

const [, , topicArg, typeArg, pagesArg, langArg] = process.argv;
const topic = topicArg || 'Fotosintez jarayoni va uning biologik ahamiyati';
const docType = typeArg || 'mustaqil_ish';
const pageCount = parseInt(pagesArg || '15', 10);
const language = langArg || 'uz';

(async () => {
  const openrouter = new OpenRouterProvider(config);
  const ai = new DocAiClient(openrouter);
  const imageService = new ImageService(config);
  const pipeline = new DocumentPipeline(
    new DocPlannerAgent(ai),
    new DocWriterAgent(ai),
    imageService,
  );
  const renderer = new DocxRendererService();

  console.log(`\n▶  Generating ${docType} (${pageCount} pages, ${language}): "${topic}"\n`);
  const start = Date.now();

  const output = await pipeline.generate(
    {
      topic,
      docType,
      pageCount,
      language,
      institution: 'Toshkent davlat pedagogika universiteti',
      studentName: 'Aliyev Jasur',
      teacherName: 'Karimova N.T.',
    },
    ({ progress, message }) => console.log(`   [${progress}%] ${message}`),
  );

  const buffer = await renderer.renderDocument(output);

  const outDir = path.join(__dirname, '..', 'test-output');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${docType}-${Date.now()}.docx`);
  fs.writeFileSync(outFile, buffer);

  const seconds = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✅ Done in ${seconds}s`);
  console.log(`   AI cost:  $${output.metadata.totalCost.toFixed(5)}`);
  console.log(`   Sections: ${output.sections.length}`);
  console.log(`   File:     ${outFile}`);
  console.log(`\n   Open it:  open "${outFile}"\n`);
})().catch((err) => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
