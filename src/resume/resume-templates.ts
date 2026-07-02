import {
  AlignmentType,
  BorderStyle,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import { ResumeData } from '../database/entities/resume.entity';
import { I18nService } from '../common/i18n/i18n.service';

export type ResumeTemplate =
  | 'classic'
  | 'modern'
  | 'minimal'
  | 'bold'
  | 'twotone'
  | 'executive';

export interface ResumeTemplateMeta {
  id: ResumeTemplate;
  name: string;
  nameUz: string;
  accent: string;
  bg: string;
  serif: boolean;
}

/** Metadata for the picker UI (backend + mini-app share these ids/colors). */
export const RESUME_TEMPLATES: ResumeTemplateMeta[] = [
  { id: 'classic', name: 'Classic', nameUz: 'Klassik', accent: '#1F4E79', bg: '#ffffff', serif: false },
  { id: 'modern', name: 'Modern', nameUz: 'Zamonaviy', accent: '#1F3864', bg: '#EAF0F7', serif: false },
  { id: 'minimal', name: 'Minimal', nameUz: 'Minimal', accent: '#374151', bg: '#ffffff', serif: true },
  { id: 'bold', name: 'Bold', nameUz: 'Jasur', accent: '#0F766E', bg: '#ffffff', serif: false },
  { id: 'twotone', name: 'Two-tone', nameUz: 'Ikki rang', accent: '#7F1D1D', bg: '#F3F4F6', serif: true },
  { id: 'executive', name: 'Executive', nameUz: 'Ijrochi', accent: '#1E293B', bg: '#ffffff', serif: true },
];

export function isResumeTemplate(v: string): v is ResumeTemplate {
  return RESUME_TEMPLATES.some((t) => t.id === v);
}

// Shared sizes (half-points).
const NAME = 46;
const POS = 24;
const CONTACT = 18;
const HEAD = 24;
const BODY = 22;
const GRAY = '595959';
const WHITE = 'FFFFFF';

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER, insideHorizontal: NO_BORDER, insideVertical: NO_BORDER };

interface Style {
  font: string;
  accent: string;
}

function run(text: string, opts: any = {}, font = 'Calibri'): TextRun {
  return new TextRun({ font, ...opts, text });
}

function bullets(items: string[], font: string): Paragraph[] {
  return items.map(
    (b) =>
      new Paragraph({
        bullet: { level: 0 },
        spacing: { line: 264, after: 20 },
        children: [run(b, { size: BODY }, font)],
      }),
  );
}

// ---- section builders (single-column, style-driven) ----

function headingBorder(text: string, s: Style): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: s.accent.replace('#', '') } },
    children: [run(text.toUpperCase(), { bold: true, size: HEAD, color: s.accent.replace('#', '') }, s.font)],
  });
}

function headingRule(text: string, s: Style): Paragraph {
  return new Paragraph({
    spacing: { before: 260, after: 90 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' } },
    children: [run(text.toUpperCase() + '  ', { bold: true, size: HEAD, color: s.accent.replace('#', ''), characterSpacing: 30 }, s.font)],
  });
}

function headingPlain(text: string, s: Style): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    children: [run(text.toUpperCase(), { bold: true, size: HEAD, color: s.accent.replace('#', '') }, s.font)],
  });
}

