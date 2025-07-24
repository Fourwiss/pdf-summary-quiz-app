import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [summary, setSummary] = useState('');
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    const { data } = await axios.get(`${API_URL}/api/files`);
    setFiles(data);
  }

  function handleSelect(id) {
    setSelectedFile(id);
    const file = files.find((f) => f._id === id);
    setSummary(file ? file.summary : '');
    setAnswer('');
    setQuestions([]);
  }

  async function handleUpload(e) {
    const formData = new FormData();
    for (const file of e.target.files) {
      formData.append('files', file);
    }
    await axios.post(`${API_URL}/api/upload`, formData);
    fetchFiles();
  }

  async function handleAsk() {
    const { data } = await axios.post(`${API_URL}/api/ask`, {
      question,
      fileId: selectedFile,
    });
    setAnswer(data.answer);
  }

  async function handleGenerateQuiz() {
    const { data } = await axios.post(`${API_URL}/api/questions`, {
      fileId: selectedFile,
    });
    setQuestions(data.questions);
  }

  async function handleExport() {
    const { data } = await axios.post(
      `${API_URL}/api/export`,
      { fileId: selectedFile, questions },
      { responseType: 'blob' }
    );
    const url = window.URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz.pdf';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function handleDelete(id) {
    await axios.delete(`${API_URL}/api/files/${id}`);
    fetchFiles();
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">PDF Summary & QA Tool</h1>
      <input type="file" multiple onChange={handleUpload} className="mb-4" />
      <ul className="mb-4">
        {files.map((f) => (
          <li key={f._id} className="flex justify-between items-center">
            <span>{f.filename}</span>
            <button
              onClick={() => handleDelete(f._id)}
              className="text-red-600"
            >
              delete
            </button>
          </li>
        ))}
      </ul>
      <select
        value={selectedFile}
        onChange={(e) => handleSelect(e.target.value)}
        className="border p-2 mb-2"
      >
        <option value="">Select file</option>
        {files.map((f) => (
          <option key={f._id} value={f._id}>
            {f.filename}
          </option>
        ))}
      </select>
      {summary && (
        <div className="mb-4 border p-2 rounded">
          <h2 className="font-semibold mb-2">Summary</h2>
          <p>{summary}</p>
        </div>
      )}
      {selectedFile && (
        <>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question"
            className="border p-2 w-full mb-2"
          />
          <button
            onClick={handleAsk}
            className="bg-blue-500 text-white px-4 py-2 mr-2"
          >
            Ask
          </button>
          <button
            onClick={handleGenerateQuiz}
            className="bg-green-500 text-white px-4 py-2 mr-2"
          >
            Generate Quiz
          </button>
          <button
            onClick={handleExport}
            className="bg-purple-500 text-white px-4 py-2"
            disabled={!questions.length}
          >
            Export PDF
          </button>
        </>
      )}
      {answer && (
        <div className="mt-4 p-2 border rounded">
          <strong>Answer:</strong> {answer}
        </div>
      )}
      {questions.length > 0 && (
        <div className="mt-4">
          <h2 className="font-semibold mb-2">Generated Questions</h2>
          <ul className="list-disc list-inside">
            {questions.map((q, i) => (
              <li key={i} className="mb-2">
                {q.question}
                {q.options && (
                  <ul className="list-decimal list-inside ml-4">
                    {q.options.map((o, idx) => (
                      <li key={idx}>{o}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
