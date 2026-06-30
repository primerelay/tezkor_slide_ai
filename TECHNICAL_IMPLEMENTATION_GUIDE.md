# Technical Implementation Guide
**Detailed Architecture & Code Patterns for Top Priority Features**

---

## Table of Contents
1. [Quiz Generator Implementation](#quiz-generator)
2. [Flashcard System Implementation](#flashcards)
3. [Resume Builder Implementation](#resume-builder)
4. [Shared Infrastructure](#shared-infrastructure)
5. [Database Schema](#database-schema)
6. [API Integration Patterns](#api-patterns)

---

## 1. Quiz Generator Implementation {#quiz-generator}

### Architecture Overview
```
Input → Content Extractor → Quiz Agent → Question Bank → Export Engine → User
```

### Database Schema

```typescript
// src/database/entities/quiz.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  title: string;

  @Column('text')
  sourceContent: string; // Original input text/PDF content

  @Column({ type: 'jsonb' })
  questions: QuizQuestion[];

  @Column({ default: 'pending' })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @Column()
  language: 'uz' | 'ru' | 'en';

  @Column({ nullable: true })
  fileUrl?: string; // Original PDF/DOCX URL

  @Column({ nullable: true })
  exportedPdfUrl?: string; // Generated quiz PDF

  @Column({ default: 0 })
  timesUsed: number; // Track review count

  @CreateDateColumn()
  createdAt: Date;
}

interface QuizQuestion {
  id: string;
  type: 'mcq' | 'true_false' | 'short_answer' | 'fill_blank';
  question: string;
  options?: string[]; // For MCQ
  correctAnswer: string | string[]; // Can be multiple for checkboxes
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string; // Auto-tagged topic
}
```

### AI Agent Implementation

```typescript
// src/ai/agents/quiz.agent.ts
import { Injectable } from '@nestjs/common';
import { GeminiProvider } from '../providers/gemini.provider';
import { OpenRouterProvider } from '../providers/openrouter.provider';

@Injectable()
export class QuizAgent {
  constructor(
    private readonly gemini: GeminiProvider,
    private readonly openRouter: OpenRouterProvider,
  ) {}

  async generateQuiz(params: {
    content: string;
    questionCount: number;
    difficulty: 'easy' | 'medium' | 'hard';
    questionTypes: QuestionType[];
    language: 'uz' | 'ru' | 'en';
  }): Promise<QuizQuestion[]> {

    const systemPrompt = this.buildSystemPrompt(params.language);
    const userPrompt = this.buildUserPrompt(params);

    try {
      // Try free DeepSeek R1 first (via OpenRouter)
      const response = await this.openRouter.generateText({
        model: 'deepseek/deepseek-r1',
        systemPrompt,
        userPrompt,
        temperature: 0.7, // Some creativity for varied questions
        maxTokens: 3000,
      });

      return this.parseQuizJSON(response);
    } catch (error) {
      // Fallback to Gemini Flash Lite
      const response = await this.gemini.generateText({
        model: 'gemini-3.5-flash-lite',
        systemPrompt,
        userPrompt,
        temperature: 0.7,
      });

      return this.parseQuizJSON(response);
    }
  }

  private buildSystemPrompt(language: string): string {
    const prompts = {
      uz: `Siz o'quvchilar uchun test savollari yaratuvchi yordamchisiz.

Qoidalar:
1. Savollar aniq va tushunarli bo'lishi kerak
2. Har bir savol FAQAT bitta to'g'ri javobga ega bo'lishi kerak
3. Noto'g'ri variantlar (distractors) mantiqiy bo'lishi, lekin aniq noto'g'ri bo'lishi kerak
4. Javob tushuntirishlari qisqa va aniq bo'lishi kerak
5. Savollar berilgan matn asosida bo'lishi kerak, tashqaridan ma'lumot qo'shmaslik

JSON formatida javob bering:
{
  "questions": [
    {
      "type": "mcq",
      "question": "Savol matni?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Tushuntirish",
      "difficulty": "medium",
      "category": "Mavzu"
    }
  ]
}`,

      ru: `Вы помощник для создания тестовых вопросов для студентов.

Правила:
1. Вопросы должны быть четкими и понятными
2. У каждого вопроса должен быть ТОЛЬКО один правильный ответ
3. Неправильные варианты (дистракторы) должны быть логичными, но явно неверными
4. Объяснения ответов должны быть краткими и точными
5. Вопросы основаны на предоставленном тексте, не добавляйте внешнюю информацию

Отвечайте в формате JSON:
{
  "questions": [
    {
      "type": "mcq",
      "question": "Текст вопроса?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Объяснение",
      "difficulty": "medium",
      "category": "Тема"
    }
  ]
}`,

      en: `You are an assistant for creating quiz questions for students.

Rules:
1. Questions must be clear and understandable
2. Each question must have ONLY one correct answer
3. Incorrect options (distractors) must be plausible but clearly wrong
4. Answer explanations must be brief and precise
5. Questions are based on the provided text, don't add external information

Respond in JSON format:
{
  "questions": [
    {
      "type": "mcq",
      "question": "Question text?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Explanation",
      "difficulty": "medium",
      "category": "Topic"
    }
  ]
}`
    };

    return prompts[language];
  }

  private buildUserPrompt(params: any): string {
    return `Generate ${params.questionCount} ${params.difficulty} quiz questions from this content:

Content:
${params.content.slice(0, 10000)}

Question types to include: ${params.questionTypes.join(', ')}

Requirements:
- Generate exactly ${params.questionCount} questions
- Mix of question types
- Vary difficulty within "${params.difficulty}" range
- Include explanations for each answer
- Auto-categorize by topic

Return ONLY valid JSON, no markdown formatting.`;
  }

  private parseQuizJSON(response: string): QuizQuestion[] {
    // Remove markdown code blocks if present
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/```\n?/g, '');
    }

    try {
      const parsed = JSON.parse(cleaned);
      return parsed.questions || [];
    } catch (error) {
      throw new Error('Failed to parse quiz JSON from AI response');
    }
  }

  // Distractor generation for MCQs
  async generateDistractors(params: {
    question: string;
    correctAnswer: string;
    count: number; // Usually 3 for total of 4 options
    language: string;
  }): Promise<string[]> {
    const prompt = `Generate ${params.count} plausible but incorrect answers (distractors) for this question:

Question: ${params.question}
Correct Answer: ${params.correctAnswer}

Requirements:
- Distractors should be related to the topic
- Should be tempting but clearly wrong
- Avoid obvious/silly options
- Return as JSON array: ["distractor1", "distractor2", "distractor3"]

Language: ${params.language}`;

    const response = await this.gemini.generateText({
      model: 'gemini-3.5-flash-lite',
      userPrompt: prompt,
      temperature: 0.8, // Higher for variety
    });

    return JSON.parse(response);
  }
}
```

### Telegram Scene Implementation

```typescript
// src/telegram/scenes/quiz.scene.ts
import { Scene, SceneEnter, On, Ctx, Action } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { QuizService } from '../../quiz/quiz.service';
import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';

@Scene('quiz')
export class QuizScene {
  constructor(private readonly quizService: QuizService) {}

  @SceneEnter()
  async onEnter(@Ctx() ctx: Context) {
    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '📝 Matndan test', callback_data: 'quiz_from_text' },
          { text: '📄 PDF/DOCX', callback_data: 'quiz_from_file' },
        ],
        [
          { text: '🔗 Havoladan', callback_data: 'quiz_from_url' },
        ],
        [
          { text: '« Orqaga', callback_data: 'back_to_main' },
        ],
      ],
    };

    await ctx.reply(
      'Test yaratish uchun manbani tanlang:',
      { reply_markup: keyboard }
    );
  }

  @Action('quiz_from_text')
  async handleTextInput(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await ctx.reply('Matnni yuboring (max 5,000 so\'z):');
    ctx.scene.session.quizInputType = 'text';
  }

  @Action('quiz_from_file')
  async handleFileInput(@Ctx() ctx: Context) {
    await ctx.answerCbQuery();
    await ctx.reply('PDF yoki DOCX fayl yuboring:');
    ctx.scene.session.quizInputType = 'file';
  }

  @On('text')
  async onTextReceived(@Ctx() ctx: Context) {
    if (ctx.scene.session.quizInputType !== 'text') return;

    const content = ctx.message.text;

    if (content.length < 100) {
      await ctx.reply('❌ Matn juda qisqa. Kamida 100 belgi yuboring.');
      return;
    }

    await this.showQuizOptions(ctx, content);
  }

  @On('document')
  async onFileReceived(@Ctx() ctx: Context) {
    if (ctx.scene.session.quizInputType !== 'file') return;

    const statusMsg = await ctx.reply('📥 Fayl yuklanmoqda...');

    try {
      // Download and extract text
      const content = await this.quizService.extractTextFromFile(
        ctx.message.document.file_id
      );

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        undefined,
        '✅ Fayl yuklandi!'
      );

      await this.showQuizOptions(ctx, content);
    } catch (error) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        undefined,
        '❌ Faylni o\'qishda xatolik. Iltimos, boshqa fayl yuboring.'
      );
    }
  }

  private async showQuizOptions(ctx: Context, content: string) {
    ctx.scene.session.quizContent = content;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: '10 ta savol', callback_data: 'quiz_count_10' },
          { text: '20 ta savol', callback_data: 'quiz_count_20' },
        ],
        [
          { text: '30 ta savol', callback_data: 'quiz_count_30' },
          { text: '50 ta savol', callback_data: 'quiz_count_50' },
        ],
        [
          { text: '« Orqaga', callback_data: 'quiz_restart' },
        ],
      ],
    };

    await ctx.reply(
      'Nechta savol yaratish kerak?',
      { reply_markup: keyboard }
    );
  }

  @Action(/quiz_count_(\d+)/)
  async handleQuestionCount(@Ctx() ctx: Context) {
    const match = ctx.match;
    const count = parseInt(match[1]);

    await ctx.answerCbQuery();

    ctx.scene.session.quizQuestionCount = count;

    const keyboard: InlineKeyboardMarkup = {
      inline_keyboard: [
        [
          { text: 'Oson', callback_data: 'quiz_diff_easy' },
          { text: 'O\'rta', callback_data: 'quiz_diff_medium' },
        ],
        [
          { text: 'Qiyin', callback_data: 'quiz_diff_hard' },
        ],
        [
          { text: '« Orqaga', callback_data: 'quiz_restart' },
        ],
      ],
    };

    await ctx.reply(
      'Qiyinlik darajasini tanlang:',
      { reply_markup: keyboard }
    );
  }

  @Action(/quiz_diff_(\w+)/)
  async handleDifficulty(@Ctx() ctx: Context) {
    const match = ctx.match;
    const difficulty = match[1];

    await ctx.answerCbQuery();

    const statusMsg = await ctx.reply('⏳ Test yaratilmoqda...\n\nBu 30-60 soniya davom etishi mumkin.');

    try {
      // Add to queue
      const job = await this.quizService.createQuizJob({
        userId: ctx.from.id,
        content: ctx.scene.session.quizContent,
        questionCount: ctx.scene.session.quizQuestionCount,
        difficulty,
        language: ctx.from.language_code || 'uz',
      });

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        undefined,
        '✅ Test yaratish boshlandi!\n\nTayyorланishi bilanoq xabar yuboraman.'
      );

      // Leave scene
      await ctx.scene.leave();

    } catch (error) {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        undefined,
        '❌ Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.'
      );
    }
  }
}
```

### Queue Processor

```typescript
// src/queue/processors/quiz.processor.ts
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QuizAgent } from '../../ai/agents/quiz.agent';
import { QuizRepository } from '../../quiz/quiz.repository';
import { TelegramService } from '../../telegram/telegram.service';
import { PdfExportService } from '../../export/pdf-export.service';

