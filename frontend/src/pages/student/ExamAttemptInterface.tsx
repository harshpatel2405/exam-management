import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Question, ExamAttempt } from '../../types';
import { Timer } from '../../components/Timer';
import { Alert } from '../../components/Alert';
import { CheckCircle2, Bookmark, ArrowLeft, ArrowRight, Send, AlertTriangle } from 'lucide-react';

export const ExamAttemptInterface: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<ExamAttempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Local active answer state for current question
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [codeAnswer, setCodeAnswer] = useState('');
  const [outputAnswer, setOutputAnswer] = useState('');
  const [isMarkedForReview, setIsMarkedForReview] = useState(false);

  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    startOrResumeAttempt();
  }, [examId]);

  const startOrResumeAttempt = async () => {
    try {
      const res = await api.post(`/attempts/${examId}/start`);
      if (res.data.success) {
        const attData = res.data.data.attempt;
        const examView = res.data.data.exam;
        setAttempt(attData);
        setQuestions(examView.questions);

        // Load initial answer for first question if existing
        if (examView.questions.length > 0) {
          loadAnswerIntoState(examView.questions[0].questionId, attData.answers);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start exam attempt');
    } finally {
      setLoading(false);
    }
  };

  const loadAnswerIntoState = (qId: string, answersMap: any) => {
    const existing = answersMap?.[qId] || answersMap?.get?.(qId);
    if (existing) {
      setSelectedOptions(existing.selectedOptions || []);
      setTextAnswer(existing.textAnswer || '');
      setCodeAnswer(existing.codeAnswer || '');
      setOutputAnswer(existing.outputAnswer || '');
      setIsMarkedForReview(existing.isMarkedForReview || false);
    } else {
      setSelectedOptions([]);
      setTextAnswer('');
      setCodeAnswer('');
      setOutputAnswer('');
      setIsMarkedForReview(false);
    }
  };

  const currentQ = questions[currentIndex];

  const persistCurrentAnswer = useCallback(
    async (nextIdx?: number) => {
      if (!attempt || !currentQ) return;
      setSavingStatus('saving');

      try {
        const payload = {
          questionId: currentQ.questionId,
          selectedOptions,
          textAnswer,
          codeAnswer,
          outputAnswer,
          isMarkedForReview
        };

        const res = await api.post(`/attempts/${attempt._id}/save-answer`, payload);
        if (res.data.success) {
          setSavingStatus('saved');
          // Update in-memory attempt answers map
          setAttempt((prev) => {
            if (!prev) return null;
            const updatedAns = { ...prev.answers, [currentQ.questionId]: payload };
            return { ...prev, answers: updatedAns };
          });
        }
      } catch (err: any) {
        console.error('Answer auto-save failed:', err.message);
      } finally {
        setTimeout(() => setSavingStatus('idle'), 1200);
        if (nextIdx !== undefined && nextIdx >= 0 && nextIdx < questions.length) {
          setCurrentIndex(nextIdx);
          loadAnswerIntoState(questions[nextIdx].questionId, attempt.answers);
        }
      }
    },
    [attempt, currentQ, selectedOptions, textAnswer, codeAnswer, outputAnswer, isMarkedForReview, questions]
  );

  const handleNavigate = (newIdx: number) => {
    persistCurrentAnswer(newIdx);
  };

  const handleSubmit = async (isAutoSubmit: boolean = false) => {
    if (!attempt) return;
    try {
      // Save current answer first
      await persistCurrentAnswer();
      const res = await api.post(`/attempts/${attempt._id}/submit`, { isAutoSubmit });
      if (res.data.success) {
        navigate(`/student/my-results/${examId}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Submission failed');
    }
  };

  if (loading) return <div className="p-8 text-center text-sm text-gray-500">Initializing examination session...</div>;
  if (error) return <div className="p-8 max-w-xl mx-auto"><Alert type="error" message={error} /></div>;
  if (!attempt || !currentQ) return null;

  const answeredCount = Object.keys(attempt.answers || {}).length;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Distraction-Free Header Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-30 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-lg text-gray-900">{currentQ.subject}</span>
          <span className="text-xs bg-gray-100 font-bold text-gray-600 px-2.5 py-1 rounded">
            Q {currentIndex + 1} of {questions.length}
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* Answer Auto-save status */}
          <div className="text-xs font-semibold text-gray-500 flex items-center gap-1">
            {savingStatus === 'saving' && <span className="text-amber-600">Saving answer...</span>}
            {savingStatus === 'saved' && <span className="text-emerald-600">Saved to server ✓</span>}
          </div>

          {/* Countdown Timer */}
          <Timer expiresAt={attempt.expiresAt} onExpire={() => handleSubmit(true)} />

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition shadow flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Submit Exam
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Question Area */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Question Header Metadata */}
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded text-xs">
                  {currentQ.topic}
                </span>
                <span className="uppercase text-[10px] font-extrabold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  {currentQ.questionType}
                </span>
              </div>
              <span className="text-xs font-bold text-gray-700">{currentQ.marks} Marks</span>
            </div>

            {/* Question Text */}
            <div className="text-base font-semibold text-gray-900 leading-relaxed">
              {currentQ.questionText}
            </div>

            {/* Optional Code Snippet */}
            {currentQ.codeSnippet && (
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto">
                <code>{currentQ.codeSnippet}</code>
              </pre>
            )}

            {/* Answer Controls Tailored to Question Type */}
            <div className="pt-2">
              {/* MCQ & True/False */}
              {(currentQ.questionType === 'mcq' || currentQ.questionType === 'true_false') && currentQ.options && (
                <div className="space-y-2.5">
                  {currentQ.options.map((opt, i) => (
                    <label
                      key={i}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                        selectedOptions.includes(opt)
                          ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold shadow-sm'
                          : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${currentQ.questionId}`}
                        checked={selectedOptions.includes(opt)}
                        onChange={() => setSelectedOptions([opt])}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* MSQ (Multiple Select) */}
              {currentQ.questionType === 'msq' && currentQ.options && (
                <div className="space-y-2.5">
                  <div className="text-xs text-blue-700 font-medium mb-1">Select all applicable options:</div>
                  {currentQ.options.map((opt, i) => (
                    <label
                      key={i}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                        selectedOptions.includes(opt)
                          ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold shadow-sm'
                          : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedOptions.includes(opt)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedOptions([...selectedOptions, opt]);
                          else setSelectedOptions(selectedOptions.filter((o) => o !== opt));
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Predict Output & Short Answer */}
              {(currentQ.questionType === 'predict_output' || currentQ.questionType === 'short_answer') && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-700">Enter Your Response:</label>
                  <input
                    type="text"
                    value={textAnswer || outputAnswer}
                    onChange={(e) => {
                      setTextAnswer(e.target.value);
                      setOutputAnswer(e.target.value);
                    }}
                    placeholder="Type your answer here..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              )}

              {/* Write Code */}
              {(currentQ.questionType === 'write_code' || currentQ.questionType === 'code_output') && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-700">Write Code Submission:</label>
                  <textarea
                    rows={8}
                    value={codeAnswer}
                    onChange={(e) => setCodeAnswer(e.target.value)}
                    placeholder="def solution():\n    pass"
                    className="w-full p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 font-mono text-xs bg-slate-900 text-slate-100"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Question Footer Controls */}
          <div className="border-t pt-4 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
              <input
                type="checkbox"
                checked={isMarkedForReview}
                onChange={(e) => setIsMarkedForReview(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded"
              />
              <Bookmark className="w-3.5 h-3.5" /> Mark for Review
            </label>

            <div className="flex items-center gap-2">
              <button
                disabled={currentIndex === 0}
                onClick={() => handleNavigate(currentIndex - 1)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition disabled:opacity-40 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                disabled={currentIndex === questions.length - 1}
                onClick={() => handleNavigate(currentIndex + 1)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow transition disabled:opacity-40 flex items-center gap-1"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Navigation Palette */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4 h-fit">
          <div className="border-b pb-2">
            <h2 className="font-bold text-gray-900 text-sm">Question Palette</h2>
            <div className="text-xs text-gray-500 mt-0.5">
              Answered: {answeredCount} / {questions.length}
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const qAns = attempt.answers?.[q.questionId];
              const isAns = !!qAns && (qAns.selectedOptions?.length || qAns.textAnswer || qAns.codeAnswer);
              const isMarked = qAns?.isMarkedForReview;

              return (
                <button
                  key={q.questionId}
                  onClick={() => handleNavigate(idx)}
                  className={`w-9 h-9 rounded-lg font-bold text-xs flex items-center justify-center transition border ${
                    currentIndex === idx
                      ? 'ring-2 ring-blue-600 ring-offset-1 font-extrabold'
                      : ''
                  } ${
                    isMarked
                      ? 'bg-amber-400 text-amber-950 border-amber-500'
                      : isAns
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t text-[11px] space-y-1.5 text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-600" /> Answered
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-400" /> Marked for Review
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-gray-200 border border-gray-300" /> Unanswered
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-8 h-8" />
              <h2 className="text-xl font-bold text-gray-900">Submit Examination?</h2>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              You have answered <strong>{answeredCount}</strong> out of <strong>{questions.length}</strong> questions.
              Once submitted, you will not be able to modify your answers.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm"
              >
                Continue Exam
              </button>
              <button
                onClick={() => handleSubmit(false)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow"
              >
                Confirm Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
