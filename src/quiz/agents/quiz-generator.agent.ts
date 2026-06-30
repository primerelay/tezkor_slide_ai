import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { QuizType, QuizDifficulty } from '../../database/entities/quiz.entity';
import { QuestionType } from '../../database/entities/question.entity';

interface GeneratedQuestion {
  type: QuestionType;
  questionText: string;
  options?: Record<string, string>;
  correctAnswer: string;
  explanation: string;
  difficulty: string;
  topic: string;
}

@Injectable()
export class QuizGeneratorAgent {
  private readonly logger = new Logger(QuizGeneratorAgent.name);
  private readonly openRouterApiKey: string;
  private readonly baseURL = 'https://openrouter.ai/api/v1';

  constructor(private configService: ConfigService) {
    this.openRouterApiKey = this.configService.get<string>('OPENROUTER_API_KEY') || '';
  }

  /**
   * AGENT 1: Content Analyzer
   * Analyzes source content and extracts key concepts, topics, and structure
   */
  private async analyzeContent(content: string, language: string = 'uz'): Promise<{
    mainTopics: string[];
    keyConcepts: string[];
    difficulty: string;
    contentLength: number;
  }> {
    this.logger.log('[Agent 1: Content Analyzer] Starting analysis...');

    const systemPrompt = `You are a content analysis expert. Analyze the given educational content and extract:
1. Main topics covered
2. Key concepts and terms
3. Overall difficulty level (easy/medium/hard)
4. Content structure

Respond in JSON format only.`;

    const userPrompt = `Analyze this educational content and provide a structured analysis:

Content:
${content.substring(0, 4000)} ${content.length > 4000 ? '...' : ''}

Language: ${language}

Provide JSON response with:
{
  "mainTopics": ["topic1", "topic2", ...],
  "keyConcepts": ["concept1", "concept2", ...],
  "difficulty": "easy|medium|hard",
  "contentLength": number_of_meaningful_paragraphs
}`;

    try {
      const response = await this.callAI(systemPrompt, userPrompt, 'deepseek/deepseek-r1');
      const analysis = JSON.parse(response);
      this.logger.log(`[Agent 1] Analysis complete: ${analysis.mainTopics.length} topics found`);
      return analysis;
    } catch (error) {
      this.logger.error('[Agent 1] Analysis failed, using fallback', error);
      return {
        mainTopics: ['General Topic'],
        keyConcepts: [],
        difficulty: 'medium',
        contentLength: 1,
      };
    }
  }

  /**
   * AGENT 2: Question Generator
   * Generates questions based on content analysis
   */
  private async generateQuestions(
    content: string,
    analysis: any,
    quizType: QuizType,
    difficulty: QuizDifficulty,
    numberOfQuestions: number,
    language: string,
  ): Promise<GeneratedQuestion[]> {
    this.logger.log(`[Agent 2: Question Generator] Generating ${numberOfQuestions} questions...`);

    const languageInstructions = {
      uz: "O'zbek tilida savol yozing. Rasmiy akademik uslubda.",
      ru: 'Пишите вопросы на русском языке. Используйте формальный академический стиль.',
      en: 'Write questions in English. Use formal academic style.',
    };

    const difficultyInstructions = {
      easy: 'Simple recall questions, basic concepts, straightforward',
      medium: 'Application and analysis questions, moderate complexity',
      hard: 'Synthesis and evaluation questions, complex reasoning required',
    };

    const questionTypeInstructions = {
      multiple_choice: 'Multiple choice questions with 4 options (A, B, C, D). One correct answer.',
      true_false: 'True/False questions only.',
      short_answer: 'Short answer questions requiring 1-3 sentence responses.',
      fill_blank: 'Fill in the blank questions with single word/phrase answers.',
      mixed: 'Mix of question types: multiple choice, true/false, and short answer.',
    };

    const systemPrompt = `You are an expert educational assessment creator. Generate high-quality quiz questions that:
- Test understanding, not just memorization
- Are clear, unambiguous, and grammatically correct
- Match the specified difficulty level
- Cover diverse aspects of the content
- Follow Bloom's Taxonomy principles

${languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.en}`;

    const userPrompt = `Based on this content, generate ${numberOfQuestions} quiz questions.

Content:
${content.substring(0, 3000)}

Requirements:
- Question Type: ${questionTypeInstructions[quizType] || questionTypeInstructions.multiple_choice}
- Difficulty: ${difficultyInstructions[difficulty]}
- Topics to cover: ${analysis.mainTopics.join(', ')}
- Key concepts: ${analysis.keyConcepts.slice(0, 10).join(', ')}

For Multiple Choice:
- Provide exactly 4 options (A, B, C, D)
- Make distractors (wrong answers) plausible
- Avoid "all of the above" or "none of the above"

For each question, provide:
1. Question text
2. Answer options (if MCQ)
3. Correct answer
4. Brief explanation (why answer is correct)
5. Topic/concept being tested

Respond with valid JSON array:
[
  {
    "type": "multiple_choice|true_false|short_answer|fill_blank",
    "questionText": "Question here?",
    "options": { "a": "Option A", "b": "Option B", "c": "Option C", "d": "Option D" },
    "correctAnswer": "a",
    "explanation": "Explanation here",
    "difficulty": "easy|medium|hard",
    "topic": "Topic name"
  },
  ...
]`;

    try {
      const response = await this.callAI(systemPrompt, userPrompt, 'deepseek/deepseek-r1', 4000);

      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/g, '');
      }

