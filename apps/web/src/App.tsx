import type { ApprovedRole } from "@clubflow/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";

import { AppShell } from "./components/app-shell";
import { AuthProvider, getHomePath, useAuth } from "./lib/auth";
import {
  AdminApplicationsPage,
  AdminClubsPage,
  AdminDashboardPage,
  AdminUsersPage,
} from "./pages/admin-pages";
import {
  LeaderAnnouncementsPage,
  LeaderDashboardPage,
  LeaderMembersPage,
} from "./pages/leader-pages";
import {
  MemberClubPage,
  MemberDashboardPage,
  MemberProfilePage,
} from "./pages/member-pages";
import { PendingPage } from "./pages/pending-page";
import { LoginPage, SignupPage } from "./pages/public-pages";

const queryClient = new QueryClient();

const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="loading-screen__orb" />
    <p>세션과 권한 구성을 불러오는 중입니다.</p>
  </div>
);

const PublicOnlyRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate replace to={getHomePath(user)} />;
  }

  return children;
};

const PendingRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (user.approvalStatus === "approved" && user.role !== "pending") {
    return <Navigate replace to={getHomePath(user)} />;
  }

  return <PendingPage />;
};

const AuthenticatedLayout = ({ roles }: { roles: ApprovedRole[] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (user.approvalStatus !== "approved" || user.role === "pending") {
    return <Navigate replace to="/access" />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate replace to={getHomePath(user)} />;
  }

  return (
    <AppShell user={user}>
      <Outlet />
    </AppShell>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <SignupPage />
          </PublicOnlyRoute>
        }
      />
      <Route path="/access" element={<PendingRoute />} />

      <Route
        path="/"
        element={<Navigate replace to={user ? getHomePath(user) : "/login"} />}
      />

      <Route element={<AuthenticatedLayout roles={["member"]} />}>
        <Route path="/member/dashboard" element={<MemberDashboardPage />} />
        <Route path="/member/club" element={<MemberClubPage />} />
        <Route path="/member/profile" element={<MemberProfilePage />} />
      </Route>

      <Route element={<AuthenticatedLayout roles={["leader"]} />}>
        <Route path="/leader/dashboard" element={<LeaderDashboardPage />} />
        <Route path="/leader/members" element={<LeaderMembersPage />} />
        <Route path="/leader/announcements" element={<LeaderAnnouncementsPage />} />
      </Route>

      <Route element={<AuthenticatedLayout roles={["admin"]} />}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/applications" element={<AdminApplicationsPage />} />
        <Route path="/admin/clubs" element={<AdminClubsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
      </Route>

      <Route
        path="*"
        element={<Navigate replace to={user ? getHomePath(user) : "/login"} />}
      />
    </Routes>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
