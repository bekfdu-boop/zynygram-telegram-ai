# Zynygram Telegram AI Support (`zynygram-telegram-ai`)

> Production-ready, modular AI-powered customer support assistant for **Zynygram** built with Node.js, TypeScript, Telegraf, PostgreSQL, Prisma ORM, Fastify, and OpenAI-compatible API endpoints.

---

## 📖 Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Architecture & Message Pipeline](#architecture--message-pipeline)
- [Project Structure](#project-structure)
- [Prerequisites & Requirements](#prerequisites--requirements)
- [Telegram Bot & @BotFather Setup](#telegram-bot--botfather-setup)
- [Telegram Chat Automation Compatibility](#telegram-chat-automation-compatibility)
- [Environment Configuration](#environment-configuration)
- [Local Installation & Quickstart](#local-installation--quickstart)
- [Database Migrations](#database-migrations)
- [Testing](#testing)
- [Docker & Containerized Deployment](#docker--containerized-deployment)
- [Admin Commands & Operations](#admin-commands--operations)
- [Security & Moderation Policies](#security--moderation-policies)
- [Troubleshooting & FAQ](#troubleshooting--faq)

---

## 🌟 Project Overview

**Zynygram** is an Uzbek social network where users publish posts, interact with other community members, and generate images and videos using built-in AI creative tools.

`zynygram-telegram-ai` serves as the official AI customer support assistant for Zynygram. It automatically handles user inquiries in **Uzbek**, **Russian**, and **English**, retrieves verified information from an official Markdown knowledge base, remembers recent conversation context, protects sensitive credentials, and cleanly escalates complex or sensitive issues to human support staff.

---

## ✨ Key Features

1. **Strict Fact-Based AI Support**: Adheres to the official knowledge base. Placeholders marked `OFFICIAL POLICY REQUIRED` prevent the model from hallucinating prices, verification rules, or payment policies.
2. **Multilingual Responsiveness**: Dynamically communicates in the user's language (Uzbek, Russian, or English).
3. **Telegram Chat Automation Support**: Architected to support official Telegram Business Chat Automation (`business_message` updates from Telegram Bot API 7.2+) alongside standard private chat interactions.
4. **Human Escalation Workflow**: `/human` command and automatic escalation for sensitive topics (account compromise, payment errors, severe harassment). Automatically pauses AI automation and notifies human support channels.
5. **Robust Moderation & Anti-Abuse**: Detects credential theft attempts, system prompt injection/jailbreak attempts, character flooding, and malicious spam while deliberately allowing legitimate user feedback and complaints.
6. **In-Memory Sliding-Window Rate Limiting**: Enforces per-user limits (default: 10 requests/min) with modular architecture for easy Redis integration.
7. **Production Observability & Health Checks**: Fastify server exposing `/health` (liveness) and `/ready` (readiness with PostgreSQL and AI configuration validation) and structured Pino logging with credential redaction.

---

## 🏛 Architecture & Message Pipeline

The system processes incoming Telegram updates through a strict, resilient 14-step pipeline:

```
           Incoming Telegram Message / Business Message
                                ↓
                        Validate Message
                                ↓
                        Find / Create User
                                ↓
                    Find / Create Conversation
                                ↓
                         Save USER Message
                                ↓
                       Check Blocked Status
                                ↓
                        Check Rate Limit
                                ↓
                  Check Human Escalation Status
               (If WAITING_HUMAN -> Halt AI reply)
                                ↓
                      Search Knowledge Base
                                ↓
                  Get Recent History (Memory)
                                ↓
                       Build System Prompt
                                ↓
                   Call OpenAI-Compatible AI
                                ↓
                    Validate AI Output & Safety
                                ↓
                      Save ASSISTANT Message
                                ↓
                      Send Telegram Response
```

---

## 📁 Project Structure

```
zynygram-telegram-ai/
├── src/
│   ├── app.ts                         # Application entrypoint & lifecycle management
│   ├── bot/
│   │   ├── telegram.ts                # Telegraf bot configuration & long-polling
│   │   ├── handlers.ts                # Command (/start, /help, /human, admin) & message handlers
│   │   ├── middleware.ts              # Rate limiter, auth guard, and error boundary middleware
│   │   └── automation.ts              # Telegram Business / Chat Automation event handlers
│   ├── ai/
│   │   ├── client.ts                  # OpenAI-compatible API client with retries & timeout
│   │   ├── prompts.ts                 # System prompt & context injection builder
│   │   ├── knowledge.ts               # Knowledge base loader, section parser & search engine
│   │   └── response.ts                # Response validator (anti-leakage, length & safety)
│   ├── services/
│   │   ├── support.ts                 # 14-step support orchestration pipeline
│   │   ├── conversation.ts            # Conversation state & history service
│   │   ├── user.ts                    # User management & blocklist service
│   │   ├── escalation.ts              # Human escalation dispatcher & notifications
│   │   └── moderation.ts              # Content moderation & prompt injection shield
│   ├── database/
│   │   ├── prisma.ts                  # Prisma Client singleton with BigInt JSON serializer
│   │   └── repositories/
│   │       ├── user.repository.ts
│   │       ├── conversation.repository.ts
│   │       └── message.repository.ts
│   ├── config/
│   │   └── env.ts                     # Centralized Zod-validated environment config
│   ├── utils/
│   │   ├── logger.ts                  # Pino structured logging with secret redaction
│   │   ├── errors.ts                  # Domain error classes
│   │   └── text.ts                    # Text truncation, sanitization & language heuristics
│   └── server/
│       ├── server.ts                  # Fastify HTTP server
│       └── health.ts                  # /health and /ready routes
├── knowledge/
│   ├── zynygram.md                    # Platform overview & AI generation features
│   ├── verification.md                # Verification badges (OFFICIAL POLICY REQUIRED)
│   ├── advertising.md                # Partnerships & advertising (OFFICIAL POLICY REQUIRED)
│   ├── payments.md                    # Payment methods & billing (OFFICIAL POLICY REQUIRED)
│   ├── account.md                     # Account security & passwords (OFFICIAL POLICY REQUIRED)
│   ├── technical-support.md           # Troubleshooting steps & common issues
│   └── faq.md                         # Frequently asked questions
├── prisma/
│   └── schema.prisma                  # PostgreSQL schema (User, Conversation, Message)
├── tests/
│   ├── ai.test.ts                     # AI prompt, validation, and client mocking tests
│   ├── support.test.ts                # Support pipeline, escalation, and auth tests
│   ├── moderation.test.ts             # Moderation, jailbreak, and spam tests
│   ├── knowledge.test.ts              # Knowledge search & ranking tests
│   └── rate-limit.test.ts             # In-memory rate limiting tests
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── eslint.config.js
├── prettier.config.js
└── README.md
```

---

## 📋 Prerequisites & Requirements

- **Node.js**: `v20.0.0` or newer (v22+ LTS recommended)
- **npm**: `v10.0.0` or newer
- **PostgreSQL**: `v14` or newer (or via Docker Compose)
- **Docker & Docker Compose**: Optional for containerized deployment

---

## 🤖 Telegram Bot & @BotFather Setup

Follow these official steps to configure your bot:

1. Open Telegram and search for [@BotFather](https://t.me/BotFather).
2. Send `/newbot` to create a new bot.
3. Choose a display name (e.g., `Zynygram Support Assistant`).
4. Choose a unique username ending in `bot` (e.g., `zynygram_support_bot`).
5. Copy the generated **HTTP API Token** (e.g., `123456789:AA...`).
6. Set bot commands by sending `/setcommands` to BotFather:
   ```text
   start - Botni ishga tushirish
   help - Qo‘llanma va buyruqlar
   support - Yordam xizmati
   human - Tirik operatorga ulanish
   status - Murojaat holati
   ```
7. Paste your bot token into your `.env` file under `BOT_TOKEN`.

---

## ⚡ Telegram Chat Automation Compatibility

> [!IMPORTANT]
> **API Boundaries & Security Rules:**
> This system interacts with Telegram exclusively via the **official Telegram Bot API**.
> - It does **NOT** use unofficial MTProto userbot libraries (such as Telethon/GramJS user logins).
> - It does **NOT** ask users for login codes, 2FA passwords, or MTProto session strings.
> - Bot tokens do not grant access to personal messages unless the account holder explicitly links the bot via Telegram's native Business features.

### How Telegram Business Chat Automation Works:
In Telegram Bot API 7.2+, Telegram introduced native Chat Automation for Telegram Business accounts:
1. A Telegram user with Telegram Business goes to **Settings** > **Telegram Business** > **Chatbots**.
2. They select this bot and grant permissions (e.g., manage chats, reply to messages).
3. Telegram delivers updates via the `business_connection` and `business_message` channels.
4. `src/bot/automation.ts` receives these updates and replies using the official `business_connection_id` parameter.

---

## ⚙️ Environment Configuration

Copy the sample environment file:

```bash
cp .env.example .env
```

Configure the following variables in `.env`:

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `BOT_TOKEN` | **Yes** | — | Telegram Bot API token from @BotFather |
| `AI_API_KEY` | **Yes** | — | API key for OpenAI or any compatible AI provider |
| `AI_BASE_URL` | No | `https://api.openai.com/v1` | Base URL of the OpenAI-compatible API endpoint |
| `AI_MODEL` | No | `gpt-4o-mini` | AI Model identifier (e.g. `gpt-4o-mini`, `deepseek-chat`) |
| `AI_TEMPERATURE` | No | `0.3` | Model temperature (0.0 to 2.0) |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `ADMIN_TELEGRAM_IDS` | No | `""` | Comma-separated Telegram User IDs with admin access |
| `SUPPORT_GROUP_ID` | No | — | Telegram Group ID (e.g. `-1001234567890`) for escalation alerts |
| `MAX_MESSAGE_LENGTH`| No | `4000` | Maximum character length for incoming/outgoing messages |
| `NODE_ENV` | No | `development` | `development`, `production`, or `test` |
| `PORT` | No | `3000` | HTTP port for Fastify server |
| `ADMIN_PANEL_PASSWORD` | **Yes in production** | — | Unique, high-entropy password for `/admin`; the panel is disabled if omitted |
| `ADMIN_SESSION_TTL_MS` | No | `28800000` | Admin session lifetime in milliseconds (default: 8 hours) |
| `RATE_LIMIT_MAX_REQUESTS` | No | `10` | Max user requests per window |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Sliding window in milliseconds (default: 60s) |

---

## 🚀 Local Installation & Quickstart

### 1. Clone & Install Dependencies

```bash
git clone <repository-url>
cd zynygram-telegram-ai
npm install
```

### 2. Generate Prisma Client

```bash
npm run prisma:generate
```

### 3. Setup PostgreSQL & Run Migrations

Start PostgreSQL (locally or using Docker):

```bash
docker compose up postgres -d
```

Run database migrations:

```bash
npm run prisma:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The Fastify HTTP server will bind to `http://localhost:3000` and the Telegram bot will start polling for updates.

---

## 🗄 Database Migrations

This project uses Prisma ORM with PostgreSQL.

```bash
# Generate Prisma Client after schema changes
npm run prisma:generate

# Create and apply new migration in development
npm run prisma:migrate

# Apply migrations in production environments
npx prisma migrate deploy
```

### Schema Models:
- **`User`**: Tracks `telegramId` (`BigInt`), `username`, `firstName`, `lastName`, `language`, `isBlocked`, and timestamps.
- **`Conversation`**: Tracks `userId`, `status` (`OPEN`, `AI_HANDLED`, `WAITING_HUMAN`, `CLOSED`), and `assignedTo`.
- **`Message`**: Stores chronological messages with `role` (`USER`, `ASSISTANT`, `SYSTEM`, `ADMIN`) and `telegramMessageId`.

---

## 🧪 Testing

Comprehensive unit tests cover AI prompts, knowledge retrieval, escalation, admin commands, moderation, and rate limiting without requiring live external API keys:

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch
```

---

## 🐳 Docker & Containerized Deployment

Run both the application and PostgreSQL database with Docker Compose:

### 1. Build and Start Services

```bash
docker compose up -d --build
```

### 2. View Service Logs

```bash
docker compose logs -f app
```

### 3. Check Health Endpoints

```bash
curl http://localhost:3000/health
curl http://localhost:3000/ready
```

---

## 🛡 Admin Commands & Operations

Users whose numeric Telegram IDs are listed in `ADMIN_TELEGRAM_IDS` have access to administration commands:

| Command | Usage | Description |
| :--- | :--- | :--- |
| `/admin` | `/admin` | Displays available admin commands |
| `/stats` | `/stats` | Shows registered user counts, conversation counts by status |
| `/users` | `/users` | Lists 10 most recent users with block status |
| `/open` | `/open <conversationId>` | Reopens a closed conversation |
| `/close` | `/close <conversationId>` | Manually marks a conversation as `CLOSED` |
| `/block` | `/block <telegramId>` | Blocks a malicious user from bot interaction |
| `/unblock` | `/unblock <telegramId>` | Unblocks a previously blocked user |

> Non-admin users attempting to execute admin commands receive:
> *"Bu buyruq faqat administratorlar uchun."*

---

## 🔒 Security & Moderation Policies

1. **Zero Secret Leakage**: Sanitizers prevent exposing system prompts, environment variables, bot tokens, or database connection strings.
2. **Credential Theft Protection**: Any user attempt to ask for passwords, Telegram authorization codes, or database credentials is automatically rejected.
3. **No Credential Harvesting**: The AI prompt and policies strictly forbid asking users for passwords, 2FA codes, or banking card CVVs.
4. **Legitimate Feedback Welcomed**: Users voicing frustration or criticism about Zynygram are never blocked or censored—the assistant maintains a calm, professional tone and attempts to assist them.

---

## ❓ Troubleshooting & FAQ

### 1. Bot does not reply to messages
- Check bot token validity in `.env`.
- Ensure another instance of the bot is not running (Telegram enforces single active webhook or polling connection per bot token).
- Verify server logs for network or timeout issues (`docker compose logs app`).

### 2. `/ready` returns 503 degraded
- Check PostgreSQL database connectivity (`SELECT 1`).
- Verify `DATABASE_URL` credentials and port.
- Verify `AI_API_KEY` is non-empty.

### 3. Unknown Zynygram Policies
- Inquiries regarding unannounced features, pricing tiers, or unreleased verification badge criteria are marked `OFFICIAL POLICY REQUIRED` in the knowledge base. The AI will state that official guidelines are pending and offer `/human`.

---

## 📄 License

MIT License. Designed and maintained for Zynygram.
