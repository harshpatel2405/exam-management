import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { QuestionBank, Question } from '../../types';
import { Database, Search, Filter, BookOpen, Layers } from 'lucide-react';

export const QuestionBankList: React.FC = () => {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await api.get('/question-banks/banks');
      if (res.data.success) {
        setBanks(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedBank(res.data.data[0]._id);
          fetchQuestions(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load banks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (bankId: string) => {
    try {
      const res = await api.get(`/question-banks/questions?bankId=${bankId}`);
      if (res.data.success) {
        setQuestions(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load questions:', err);
    }
  };

  const handleBankSelect = (id: string) => {
    setSelectedBank(id);
    fetchQuestions(id);
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.questionText.toLowerCase().includes(search.toLowerCase()) ||
      q.topic.toLowerCase().includes(search.toLowerCase()) ||
      q.questionId.toLowerCase().includes(search.toLowerCase());
    const matchesDiff = !difficultyFilter || q.difficulty === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Bank Repository</h1>
          <p className="text-sm text-gray-500">Browse imported question banks and inspect questions.</p>
        </div>
        <Link
          to="/admin/question-banks/import"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition shadow"
        >
          + Import New Bank
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Bank List Sidebar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
            Available Banks
          </h2>
          {banks.length === 0 ? (
            <div className="text-xs text-gray-500 p-2">No question banks imported yet.</div>
          ) : (
            banks.map((bank) => (
              <button
                key={bank._id}
                onClick={() => handleBankSelect(bank._id)}
                className={`w-full text-left p-3 rounded-lg border text-sm transition ${
                  selectedBank === bank._id
                    ? 'bg-blue-50 border-blue-300 text-blue-800 font-semibold'
                    : 'border-gray-100 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="font-semibold">{bank.title}</div>
                <div className="text-xs text-gray-500 flex items-center justify-between mt-1">
                  <span>{bank.subject}</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-medium">
                    {bank.questionCount} Qs
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Questions Inspection Table */}
        <div className="md:col-span-3 bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-gray-900 text-base">Bank Questions</h2>
              <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded">
                {filteredQuestions.length} Items
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search topic or text..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs w-48 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white text-gray-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">No questions found matching your filter criteria.</div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((q) => (
                <div key={q.questionId} className="p-4 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                        {q.questionId}
                      </span>
                      <span className="font-semibold text-gray-700">{q.topic}</span>
                      <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                        q.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-800' :
                        q.difficulty === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {q.difficulty}
                      </span>
                      <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-semibold uppercase">
                        {q.questionType}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-gray-600">{q.marks} Marks</div>
                  </div>

                  <div className="text-sm font-medium text-gray-900">{q.questionText}</div>

                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs text-gray-600">
                      {q.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded border ${
                            q.correctAnswers?.includes(opt)
                              ? 'bg-emerald-50 border-emerald-300 font-semibold text-emerald-900'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          {opt} {q.correctAnswers?.includes(opt) && '✓'}
                        </div>
                      ))}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="text-xs text-gray-500 bg-blue-50/50 p-2 rounded border border-blue-100">
                      <strong className="text-blue-800">Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
