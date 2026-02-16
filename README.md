# Visicheck

SaaS zur Überwachung der Sichtbarkeit Ihrer Domains und Marken in ChatGPT, Claude, Gemini und Perplexity.

## Features

- Magic-Link-Anmeldung (passwortfrei)
- Verwaltung von Domains/Marken
- Definierbare Prompt-Sets
- Tracking-Intervalle: täglich, wöchentlich, monatlich oder on-demand
- Auswertung von Erwähnungen und Sichtbarkeits-Scores pro KI-Anbieter

## Tech-Stack

- Next.js 15, Tailwind CSS, shadcn/ui
- Neon (Postgres), Drizzle ORM
- NextAuth.js (Auth.js) mit Resend für Magic Links
- OpenAI, Anthropic, Google AI, Perplexity APIs

## Setup

1. Repo klonen und Abhängigkeiten installieren:
   ```bash
   npm install
   ```

2. `.env.local` anlegen (siehe `.env.example`):
   ```bash
   cp .env.example .env.local
   ```

3. Neon-Datenbank:
   - Projekt auf [neon.tech](https://neon.tech) erstellen
   - Connection String in `DATABASE_URL` eintragen
   - Schema pushen: `npm run db:push`

4. Resend:
   - API Key auf [resend.com](https://resend.com) erstellen
   - `AUTH_RESEND_KEY` und ggf. `EMAIL_FROM` setzen

5. AI-API-Keys eintragen:
   - `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`

6. Dev-Server starten:
   ```bash
   npm run dev
   ```

## Cron (Vercel)

Für geplante Runs den Cron-Endpoint `/api/cron/run-scheduled` per Vercel Cron einrichten. In `vercel.json` ist stündlicher Aufruf hinterlegt. `CRON_SECRET` muss in den Vercel-Env-Variablen gesetzt werden.