@Processor('quiz-generation')
export class QuizProcessor extends WorkerHost {
  constructor(
    private readonly quizAgent: QuizAgent,
    private readonly quizRepo: QuizRepository,
    private readonly telegram: TelegramService,
    private readonly pdfExport: PdfExportService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { userId, content, questionCount, difficulty, language, quizId } = job.data;

    try {
      // Update status
      await this.quizRepo.update(quizId, { status: 'processing' });

      // Generate questions
      await job.updateProgress(20);
      const questions = await this.quizAgent.generateQuiz({
        content,
        questionCount,
        difficulty,
        questionTypes: ['mcq', 'true_false', 'short_answer'],
        language,
      });

      // Save to database
      await job.updateProgress(60);
      await this.quizRepo.update(quizId, {
        questions,
        status: 'completed',
      });

      // Generate PDF export
      await job.updateProgress(80);
      const pdfBuffer = await this.pdfExport.generateQuizPDF({
        title: questions[0]?.category || 'Test',
        questions,
        language,
        includeAnswerKey: true,
      });

      // Upload PDF
      const pdfUrl = await this.storageService.upload(
        pdfBuffer,
        `quizzes/${quizId}.pdf`
      );

      await this.quizRepo.update(quizId, { exportedPdfUrl: pdfUrl });

      // Notify user
      await job.updateProgress(100);
      await this.telegram.sendQuizComplete(userId, quizId, {
        questionCount: questions.length,
        pdfUrl,
      });

    } catch (error) {
      await this.quizRepo.update(quizId, {
        status: 'failed',
      });
      throw error;
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    const { userId } = job.data;
    await this.telegram.sendMessage(userId,
      '❌ Test yaratishda xatolik. Iltimos, qayta urinib ko\'ring.'
    );
  }
}
```

### Quiz Review Interface (Telegram Inline)

```typescript
// src/telegram/quiz-review.handler.ts
import { Injectable } from '@nestjs/common';
import { Context } from 'telegraf';
import { QuizService } from '../quiz/quiz.service';
import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';

@Injectable()
export class QuizReviewHandler {
  constructor(private readonly quizService: QuizService) {}

