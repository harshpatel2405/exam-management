import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Alert } from '../../components/Alert';
import { FileSpreadsheet, Upload, CheckCircle2, Sparkles } from 'lucide-react';

export const ImportQuestionBank: React.FC = () => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonText(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setError(null);
    setSuccessMsg(null);
    if (!jsonText.trim()) {
      setError('Please paste JSON data or select a .json file to import');
      return;
    }

    try {
      const parsed = JSON.parse(jsonText);
      setLoading(true);
      const res = await api.post('/question-banks/import', parsed);
      if (res.data.success) {
        setSuccessMsg(res.data.message);
        setTimeout(() => navigate('/admin/question-banks'), 1500);
      }
    } catch (err: any) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON format. Please check for syntax errors.');
      } else {
        setError(err.response?.data?.message || err.message || 'Import failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSampleJSON = () => {
    const sample = {
      title: 'Computer Science & Software Engineering Bank',
      subject: 'Computer Science',
      description: 'Comprehensive multi-topic question bank for CS fundamentals.',
      questions: [
        {
          questionId: 'CS-101',
          subject: 'Computer Science',
          topic: 'Data Structures',
          difficulty: 'easy',
          questionType: 'mcq',
          questionText: 'What is the time complexity of searching an element in a balanced Binary Search Tree (BST)?',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
          correctAnswers: ['O(log n)'],
          explanation: 'Each step divides the search space in half in a balanced BST.',
          marks: 2,
          negativeMarks: 0.5
        },
        {
          questionId: 'CS-102',
          subject: 'Computer Science',
          topic: 'Data Structures',
          difficulty: 'medium',
          questionType: 'msq',
          questionText: 'Which of the following sorting algorithms operate in O(n log n) average time complexity?',
          options: ['Merge Sort', 'Quick Sort', 'Heap Sort', 'Bubble Sort'],
          correctAnswers: ['Merge Sort', 'Quick Sort', 'Heap Sort'],
          explanation: 'Merge Sort, Quick Sort, and Heap Sort achieve O(n log n) average time complexity.',
          marks: 3,
          negativeMarks: 1
        },
        {
          questionId: 'CS-103',
          subject: 'Computer Science',
          topic: 'Algorithms',
          difficulty: 'easy',
          questionType: 'true_false',
          questionText: 'Dijkstra\'s algorithm works correctly on graphs with negative edge weights.',
          options: ['True', 'False'],
          correctAnswers: ['False'],
          explanation: 'Dijkstra assumes non-negative edge weights; Bellman-Ford must be used for negative edge weights.',
          marks: 1
        },
        {
          questionId: 'CS-104',
          subject: 'Computer Science',
          topic: 'Programming',
          difficulty: 'medium',
          questionType: 'predict_output',
          questionText: 'Given Python code: x = [1, 2, 3]; y = x; y.append(4); print(len(x)). What is the output?',
          correctAnswers: ['4'],
          explanation: 'y and x reference the exact same list in memory.',
          marks: 2
        },
        {
          questionId: 'CS-105',
          subject: 'Computer Science',
          topic: 'Programming',
          difficulty: 'hard',
          questionType: 'short_answer',
          questionText: 'Name the ACID property that ensures all transactions either fully complete or leave no trace.',
          correctAnswers: ['Atomicity'],
          explanation: 'Atomicity enforces all-or-nothing execution for database transactions.',
          marks: 2
        },
        {
          questionId: 'CS-106',
          subject: 'Computer Science',
          topic: 'Algorithms',
          difficulty: 'hard',
          questionType: 'write_code',
          questionText: 'Write a Python function `is_palindrome(s: str) -> bool` that ignores case and non-alphanumeric characters.',
          correctAnswers: ['def is_palindrome(s):\n    cleaned = [c.lower() for c in s if c.isalnum()]\n    return cleaned == cleaned[::-1]'],
          explanation: 'Filter alphanumeric characters and compare with reverse.',
          marks: 5
        }
      ]
    };
    setJsonText(JSON.stringify(sample, null, 2));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Question Bank</h1>
          <p className="text-sm text-gray-500">Upload or paste JSON question bank definitions.</p>
        </div>
        <button
          onClick={loadSampleJSON}
          className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold rounded-lg text-xs transition border border-purple-200"
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Load Sample CS Question Bank</span>
        </button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {successMsg && <Alert type="success" message={successMsg} />}

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Upload JSON File</label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Or Paste Question Bank JSON Data
          </label>
          <textarea
            rows={14}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='{\n  "title": "Subject Bank",\n  "subject": "CS101",\n  "questions": [...]\n}'
            className="w-full p-4 font-mono text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900"
          />
        </div>

        <button
          onClick={handleImport}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow transition disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          <span>{loading ? 'Validating & Importing...' : 'Validate and Import Question Bank'}</span>
        </button>
      </div>
    </div>
  );
};
