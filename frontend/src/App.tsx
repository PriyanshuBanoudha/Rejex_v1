import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import MainLayout from './layouts/MainLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import CreateEventPage from './pages/CreateEventPage';
import ManageEventPage from './pages/ManageEventPage';
import TeamPage from './pages/TeamPage';
import SubmitProjectPage from './pages/SubmitProjectPage';
import GalleryPage from './pages/GalleryPage';
import JudgeDashboardPage from './pages/JudgeDashboardPage';
import ScoreProjectPage from './pages/ScoreProjectPage';
import PairwisePage from './pages/PairwisePage';
import AdminPage from './pages/AdminPage';
import AuditLogsPage from './pages/AuditLogsPage';
import CertVerifyPage from './pages/CertVerifyPage';
import ResultsPage from './pages/ResultsPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<SignupPage />} />
        <Route path="/certs/verify/:certId" element={<CertVerifyPage />} />

        {/* Main layout */}
        <Route element={<MainLayout />}>
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/gallery/:eventId" element={<GalleryPage />} />
          <Route path="/results/:eventId" element={<ResultsPage />} />

          {/* Authenticated */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/teams/:id" element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
          <Route path="/submit/:eventId" element={<ProtectedRoute roles={['participant']}><SubmitProjectPage /></ProtectedRoute>} />

          {/* Organizer+ */}
          <Route path="/events/new" element={<ProtectedRoute roles={['admin', 'organizer']}><CreateEventPage /></ProtectedRoute>} />
          <Route path="/events/:id/manage" element={<ProtectedRoute roles={['admin', 'organizer']}><ManageEventPage /></ProtectedRoute>} />
          <Route path="/audit/:eventId" element={<ProtectedRoute roles={['admin', 'organizer']}><AuditLogsPage /></ProtectedRoute>} />

          {/* Judge */}
          <Route path="/judge" element={<ProtectedRoute roles={['judge', 'admin']}><JudgeDashboardPage /></ProtectedRoute>} />
          <Route path="/judge/score/:assignmentId" element={<ProtectedRoute roles={['judge', 'admin']}><ScoreProjectPage /></ProtectedRoute>} />
          <Route path="/judge/pairwise/:eventId" element={<ProtectedRoute roles={['judge', 'admin']}><PairwisePage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