      const questions = JSON.parse(jsonStr);
      this.logger.log(`[Agent 2] Generated ${questions.length} questions successfully`);
      return questions;
    } catch (error) {
      this.logger.error('[Agent 2] Question generation failed', error);
      throw new Error('Failed to generate questions. Please try again.');
    }
  }

  /**
   * AGENT 3: Distractor Generator (for MCQs)
   * Improves wrong answer options to make them more realistic
   */
  private async enhanceDistractors(
    questions: GeneratedQuestion[],
    content: string,
  ): Promise<GeneratedQuestion[]> {
    this.logger.log('[Agent 3: Distractor Generator] Enhancing wrong answers...');

    const mcqQuestions = questions.filter(q => q.type === QuestionType.MULTIPLE_CHOICE);

    if (mcqQuestions.length === 0) {
      return questions;
    }

    const systemPrompt = `You are an expert at creating plausible but incorrect answer options (distractors) for multiple choice questions. Make distractors that:
- Are believable and tempting
- Test common misconceptions
- Are similar in length/style to correct answer
- Are clearly wrong to someone who knows the material`;

    // Process in batches to avoid token limits
    const batchSize = 5;
    for (let i = 0; i < mcqQuestions.length; i += batchSize) {
      const batch = mcqQuestions.slice(i, i + batchSize);

      const userPrompt = `Review and improve the distractors for these MCQs:

${JSON.stringify(batch, null, 2)}

Return the same JSON structure with improved distractors.`;

      try {
        const response = await this.callAI(systemPrompt, userPrompt, 'deepseek/deepseek-r1');
        let jsonStr = response.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
        }
        const enhanced = JSON.parse(jsonStr);

        // Update original questions with enhanced distractors
        batch.forEach((original, idx) => {
          if (enhanced[idx] && enhanced[idx].options) {
            original.options = enhanced[idx].options;
          }
        });
      } catch (error) {
        this.logger.warn('[Agent 3] Distractor enhancement failed for batch, using originals', error);
      }
    }

    this.logger.log('[Agent 3] Distractor enhancement complete');
    return questions;
  }

  /**
   * AGENT 4: Quality Checker
   * Validates question quality and filters out low-quality questions
   */
  private async checkQuality(questions: GeneratedQuestion[]): Promise<GeneratedQuestion[]> {
    this.logger.log('[Agent 4: Quality Checker] Validating questions...');

    const filtered = questions.filter(q => {
      // Basic validation
      if (!q.questionText || q.questionText.length < 10) return false;
      if (!q.correctAnswer) return false;
      if (q.type === QuestionType.MULTIPLE_CHOICE && (!q.options || Object.keys(q.options).length < 4)) return false;

      // Check for quality issues
      const lowerQ = q.questionText.toLowerCase();
      if (lowerQ.includes('undefined') || lowerQ.includes('null') || lowerQ.includes('[object')) return false;

      return true;
    });

    this.logger.log(`[Agent 4] Quality check: ${filtered.length}/${questions.length} questions passed`);
    return filtered;
  }

  /**
   * Master method: Generate complete quiz with multi-agent pipeline
   */
  async generateQuiz(
    content: string,
    quizType: QuizType,
    difficulty: QuizDifficulty,
    numberOfQuestions: number,
    language: string = 'uz',
  ): Promise<GeneratedQuestion[]> {
    const startTime = Date.now();
    this.logger.log('=== QUIZ GENERATION PIPELINE STARTED ===');

    try {
      // Agent 1: Analyze content
      const analysis = await this.analyzeContent(content, language);

      // Agent 2: Generate questions
      let questions = await this.generateQuestions(
        content,
        analysis,
        quizType,
        difficulty,
        numberOfQuestions,
        language,
      );

      // Agent 3: Enhance distractors (only for MCQ)
      if (quizType === QuizType.MULTIPLE_CHOICE || quizType === QuizType.MIXED) {
        questions = await this.enhanceDistractors(questions, content);
      }

      // Agent 4: Quality check
      questions = await this.checkQuality(questions);

      // If we don't have enough questions, regenerate
      if (questions.length < numberOfQuestions * 0.7) {
        this.logger.warn('Insufficient quality questions, regenerating...');
        questions = await this.generateQuestions(
          content,
          analysis,
          quizType,
          difficulty,
          Math.ceil(numberOfQuestions * 1.2), // Generate 20% more
          language,
        );
        questions = await this.checkQuality(questions);
      }

      // Take only requested number
      questions = questions.slice(0, numberOfQuestions);

      const duration = Date.now() - startTime;
      this.logger.log(`=== QUIZ GENERATION COMPLETE === (${duration}ms, ${questions.length} questions)`);

      return questions;
    } catch (error) {
      this.logger.error('Quiz generation pipeline failed', error);
      throw error;
    }
  }

  /**
   * Helper: Call AI model via OpenRouter
   */
  private async callAI(
    systemPrompt: string,
    userPrompt: string,
    model: string = 'deepseek/deepseek-r1',
    maxTokens: number = 2000,
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openRouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://tezhisobchi.uz',
            'X-Title': 'Tezkor Slide AI - Quiz Generator',
          },
          timeout: 60000,
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      this.logger.error('AI API call failed', error.response?.data || error.message);
      throw new Error('AI service temporarily unavailable');
    }
  }
}
