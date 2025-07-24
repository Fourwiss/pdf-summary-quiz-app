import express from 'express';
import cors from 'cors';
import multer from 'multer';
import mongoose from 'mongoose';
import morgan from 'morgan';
import dotenv from 'dotenv';
import pdfParse from 'pdf-parse';
import { Configuration, OpenAIApi } from 'openai';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

mongoose
  .connect(process.env.MONGODB_URI || '', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err.message));

const fileSchema = new mongoose.Schema({
  filename: String,
  summary: String,
  createdAt: { type: Date, default: Date.now },
});
const File = mongoose.model('File', fileSchema);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join('uploads');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

async function summarizeText(text) {
  const prompt = `Summarize the following text:\n${text}`;
  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
  });
  return completion.data.choices[0].message.content.trim();
}

app.post('/api/upload', upload.array('files'), async (req, res) => {
  try {
    const results = [];
    for (const file of req.files) {
      const dataBuffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(dataBuffer);
      const summary = await summarizeText(pdfData.text.substring(0, 4000));
      const saved = await File.create({ filename: file.filename, summary });
      results.push(saved);
    }
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process files' });
  }
});

app.get('/api/files', async (req, res) => {
  const files = await File.find();
  res.json(files);
});

app.delete('/api/files/:id', async (req, res) => {
  try {
    const file = await File.findByIdAndDelete(req.params.id);
    if (file) fs.unlinkSync(path.join('uploads', file.filename));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

app.post('/api/ask', async (req, res) => {
  try {
    const { question, fileId } = req.body;
    const file = await File.findById(fileId);
    const prompt = `Answer this question based on the summary: ${file.summary}\nQuestion: ${question}`;
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });
    const answer = completion.data.choices[0].message.content.trim();
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to answer question' });
  }
});

app.post('/api/questions', async (req, res) => {
  try {
    const { fileId } = req.body;
    const file = await File.findById(fileId);
    const prompt = `Generate three multiple choice and two short answer questions in JSON based on this summary:\n${file.summary}`;
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });
    const questions = JSON.parse(completion.data.choices[0].message.content);
    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
});

app.post('/api/export', async (req, res) => {
  try {
    const { fileId, questions } = req.body;
    const file = await File.findById(fileId);
    const doc = new PDFDocument();
    const chunks = [];
    doc.on('data', (d) => chunks.push(d));
    doc.on('end', () => {
      const pdfData = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="quiz.pdf"`);
      res.send(pdfData);
    });
    doc.fontSize(16).text('Summary', { underline: true });
    doc.fontSize(12).text(file.summary);
    doc.addPage();
    doc.fontSize(16).text('Questions', { underline: true });
    questions.forEach((q, i) => {
      doc.moveDown();
      doc.fontSize(12).text(`${i + 1}. ${q.question}`);
      if (q.options) {
        q.options.forEach((opt, idx) => {
          doc.text(`   ${String.fromCharCode(65 + idx)}. ${opt}`);
        });
      }
    });
    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
