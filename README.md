# PDF Summary & Quiz App

A full-stack application for uploading PDFs, generating summaries, asking questions, and exporting quiz questions.

## Tech Stack
- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** MongoDB via Mongoose
- **NLP:** OpenAI API

## Setup

1. Clone repository
2. Install dependencies for server and client (requires internet)
3. Copy `.env.example` in `server` to `.env` and set credentials
4. Run MongoDB
5. Start backend and frontend

```bash
cd server && npm install && npm run dev
cd ../client && npm install && npm run start
```

The app is ready for deployment on Vercel/Render/Glitch.
