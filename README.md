# Study Buddy

A full-stack web application that helps polytechnic students manage their study materials under tight deadlines. The system uses AI to answer questions, generate quizzes, and track weak points.

**Vision: One Inbox → One Brain → One Plan**

## Architecture

- **Frontend**: Next.js (Port 3000)
- **Backend**: Express.js (Port 7101)
- **Database**: PostgreSQL with pgvector extension (Port 5432)
- **AI**: Ollama with Llama 3 and mxbai-embed-large (Port 11434)

## Quick Start

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

2. Start infrastructure:
   ```bash
   npm run docker:up
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run migrations:
   ```bash
   npm run db:migrate
   ```

5. Seed database:
   ```bash
   npm run db:seed
   ```

6. Start development servers:
   ```bash
   npm run dev
   ```

## Project Structure

```
study-buddy/
├── apps/
│   ├── frontend/          # Next.js application
│   └── backend/           # Express.js API
├── packages/              # Shared utilities and types
├── infra/                 # Docker Compose and infrastructure
└── scripts/               # Database migrations and utilities
```

## Features

- **Chat Interface**: Ask questions about uploaded materials
- **Library**: Upload and manage lecture slides and notes
- **Quiz System**: Diagnostic and practice tests
- **Mastery Map**: Visual representation of strengths and weaknesses
- **Study Planner**: Schedule daily revision tasks