  async startReview(ctx: Context, quizId: string) {
    const quiz = await this.quizService.findOne(quizId);

    if (!quiz || quiz.questions.length === 0) {
      await ctx.reply('❌ Test topilmadi.');
      return;
    }

    // Initialize review session
    ctx.session.quizReview = {
      quizId,
      currentQuestion: 0,
      correctCount: 0,
      answers: [],
    };

    await this.showQuestion(ctx);
  }

  private async showQuestion(ctx: Context) {
    const { quizId, currentQuestion } = ctx.session.quizReview;
    const quiz = await this.quizService.findOne(quizId);
    const question = quiz.questions[currentQuestion];

    if (!question) {
      // Quiz complete
      await this.showResults(ctx);
      return;
    }

    let keyboard: InlineKeyboardMarkup;

    if (question.type === 'mcq') {
      keyboard = {
        inline_keyboard: [
          ...question.options.map((opt, idx) => [
            {
              text: `${String.fromCharCode(65 + idx)}) ${opt}`,
              callback_data: `quiz_answer_${idx}`
            }
          ]),
          [
            { text: '❌ Bekor qilish', callback_data: 'quiz_cancel' }
          ]
        ],
      };
    } else if (question.type === 'true_false') {
      keyboard = {
        inline_keyboard: [
          [
            { text: '✅ To\'g\'ri', callback_data: 'quiz_answer_true' },
            { text: '❌ Noto\'g\'ri', callback_data: 'quiz_answer_false' },
          ],
          [
            { text: 'Bekor qilish', callback_data: 'quiz_cancel' }
          ]
        ],
      };
    }

    const progress = `Savol ${currentQuestion + 1}/${quiz.questions.length}`;
    const difficultyEmoji = {
      easy: '🟢',
      medium: '🟡',
      hard: '🔴',
    };

    await ctx.reply(
      `${progress} ${difficultyEmoji[question.difficulty]}\n\n${question.question}`,
      { reply_markup: keyboard }
    );
  }

