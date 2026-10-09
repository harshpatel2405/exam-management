import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Database, Wand2, CheckSquare, BarChart3, Plus, ArrowRight, Shield } from 'lucide-react';
import { Exam } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [bankCount, setBankCount] = useState(0);
  const [pendingGradingCount, setPendingGradingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsRes, banksRes, pendingRes] = await Promise.all([
          api.get('/exams'),
          api.get('/question-banks/banks'),
          api.get('/grading/pending')
        ]);
        if (examsRes.data.success) setExams(examsRes.data.data);
        if (banksRes.data.success) setBankCount(banksRes.data.data.length);
        if (pendingRes.data.success) setPendingGradingCount(pendingRes.data.data.length);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Examiner Control Center</h1>
          <p className="text-sm text-gray-500">Manage question banks, generate exams, assign students, and grade submissions.</p>
        </div>
        <Link
          to="/admin/exams/wizard"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition"
        >
          <Wand2 className="w-4 h-4" />
          <span>Launch Exam Wizard</span>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{bankCount}</div>
            <div className="text-xs font-medium text-gray-500 uppercase">Question Banks</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Wand2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{exams.length}</div>
            <div className="text-xs font-medium text-gray-500 uppercase">Saved Exams</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{pendingGradingCount}</div>
            <div className="text-xs font-medium text-gray-500 uppercase">Pending Manual Grading</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {exams.filter((e) => e.isPublished).length}
            </div>
            <div className="text-xs font-medium text-gray-500 uppercase">Published Active Exams</div>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/question-banks/import"
          className="p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition">Import Question Bank</span>
            <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
          </div>
          <p className="text-xs text-gray-500">Upload JSON or CSV master question banks with automatic schema validation.</p>
        </Link>

        <Link
          to="/admin/exams/wizard"
          className="p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition">6-Step Exam Wizard</span>
            <Wand2 className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
          </div>
          <p className="text-xs text-gray-500">Configure topic filters, difficulty distribution, and assign authorized student emails.</p>
        </Link>

        <Link
          to="/admin/grading"
          className="p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition">Manual Grading Queue</span>
            <CheckSquare className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
          </div>
          <p className="text-xs text-gray-500">Review student short-answer and code submissions requiring human evaluation.</p>
        </Link>
      </div>

      {/* Recent Exams Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Recent Examinations</h2>
          <Link to="/admin/exams" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading examinations...</div>
        ) : exams.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No examinations created yet. Click "Launch Exam Wizard" to generate one.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b text-xs uppercase">
              <tr>
                <th className="p-3.5">Exam Title</th>
                <th className="p-3.5">Subject</th>
                <th className="p-3.5">Questions</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {exams.slice(0, 5).map((exam) => (
                <tr key={exam._id} className="hover:bg-gray-50">
                  <td className="p-3.5 font-medium text-gray-900">{exam.title}</td>
                  <td className="p-3.5 text-gray-600">{exam.subject}</td>
                  <td className="p-3.5 text-gray-600">{exam.totalQuestions} Qs ({exam.totalMarks} Marks)</td>
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                      exam.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {exam.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <Link
                      to={`/admin/assignments?examId=${exam._id}`}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Assignments
                    </Link>
                    <Link
                      to={`/admin/results?examId=${exam._id}`}
                      className="text-xs font-medium text-purple-600 hover:underline"
                    >
                      Results
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
