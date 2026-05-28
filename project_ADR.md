Quyidagi ADR sizning AI Presentation Telegram Bot startupingiz uchun production-level architecture decision record sifatida yozilgan.Bot nomi Tezkor Slide AI

# ADR-001 — AI Presentation Generator Telegram Platform

## Status

Accepted

---

# Title

AI-Powered Telegram-Based Academic Presentation Generation Platform

---

# Context

Platforma O‘zbekiston va CIS studentlari uchun AI yordamida professional akademik prezentatsiyalar (PPTX/PDF) generatsiya qiluvchi Telegram-first servis hisoblanadi.

Asosiy problemalar:

- Studentlar prezentatsiya tayyorlashni yoqtirmaydi
- PowerPoint dizayn bilimi past
- Deadline pressure yuqori
- Hozirgi AI PPT botlar sifatsiz output beradi
- Uzbek/Russian academic support deyarli yo‘q
- Ko‘p AI servislar Telegram ichida ishlamaydi

System quyidagilarni qo‘llab-quvvatlashi kerak:

- Uzbek
- Russian
- English

Target:

- Professional looking editable PPTX
- Fast generation
- Low AI cost
- Stable slide quality
- Telegram-native UX

---

# Primary Product Goal

User:

1. Topic yuboradi
2. AI professional presentation yaratadi
3. User PPTX/PDF download qiladi

Presentation:

- visually clean
- academic optimized
- editable
- minimalistic
- teacher-safe
- low-text
- high readability

---

# Non Goals

System:

- Canva clone bo‘lmaydi
- Full manual editor bo‘lmaydi
- Real-time collaborative editing bo‘lmaydi
- AI image-heavy generator bo‘lmaydi
- Generic business deck system bo‘lmaydi (initially)

Initial focus:
ONLY student academic presentations.

---

# Core Product Principles

## 1. Design > Intelligence

User AI qualityni emas:

- visual cleanliness
- readability
- structure
- spacing

uchun baholaydi.

Shuning uchun:
deterministic layout engine AI’dan muhimroq.

---

## 2. JSON-driven Rendering

AI directly PPT yaratmaydi.

AI:
ONLY structured JSON yaratadi.

Rendering engine:
JSON → native PPTX.

Bu:

- stable quality
- predictable layout
- easier debugging
- theme consistency

beradi.

---

## 3. Multi-Agent Pipeline

Single prompt architecture reject qilinadi.

Pipeline:

1. Outline Agent
2. Content Agent
3. Layout Agent
4. Asset Agent
5. Render Engine

---

# Architecture Decision

System architecture:
Telegram Bot + AI Orchestration Backend + PPT Rendering Engine + Queue-based async processing.

---

# High-Level Architecture

User
↓
Telegram Bot
↓
API Gateway
↓
Job Queue
↓
AI Pipeline Workers
↓
JSON Presentation Schema
↓
PPT Render Engine
↓
Storage
↓
Telegram Delivery

---

# Technology Decisions

## Backend

Decision:
Node.js + NestJS

Reason:

- scalable
- modular
- queue-friendly
- TypeScript ecosystem
- Telegram ecosystem compatibility

Rejected:

- Django
- Laravel
- Go

---

# Telegram Framework

Decision:
Telegraf

Reason:

- mature ecosystem
- middleware support
- scalable
- Telegram WebApp compatibility

---

# Database

Decision:
PostgreSQL

Reason:

- relational consistency
- transactional payments
- user balances
- analytics
- job states

Rejected:

- MongoDB

Because:
financial balance consistency important.

---

# Queue System

Decision:
BullMQ + Redis

Reason:
Presentation generation async heavy task.

Benefits:

- retries
- concurrency
- rate limiting
- worker separation
- progress tracking

---

# Storage

Decision:
S3-compatible object storage

Examples:

- Cloudflare R2
- AWS S3
- MinIO

Stored:

- PPTX
- PDF
- thumbnails
- uploaded files

---

# Presentation Rendering

Decision:
PptxGenJS

Reason:

- native editable PPTX
- stable
- mature
- customizable
- TypeScript support

Rejected:

- HTML screenshot rendering
- Canva automation
- Google Slides automation

Reason:
non-editable or unstable output.

---

# AI Model Strategy

## Core Principle

Best quality-per-dollar.

NOT strongest model.

---

# Model Routing Strategy

## Cheap models for:

- outline generation
- summarization
- slide structuring
- bullet optimization

Models:

- Gemini Flash
- DeepSeek
- Qwen

---

## Premium models only for:

- complex academic reasoning
- difficult topics
- refinement
- rewriting

Models:

- Claude Sonnet
- GPT-4.1 Mini

---

# AI Provider Abstraction Layer

Decision:
Provider abstraction required.

Reason:

- fallback support
- pricing optimization
- dynamic routing
- outage resilience

Architecture:
AIProvider interface.

Implementations:

- OpenRouter
- Gemini API
- Anthropic
- OpenAI

---

# Presentation Generation Pipeline

