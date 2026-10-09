import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Exam, ExamAssignment, User } from '../../types';
import { Alert } from '../../components/Alert';
import { UserCheck, UserX, Mail, Upload, Plus, ShieldAlert } from 'lucide-react';

export const ExamAssignmentManagement: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialExamId = searchParams.get('examId');

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId || '');
  const [assignments, setAssignments] = useState<ExamAssignment[]>([]);
  const [registeredStudents, setRegisteredStudents] = useState<User[]>([]);

  // Add Assignment Form State
  const [emailInput, setEmailInput] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [sendNotifications, setSendNotifications] = useState(true);

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchExams();
    fetchRegisteredStudents();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      fetchAssignments(selectedExamId);
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

  const fetchRegisteredStudents = async () => {
    try {
      const res = await api.get('/students');
      if (res.data.success) setRegisteredStudents(res.data.data);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const fetchAssignments = async (examId: string) => {
    try {
      const res = await api.get(`/assignments/${examId}`);
      if (res.data.success) setAssignments(res.data.data);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    }
  };

  const handleAddAssignments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;
    setMsg(null);
    setLoading(true);

    try {
      const emails = emailInput
        .split('\n')
        .map((em) => em.trim())
        .filter((em) => em.length > 0);

      const res = await api.post(`/assignments/${selectedExamId}/assign`, {
        emails,
        studentIds: selectedStudentIds,
        csvContent,
        sendNotifications
      });

      if (res.data.success) {
        setMsg({ type: 'success', text: res.data.message });
        setEmailInput('');
        setCsvContent('');
        setSelectedStudentIds([]);
        fetchAssignments(selectedExamId);
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Assignment failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (email: string) => {
    if (!window.confirm(`Are you sure you want to revoke access for ${email}?`)) return;
    try {
      const res = await api.post(`/assignments/${selectedExamId}/revoke`, {
        email,
        reason: 'Revoked by administrator'
      });
      if (res.data.success) {
        setMsg({ type: 'success', text: `Access revoked for ${email}` });
        fetchAssignments(selectedExamId);
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Revocation failed' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exam Assignment Management</h1>
          <p className="text-sm text-gray-500">
            Control strict email access, invite registered/pending students, and manage revocation rules.
          </p>
        </div>

        {/* Exam Selector */}
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

      {/* Assign New Recipients Panel */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="font-bold text-gray-900 flex items-center gap-2 text-base border-b pb-2">
          <Plus className="w-5 h-5 text-blue-600" /> Assign Authorized Students
        </h2>

        <form onSubmit={handleAddAssignments} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Enter Authorized Student Emails (One per line)
              </label>
              <textarea
                rows={3}
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="alice@student.edu&#10;bob@student.edu"
                className="w-full p-2.5 border rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Or Paste CSV List of Emails
              </label>
              <textarea
                rows={3}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="email&#10;student1@school.edu&#10;student2@school.edu"
                className="w-full p-2.5 border rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={sendNotifications}
                onChange={(e) => setSendNotifications(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              Send Email Invitations
            </label>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition shadow disabled:opacity-50"
            >
              {loading ? 'Assigning...' : 'Add Assignments'}
            </button>
          </div>
        </form>
      </div>

      {/* Current Assignments List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-base">Authorized Recipients ({assignments.length})</h2>
          <div className="text-xs text-gray-500 font-medium">Strict Email Matching Enforced</div>
        </div>

        {assignments.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No student email assignments created for this exam yet.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold border-b text-xs uppercase">
              <tr>
                <th className="p-3.5">Student Email</th>
                <th className="p-3.5">Registered Name</th>
                <th className="p-3.5">Assignment Status</th>
                <th className="p-3.5">Attempt Status</th>
                <th className="p-3.5">Invitation</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {assignments.map((assign) => (
                <tr key={assign._id} className="hover:bg-gray-50">
                  <td className="p-3.5 font-mono font-semibold text-gray-900">{assign.normalizedEmail}</td>
                  <td className="p-3.5 text-gray-700">
                    {assign.studentId ? assign.studentId.name : <span className="text-amber-600 text-xs italic">Pending Registration</span>}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        assign.status === 'assigned'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {assign.status}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 uppercase">
                      {assign.attemptStatus || 'not_started'}
                    </span>
                  </td>
                  <td className="p-3.5 text-xs text-gray-500 uppercase">{assign.invitationStatus}</td>
                  <td className="p-3.5 text-right">
                    {assign.status === 'assigned' && (
                      <button
                        onClick={() => handleRevoke(assign.normalizedEmail)}
                        className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 font-semibold rounded text-xs transition inline-flex items-center gap-1"
                      >
                        <UserX className="w-3.5 h-3.5" /> Revoke Access
                      </button>
                    )}
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