  async handleAnswer(ctx: Context, answer: string) {
    const { quizId, currentQuestion } = ctx.session.quizReview;
    const quiz = await this.quizService.findOne(quizId);
    const question = quiz.questions[currentQuestion];

    const isCorrect = answer === question.correctAnswer;

    if (isCorrect) {
      ctx.session.quizReview.correctCount++;
    }

    ctx.session.quizReview.answers.push({
      questionId: question.id,
      userAnswer: answer,
      isCorrect,
    });

    // Show explanation
    const emoji = isCorrect ? '✅' : '❌';
    await ctx.reply(
      `${emoji} ${isCorrect ? 'To\'g\'ri!' : 'Noto\'g\'ri'}\n\n📖 Tushuntirish:\n${question.explanation || 'Tushuntirish mavjud emas.'}`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Keyingi savol ➡️', callback_data: 'quiz_next' }]
          ]
        }
      }
    );
  }

  private async showResults(ctx: Context) {
    const { correctCount, answers } = ctx.session.quizReview;
    const total = answers.length;
    const percentage = Math.round((correctCount / total) * 100);

    let grade = '';
    if (percentage >= 90) grade = '🏆 A\'lo';
    else if (percentage >= 75) grade = '🥇 Yaxshi';
    else if (percentage >= 60) grade = '🥈 Qoniqarli';
    else grade = '🥉 Qoniqarsiz';

    const message = `
📊 Test natijalari

${grade}

✅ To'g'ri: ${correctCount}/${total}
❌ Noto'g'ri: ${total - correctCount}
📈 Foiz: ${percentage}%

${this.getMotivationalMessage(percentage)}
    `.trim();

    await ctx.reply(message, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔄 Qayta o\'tish', callback_data: `quiz_restart_${ctx.session.quizReview.quizId}` },
          ],
          [
            { text: '📥 PDF yuklab olish', callback_data: `quiz_download_${ctx.session.quizReview.quizId}` },
          ],
          [
            { text: '« Asosiy menyu', callback_data: 'back_to_main' },
          ],
        ],
      },
    });

    // Clear session
    delete ctx.session.quizReview;
  }

  private getMotivationalMessage(percentage: number): string {
    if (percentage >= 90) return 'Ajoyib natija! 🎉';
    if (percentage >= 75) return 'Yaxshi bilasiz! Davom eting! 💪';
    if (percentage >= 60) return 'Yaxshi harakat. Yana mashq qiling. 📚';
    return 'Yana bir bor urinib ko\'ring. Muvaffaqiyat sizniki! 🚀';
  }
}
```

### Export to Different Formats

```typescript
// src/export/quiz-export.service.ts
import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { Quiz, QuizQuestion } from '../database/entities/quiz.entity';

@Injectable()
export class QuizExportService {

