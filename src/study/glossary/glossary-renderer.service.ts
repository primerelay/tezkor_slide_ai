import { Injectable, Logger } from '@nestjs/common';
import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { GlossaryEntry } from '../../database/entities/glossary-set.entity';

const MARGIN = { top: 1134, right: 1134, bottom: 1134, left: 1134 };
const FONT = 'Times New Roman';
const BODY_SIZE = 28; // 14pt
const TITLE_SIZE = 32; // 16pt
const LINE_15 = 360;

@Injectable()
export class GlossaryRendererService {
  private readonly logger = new Logger(GlossaryRendererService.name);

  async render(title: string, entries: GlossaryEntry[]): Promise<Buffer> {
    const children: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 300, line: LINE_15 },
        children: [new TextRun({ text: title, bold: true, size: TITLE_SIZE, font: FONT })],
      }),
    ];

    entries.forEach((e) => {
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 120, line: LINE_15 },
          children: [
            new TextRun({ text: `${e.term}`, bold: true, size: BODY_SIZE, font: FONT }),
            new TextRun({ text: ` — ${e.definition}`, size: BODY_SIZE, font: FONT }),
          ],
        }),
      );
    });

    const doc = new Document({
      creator: 'SliderAI UZ',
      title,
      styles: {
        default: {
          document: {
            run: { font: FONT, size: BODY_SIZE },
            paragraph: { spacing: { line: LINE_15 } },
          },
        },
      },
      sections: [{ properties: { page: { margin: MARGIN } }, children }],
    });

    const buffer = await Packer.toBuffer(doc);
    this.logger.log(`Glossary DOCX rendered: ${title} (${buffer.length} bytes)`);
    return buffer;
  }
}
