import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import {
  AlignmentType,
  Document,
  Footer,
  ImageRun,
  LeaderType,
  PageNumber,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
} from 'docx';
import { DocPipelineOutput } from '../pipeline/document.pipeline';
import { WrittenSection } from '../agents/doc-writer.agent';
import { I18nService, SupportedLanguage } from '../../common/i18n/i18n.service';
import { WORDS_PER_PAGE } from '../agents/doc-planner.agent';

// Max rendered image width in pixels (fits the content column at 96 dpi).
const IMAGE_MAX_WIDTH = 450;

// All measurements in twips (1 cm = 567 twips). Standard Uzbek academic
// formatting: left 3cm, right 1.5cm, top/bottom 2cm, TNR 14pt, 1.5 spacing.
const MARGIN = { top: 1134, right: 850, bottom: 1134, left: 1701 };
const FONT = 'Times New Roman';
const BODY_SIZE = 28; // 14pt in half-points
const TITLE_SIZE = 32; // 16pt
const LINE_15 = 360; // 1.5 line spacing (240 = single)
const FIRST_LINE_INDENT = 709; // 1.25 cm
// Right-edge tab position for TOC dot leaders (page width minus margins).
const TOC_TAB_POS = 9355;

@Injectable()
export class DocxRendererService {
  private readonly logger = new Logger(DocxRendererService.name);

