import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Alert } from '../../components/Alert';
import { Question, User } from '../../types';
import {
  Wand2,
  CheckCircle,
  Eye,
  UserCheck,
  RefreshCw,
  Save,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

export const CreateExamWizard: React.FC = () => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Basic Info
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Computer Science');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('Attempt all questions within the allocated time.');
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [totalMarks, setTotalMarks] = useState(10);
  const [passingMarks, setPassingMarks] = useState(5);
  const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState(true);
  const [defaultNegativeMarks, setDefaultNegativeMarks] = useState(0.5);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16));
  const [resultVisibility, setResultVisibility] = useState('after_manual_grading');

  // Step 2: Topics
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // Step 3: Difficulty
  const [diffMode, setDiffMode] = useState<'exact' | 'percentage'>('exact');
  const [easyCount, setEasyCount] = useState(2);
  const [mediumCount, setMediumCount] = useState(2);
  const [hardCount, setHardCount] = useState(1);

  // Step 4: Question Types
  const [mcqCount, setMcqCount] = useState(2);
  const [msqCount, setMsqCount] = useState(1);
  const [tfCount, setTfCount] = useState(1);
  const [shortAnsCount, setShortAnsCount] = useState(1);
  const [predictOutCount, setPredictOutCount] = useState(0);
  const [writeCodeCount, setWriteCodeCount] = useState(0);

  // Step 5: Generated Preview
  const [generatedExam, setGeneratedExam] = useState<any>(null);
  const [previewTab, setPreviewTab] = useState<'admin' | 'student'>('admin');

  // Step 6: Assignments
  const [registeredStudents, setRegisteredStudents] = useState<User[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [customEmails, setCustomEmails] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [sendNotifications, setSendNotifications] = useState(true);
  const [assignOption, setAssignOption] = useState<'assign_now' | 'assign_later'>('assign_now');

  const navigate = useNavigate();

  useEffect(() => {
    fetchTopics(subject);
    fetchRegisteredStudents();
  }, [subject]);

  const fetchTopics = async (subj: string) => {
    try {
      const res = await api.get(`/question-banks/topics?subject=${encodeURIComponent(subj)}`);
      if (res.data.success && res.data.data.length > 0) {
        setAvailableTopics(res.data.data);
        setSelectedTopics(res.data.data);
      } else {
        setAvailableTopics(['Data Structures', 'Algorithms', 'Programming']);
        setSelectedTopics(['Data Structures', 'Algorithms', 'Programming']);
      }
    } catch {
      setAvailableTopics(['Data Structures', 'Algorithms', 'Programming']);
      setSelectedTopics(['Data Structures', 'Algorithms', 'Programming']);
    }
  };

  const fetchRegisteredStudents = async () => {
    try {
      const res = await api.get('/students');
      if (res.data.success) setRegisteredStudents(res.data.data);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  // Step Nav Validation
  const validateStep = (currentStep: number) => {
    setError(null);
    if (currentStep === 1) {
      if (!title.trim()) return setError('Exam title is required');
      if (totalQuestions <= 0) return setError('Total questions must be greater than 0');
      if (durationMinutes <= 0) return setError('Duration must be greater than 0');
      if (passingMarks > totalMarks) return setError('Passing marks cannot exceed total marks');
    }
    if (currentStep === 2) {
      if (selectedTopics.length === 0) return setError('Select at least one topic');
    }
    if (currentStep === 3) {
      if (diffMode === 'exact') {
        const sum = easyCount + mediumCount + hardCount;
        if (sum !== totalQuestions) {
          return setError(`Difficulty counts (${sum}) must sum to total questions (${totalQuestions})`);
        }
      } else {
        const sum = easyCount + mediumCount + hardCount;
        if (sum !== 100) return setError(`Difficulty percentages (${sum}%) must sum to 100%`);
      }
    }
    if (currentStep === 4) {
      const sum = mcqCount + msqCount + tfCount + shortAnsCount + predictOutCount + writeCodeCount;
      if (sum !== totalQuestions) {
        return setError(`Sum of question types (${sum}) must equal total questions requested (${totalQuestions})`);
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep(step)) return;
    if (step === 4) {
      // Generate preview exam
      await generateExamPreview();
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const generateExamPreview = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        title,
        subject,
        description,
        instructions,
        totalQuestions,
        durationMinutes,
        totalMarks,
        passingMarks,
        negativeMarkingEnabled,
        defaultNegativeMarks,
        maxAttempts,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        resultVisibility,
        selectedTopics,
        difficultyConfig: {
          mode: diffMode,
          easy: easyCount,
          medium: mediumCount,
          hard: hardCount
        },
        questionTypeConfig: {
          mcq: mcqCount,
          msq: msqCount,
          true_false: tfCount,
          short_answer: shortAnsCount,
          predict_output: predictOutCount,
          write_code: writeCodeCount,
          code_output: 0
        }
      };

      const res = await api.post('/exams/wizard', payload);
      if (res.data.success) {
        setGeneratedExam(res.data.data.exam);
        setStep(5);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to generate exam preview');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSave = async () => {
    setLoading(true);
    setError(null);
    try {
      let initialAssignments = undefined;
      if (assignOption === 'assign_now') {
        const emailList = customEmails
          .split('\n')
          .map((e) => e.trim())
          .filter((e) => e.length > 0);

        initialAssignments = {
          studentIds: selectedStudentIds,
          emails: emailList,
          csvContent,
          sendNotifications
        };

        const assignRes = await api.post(
          `/assignments/${generatedExam._id}/assign`,
          initialAssignments
        );
        if (!assignRes.data.success) {
          throw new Error('Failed to save student assignments');
        }
      }

      setSuccessMsg('Exam generated, saved persistently, and student access configured successfully!');
      setTimeout(() => navigate('/admin/exams'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error saving exam assignments');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exam Creation Wizard</h1>
          <p className="text-sm text-gray-500">
            Step-by-step rule-based question selection and student assignment.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
          Step {step} of 6
        </div>
      </div>

      {/* Wizard Progress Indicator */}
      <div className="grid grid-cols-6 gap-2">
        {['1. Basic Info', '2. Topics', '3. Difficulty', '4. Question Types', '5. Preview', '6. Assign'].map(
          (label, idx) => (
            <div
              key={idx}
              className={`p-2 text-center text-xs font-semibold rounded-lg border transition ${
                step === idx + 1
                  ? 'bg-blue-600 text-white border-blue-600 shadow'
                  : step > idx + 1
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-white text-gray-400 border-gray-200'
              }`}
            >
              {label}
            </div>
          )
        )}
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {successMsg && <Alert type="success" message={successMsg} />}

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 text-lg border-b pb-2">Step 1: Examination Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Exam Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. CS101 Midterm Examination"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Subject *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Total Questions</label>
                <input
                  type="number"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Total Marks</label>
                <input
                  type="number"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Passing Marks</label>
                <input
                  type="number"
                  value={passingMarks}
                  onChange={(e) => setPassingMarks(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Result Visibility Policy</label>
                <select
                  value={resultVisibility}
                  onChange={(e) => setResultVisibility(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="after_manual_grading">Release after manual grading complete</option>
                  <option value="full_with_answers">Immediate full results with correct answers</option>
                  <option value="marks_only">Immediate marks & pass/fail only</option>
                  <option value="hidden">Hidden until manually released by examiner</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="negMarking"
                  checked={negativeMarkingEnabled}
                  onChange={(e) => setNegativeMarkingEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="negMarking" className="text-xs font-semibold text-gray-700">
                  Enable Negative Marking
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Topics */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 text-lg border-b pb-2">Step 2: Topic Selection</h2>
            <p className="text-xs text-gray-500">Choose topics from the question bank for subject "{subject}".</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {availableTopics.map((tp) => (
                <label
                  key={tp}
                  className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition ${
                    selectedTopics.includes(tp) ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTopics.includes(tp)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedTopics([...selectedTopics, tp]);
                      else setSelectedTopics(selectedTopics.filter((t) => t !== tp));
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm">{tp}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Difficulty */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 text-lg border-b pb-2">Step 3: Difficulty Distribution</h2>
            <div className="flex items-center gap-4">
              <label className="text-xs font-semibold text-gray-700">Configuration Mode:</label>
              <button
                onClick={() => setDiffMode('exact')}
                className={`px-3 py-1 rounded text-xs font-semibold ${
                  diffMode === 'exact' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Exact Counts
              </button>
              <button
                onClick={() => setDiffMode('percentage')}
                className={`px-3 py-1 rounded text-xs font-semibold ${
                  diffMode === 'percentage' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                Percentages (%)
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-emerald-700 mb-1">Easy {diffMode === 'percentage' ? '(%)' : 'Count'}</label>
                <input
                  type="number"
                  value={easyCount}
                  onChange={(e) => setEasyCount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-700 mb-1">Medium {diffMode === 'percentage' ? '(%)' : 'Count'}</label>
                <input
                  type="number"
                  value={mediumCount}
                  onChange={(e) => setMediumCount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-red-700 mb-1">Hard {diffMode === 'percentage' ? '(%)' : 'Count'}</label>
                <input
                  type="number"
                  value={hardCount}
                  onChange={(e) => setHardCount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Question Types */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 text-lg border-b pb-2">Step 4: Question Type Allocation</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Multiple Choice (MCQ)</label>
                <input
                  type="number"
                  value={mcqCount}
                  onChange={(e) => setMcqCount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Multiple Select (MSQ)</label>
                <input
                  type="number"
                  value={msqCount}
                  onChange={(e) => setMsqCount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">True / False</label>
                <input
                  type="number"
                  value={tfCount}
                  onChange={(e) => setTfCount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Predict Output</label>
                <input
                  type="number"
                  value={predictOutCount}
                  onChange={(e) => setPredictOutCount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Short Answer</label>
                <input
                  type="number"
                  value={shortAnsCount}
                  onChange={(e) => setShortAnsCount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Write Code</label>
                <input
                  type="number"
                  value={writeCodeCount}
                  onChange={(e) => setWriteCodeCount(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Dual Preview */}
        {step === 5 && generatedExam && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="font-bold text-gray-900 text-lg">Step 5: Generated Exam Dual Preview</h2>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setPreviewTab('admin')}
                  className={`px-3 py-1 text-xs font-semibold rounded ${
                    previewTab === 'admin' ? 'bg-white text-blue-700 shadow' : 'text-gray-600'
                  }`}
                >
                  Admin Key Preview
                </button>
                <button
                  onClick={() => setPreviewTab('student')}
                  className={`px-3 py-1 text-xs font-semibold rounded ${
                    previewTab === 'student' ? 'bg-white text-blue-700 shadow' : 'text-gray-600'
                  }`}
                >
                  Student Preview (No Keys)
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {generatedExam.questionsSnapshot.map((q: Question, idx: number) => (
                <div key={idx} className="p-4 border rounded-lg bg-gray-50/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-blue-700">Q{idx + 1}. {q.topic} ({q.difficulty})</span>
                    <span>{q.marks} Marks</span>
                  </div>
                  <div className="text-sm font-medium text-gray-900">{q.questionText}</div>
                  {q.options && (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded border ${
                            previewTab === 'admin' && q.correctAnswers?.includes(opt)
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                              : 'bg-white border-gray-200 text-gray-700'
                          }`}
                        >
                          {opt} {previewTab === 'admin' && q.correctAnswers?.includes(opt) && '✓'}
                        </div>
                      ))}
                    </div>
                  )}
                  {previewTab === 'admin' && q.explanation && (
                    <div className="text-xs text-blue-800 bg-blue-50 p-2 rounded">
                      <strong>Answer Key Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Student Assignment */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 text-lg border-b pb-2">
              Step 6: Assign Authorized Student Emails
            </h2>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                <input
                  type="radio"
                  name="assignOption"
                  value="assign_now"
                  checked={assignOption === 'assign_now'}
                  onChange={() => setAssignOption('assign_now')}
                />
                Assign Students Now
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-600">
                <input
                  type="radio"
                  name="assignOption"
                  value="assign_later"
                  checked={assignOption === 'assign_later'}
                  onChange={() => setAssignOption('assign_later')}
                />
                Save Exam First and Assign Later
              </label>
            </div>

            {assignOption === 'assign_now' && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Select Registered Students
                  </label>
                  <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1 bg-gray-50">
                    {registeredStudents.map((s) => (
                      <label key={s._id} className="flex items-center gap-2 text-xs p-1.5 hover:bg-white rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(s._id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedStudentIds([...selectedStudentIds, s._id]);
                            else setSelectedStudentIds(selectedStudentIds.filter((id) => id !== s._id));
                          }}
                        />
                        <span className="font-semibold text-gray-900">{s.name}</span>
                        <span className="text-gray-500">({s.email})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Enter Permitted Student Emails (One per line)
                  </label>
                  <textarea
                    rows={3}
                    value={customEmails}
                    onChange={(e) => setCustomEmails(e.target.value)}
                    placeholder="student1@school.edu&#10;student2@school.edu"
                    className="w-full p-2.5 border rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Or Import CSV Email List
                  </label>
                  <textarea
                    rows={2}
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    placeholder="email&#10;studentA@school.edu&#10;studentB@school.edu"
                    className="w-full p-2 border rounded-lg text-xs font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notify"
                    checked={sendNotifications}
                    onChange={(e) => setSendNotifications(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="notify" className="text-xs font-semibold text-gray-700">
                    Send Email Invitations to Assigned Students
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between border-t pt-4 mt-6">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}

          {step < 5 && (
            <button
              onClick={handleNext}
              disabled={loading}
              className="ml-auto flex items-center gap-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow transition"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 5 && (
            <button
              onClick={() => setStep(6)}
              className="ml-auto flex items-center gap-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow transition"
            >
              Proceed to Student Assignment <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 6 && (
            <button
              onClick={handleFinalSave}
              disabled={loading}
              className="ml-auto flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? 'Saving & Publishing...' : 'Save & Publish Examination'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