  // PDF Export
  async exportToPDF(quiz: Quiz, options: { includeAnswerKey: boolean }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text(quiz.title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Savollar soni: ${quiz.questions.length}`, { align: 'center' });
      doc.moveDown(2);

      // Questions
      quiz.questions.forEach((q, idx) => {
        doc.fontSize(14).text(`${idx + 1}. ${q.question}`, { continued: false });
        doc.moveDown(0.5);

        if (q.type === 'mcq') {
          q.options.forEach((opt, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx);
            doc.fontSize(12).text(`   ${letter}) ${opt}`);
          });
        } else if (q.type === 'true_false') {
          doc.fontSize(12).text('   A) To\'g\'ri');
          doc.fontSize(12).text('   B) Noto\'g\'ri');
        } else if (q.type === 'short_answer' || q.type === 'fill_blank') {
          doc.fontSize(12).text('   Javob: _____________________________');
        }

        doc.moveDown(1.5);

        // Page break if needed
        if (doc.y > 700) {
          doc.addPage();
        }
      });

      // Answer key on separate page
      if (options.includeAnswerKey) {
        doc.addPage();
        doc.fontSize(18).text('Javoblar kaliti', { align: 'center' });
        doc.moveDown(2);

        quiz.questions.forEach((q, idx) => {
          let answer = q.correctAnswer;
          if (q.type === 'mcq') {
            const answerIdx = q.options.indexOf(answer as string);
            answer = String.fromCharCode(65 + answerIdx);
          }
          doc.fontSize(12).text(`${idx + 1}. ${answer}`);
        });
      }

      doc.end();
    });
  }

  // Google Forms format export
  async exportToGoogleForms(quiz: Quiz): Promise<string> {
    // Google Forms uses CSV-like format
    // Format: Question,Type,Option1,Option2,Option3,Option4,CorrectAnswer

    const lines: string[] = [
      'Question,Type,Option A,Option B,Option C,Option D,Correct Answer'
    ];

    quiz.questions.forEach(q => {
      if (q.type === 'mcq') {
        const options = [...q.options, '', '', '', ''].slice(0, 4); // Pad to 4 options
        const correctIdx = q.options.indexOf(q.correctAnswer as string);
        const correctLetter = String.fromCharCode(65 + correctIdx);

        lines.push([
          `"${q.question}"`,
          'Multiple Choice',
          ...options.map(o => `"${o}"`),
          correctLetter
        ].join(','));
      }
    });

    return lines.join('\n');
  }

  // Kahoot format export
  async exportToKahoot(quiz: Quiz): Promise<any> {
    // Kahoot uses JSON format
    return {
      title: quiz.title,
      questions: quiz.questions.map(q => ({
        question: q.question,
        time: 30, // seconds
        points: q.difficulty === 'hard' ? 1000 : q.difficulty === 'medium' ? 750 : 500,
        image: null,
        answers: q.type === 'mcq' ? q.options.map((opt, idx) => ({
          answer: opt,
          correct: opt === q.correctAnswer
        })) : []
      }))
    };
  }

  // Moodle GIFT format export
  async exportToGIFT(quiz: Quiz): Promise<string> {
    // GIFT format is Moodle's text format for quiz questions
    const lines: string[] = [];

    quiz.questions.forEach(q => {
      // Question title
      lines.push(`::Q${quiz.questions.indexOf(q) + 1}::`);

      // Question text
      lines.push(q.question);

      if (q.type === 'mcq') {
        lines.push('{');
        q.options.forEach(opt => {
          const prefix = opt === q.correctAnswer ? '=' : '~';
          lines.push(`  ${prefix}${opt}`);
        });
        lines.push('}');
      } else if (q.type === 'true_false') {
        const answer = q.correctAnswer === 'true' ? 'TRUE' : 'FALSE';
        lines.push(`{${answer}}`);
      } else if (q.type === 'short_answer') {
        lines.push(`{=${q.correctAnswer}}`);
      }

      lines.push(''); // Blank line between questions
    });

    return lines.join('\n');
  }
}
```

---

## 2. Flashcard System Implementation {#flashcards}

### Database Schema

```typescript
// src/database/entities/flashcard-deck.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('flashcard_decks')
export class FlashcardDeck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description?: string;

  @OneToMany(() => Flashcard, card => card.deck)
  cards: Flashcard[];

  @Column({ default: 'active' })
  status: 'active' | 'archived';

  @Column()
  language: 'uz' | 'ru' | 'en';

  @Column({ type: 'jsonb', default: {} })
  stats: DeckStats;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('flashcards')
export class Flashcard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FlashcardDeck, deck => deck.cards)
  deck: FlashcardDeck;

  @Column('text')
  front: string; // Question/Term

  @Column('text')
  back: string; // Answer/Definition

  @Column('text', { nullable: true })
  hint?: string; // Optional mnemonic/hint

  @Column({ nullable: true })
  imageUrl?: string; // Optional visual aid

  @Column({ default: 1 })
  difficulty: number; // 1-5, used for spaced repetition

  @Column({ type: 'timestamp', nullable: true })
  nextReviewDate?: Date; // Spaced repetition scheduling

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ default: 0 })
  correctCount: number;

  @Column({ type: 'jsonb', nullable: true })
  tags?: string[]; // For categorization

  @CreateDateColumn()
  createdAt: Date;
}

interface DeckStats {
  totalCards: number;
  masteredCards: number;
  averageCorrectRate: number;
  totalReviews: number;
  lastReviewedAt?: Date;
  streakDays: number;
}
```

### Flashcard Generation Agent

```typescript
// src/ai/agents/flashcard.agent.ts
import { Injectable } from '@nestjs/common';
import { GeminiProvider } from '../providers/gemini.provider';

@Injectable()
export class FlashcardAgent {
  constructor(private readonly gemini: GeminiProvider) {}

  async generateFlashcards(params: {
    content: string;
    cardCount: number;
    language: 'uz' | 'ru' | 'en';
    includeHints: boolean;
  }): Promise<Array<{front: string; back: string; hint?: string}>> {

    const systemPrompt = this.buildSystemPrompt(params.language);
    const userPrompt = `Generate ${params.cardCount} flashcards from this content:

${params.content}

Requirements:
- Front side: concise question or term
- Back side: clear answer or definition
${params.includeHints ? '- Include memory hints/mnemonics' : ''}
- Cover key concepts evenly
- Progressive difficulty (start easy)

Return JSON:
{
  "flashcards": [
    {"front": "Q?", "back": "A", "hint": "H"}
  ]
}`;

    const response = await this.gemini.generateText({
      model: 'gemini-3.5-flash-lite',
      systemPrompt,
      userPrompt,
      temperature: 0.6,
    });

    return this.parseFlashcardJSON(response);
  }

  private buildSystemPrompt(language: string): string {
    const prompts = {
      uz: `Siz flash-kartalar yaratuvchi yordamchisiz.

Qoidalar:
1. Savol (Front) qisqa va aniq bo'lishi kerak
2. Javob (Back) to'liq lekin ixcham bo'lishi kerak
3. Eslab qolishga yordam beruvchi maslahatlar (Hint) qo'shing
4. Oddiydan qiyinga tartibda joylang
5. Asosiy tushunchalarni qamrab oling

JSON formatida javob bering.`,

      ru: `Вы помощник для создания флеш-карт.

Правила:
1. Вопрос (Front) должен быть кратким и точным
2. Ответ (Back) полным но лаконичным
3. Добавьте подсказки для запоминания (Hint)
4. Расположите от простого к сложному
5. Охватите ключевые концепции

Отвечайте в формате JSON.`,

      en: `You are a flashcard creation assistant.

Rules:
1. Front should be brief and precise
2. Back should be complete but concise
3. Include memory hints
4. Arrange from easy to hard
5. Cover key concepts

Respond in JSON format.`
    };

    return prompts[language];
  }

  private parseFlashcardJSON(response: string): any[] {
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    }

    const parsed = JSON.parse(cleaned);
    return parsed.flashcards || [];
  }
}
```

### Spaced Repetition Algorithm (SM-2)

```typescript
// src/flashcard/spaced-repetition.service.ts
import { Injectable } from '@nestjs/common';
import { Flashcard } from '../database/entities/flashcard-deck.entity';

@Injectable()
export class SpacedRepetitionService {
  /**
   * SM-2 Algorithm (SuperMemo 2)
   * Used by Anki and most flashcard apps
   */
  calculateNextReview(params: {
    flashcard: Flashcard;
    quality: number; // 0-5 (0=complete blackout, 5=perfect recall)
  }): { nextReviewDate: Date; difficulty: number } {

    let { difficulty, reviewCount } = params.flashcard;
    const { quality } = params;

    // If quality < 3, reset the card (failed recall)
    if (quality < 3) {
      difficulty = 1;
      reviewCount = 0;
    } else {
      // Update difficulty (easiness factor)
      difficulty = Math.max(1.3, difficulty + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
      reviewCount++;
    }

    // Calculate interval
    let interval: number;
    if (reviewCount === 0) {
      interval = 1; // 1 day
    } else if (reviewCount === 1) {
      interval = 6; // 6 days
    } else {
      interval = Math.round(this.getLastInterval(params.flashcard) * difficulty);
    }

    // Next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return { nextReviewDate, difficulty };
  }

  private getLastInterval(flashcard: Flashcard): number {
    if (!flashcard.nextReviewDate) return 1;

    const now = new Date();
    const diff = now.getTime() - flashcard.nextReviewDate.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * Get cards due for review today
   */
  getDueCards(deck: Flashcard[]): Flashcard[] {
    const now = new Date();
    return deck.filter(card =>
      !card.nextReviewDate || card.nextReviewDate <= now
    );
  }

  /**
   * Get new cards (never reviewed)
   */
  getNewCards(deck: Flashcard[], limit: number = 10): Flashcard[] {
    return deck
      .filter(card => card.reviewCount === 0)
      .slice(0, limit);
  }
}
```

### Telegram Flashcard Review Interface

```typescript
// src/telegram/flashcard-review.handler.ts
import { Injectable } from '@nestjs/common';
import { Context } from 'telegraf';
import { FlashcardService } from '../flashcard/flashcard.service';
import { SpacedRepetitionService } from '../flashcard/spaced-repetition.service';

@Injectable()
export class FlashcardReviewHandler {
  constructor(
    private readonly flashcardService: FlashcardService,
    private readonly spacedRep: SpacedRepetitionService,
  ) {}

  async startReview(ctx: Context, deckId: string) {
    const deck = await this.flashcardService.getDeckWithCards(deckId);

    // Get due cards
    const dueCards = this.spacedRep.getDueCards(deck.cards);
    const newCards = this.spacedRep.getNewCards(deck.cards, 5);
    const reviewCards = [...newCards, ...dueCards];

    if (reviewCards.length === 0) {
      await ctx.reply('🎉 Barcha kartalar ko\'rib chiqildi!\n\nKeyingi ko\'rib chiqish: ertaga');
      return;
    }

    ctx.session.flashcardReview = {
      deckId,
      cards: reviewCards.map(c => c.id),
      currentIndex: 0,
      showingFront: true,
      stats: { correct: 0, total: 0 },
    };

    await this.showCard(ctx);
  }

  private async showCard(ctx: Context) {
    const { deckId, cards, currentIndex, showingFront } = ctx.session.flashcardReview;

    if (currentIndex >= cards.length) {
      await this.showReviewComplete(ctx);
      return;
    }

    const card = await this.flashcardService.getCard(cards[currentIndex]);

    if (showingFront) {
      // Show question side
      await ctx.reply(
        `🔖 Karta ${currentIndex + 1}/${cards.length}\n\n${card.front}`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '🔄 Javobni ko\'rish', callback_data: 'flashcard_flip' }],
              [
                { text: '💡 Maslahat', callback_data: 'flashcard_hint' },
                { text: '❌ Bekor qilish', callback_data: 'flashcard_cancel' },
              ],
            ],
          },
        }
      );
    } else {
      // Show answer side
      await ctx.reply(
        `📖 Javob:\n\n${card.back}`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '❌ Bilmadim (0)', callback_data: 'flashcard_rate_0' },
                { text: '🤔 Qiyin (2)', callback_data: 'flashcard_rate_2' },
              ],
              [
                { text: '🙂 Yaxshi (4)', callback_data: 'flashcard_rate_4' },
                { text: '✅ Oson (5)', callback_data: 'flashcard_rate_5' },
              ],
            ],
          },
        }
      );
    }
  }

  async handleFlip(ctx: Context) {
    ctx.session.flashcardReview.showingFront = false;
    await this.showCard(ctx);
  }

  async handleHint(ctx: Context) {
    const { cards, currentIndex } = ctx.session.flashcardReview;
    const card = await this.flashcardService.getCard(cards[currentIndex]);

    if (card.hint) {
      await ctx.answerCbQuery(`💡 Maslahat: ${card.hint}`, { show_alert: true });
    } else {
      await ctx.answerCbQuery('Maslahat mavjud emas', { show_alert: false });
    }
  }

  async handleRating(ctx: Context, quality: number) {
    const { cards, currentIndex, stats } = ctx.session.flashcardReview;
    const card = await this.flashcardService.getCard(cards[currentIndex]);

    // Update spaced repetition data
    const { nextReviewDate, difficulty } = this.spacedRep.calculateNextReview({
      flashcard: card,
      quality,
    });

    await this.flashcardService.updateCard(card.id, {
      nextReviewDate,
      difficulty,
      reviewCount: card.reviewCount + 1,
      correctCount: quality >= 3 ? card.correctCount + 1 : card.correctCount,
    });

    // Update session stats
    ctx.session.flashcardReview.stats.total++;
    if (quality >= 3) ctx.session.flashcardReview.stats.correct++;

    // Move to next card
    ctx.session.flashcardReview.currentIndex++;
    ctx.session.flashcardReview.showingFront = true;

    await ctx.answerCbQuery();
    await this.showCard(ctx);
  }

  private async showReviewComplete(ctx: Context) {
    const { stats } = ctx.session.flashcardReview;
    const percentage = Math.round((stats.correct / stats.total) * 100);

    let emoji = '🎉';
    if (percentage < 50) emoji = '📚';
    else if (percentage < 75) emoji = '💪';
    else if (percentage < 90) emoji = '🌟';

    await ctx.reply(
      `${emoji} Ko'rib chiqish tugadi!\n\n` +
      `✅ To'g'ri: ${stats.correct}/${stats.total}\n` +
      `📈 Foiz: ${percentage}%\n\n` +
      `Keyingi ko'rib chiqish: ertaga`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 Statistika', callback_data: 'flashcard_stats' }],
            [{ text: '« Asosiy menyu', callback_data: 'back_to_main' }],
          ],
        },
      }
    );

    delete ctx.session.flashcardReview;
  }
}
```

---

## 3. Resume Builder Implementation {#resume-builder}

(Due to length constraints, I'll provide a condensed version)

### Key Components:

1. **User Info Collection Form** (Telegram conversational flow)
2. **ATS Scoring Algorithm** (keyword matching)
3. **Template Engine** (DOCX generation using `docx` library)
4. **Content Generation Agent** (Claude/GPT for STAR framework bullets)

### Implementation Priority:
1. Basic 3 templates (Minimalist, Professional, Modern)
2. ATS keyword scanner (simple regex-based initially)
3. Bilingual support (English/Russian side-by-side)
4. DOCX export (editable format)

---

## Shared Infrastructure {#shared-infrastructure}

### AI Provider Abstraction

```typescript
// src/ai/providers/ai-provider.interface.ts
export interface AIProvider {
  generateText(params: {
    model: string;
    systemPrompt?: string;
    userPrompt: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<string>;

  generateJSON<T>(params: {
    model: string;
    systemPrompt?: string;
    userPrompt: string;
    schema: any;
  }): Promise<T>;

  estimateCost(params: {
    model: string;
    inputTokens: number;
    outputTokens: number;
  }): number;
}
```

### Cost Tracking Service

```typescript
// src/analytics/cost-tracking.service.ts
@Injectable()
export class CostTrackingService {
  async trackAIUsage(params: {
    userId: string;
    feature: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  }): Promise<void> {
    await this.analyticsRepo.save({
      ...params,
      timestamp: new Date(),
    });
  }

  async getUserMonthlyCost(userId: string): Promise<number> {
    // For monitoring heavy users / preventing abuse
    const startOfMonth = new Date();
    startOfMonth.setDate(1);

    const usage = await this.analyticsRepo
      .createQueryBuilder('usage')
      .where('usage.userId = :userId', { userId })
      .andWhere('usage.timestamp >= :start', { start: startOfMonth })
      .select('SUM(usage.cost)', 'total')
      .getRawOne();

    return usage.total || 0;
  }
}
```

---

## Database Schema (Complete) {#database-schema}

```sql
-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  language_code VARCHAR(10) DEFAULT 'uz',
  balance INTEGER DEFAULT 10, -- Free starting credits
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW()
);

-- Quizzes
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(500),
  source_content TEXT,
  questions JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  language VARCHAR(10),
  file_url VARCHAR(1000),
  exported_pdf_url VARCHAR(1000),
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Flashcard Decks
CREATE TABLE flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(500),
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  language VARCHAR(10),
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Flashcards
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  hint TEXT,
  image_url VARCHAR(1000),
  difficulty FLOAT DEFAULT 1.0,
  next_review_date TIMESTAMP,
  review_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  tags JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Resumes
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id),
  personal_info JSONB,
  work_experience JSONB,
  education JSONB,
  skills JSONB,
  template_name VARCHAR(100),
  ats_score INTEGER,
  docx_url VARCHAR(1000),
  pdf_url VARCHAR(1000),
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Usage Analytics
CREATE TABLE ai_usage_analytics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  feature VARCHAR(100),
  model VARCHAR(100),
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost DECIMAL(10, 6),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX idx_flashcard_decks_user_id ON flashcard_decks(user_id);
CREATE INDEX idx_flashcards_deck_id ON flashcards(deck_id);
CREATE INDEX idx_flashcards_next_review ON flashcards(next_review_date);
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_ai_usage_user_timestamp ON ai_usage_analytics(user_id, timestamp);
```

---

## API Integration Patterns {#api-patterns}

### Environment Variables

```bash
# .env
# AI Providers
OPENROUTER_API_KEY=sk-or-...
GOOGLE_GEMINI_API_KEY=AI...
ANTHROPIC_API_KEY=sk-ant-...