  async renderDocument(output: DocPipelineOutput): Promise<Buffer> {
    const lang = (output.language || 'uz') as SupportedLanguage;
    const i18n = I18nService.create(lang);

    const children: Paragraph[] =
      output.format === 'essay'
        ? this.buildEssay(output)
        : [
            ...this.buildTitlePage(output, i18n),
            ...this.buildTableOfContents(output, i18n),
            ...this.buildBody(output, i18n),
            ...this.buildReferences(output, i18n),
          ];

    const doc = new Document({
      creator: 'SliderAI UZ',
      title: output.title,
      styles: {
        default: {
          document: {
            run: { font: FONT, size: BODY_SIZE },
            paragraph: { spacing: { line: LINE_15 } },
          },
        },
      },
      sections: [
        {
          properties: {
            page: { margin: MARGIN },
            // Title page has no page number.
            titlePage: true,
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      children: [PageNumber.CURRENT],
                      font: FONT,
                      size: 24,
                    }),
                  ],
                }),
              ],
            }),
            first: new Footer({ children: [] }),
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    this.logger.log(`DOCX rendered: ${output.title} (${buffer.length} bytes)`);
    return buffer;
  }

  private buildTitlePage(output: DocPipelineOutput, i18n: I18nService): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    const centered = (
      text: string,
      opts: { bold?: boolean; size?: number; before?: number; after?: number; caps?: boolean } = {},
    ) =>
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: opts.before ?? 0, after: opts.after ?? 0, line: LINE_15 },
        children: [
          new TextRun({
            text: opts.caps ? text.toUpperCase() : text,
            bold: opts.bold ?? false,
            size: opts.size ?? BODY_SIZE,
            font: FONT,
          }),
        ],
      });

    paragraphs.push(centered(i18n.t('document.ministryHeader'), { bold: true, after: 120 }));

    if (output.institution) {
      paragraphs.push(centered(output.institution, { bold: true, caps: true, after: 120 }));
    }

    paragraphs.push(
      centered(i18n.t(`document.typeLabel.${output.docType}`), {
        bold: true,
        size: 40,
        before: 2400,
        after: 240,
      }),
    );

    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240, line: LINE_15 },
        children: [
          new TextRun({
            text: `${i18n.t('document.topicLabel')}: `,
            bold: true,
            size: TITLE_SIZE,
            font: FONT,
          }),
          new TextRun({
            text: `«${output.title}»`,
            bold: true,
            italics: true,
            size: TITLE_SIZE,
            font: FONT,
          }),
        ],
      }),
    );

    const infoLine = (label: string, value: string, before = 0) =>
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before, line: LINE_15 },
        children: [
          new TextRun({ text: `${label}: `, bold: true, font: FONT, size: BODY_SIZE }),
          new TextRun({ text: value, font: FONT, size: BODY_SIZE }),
        ],
      });

    if (output.studentName) {
      paragraphs.push(infoLine(i18n.t('document.preparedBy'), output.studentName, 2400));
    }
    if (output.teacherName) {
      paragraphs.push(infoLine(i18n.t('document.checkedBy'), output.teacherName));
    }

    paragraphs.push(
      centered(`${new Date().getFullYear()}`, { bold: true, before: 2400 }),
    );

    // Force the table of contents onto a fresh page.
    paragraphs.push(new Paragraph({ pageBreakBefore: true, children: [] }));

    return paragraphs;
  }

  /**
   * Static table of contents with dot leaders and estimated page numbers.
   * Estimation is based on actual generated word counts, so numbers land
   * within ±1 page — unlike Word TOC fields, it renders correctly in
   * Telegram/phone viewers without requiring a manual field update.
   */
  private buildTableOfContents(output: DocPipelineOutput, i18n: I18nService): Paragraph[] {
    const paragraphs: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240, line: LINE_15 },
        children: [
          new TextRun({
            text: i18n.t('document.tocTitle').toUpperCase(),
            bold: true,
            size: TITLE_SIZE,
            font: FONT,
          }),
        ],
      }),
    ];

    const tocLine = (text: string, page: number, bold = false, indent = 0) =>
      new Paragraph({
        spacing: { line: LINE_15 },
        indent: indent ? { left: indent } : undefined,
        tabStops: [{ type: TabStopType.RIGHT, position: TOC_TAB_POS, leader: LeaderType.DOT }],
        children: [
          new TextRun({ text, bold, font: FONT, size: BODY_SIZE }),
          new TextRun({ text: `\t${page}`, bold, font: FONT, size: BODY_SIZE }),
        ],
      });

    // Body starts on page 3 (after title page and TOC).
    let page = 3;
    let chapterNo = 0;

    for (const section of output.sections) {
      const isChapter = section.type === 'bob';
      if (isChapter) chapterNo++;
      const label = isChapter ? `${chapterNo}. ${section.title}` : section.title;
      paragraphs.push(tocLine(label, page, true));

      if (isChapter) {
        let subPage = page;
        let subNo = 0;
        const blocksWithHeading = section.blocks.filter((b) => b.heading);
        for (const block of blocksWithHeading) {
          subNo++;
          const blockWords = block.paragraphs.join(' ').split(/\s+/).length;
          paragraphs.push(
            tocLine(`${chapterNo}.${subNo}. ${block.heading}`, subPage, false, 400),
          );
          subPage += Math.floor(blockWords / WORDS_PER_PAGE);
        }
      }

      const sectionWords = section.blocks
        .flatMap((b) => b.paragraphs)
        .join(' ')
        .split(/\s+/).length;
      page += Math.max(Math.ceil(sectionWords / WORDS_PER_PAGE), 1);
    }

    paragraphs.push(tocLine(i18n.t('document.referencesTitle'), page, true));

    paragraphs.push(new Paragraph({ pageBreakBefore: true, children: [] }));

    return paragraphs;
  }

  private buildBody(output: DocPipelineOutput, i18n: I18nService): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    let chapterNo = 0;
    let figureNo = 0;

    output.sections.forEach((section, sectionIndex) => {
      const isChapter = section.type === 'bob';
      if (isChapter) chapterNo++;

      const headingText = isChapter
        ? `${chapterNo}. ${section.title.toUpperCase()}`
        : section.title.toUpperCase();

      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          pageBreakBefore: sectionIndex > 0,
          spacing: { after: 240, line: LINE_15 },
          children: [
            new TextRun({ text: headingText, bold: true, size: TITLE_SIZE, font: FONT }),
          ],
        }),
      );

      // Illustration under the chapter heading (if one was fetched).
      if (section.image) {
        const imgParagraphs = this.buildImage(section, figureNo + 1, i18n);
        if (imgParagraphs.length) {
          figureNo++;
          paragraphs.push(...imgParagraphs);
        }
      }

      let subNo = 0;
      for (const block of section.blocks) {
        if (block.heading) {
          subNo++;
          paragraphs.push(
            new Paragraph({
              spacing: { before: 240, after: 120, line: LINE_15 },
              children: [
                new TextRun({
                  text: `${chapterNo}.${subNo}. ${block.heading}`,
                  bold: true,
                  size: BODY_SIZE,
                  font: FONT,
                }),
              ],
            }),
          );
        }

        for (const text of block.paragraphs) {
          paragraphs.push(
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              indent: { firstLine: FIRST_LINE_INDENT },
              spacing: { line: LINE_15 },
              children: [new TextRun({ text, size: BODY_SIZE, font: FONT })],
            }),
          );
        }
      }
    });

    return paragraphs;
  }

  /**
   * Renders a centered image with a numbered caption ("1-rasm. ..."). Returns
   * an empty array if the file is missing or unreadable so the document still
   * builds without the picture.
   */
  private buildImage(
    section: WrittenSection,
    figureNo: number,
    i18n: I18nService,
  ): Paragraph[] {
    const image = section.image;
    if (!image) return [];

    let data: Buffer;
    try {
      data = fs.readFileSync(image.path);
    } catch {
      this.logger.warn(`Image not readable, skipping: ${image.path}`);
      return [];
    }

    const ext = image.path.split('.').pop()?.toLowerCase();
    const type =
      ext === 'png' ? 'png' : ext === 'gif' ? 'gif' : ext === 'bmp' ? 'bmp' : 'jpg';

    const srcW = image.width || IMAGE_MAX_WIDTH;
    const srcH = image.height || Math.round(IMAGE_MAX_WIDTH * 0.66);
    const width = Math.min(IMAGE_MAX_WIDTH, srcW);
    const height = Math.round(width * (srcH / srcW));

    const caption = `${figureNo}-${i18n.t('document.figureLabel')}. ${image.description}`;

    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 60, line: LINE_15 },
        children: [
          new ImageRun({
            data,
            type: type as 'jpg' | 'png' | 'gif' | 'bmp',
            transformation: { width, height },
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 180, line: LINE_15 },
        children: [
          new TextRun({ text: caption, italics: true, size: 24, font: FONT }),
        ],
      }),
    ];
  }

  /**
   * Essay (insho) layout — clean and continuous: a centered title, an optional
   * author line, then flowing justified prose with no headings, TOC, chapter
   * numbers or references.
   */
  private buildEssay(output: DocPipelineOutput): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // Optional author / institution line, right-aligned above the title.
    const authorBits = [output.institution, output.studentName].filter(Boolean);
    for (const bit of authorBits) {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { line: LINE_15 },
          children: [new TextRun({ text: bit as string, italics: true, size: BODY_SIZE, font: FONT })],
        }),
      );
    }

    // Title.
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: authorBits.length ? 240 : 0, after: 300, line: LINE_15 },
        children: [new TextRun({ text: output.title, bold: true, size: TITLE_SIZE, font: FONT })],
      }),
    );

    // Continuous prose — every paragraph of every section, no headings.
    for (const section of output.sections) {
      for (const block of section.blocks) {
        for (const text of block.paragraphs) {
          paragraphs.push(
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              indent: { firstLine: FIRST_LINE_INDENT },
              spacing: { line: LINE_15 },
              children: [new TextRun({ text, size: BODY_SIZE, font: FONT })],
            }),
          );
        }
      }
    }

    return paragraphs;
  }

  private buildReferences(output: DocPipelineOutput, i18n: I18nService): Paragraph[] {
    const paragraphs: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        pageBreakBefore: true,
        spacing: { after: 240, line: LINE_15 },
        children: [
          new TextRun({
            text: i18n.t('document.referencesTitle').toUpperCase(),
            bold: true,
            size: TITLE_SIZE,
            font: FONT,
          }),
        ],
      }),
    ];

    output.references.forEach((ref, index) => {
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 400, hanging: 400 },
          spacing: { line: LINE_15 },
          children: [
            new TextRun({ text: `${index + 1}. ${ref}`, size: BODY_SIZE, font: FONT }),
          ],
        }),
      );
    });

    return paragraphs;
  }
}
