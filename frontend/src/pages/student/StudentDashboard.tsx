import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Exam } from '../../types';
import { ShieldCheck, Clock, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyExams();
  }, []);

  const fetchMyExams = async () => {
    try {
      const res = await api.get('/exams/student/my-exams');
      if (res.data.success) setExams(res.data.data);
    } catch (err) {
      console.error('Failed to load student exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const availableExams = exams.filter((e) => e.availabilityStatus === 'available');
  const upcomingExams = exams.filter((e) => e.availabilityStatus === 'upcoming');
  const closedExams = exams.filter((e) => e.availabilityStatus === 'closed');

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-6 px-4">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Student Examination Portal</h1>
          <p className="text-blue-100 text-sm mt-1">
            Access assigned examinations, submit attempts, and view evaluation results.
          </p>
        </div>
        <ShieldCheck className="w-12 h-12 text-blue-300 opacity-80" />
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading your assigned examinations...</div>
      ) : (
        <div className="space-y-8">
          {/* Available Exams */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" /> Available Now for Attempt
            </h2>
            {availableExams.length === 0 ? (
              <div className="p-6 bg-white rounded-xl border border-gray-200 text-sm text-gray-500 text-center">
                No active examinations currently open for attempt.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableExams.map((exam) => (
                  <div
                    key={exam._id}
                    className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">{exam.title}</h3>
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {exam.subject}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800">
                        Open
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <div>
                        <span className="font-semibold text-gray-900">Duration:</span> {exam.durationMinutes} mins
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">Total Marks:</span> {exam.totalMarks}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">Questions:</span> {exam.totalQuestions}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">Closes:</span>{' '}
                        {new Date(exam.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <Link
                      to={`/student/instructions/${exam._id}`}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition text-sm"
                    >
                      <span>Start Examination</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Upcoming Exams */}
          {upcomingExams.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Upcoming Examinations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingExams.map((exam) => (
                  <div key={exam._id} className="bg-white p-5 rounded-xl border border-gray-200 space-y-3 opacity-90">
                    <h3 className="font-bold text-gray-900">{exam.title}</h3>
                    <div className="text-xs text-gray-500">
                      Available from: <strong>{new Date(exam.startDate).toLocaleString()}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Completed / Closed Exams */}
          {closedExams.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Past / Closed Examinations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {closedExams.map((exam) => (
                  <div key={exam._id} className="bg-white p-5 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{exam.title}</h3>
                      <div className="text-xs text-gray-500">{exam.subject}</div>
                    </div>
                    <Link
                      to={`/student/my-results/${exam._id}`}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold rounded-lg text-xs transition"
                    >
                      View Results
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
