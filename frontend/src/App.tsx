import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { QuestionBankList } from './pages/admin/QuestionBankList';
import { ImportQuestionBank } from './pages/admin/ImportQuestionBank';
import { CreateExamWizard } from './pages/admin/CreateExamWizard';
import { SavedExams } from './pages/admin/SavedExams';
import { ExamAssignmentManagement } from './pages/admin/ExamAssignmentManagement';
import { ManualGrading } from './pages/admin/ManualGrading';
import { ResultsReports } from './pages/admin/ResultsReports';
import { StudentManagement } from './pages/admin/StudentManagement';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ExamInstructions } from './pages/student/ExamInstructions';
import { ExamAttemptInterface } from './pages/student/ExamAttemptInterface';
import { MyResults } from './pages/student/MyResults';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: 'admin' | 'student' }> = ({
  children,
  allowedRole
}) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-8 text-center text-sm text-gray-500">Authenticating user...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
  }
  return <>{children}</>;
};

const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="question-banks" element={<QuestionBankList />} />
            <Route path="question-banks/import" element={<ImportQuestionBank />} />
            <Route path="exams/wizard" element={<CreateExamWizard />} />
            <Route path="exams" element={<SavedExams />} />
            <Route path="assignments" element={<ExamAssignmentManagement />} />
            <Route path="grading" element={<ManualGrading />} />
            <Route path="results" element={<ResultsReports />} />
            <Route path="students" element={<StudentManagement />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const StudentLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route index element={<StudentDashboard />} />
          <Route path="instructions/:examId" element={<ExamInstructions />} />
          <Route path="attempt/:examId" element={<ExamAttemptInterface />} />
          <Route path="my-results/:examId" element={<MyResults />} />
        </Routes>
      </main>
    </div>
  );
};

const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
