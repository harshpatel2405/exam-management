import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Alert } from '../../components/Alert';
import { ShieldCheck, CheckCircle2, XCircle, Clock, ArrowLeft } from 'lucide-react';

export const MyResults: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResult();
  }, [examId]);

  const fetchResult = async () => {
    try {
      const res = await api.get(`/results/exam/${examId}/my-result`);
      if (res.data.success) {
        setResult(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to retrieve examination results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-sm text-gray-500">Loading your examination results...</div>;
  if (error) return <div className="p-8 max-w-xl mx-auto"><Alert type="error" message={error} /></div>;

  if (!result || !result.isReleased) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 space-y-4 text-center">
        <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <Clock className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Results Pending Release</h2>
          <p className="text-sm text-gray-600">
            {result?.message || 'The examiner has not released results for this examination yet.'}
          </p>
          <Link
            to="/student"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Student Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8 px-4">
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-md space-y-6">
        <div className="border-b pb-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-blue-700 uppercase bg-blue-50 px-2 py-0.5 rounded">
              Examination Result Report
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900 mt-1">{result.examTitle}</h1>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-extrabold text-sm uppercase ${
              result.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {result.passed ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            {result.passed ? 'PASSED' : 'FAILED'}
          </span>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl text-center border border-gray-200">
          <div>
            <div className="text-3xl font-extrabold text-blue-600">
              {result.totalMarksEarned} / {result.maxMarks}
            </div>
            <div className="text-xs font-semibold text-gray-500 uppercase mt-1">Score Earned</div>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-gray-900">{result.percentage}%</div>
            <div className="text-xs font-semibold text-gray-500 uppercase mt-1">Percentage</div>
          </div>

          <div>
            <div className="text-sm font-bold text-gray-900 mt-2">
              {result.isGradingComplete ? 'Grading Complete' : 'Pending Manual Evaluation'}
            </div>
            <div className="text-xs font-semibold text-gray-500 uppercase mt-1">Evaluation Status</div>
          </div>
        </div>

        {/* Question Results Breakdown if available */}
        {result.questionResults && (
          <div className="space-y-4 border-t pt-4">
            <h2 className="font-bold text-gray-900 text-base">Question Breakdown</h2>
            <div className="space-y-3">
              {result.questionResults.map((q: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-700">Question {idx + 1} ({q.questionType})</span>
                    <span
                      className={`px-2 py-0.5 rounded font-bold uppercase ${
                        q.status === 'correct'
                          ? 'bg-emerald-100 text-emerald-800'
                          : q.status === 'incorrect'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {q.marksEarned} / {q.maxMarks} Marks ({q.status})
                    </span>
                  </div>

                  {q.feedback && (
                    <div className="text-xs text-blue-900 bg-blue-50 p-2 rounded">
                      <strong>Evaluator Feedback:</strong> {q.feedback}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="text-xs text-gray-600 bg-emerald-50/50 p-2 rounded border border-emerald-100">
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t">
          <Link
            to="/student"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition shadow"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Student Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};
