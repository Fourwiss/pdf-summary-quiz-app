import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function App() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    const { data } = await axios.get(`${API_URL}/api/files`);
    setFiles(data);
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
        onChange={(e) => setSelectedFile(e.target.value)}
        className="border p-2 mb-2"
      >
        <option value="">Select file</option>
        {files.map((f) => (
          <option key={f._id} value={f._id}>
            {f.filename}
          </option>
        ))}
      </select>
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask a question"
        className="border p-2 w-full mb-2"
      />
      <button onClick={handleAsk} className="bg-blue-500 text-white px-4 py-2">
        Ask
      </button>
      {answer && (
        <div className="mt-4 p-2 border rounded">
          <strong>Answer:</strong> {answer}
        </div>
      )}
    </div>
  );
}
