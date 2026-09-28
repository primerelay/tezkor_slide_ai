import { Injectable } from '@nestjs/common';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';

export interface TitlePageFields {
  language?: string;
  workType: string; // display label, e.g. "Mustaqil ish"
  topic?: string;
  subject?: string;
  university?: string;
  faculty?: string;
  department?: string;
  author?: string;
  group?: string;
  advisor?: string;
  teacherPosition?: string;
  city?: string;
  border?: boolean;
  year?: number;
}

type L = 'uz' | 'ru' | 'en';

const LABELS: Record<L, {
  ministry: string;
  facultySuffix: string;
  deptSuffix: string;
  topic: string;
  subject: string;
  author: string;
  accepted: string;
}> = {
  uz: {
    ministry: "O'ZBEKISTON RESPUBLIKASI OLIY TA'LIM, FAN VA INNOVATSIYALAR VAZIRLIGI",
    facultySuffix: 'FAKULTETI',
    deptSuffix: 'kafedrasi',
    topic: 'Mavzu:',
    subject: 'Fan:',
    author: 'Bajardi:',
    accepted: 'Qabul qildi:',
  },
  ru: {
    ministry: 'МИНИСТЕРСТВО ВЫСШЕГО ОБРАЗОВАНИЯ, НАУКИ И ИННОВАЦИЙ РЕСПУБЛИКИ УЗБЕКИСТАН',
    facultySuffix: 'ФАКУЛЬТЕТ',
    deptSuffix: 'кафедра',
    topic: 'Тема:',
    subject: 'Предмет:',
    author: 'Выполнил(а):',
    accepted: 'Принял(а):',
  },
  en: {
    ministry: 'MINISTRY OF HIGHER EDUCATION, SCIENCE AND INNOVATION OF THE REPUBLIC OF UZBEKISTAN',
    facultySuffix: 'FACULTY',
    deptSuffix: 'department',
    topic: 'Topic:',
    subject: 'Subject:',
    author: 'Done by:',
    accepted: 'Accepted by:',
  },
};

const FONT = 'Times New Roman';
const empty = (count = 1) =>
  Array.from({ length: count }, () => new Paragraph({ children: [new TextRun({ text: '', font: FONT })] }));

@Injectable()
export class TitlePageService {
  private lang(fields: TitlePageFields): L {
    const l = fields.language || 'uz';
    return (l === 'ru' || l === 'en' ? l : 'uz') as L;
  }

  async renderDocx(fields: TitlePageFields): Promise<Buffer> {
    const L = this.lang(fields);
    const t = LABELS[L];
    const year = fields.year || 2026;
    const children: Paragraph[] = [];

    const center = (runs: TextRun[], spacingAfter = 0) =>
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: spacingAfter }, children: runs });

    // Ministry header
    children.push(
      center([new TextRun({ text: t.ministry, bold: true, size: 26, font: FONT })], 120),
    );

    if (fields.university) {
      children.push(center([new TextRun({ text: fields.university, bold: true, size: 26, font: FONT })], 60));
    }
    if (fields.faculty) {
      children.push(
        center([new TextRun({ text: `${fields.faculty} ${t.facultySuffix}`, size: 26, font: FONT })], 40),
      );
    }
    if (fields.department) {
      children.push(
        center([new TextRun({ text: `${fields.department} ${t.deptSuffix}`, size: 26, font: FONT })], 40),
      );
    }

    // Push work type toward the vertical middle.
    children.push(...empty(9));

    // Work type (large, letter-spaced)
    children.push(
      center(
        [new TextRun({ text: (fields.workType || '').toUpperCase(), bold: true, size: 48, font: FONT, characterSpacing: 60 })],
        200,
      ),
    );

    // Topic
    if (fields.topic) {
      children.push(
        center([
          new TextRun({ text: `${t.topic} `, bold: true, size: 30, font: FONT }),
          new TextRun({ text: fields.topic, size: 30, font: FONT }),
        ], 80),
      );
    }
    if (fields.subject) {
      children.push(
        center([
          new TextRun({ text: `${t.subject} `, bold: true, size: 28, font: FONT }),
          new TextRun({ text: fields.subject, size: 28, font: FONT }),
        ]),
      );
    }

    // Push the author block toward the bottom.
    children.push(...empty(9));

    // Author / advisor block, right-aligned
    const authorLine = fields.author
      ? `${fields.author}${fields.group ? ` (${fields.group})` : ''}`
      : '';
    if (authorLine) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 40 },
          children: [
            new TextRun({ text: `${t.author} `, bold: true, size: 28, font: FONT }),
            new TextRun({ text: authorLine, size: 28, font: FONT }),
          ],
        }),
      );
    }
    // Accepted-by: name, or a signature line if empty.
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 40 },
        children: [
          new TextRun({ text: `${t.accepted} `, bold: true, size: 28, font: FONT }),
          new TextRun({ text: fields.advisor ? fields.advisor : '______________', size: 28, font: FONT }),
        ],
      }),
    );
    if (fields.teacherPosition) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: fields.teacherPosition, italics: true, size: 24, font: FONT })],
        }),
      );
    }

    // Push the city/year to the very bottom.
    children.push(...empty(6));
    children.push(
      center([
        new TextRun({ text: `${(fields.city || 'Toshkent').toUpperCase()} — ${year}`, bold: true, size: 26, font: FONT }),
      ]),
    );

    const line = { style: BorderStyle.SINGLE, size: 12, space: 24, color: '000000' };
    const pageBorders = fields.border
      ? { pageBorderTop: line, pageBorderRight: line, pageBorderBottom: line, pageBorderLeft: line }
      : undefined;

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1134, right: 1134, bottom: 1134, left: 1701 },
              ...(pageBorders ? { borders: pageBorders } : {}),
            },
          },
          children,
        },
      ],
    });

    return Packer.toBuffer(doc);
  }
}
