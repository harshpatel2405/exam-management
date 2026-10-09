import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ResultRecord, QuestionResult } from '../../types';
import { Alert } from '../../components/Alert';
import { CheckSquare, Save, UserCheck, Code, FileText } from 'lucide-react';

export const ManualGrading: React.FC = () => {
  const [pendingResults, setPendingResults] = useState<ResultRecord[]>([]);
  const [selectedResult, setSelectedResult] = useState<ResultRecord | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionResult | null>(null);
  const [marksEarned, setMarksEarned] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPendingResults();
  }, []);

  const fetchPendingResults = async () => {
    try {
      const res = await api.get('/grading/pending');
      if (res.data.success) {
        setPendingResults(res.data.data);
        if (res.data.data.length > 0) {
          const first = res.data.data[0];
          setSelectedResult(first);
          const firstPendingQ = first.questionResults.find((q: any) => q.status === 'pending_manual');
          if (firstPendingQ) {
            setSelectedQuestion(firstPendingQ);
            setMarksEarned(firstPendingQ.marksEarned || 0);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load pending grading queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResult || !selectedQuestion) return;
    setMsg(null);

    try {
      const res = await api.post(`/grading/result/${selectedResult._id}/grade`, {
        questionId: selectedQuestion.questionId,
        marksEarned,
        feedback
      });

      if (res.data.success) {
        setMsg({ type: 'success', text: 'Grade awarded and audit log recorded' });
        fetchPendingResults();
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Grading submission failed' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manual Evaluation Queue</h1>
        <p className="text-sm text-gray-500">
          Review and grade short-answer and code submissions requiring human judgment.
        </p>
      </div>

      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Submissions Queue */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
            Pending Submissions ({pendingResults.length})
          </h2>
          {loading ? (
            <div className="text-xs text-gray-500 p-2">Loading queue...</div>
          ) : pendingResults.length === 0 ? (
            <div className="text-xs text-gray-500 p-2">All submissions have been graded!</div>
          ) : (
            pendingResults.map((r) => (
              <button
                key={r._id}
                onClick={() => {
                  setSelectedResult(r);
                  const pendingQ = r.questionResults.find((q) => q.status === 'pending_manual');
                  if (pendingQ) {
                    setSelectedQuestion(pendingQ);
                    setMarksEarned(pendingQ.marksEarned || 0);
                  }
                }}
                className={`w-full text-left p-3 rounded-lg border text-sm transition ${
                  selectedResult?._id === r._id
                    ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                    : 'border-gray-100 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="font-semibold">{r.studentId?.name || r.normalizedEmail}</div>
                <div className="text-xs text-gray-500 flex items-center justify-between mt-1">
                  <span>{r.normalizedEmail}</span>
                  <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">
                    {r.pendingManualGradingCount} Pending
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Grading Workspace */}
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          {selectedResult && selectedQuestion ? (
            <form onSubmit={handleGradeSubmit} className="space-y-5">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-600 uppercase">
                    Question ID: {selectedQuestion.questionId}
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Evaluating {selectedResult.studentId?.name || selectedResult.normalizedEmail}
                  </h2>
                </div>
                <span className="text-xs font-bold bg-purple-100 text-purple-800 px-3 py-1 rounded-full uppercase">
                  {selectedQuestion.questionType}
                </span>
              </div>

              {/* Student Response Display */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase">Student Submitted Response:</div>
                <div className="font-mono text-sm bg-white p-3 rounded border border-gray-300 text-gray-900 whitespace-pre-wrap">
                  {selectedQuestion.studentResponse?.textAnswer ||
                    selectedQuestion.studentResponse?.codeAnswer ||
                    selectedQuestion.studentResponse?.outputAnswer ||
                    '(No answer text recorded)'}
                </div>
              </div>

              {/* Correct Key Reference */}
              {selectedQuestion.correctAnswerKey && (
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-xs text-emerald-900">
                  <strong>Expected Answer Key Reference:</strong>{' '}
                  {JSON.stringify(selectedQuestion.correctAnswerKey)}
                </div>
              )}

              {/* Grading Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Award Marks (Max: {selectedQuestion.maxMarks})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    max={selectedQuestion.maxMarks}
                    min="0"
                    value={marksEarned}
                    onChange={(e) => setMarksEarned(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Evaluator Feedback (Optional)
                  </label>
                  <input
                    type="text"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="e.g. Excellent explanation of complexity"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition"
              >
                <Save className="w-4 h-4" />
                <span>Save Grade and Record Audit Entry</span>
              </button>
            </form>
          ) : (
            <div className="py-16 text-center text-sm text-gray-500">
              Select a pending submission from the queue to start manual evaluation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
