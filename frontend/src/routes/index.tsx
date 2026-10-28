import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { AuthLayout } from '../components/layout/AuthLayout';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { LoginPage } from '../features/auth/LoginPage';
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/ResetPasswordPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { UsersPage } from '../features/users/UsersPage';
import { RolesPage } from '../features/roles/RolesPage';
import { InstitutionsPage } from '../features/institutions/InstitutionsPage';
import { RequirementsPage } from '../features/requirements/RequirementsPage';
import { FdrsPage } from '../features/fdrs/FdrsPage';
import { RegisterFdrPage } from '../features/fdrs/RegisterFdrPage';
import { EditFdrPage } from '../features/fdrs/EditFdrPage';
import { VerificationsPage } from '../features/verifications/VerificationsPage';
import { VerificationScrutinyPage } from '../features/verifications/VerificationScrutinyPage';
import { ApprovalsPage } from '../features/approvals/ApprovalsPage';
import { ApprovalReviewPage } from '../features/approvals/ApprovalReviewPage';
import { MaturityDashboardPage } from '../features/maturity/MaturityDashboardPage';
import { RenewalsPage } from '../features/renewals/RenewalsPage';
import { ReleasesPage } from '../features/releases/ReleasesPage';
import { AiIntelligencePage } from '../features/ai/AiIntelligencePage';
import { ReportsPage } from '../features/reports/ReportsPage';

export const router = createBrowserRouter([
  // Default entry route redirects to /login
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },

  // Auth Layout (Public authentication routes)
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: '/reset-password',
        element: <ResetPasswordPage />,
      },
    ],
  },

  // Portal Layout (Protected with ProtectedRoute)
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/institutions',
        element: (
          <ProtectedRoute requiredPermissions={['INSTITUTIONS:READ']}>
            <InstitutionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/requirements',
        element: (
          <ProtectedRoute requiredPermissions={['DEPOSITS:READ']}>
            <RequirementsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/fdrs',
        element: (
          <ProtectedRoute requiredPermissions={['FDR:READ']}>
            <FdrsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/fdrs/register',
        element: (
          <ProtectedRoute requiredPermissions={['FDR:CREATE']}>
            <RegisterFdrPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/fdrs/new',
        element: (
          <ProtectedRoute requiredPermissions={['FDR:CREATE']}>
            <RegisterFdrPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/fdrs/edit/:fdrId',
        element: (
          <ProtectedRoute requiredPermissions={['FDR:UPDATE']}>
            <EditFdrPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/fdrs/:fdrId/edit',
        element: (
          <ProtectedRoute requiredPermissions={['FDR:UPDATE']}>
            <EditFdrPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/verifications',
        element: (
          <ProtectedRoute>
            <VerificationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/verifications/:fdrId',
        element: (
          <ProtectedRoute>
            <VerificationScrutinyPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/approvals',
        element: (
          <ProtectedRoute>
            <ApprovalsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/approvals/:approvalId',
        element: (
          <ProtectedRoute>
            <ApprovalReviewPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/approvals/review/:approvalId',
        element: (
          <ProtectedRoute>
            <ApprovalReviewPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/maturity',
        element: (
          <ProtectedRoute>
            <MaturityDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/renewals',
        element: (
          <ProtectedRoute>
            <RenewalsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/releases',
        element: (
          <ProtectedRoute>
            <ReleasesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/ai-intelligence',
        element: (
          <ProtectedRoute>
            <AiIntelligencePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/reports',
        element: (
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/users',
        element: (
          <ProtectedRoute requiredPermissions={['USERS:READ']}>
            <UsersPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/roles',
        element: (
          <ProtectedRoute requiredPermissions={['ROLES:READ']}>
            <RolesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
], {
  future: {
    v7_relativeSplatPath: true,
  },
});