function bodySections(
  data: ResumeData,
  i18n: I18nService,
  s: Style,
  heading: (t: string, s: Style) => Paragraph,
  opts: { skipEducation?: boolean; skipSkills?: boolean; skipLanguages?: boolean } = {},
): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  const rightTab = 9200;

  if (data.summary) {
    out.push(heading(i18n.t('resume.summary'), s));
    out.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { line: 276 }, children: [run(data.summary, { size: BODY }, s.font)] }));
  }
  if (data.experience.length) {
    out.push(heading(i18n.t('resume.experience'), s));
    for (const e of data.experience) {
      out.push(
        new Paragraph({
          tabStops: [{ type: 'right' as any, position: rightTab }],
          spacing: { before: 80, after: 20 },
          children: [
            run([e.role, e.company].filter(Boolean).join(' — '), { bold: true, size: BODY }, s.font),
            run(`\t${e.period || ''}`, { size: CONTACT, color: GRAY }, s.font),
          ],
        }),
      );
      out.push(...bullets(e.bullets || [], s.font));
    }
  }
  if (!opts.skipEducation && data.education.length) {
    out.push(heading(i18n.t('resume.education'), s));
    for (const e of data.education) {
      out.push(
        new Paragraph({
          tabStops: [{ type: 'right' as any, position: rightTab }],
          spacing: { before: 60, after: 20 },
          children: [
            run([e.degree, e.institution].filter(Boolean).join(' — '), { bold: true, size: BODY }, s.font),
            run(`\t${e.period || ''}`, { size: CONTACT, color: GRAY }, s.font),
          ],
        }),
      );
    }
  }
  if (!opts.skipSkills && data.skills.length) {
    out.push(heading(i18n.t('resume.skills'), s));
    out.push(new Paragraph({ spacing: { line: 276 }, children: [run(data.skills.join('   •   '), { size: BODY }, s.font)] }));
  }
  if (!opts.skipLanguages && data.languages.length) {
    out.push(heading(i18n.t('resume.languages'), s));
    out.push(new Paragraph({ spacing: { line: 276 }, children: [run(data.languages.join('   •   '), { size: BODY }, s.font)] }));
  }
  return out;
}

type Align = (typeof AlignmentType)[keyof typeof AlignmentType];
function nameBlock(data: ResumeData, s: Style, align: Align = AlignmentType.LEFT): Paragraph[] {
  const p: Paragraph[] = [
    new Paragraph({ alignment: align, spacing: { after: 40 }, children: [run(data.fullName, { bold: true, size: NAME, color: s.accent.replace('#', '') }, s.font)] }),
  ];
  if (data.position) p.push(new Paragraph({ alignment: align, spacing: { after: 60 }, children: [run(data.position, { size: POS, color: GRAY }, s.font)] }));
  const contact = [data.phone, data.email, data.location].filter(Boolean).join('   •   ');
  if (contact) p.push(new Paragraph({ alignment: align, spacing: { after: 120 }, children: [run(contact, { size: CONTACT, color: GRAY }, s.font)] }));
  return p;
}

// ---- two-column (sidebar) helper ----

function sidebarCell(paras: Paragraph[], widthDxa: number, fill?: string): TableCell {
  return new TableCell({
    width: { size: widthDxa, type: WidthType.DXA },
    borders: NO_BORDERS,
    shading: fill ? { type: ShadingType.CLEAR, color: 'auto', fill } : undefined,
    margins: { top: 200, bottom: 200, left: 220, right: 220 },
    children: paras,
  });
}

function sidebarHeading(text: string, color: string, font: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 80 },
    children: [run(text.toUpperCase(), { bold: true, size: HEAD, color, characterSpacing: 20 }, font)],
  });
}

function stacked(label: string | null, lines: string[], color: string, font: string, size = BODY): Paragraph[] {
  const out: Paragraph[] = [];
  for (const l of lines) out.push(new Paragraph({ spacing: { after: 40, line: 264 }, children: [run(l, { size, color }, font)] }));
  return out;
}

/**
 * Render the resume body (array of Paragraph|Table) for the chosen template.
 * The caller wraps this in a docx Document section.
 */
