import { Injectable, Logger } from '@nestjs/common';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  TabStopType,
  TextRun,
} from 'docx';
import { ResumeData } from '../database/entities/resume.entity';
import { I18nService, SupportedLanguage } from '../common/i18n/i18n.service';

const FONT = 'Calibri';
const MARGIN = { top: 1000, right: 1000, bottom: 1000, left: 1000 };
const ACCENT = '1F4E79'; // deep professional blue
const GRAY = '595959';
const NAME_SIZE = 44; // 22pt
const POS_SIZE = 24; // 12pt
const CONTACT_SIZE = 18; // 9pt
const HEADING_SIZE = 24; // 12pt
const BODY_SIZE = 22; // 11pt
const RIGHT_TAB = 9360;

@Injectable()
export class ResumeRendererService {
  private readonly logger = new Logger(ResumeRendererService.name);

  async render(data: ResumeData, language: string): Promise<Buffer> {
    const i18n = I18nService.create((language || 'uz') as SupportedLanguage);
    const children: Paragraph[] = [];

    // Header — name + target position.
    children.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [new TextRun({ text: data.fullName, bold: true, size: NAME_SIZE, font: FONT, color: ACCENT })],
      }),
    );
    if (data.position) {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: data.position, size: POS_SIZE, font: FONT, color: GRAY })],
        }),
      );
    }

    // Contact line.
    const contact = [data.phone, data.email, data.location].filter(Boolean).join('   •   ');
    if (contact) {
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: contact, size: CONTACT_SIZE, font: FONT, color: GRAY })],
        }),
      );
    }

    const heading = (text: string) =>
      new Paragraph({
        spacing: { before: 240, after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT } },
        children: [new TextRun({ text: text.toUpperCase(), bold: true, size: HEADING_SIZE, font: FONT, color: ACCENT })],
      });

    // Summary.
    if (data.summary) {
      children.push(heading(i18n.t('resume.summary')));
      children.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { line: 276 },
          children: [new TextRun({ text: data.summary, size: BODY_SIZE, font: FONT })],
        }),
      );
    }

    // Experience.
    if (data.experience.length) {
      children.push(heading(i18n.t('resume.experience')));
      for (const exp of data.experience) {
        const title = [exp.role, exp.company].filter(Boolean).join(' — ');
        children.push(
          new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
            spacing: { before: 80, after: 20 },
            children: [
              new TextRun({ text: title, bold: true, size: BODY_SIZE, font: FONT }),
              new TextRun({ text: `\t${exp.period || ''}`, size: CONTACT_SIZE, font: FONT, color: GRAY }),
            ],
          }),
        );
        for (const b of exp.bullets || []) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { line: 264 },
              children: [new TextRun({ text: b, size: BODY_SIZE, font: FONT })],
            }),
          );
        }
      }
    }

    // Education.
    if (data.education.length) {
      children.push(heading(i18n.t('resume.education')));
      for (const edu of data.education) {
        const title = [edu.degree, edu.institution].filter(Boolean).join(' — ');
        children.push(
          new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
            spacing: { before: 60, after: 20 },
            children: [
              new TextRun({ text: title, bold: true, size: BODY_SIZE, font: FONT }),
              new TextRun({ text: `\t${edu.period || ''}`, size: CONTACT_SIZE, font: FONT, color: GRAY }),
            ],
          }),
        );
      }
    }

    // Skills.
    if (data.skills.length) {
      children.push(heading(i18n.t('resume.skills')));
      children.push(
        new Paragraph({
          spacing: { line: 276 },
          children: [new TextRun({ text: data.skills.join('   •   '), size: BODY_SIZE, font: FONT })],
        }),
      );
    }

    // Languages.
    if (data.languages.length) {
      children.push(heading(i18n.t('resume.languages')));
      children.push(
        new Paragraph({
          spacing: { line: 276 },
          children: [new TextRun({ text: data.languages.join('   •   '), size: BODY_SIZE, font: FONT })],
        }),
      );
    }

    const doc = new Document({
      creator: 'SliderAI UZ',
      title: `${data.fullName} — CV`,
      styles: { default: { document: { run: { font: FONT, size: BODY_SIZE } } } },
      sections: [{ properties: { page: { margin: MARGIN } }, children }],
    });

    const buffer = await Packer.toBuffer(doc);
    this.logger.log(`Resume DOCX rendered: ${data.fullName} (${buffer.length} bytes)`);
    return buffer;
  }
}
