import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  FileSpreadsheet,
  Wand2,
  FileCheck,
  UserCheck,
  CheckSquare,
  BarChart3,
  Users
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const links = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/question-banks', label: 'Question Banks', icon: Database },
    { to: '/admin/question-banks/import', label: 'Import Question Bank', icon: FileSpreadsheet },
    { to: '/admin/exams/wizard', label: 'Create Exam Wizard', icon: Wand2 },
    { to: '/admin/exams', label: 'Saved Exams', icon: FileCheck },
    { to: '/admin/assignments', label: 'Exam Assignments', icon: UserCheck },
    { to: '/admin/grading', label: 'Manual Grading Queue', icon: CheckSquare },
    { to: '/admin/results', label: 'Results & Analytics', icon: BarChart3 },
    { to: '/admin/students', label: 'Student Management', icon: Users }
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col gap-1">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
        Examiner Navigation
      </div>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{link.label}</span>
          </NavLink>
        );
      })}
    </aside>
  );
};
