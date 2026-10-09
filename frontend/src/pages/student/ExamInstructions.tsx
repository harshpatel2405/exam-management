import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Exam } from '../../types';
import { Alert } from '../../components/Alert';
import { Clock, ShieldAlert, ArrowRight, BookOpen } from 'lucide-react';

export const ExamInstructions: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExam();
  }, [examId]);

  const fetchExam = async () => {
    try {
      const res = await api.get(`/exams/${examId}/student-instructions`);
      if (res.data.success) {
        setExam(res.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = () => {
    navigate(`/student/attempt/${examId}`);
  };

  if (loading) return <div className="p-8 text-center text-sm text-gray-500">Loading exam briefing...</div>;
  if (error) return <div className="p-8 max-w-xl mx-auto"><Alert type="error" message={error} /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8 px-4">
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-md space-y-6">
        <div className="border-b pb-4">
          <span className="text-xs font-bold text-blue-700 uppercase bg-blue-50 px-2.5 py-1 rounded">
            {exam?.subject}
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-2">{exam?.title}</h1>
          {exam?.description && <p className="text-sm text-gray-600 mt-1">{exam.description}</p>}
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl text-center border border-gray-200">
          <div>
            <div className="text-2xl font-bold text-gray-900">{exam?.durationMinutes} Mins</div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Duration</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{exam?.totalQuestions}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Total Questions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{exam?.totalMarks}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Total Marks</div>
          </div>
        </div>

        {/* Instructions List */}
        <div className="space-y-3">
          <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" /> Examination Rules & Instructions
          </h2>
          <div className="text-sm text-gray-700 bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-2 leading-relaxed">
            <p>1. The countdown timer begins immediately when you click <strong>Start Examination</strong>.</p>
            <p>2. Answers are automatically saved to the server as you select options or type responses.</p>
            <p>3. If your browser closes or connection drops, refresh the page to resume your active attempt.</p>
            <p>4. When the countdown timer reaches zero, your examination will automatically submit.</p>
            <p>5. {exam?.instructions || 'Ensure honest attempt without external assistance.'}</p>
          </div>
        </div>

        <button
          onClick={handleStartExam}
          className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg transition text-base"
        >
          <span>I Understand Rules — Start Examination</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