# Model Selection
QUIZ_MODEL=deepseek/deepseek-r1  # Free tier
FLASHCARD_MODEL=gemini-3.5-flash-lite
RESUME_MODEL=gpt-4.1-mini
ESSAY_MODEL=gemini-3.1-pro

# Feature Flags
ENABLE_QUIZ=true
ENABLE_FLASHCARDS=true
ENABLE_RESUME=true
ENABLE_ESSAY=false  # Launch later
```

### Dynamic Model Routing

```typescript
// src/ai/model-router.service.ts
@Injectable()
export class ModelRouterService {
  getOptimalModel(feature: string): { provider: string; model: string } {
    const routes = {
      quiz: { provider: 'openrouter', model: 'deepseek/deepseek-r1' },
      flashcard: { provider: 'gemini', model: 'gemini-3.5-flash-lite' },
      resume: { provider: 'openai', model: 'gpt-4.1-mini' },
      essay: { provider: 'gemini', model: 'gemini-3.1-pro' },
      presentation: { provider: 'anthropic', model: 'claude-sonnet-4.5' },
    };

    return routes[feature] || routes.quiz;
  }

  async executeWithFallback(params: {
    feature: string;
    prompt: string;
  }): Promise<string> {
    const primary = this.getOptimalModel(params.feature);

    try {
      return await this.providers[primary.provider].generateText({
        model: primary.model,
        userPrompt: params.prompt,
      });
    } catch (error) {
      // Fallback to Gemini Flash (reliable backup)
      return await this.providers.gemini.generateText({
        model: 'gemini-3.5-flash',
        userPrompt: params.prompt,
      });
    }
  }
}
```

---

## Next Steps

1. **Week 1:** Implement Quiz Generator (prioritize this document's code)
2. **Week 2:** Add export formats (PDF, Google Forms, Kahoot)
3. **Week 3:** Implement Flashcards with spaced repetition
4. **Week 4:** Build Resume Builder (start with simple version)

---

**End of Technical Implementation Guide**