export function renderResumeBody(
  data: ResumeData,
  i18n: I18nService,
  template: ResumeTemplate,
): (Paragraph | Table)[] {
  const meta = RESUME_TEMPLATES.find((t) => t.id === template) || RESUME_TEMPLATES[0];
  const s: Style = { font: meta.serif ? 'Cambria' : 'Calibri', accent: meta.accent };
  const accentHex = meta.accent.replace('#', '');

  // 1. CLASSIC — single column, blue, bottom-border headings.
  if (template === 'classic') {
    return [...nameBlock(data, s), ...bodySections(data, i18n, s, headingBorder)];
  }

  // 3. MINIMAL — serif, elegant, thin ruled headings, roomy.
  if (template === 'minimal') {
    return [...nameBlock(data, s, AlignmentType.LEFT), ...bodySections(data, i18n, s, headingRule)];
  }

  // 6. EXECUTIVE — serif, centered name, formal plain headings.
  if (template === 'executive') {
    return [...nameBlock(data, s, AlignmentType.CENTER), ...bodySections(data, i18n, s, headingPlain)];
  }

  // 4. BOLD — full-width colored header band, then single column.
  if (template === 'bold') {
    const contact = [data.phone, data.email, data.location].filter(Boolean).join('   •   ');
    const band = new Table({
      width: { size: 9360, type: WidthType.DXA },
      borders: NO_BORDERS,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 9360, type: WidthType.DXA },
              borders: NO_BORDERS,
              shading: { type: ShadingType.CLEAR, color: 'auto', fill: accentHex },
              margins: { top: 260, bottom: 220, left: 260, right: 260 },
              children: [
                new Paragraph({ children: [run(data.fullName, { bold: true, size: NAME, color: WHITE }, s.font)] }),
                ...(data.position ? [new Paragraph({ spacing: { before: 20 }, children: [run(data.position, { size: POS, color: 'E5E7EB' }, s.font)] })] : []),
                ...(contact ? [new Paragraph({ spacing: { before: 40 }, children: [run(contact, { size: CONTACT, color: 'E5E7EB' }, s.font)] })] : []),
              ],
            }),
          ],
        }),
      ],
    });
    return [band, ...bodySections(data, i18n, s, headingPlain)];
  }

  // 2 & 5. Two-column sidebar layouts (MODERN, TWOTONE).
  const sidebarFill = template === 'modern' ? accentHex : 'F3F4F6';
  const onDark = template === 'modern';
  const sideText = onDark ? WHITE : '374151';
  const sideAccent = onDark ? WHITE : accentHex;
  const sideMuted = onDark ? 'D9E2EF' : GRAY;
  const SIDE_W = 3300;
  const MAIN_W = 6060;

  // Sidebar content: contact, skills, languages, education.
  const side: Paragraph[] = [];
  const contactLines = [data.phone, data.email, data.location].filter(Boolean) as string[];
  if (contactLines.length) {
    side.push(sidebarHeading(i18n.t('resume.contactTitle'), sideAccent, s.font));
    side.push(...stacked(null, contactLines, sideText, s.font, CONTACT));
  }
  if (data.skills.length) {
    side.push(sidebarHeading(i18n.t('resume.skills'), sideAccent, s.font));
    side.push(...stacked(null, data.skills, sideText, s.font));
  }
  if (data.languages.length) {
    side.push(sidebarHeading(i18n.t('resume.languages'), sideAccent, s.font));
    side.push(...stacked(null, data.languages, sideText, s.font));
  }
  if (data.education.length) {
    side.push(sidebarHeading(i18n.t('resume.education'), sideAccent, s.font));
    for (const e of data.education) {
      side.push(new Paragraph({ spacing: { after: 20 }, children: [run([e.degree, e.institution].filter(Boolean).join(', '), { bold: true, size: CONTACT, color: sideText }, s.font)] }));
      if (e.period) side.push(new Paragraph({ spacing: { after: 60 }, children: [run(e.period, { size: 16, color: sideMuted }, s.font)] }));
    }
  }

  // Main column: name + title, summary, experience.
  const main: Paragraph[] = [
    new Paragraph({ spacing: { after: 40 }, children: [run(data.fullName, { bold: true, size: NAME, color: accentHex }, s.font)] }),
  ];
  if (data.position) main.push(new Paragraph({ spacing: { after: 160 }, children: [run(data.position, { size: POS, color: GRAY }, s.font)] }));
  const mainSections = bodySections(data, i18n, s, headingBorder, { skipEducation: true, skipSkills: true, skipLanguages: true }) as Paragraph[];
  main.push(...mainSections);

  const table = new Table({
    width: { size: SIDE_W + MAIN_W, type: WidthType.DXA },
    columnWidths: [SIDE_W, MAIN_W],
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: SIDE_W, type: WidthType.DXA },
            borders: NO_BORDERS,
            shading: { type: ShadingType.CLEAR, color: 'auto', fill: sidebarFill },
            margins: { top: 240, bottom: 240, left: 220, right: 220 },
            verticalAlign: VerticalAlign.TOP,
            children: side.length ? side : [new Paragraph({ children: [] })],
          }),
          sidebarCell(main, MAIN_W),
        ],
      }),
    ],
  });

  return [table];
}
