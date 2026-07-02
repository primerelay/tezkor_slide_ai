import { Injectable, Logger } from '@nestjs/common';
import { Document, Packer } from 'docx';
import { ResumeData } from '../database/entities/resume.entity';
import { I18nService, SupportedLanguage } from '../common/i18n/i18n.service';
import { ResumeTemplate, renderResumeBody, RESUME_TEMPLATES } from './resume-templates';

@Injectable()
export class ResumeRendererService {
  private readonly logger = new Logger(ResumeRendererService.name);

  async render(
    data: ResumeData,
    language: string,
    template: ResumeTemplate = 'classic',
  ): Promise<Buffer> {
    const i18n = I18nService.create((language || 'uz') as SupportedLanguage);
    const meta = RESUME_TEMPLATES.find((t) => t.id === template) || RESUME_TEMPLATES[0];
    const font = meta.serif ? 'Cambria' : 'Calibri';

    const children = renderResumeBody(data, i18n, template);

    const doc = new Document({
      creator: 'SliderAI UZ',
      title: `${data.fullName} — CV`,
      styles: { default: { document: { run: { font, size: 22 } } } },
      sections: [
        {
          properties: { page: { margin: { top: 900, right: 900, bottom: 900, left: 900 } } },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    this.logger.log(`Resume DOCX rendered (${template}): ${data.fullName} (${buffer.length} bytes)`);
    return buffer;
  }
}