## Stage 1 — Input Parsing

Input types:

- plain text topic
- PDF
- DOCX
- screenshots
- raw notes

Output:
normalized content context.

---

# Stage 2 — Outline Generation

AI generates:

- title
- sections
- slide count
- hierarchy

Output schema:
PresentationOutline.

---

# Stage 3 — Slide Content Generation

AI generates:

- concise bullets
- academic summaries
- examples
- definitions
- citations placeholders

Rules:

- max 5 bullets
- max 14 words each
- presentation style only
- avoid paragraphs

---

# Stage 4 — Slide Type Classification

Each slide assigned type:

- hero
- timeline
- comparison
- statistics
- process
- infographic
- quote
- table
- chart
- conclusion

This stage CRITICAL.

---

# Stage 5 — Layout Engine

Deterministic rendering system.

Layout chosen by:

- slide type
- text density
- image availability

AI NEVER controls absolute positioning.

Layout engine controls:

- spacing
- typography
- grid
- colors
- alignment

---

# Stage 6 — Asset Selection

Assets:

- icons
- illustrations
- stock images

Rules:

- minimalistic
- academic-safe
- consistent style

Avoid:

- random AI generated images
- inconsistent aesthetics

---

# Stage 7 — PPT Rendering

Renderer converts:
PresentationJSON → PPTX.

Requirements:

- editable
- animations optional
- native charts
- consistent themes

---

# Stage 8 — Export

Formats:

- PPTX
- PDF

Optional later:

- Google Slides export

---

# JSON Presentation Schema

Canonical system format.

Example:

```json
{
	"title": "Artificial Intelligence",
	"theme": "academic_blue",
	"slides": [
		{
			"type": "timeline",
			"title": "History of AI",
			"bullets": [],
			"timeline": []
		}
	]
}
```

AI outputs ONLY schema-compatible data.

---

# Design System

## Typography

Fonts:

- Aptos
- Inter
- Calibri fallback

Rules:

- max 2 fonts
- high readability
- large headings

---

# Color System

Themes:

- Academic Blue
- Minimal White
- Modern Dark

Rules:

- deterministic palettes
- no random colors

---

# Spacing System

8px grid system mandatory.

---

# Slide Density Rules

Hard limits:

- max 30 words/slide
- max 5 bullets
- max 2 visual sections

Reason:
teacher readability.

---

# Payment System

## MVP Decision

Manual payment verification.

Flow:

1. User pays via Click/Payme
2. Screenshot uploads
3. Admin group receives proof
4. Admin approves
5. User balance increased

Reason:
fast MVP shipping.

---

# Balance System

User has internal credits.

Example:

- 1 presentation = 10 credits

Benefits:

- easier pricing
- promotions
- referrals

---

# Telegram UX Decisions

## UX must stay simple.

Flow:
Start
↓
Choose Language
↓
Enter Topic
↓
Choose Slide Count
↓
Choose Theme
↓
Generation
↓
Download

Avoid:
complex menus.

---

# Generation Time Goal

Target:
under 60 seconds.

Hard maximum:
120 seconds.

---

# Scalability Decisions

Workers horizontally scalable.

Components scalable independently:

- bot server
- AI workers
- renderer workers

---

# Error Handling

Mandatory:

- retry failed generations
- fallback AI providers
- graceful degradation

If rendering fails:
return partial recovery.

---

# Analytics Requirements

Track:

- generation time
- AI cost per deck
- conversion rate
- popular topics
- failed slides
- export counts

---

# Security Decisions

Mandatory:

- file scanning
- rate limiting
- signed download URLs
- prompt sanitization

---

# Prompt Engineering Rules

Prompts must:

- enforce concise content
- avoid paragraphs
- optimize for slides
- enforce academic tone
- avoid hallucinated citations

---

# Initial MVP Scope

MVP includes:

- Telegram bot
- Topic → PPT
- PPTX export
- PDF export
- 3 themes
- Uzbek/Russian/English
- manual balance system

Excluded from MVP:

- collaborative editing
- live editor
- custom branding
- AI animations
- video export

---

# Future Roadmap

## Phase 2

- PDF summarization
- DOCX import
- chart generation
- citations
- speaker notes

---

## Phase 3

- startup pitch decks
- business presentations
- company templates

---

## Phase 4

- Web editor
- Team collaboration
- Marketplace

---

# Success Metrics

Primary:

- user retention
- repeat generations
- generation completion rate

Secondary:

- average PPT quality score
- AI cost efficiency
- Telegram share rate

---

# Critical Engineering Philosophy

The system must behave like:
“Professional presentation designer with AI assistance”

NOT:
“Raw LLM generating random slides”

---

# Final Decision Summary

Chosen Architecture:

- Telegram-first
- JSON-driven
- deterministic layout rendering
- multi-agent AI pipeline
- async queue processing
- low-cost model routing
- native editable PPTX generation

This architecture optimizes:

- quality
- stability
- scalability
- cost efficiency
- local market fit

for the Uzbekistan student market.
