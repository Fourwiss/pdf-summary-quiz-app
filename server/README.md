# Backend Server

Express server for PDF summarization, question answering and quiz generation.

## Setup

```bash
cd server
npm install # may require internet
cp .env.example .env
npm run dev
```

Ensure MongoDB is running and provide your OpenAI API key in `.env`.

### Available Endpoints

- `POST /api/upload` – upload PDF files
- `GET /api/files` – list uploaded files with summaries
- `DELETE /api/files/:id` – remove a file
- `POST /api/ask` – ask a question about a summary
- `POST /api/questions` – generate quiz questions
- `POST /api/export` – export summary and questions as a PDF
