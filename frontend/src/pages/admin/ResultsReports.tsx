import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Exam, ResultRecord } from '../../types';
import { Alert } from '../../components/Alert';
import { BarChart3, Download, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

export const ResultsReports: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialExamId = searchParams.get('examId');

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId || '');
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [isReleased, setIsReleased] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      fetchResults(selectedExamId);
    }
  }, [selectedExamId]);

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams');
      if (res.data.success) {
        setExams(res.data.data);
        if (!selectedExamId && res.data.data.length > 0) {
          setSelectedExamId(res.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load exams:', err);
    }
  };

  const fetchResults = async (examId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/results/exam/${examId}`);
      if (res.data.success) {
        setResults(res.data.data);
        if (res.data.data.length > 0) {
          setIsReleased(res.data.data[0].releasedToStudent);
        }
      }
    } catch (err) {
      console.error('Failed to load results:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRelease = async () => {
    if (!selectedExamId) return;
    const nextState = !isReleased;
    try {
      const res = await api.post(`/results/exam/${selectedExamId}/release`, { released: nextState });
      if (res.data.success) {
        setIsReleased(nextState);
        setMsg({ type: 'success', text: res.data.message });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to toggle result release' });
    }
  };

  const handleDownloadCSV = () => {
    if (!selectedExamId) return;
    window.open(`/api/results/exam/${selectedExamId}/export-csv`, '_blank');
  };

  const totalSubmissions = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const passRate = totalSubmissions > 0 ? ((passedCount / totalSubmissions) * 100).toFixed(1) : '0';
  const avgScore =
    totalSubmissions > 0
      ? (results.reduce((acc, r) => acc + r.totalMarksEarned, 0) / totalSubmissions).toFixed(1)
      : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Results & Performance Analytics</h1>
          <p className="text-sm text-gray-500">
            View student scores, release results, and export CSV reports.
          </p>
        </div>

        {/* Select Exam */}
        <select
          value={selectedExamId}
          onChange={(e) => setSelectedExamId(e.target.value)}
          className="px-4 py-2 border rounded-lg text-sm bg-white font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500"
        >
          {exams.map((ex) => (
            <option key={ex._id} value={ex._id}>
              {ex.title} ({ex.subject})
            </option>
          ))}
        </select>
      </div>

      {msg && <Alert type={msg.type} message={msg.text} onClose={() => setMsg(null)} />}

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{totalSubmissions}</div>
          <div className="text-xs font-semibold text-gray-500 uppercase mt-1">Total Submissions</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-emerald-600">{passRate}%</div>
          <div className="text-xs font-semibold text-gray-500 uppercase mt-1">Pass Rate</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{avgScore}</div>
          <div className="text-xs font-semibold text-gray-500 uppercase mt-1">Average Score</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-gray-900">Result Release Status</div>
            <div className="text-xs font-semibold text-gray-500 mt-1">
              {isReleased ? (
                <span className="text-emerald-700 font-bold">Released to Students</span>
              ) : (
                <span className="text-amber-700 font-bold">Hidden from Students</span>
              )}
            </div>
          </div>
          <button
            onClick={handleToggleRelease}
            className={`p-2.5 rounded-lg border transition ${
              isReleased ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
            }`}
            title={isReleased ? 'Hide results from students' : 'Release results to students'}
          >
            {isReleased ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-base">Student Submissions</h2>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition shadow"
          >
            <Download className="w-4 h-4" /> Export CSV Report
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading student results...</div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No submissions recorded for this examination yet.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b text-xs uppercase">
              <tr>
                <th className="p-3.5">Student Name</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Score</th>
                <th className="p-3.5">Percentage</th>
                <th className="p-3.5">Pass / Fail</th>
                <th className="p-3.5">Grading Status</th>
                <th className="p-3.5 text-right">Evaluated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="p-3.5 font-semibold text-gray-900">
                    {r.studentId?.name || r.normalizedEmail}
                  </td>
                  <td className="p-3.5 text-gray-600 font-mono text-xs">{r.normalizedEmail}</td>
                  <td className="p-3.5 font-bold text-gray-900">
                    {r.totalMarksEarned} / {r.maxMarks}
                  </td>
                  <td className="p-3.5 font-semibold text-blue-700">{r.percentage}%</td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        r.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {r.passed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {r.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        r.isGradingComplete
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800 font-bold'
                      }`}
                    >
                      {r.isGradingComplete ? 'Complete' : `${r.pendingManualGradingCount} Pending`}
                    </span>
                  </td>
                  <td className="p-3.5 text-right text-xs text-gray-500">
                    {new Date(r.evaluatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
