import { Injectable, Logger } from '@nestjs/common';
import { OpenRouterProvider } from '../ai/providers/openrouter.provider';
import { ResumeData } from '../database/entities/resume.entity';

const LANGUAGE_NAMES: Record<string, string> = {
  uz: "O'zbek tili",
  ru: 'Русский язык',
  en: 'English',
  de: 'Deutsch',
};

export interface ResumeInput {
  fullName: string;
  position: string;
  phone?: string;
  email?: string;
  location?: string;
  summary?: string;
  experience?: { role?: string; company?: string; period?: string; description?: string }[];
  education?: { degree?: string; institution?: string; period?: string }[];
  skills?: string[];
  languages?: string[];
  /** Free-form background (bot flow) the AI should structure into sections. */
  rawBackground?: string;
  language: string;
  /** Chosen visual template id (default 'classic'). */
  template?: string;
}

export interface ResumeEnhanceResult {
  data: ResumeData;
  cost: number;
}

@Injectable()
export class ResumeEnhancerAgent {
  private readonly logger = new Logger(ResumeEnhancerAgent.name);

  constructor(private readonly ai: OpenRouterProvider) {}

  async enhance(input: ResumeInput): Promise<ResumeEnhanceResult> {
    const lang = LANGUAGE_NAMES[input.language] || LANGUAGE_NAMES.uz;

    const systemPrompt = `You are a professional CV/resume writer for the job market in Uzbekistan. You turn a person's real information into a polished, recruiter-ready resume.

STRICT RULES:
1. Write ALL output in ${lang}
2. Use ONLY the facts the person provides — NEVER invent employers, degrees, dates, or skills they didn't mention
3. Polish wording into strong, professional resume language
4. For each work experience, write 2-4 achievement-oriented bullet points (start with action verbs; add impact where the person implied it, but do not fabricate numbers)
5. Write a compelling 2-3 sentence professional summary
6. Keep it concise and truthful`;

    const prompt = `Build a polished resume from this person's information.

FULL NAME: ${input.fullName}
TARGET POSITION: ${input.position}
${input.summary ? `SELF-SUMMARY: ${input.summary}` : ''}
${input.rawBackground ? `BACKGROUND (free text — extract experience, education, skills, languages from this):\n${input.rawBackground}` : ''}
${input.experience?.length ? `EXPERIENCE:\n${input.experience.map((e) => `- ${e.role || ''} @ ${e.company || ''} (${e.period || ''}): ${e.description || ''}`).join('\n')}` : ''}
${input.education?.length ? `EDUCATION:\n${input.education.map((e) => `- ${e.degree || ''}, ${e.institution || ''} (${e.period || ''})`).join('\n')}` : ''}
${input.skills?.length ? `SKILLS: ${input.skills.join(', ')}` : ''}
${input.languages?.length ? `LANGUAGES: ${input.languages.join(', ')}` : ''}

Return JSON (all text in ${lang}):
{
  "summary": "2-3 sentence professional summary",
  "experience": [ { "role": "...", "company": "...", "period": "...", "bullets": ["achievement bullet", "..."] } ],
  "education": [ { "degree": "...", "institution": "...", "period": "..." } ],
  "skills": ["skill", "..."],
  "languages": ["language — level", "..."]
}
If a section has no information, return an empty array for it.`;

    this.logger.log(`Enhancing resume for ${input.fullName} (${input.language})`);

    const result = await this.ai.generateJson<{
      summary: string;
      experience: ResumeData['experience'];
      education: ResumeData['education'];
      skills: string[];
      languages: string[];
    }>(prompt, systemPrompt, { temperature: 0.6, maxTokens: 4000 });

    const data: ResumeData = {
      fullName: input.fullName,
      position: input.position,
      phone: input.phone,
      email: input.email,
      location: input.location,
      summary: result.data.summary?.trim() || '',
      experience: Array.isArray(result.data.experience) ? result.data.experience : [],
      education: Array.isArray(result.data.education) ? result.data.education : [],
      skills: Array.isArray(result.data.skills) ? result.data.skills : [],
      languages: Array.isArray(result.data.languages) ? result.data.languages : [],
    };

    return { data, cost: result.cost || 0 };
  }
}
