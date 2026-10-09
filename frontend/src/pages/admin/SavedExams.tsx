import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Exam } from '../../types';
import { Alert } from '../../components/Alert';
import { FileCheck, UserCheck, BarChart3, CheckCircle2, Wand2 } from 'lucide-react';

export const SavedExams: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams');
      if (res.data.success) setExams(res.data.data);
    } catch (err) {
      console.error('Failed to load exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async (examId: string) => {
    try {
      const res = await api.post(`/exams/${examId}/publish`);
      if (res.data.success) {
        setMsg(`Exam published successfully`);
        fetchExams();
      }
    } catch (err: any) {
      setMsg(err.response?.data?.message || 'Publication failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Examinations</h1>
          <p className="text-sm text-gray-500">Manage saved exam configurations, publishing status, and student assignments.</p>
        </div>
        <Link
          to="/admin/exams/wizard"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition shadow"
        >
          <Wand2 className="w-4 h-4" />
          <span>New Exam Wizard</span>
        </Link>
      </div>

      {msg && <Alert type="info" message={msg} onClose={() => setMsg(null)} />}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading saved exams...</div>
        ) : exams.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No exams found. Launch the wizard to create your first exam.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b text-xs uppercase">
              <tr>
                <th className="p-4">Title & Subject</th>
                <th className="p-4">Questions</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Window</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {exams.map((exam) => (
                <tr key={exam._id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">
                    <div>{exam.title}</div>
                    <div className="text-xs text-gray-500 font-normal">{exam.subject}</div>
                  </td>
                  <td className="p-4 text-gray-600">
                    {exam.totalQuestions} Qs ({exam.totalMarks} Marks)
                  </td>
                  <td className="p-4 text-gray-600">{exam.durationMinutes} mins</td>
                  <td className="p-4 text-xs text-gray-500">
                    <div>From: {new Date(exam.startDate).toLocaleString()}</div>
                    <div>Until: {new Date(exam.endDate).toLocaleString()}</div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        exam.isPublished
                          ? 'bg-emerald-100 text-emerald-800'
                          : exam.status === 'awaiting_assignment'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {exam.isPublished ? 'Published' : exam.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <Link
                      to={`/admin/assignments?examId=${exam._id}`}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold rounded text-xs transition inline-flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Assign
                    </Link>

                    {!exam.isPublished && (
                      <button
                        onClick={() => handlePublishToggle(exam._id)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold rounded text-xs transition inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Publish
                      </button>
                    )}

                    <Link
                      to={`/admin/results?examId=${exam._id}`}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold rounded text-xs transition inline-flex items-center gap-1"
                    >
                      <BarChart3 className="w-3.5 h-3.5" /> Results
                    </Link>
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
