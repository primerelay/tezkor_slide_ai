import { Injectable, Logger } from '@nestjs/common';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import { CrosswordData } from '../../database/entities/crossword-set.entity';

const FONT = 'Times New Roman';
const CELL = 420; // twips per cell (~0.29")
const BLACK = '000000';
const BORDER = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const CELL_BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

@Injectable()
export class CrosswordRendererService {
  private readonly logger = new Logger(CrosswordRendererService.name);

  async render(title: string, data: CrosswordData): Promise<Buffer> {
    const i18nAcross = 'Gorizontal';
    const i18nDown = 'Vertikal';

    const heading = (text: string) =>
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text, bold: true, size: 32, font: FONT })],
      });

    const across = data.clues.filter((c) => c.direction === 'across');
    const down = data.clues.filter((c) => c.direction === 'down');

    const clueList = (label: string, list: typeof data.clues) => {
      const items: Paragraph[] = [
        new Paragraph({
          spacing: { before: 200, after: 80 },
          children: [new TextRun({ text: label, bold: true, size: 28, font: FONT })],
        }),
      ];
      for (const c of list) {
        items.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: `${c.number}. `, bold: true, size: 26, font: FONT }),
              new TextRun({ text: c.clue, size: 26, font: FONT }),
            ],
          }),
        );
      }
      return items;
    };

    const doc = new Document({
      creator: 'SliderAI UZ',
      title,
      sections: [
        {
          properties: {},
          children: [
            heading(title),
            this.buildGrid(data, false),
            new Paragraph({ spacing: { after: 120 }, children: [] }),
            ...clueList(`↔ ${i18nAcross}`, across),
            ...clueList(`↕ ${i18nDown}`, down),
            // Answer key on a new page.
            new Paragraph({
              pageBreakBefore: true,
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
              children: [new TextRun({ text: 'Javoblar (kalit)', bold: true, size: 32, font: FONT })],
            }),
            this.buildGrid(data, true),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    this.logger.log(`Crossword DOCX rendered: ${title} (${buffer.length} bytes)`);
    return buffer;
  }

  private buildGrid(data: CrosswordData, showLetters: boolean): Table {
    const { rows, cols } = data.size;
    const tableRows: TableRow[] = [];

    for (let r = 0; r < rows; r++) {
      const cellsRow: TableCell[] = [];
      for (let c = 0; c < cols; c++) {
        const letter = data.grid[r][c];
        const num = data.numbers[`${r},${c}`];

        if (!letter) {
          // Blocked cell — solid black.
          cellsRow.push(
            new TableCell({
              width: { size: CELL, type: WidthType.DXA },
              borders: CELL_BORDERS,
              shading: { type: ShadingType.CLEAR, color: 'auto', fill: BLACK },
              children: [new Paragraph({ children: [] })],
            }),
          );
          continue;
        }

        const runs: TextRun[] = [];
        if (num) {
          runs.push(new TextRun({ text: `${num}`, size: 12, font: FONT, superScript: true }));
        }
        if (showLetters) {
          runs.push(new TextRun({ text: (num ? ' ' : '') + letter, bold: true, size: 24, font: FONT }));
        }
        cellsRow.push(
          new TableCell({
            width: { size: CELL, type: WidthType.DXA },
            borders: CELL_BORDERS,
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: num && !showLetters ? AlignmentType.LEFT : AlignmentType.CENTER,
                spacing: { line: 240, before: 0, after: 0 },
                children: runs.length ? runs : [new TextRun({ text: '' })],
              }),
            ],
          }),
        );
      }
      tableRows.push(new TableRow({ children: cellsRow, height: { value: CELL, rule: 'exact' } }));
    }

    return new Table({
      rows: tableRows,
      width: { size: cols * CELL, type: WidthType.DXA },
      columnWidths: Array.from({ length: cols }, () => CELL),
    });
  }
}
