import { useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../constants/routes.constants';
import ProtectedRoute from './ProtectedRoute';
import Header from '../components/layout/Header';
import { useApp } from '../context/AppContext';
import { hasPermission, hasAnyPermission } from '../utils/permissions';

// Lazy Loaded Pages
 
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Profile = lazy(() => import('../pages/onBording/Profile'));
const Company = lazy(() => import('../pages/onBording/Compny'));
const Subscription = lazy(() => import('../pages/onBording/Subscription'));

const Employees = lazy(() => import('../features/employees'));
const Departments = lazy(() => import('../features/departments'));
const Designations = lazy(() => import('../features/departments/designation/designation'));
const Meetings = lazy(() => import('../features/meetings'));
const Payroll = lazy(() => import('../features/payroll'));
const SalaryDashboard = lazy(() => import('../features/salaryDashboard'));

const ReportEmployees = lazy(() => import('../features/reports/ReportEmployees'));
const ReportPayroll = lazy(() => import('../features/reports/ReportPayroll'));
const ReportMeetings = lazy(() => import('../features/reports/ReportMeetings'));

const Leave = lazy(() => import('../features/leave'));
const Attendance = lazy(() => import('../features/attendance'));
const AttendanceSummaryPage = lazy(() => import('../features/attendance/EmployeeSummaryPage'));
const CompanyRule = lazy(() => import('../pages/employeeRule/CompanyRule'));

const Login = lazy(() => import('../pages/auth/Login'));
const Signup = lazy(() => import('../pages/auth/SignUp'));

const Settings = lazy(() => import('../pages/Settings/Settings'));
const RolesPermissions = lazy(() => import('../pages/Settings/RolesPermissions'));
const SuperAdminDashboard = lazy(() => import('../pages/SuperAdmin/Dashboard'));
const SuperAdminCompanies = lazy(() => import('../pages/SuperAdmin/Companies'));
const SuperAdminCompanyDetails = lazy(() => import('../pages/SuperAdmin/CompanyDetails'));
const SuperAdminSubscription = lazy(() => import('../pages/SuperAdmin/Subscription'));
const SuperAdminAuditLogs = lazy(() => import('../pages/SuperAdmin/AuditLogs'));
const SuperAdminGlobalSettings = lazy(() => import('../pages/SuperAdmin/GlobalSettings'));

function OnboardingGate({ children }) {
  const { onboarding, getNextOnboardingPath, user } = useApp();
  const location = useLocation();
  if (user?.role === 'SUPER_ADMIN') return children;
  if (user?.role === 'employee') return children;
  const nextPath = getNextOnboardingPath(onboarding);
  const onboardingPaths = [
    ROUTES.ONBOARDING_PROFILE,
    ROUTES.ONBOARDING_COMPANY,
    ROUTES.ONBOARDING_SUBSCRIPTION,
  ];
  const isOnboardingPath = onboardingPaths.includes(location.pathname);

  if (!onboarding.onboarding_completed && !isOnboardingPath) {
    return <Navigate to={nextPath} replace />;
  }

  if (onboarding.onboarding_completed && isOnboardingPath) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // Allow navigation to any path if all previous steps are completed
  const pathOrder = [
    ROUTES.ONBOARDING_PROFILE,
    ROUTES.ONBOARDING_COMPANY,
    ROUTES.ONBOARDING_SUBSCRIPTION,
  ];
  const currentPathIndex = pathOrder.indexOf(location.pathname);
  const nextPathIndex = pathOrder.indexOf(nextPath);

  // If trying to access a step ahead of the next required step, redirect
  if (currentPathIndex > nextPathIndex && !onboarding.onboarding_completed) {
    return <Navigate to={nextPath} replace />;
  }

  return children;
}

function OnboardingLayout({ children }) {
  const { user, logout } = useApp();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-page)]" style={{ fontFamily: "'Outfit', 'Segoe UI', Arial, sans-serif" }}>
      <Header
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        onMenuToggle={() => { }}
        user={user}
        logout={logout}
        hideMenu
      />
      <main className="pt-20">
        {children}
      </main>
    </div>
  );
}

export default function AppRoutes({ renderProtectedLayout }) {
  const { user } = useApp();
  const isEmployee = user?.role === 'employee';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const canAccessEmployees = hasPermission(user, 'employee.view');
  const canAccessLeave = hasAnyPermission(user, ['leave.view', 'leave.view_all']);
  const canAccessAttendance = hasAnyPermission(user, ['attendance.view', 'attendance.view_all']);
  const canAccessMeetings = hasPermission(user, 'meeting.view');
  const canAccessSalary = hasAnyPermission(user, ['payroll.view', 'payroll.view_all']);
  const canAccessPayroll = hasPermission(user, 'payroll.view_all');
  const canAccessReports = hasPermission(user, 'reports.view');
  const canAccessSettings = hasPermission(user, 'settings.view');

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      }
    >
      <Routes>
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.SIGNUP} element={<Signup />} />

        <Route
          path={ROUTES.ONBOARDING_PROFILE}
          element={
            <ProtectedRoute>
              <OnboardingGate>
                <OnboardingLayout>
                  <Profile mode="onboarding" />
                </OnboardingLayout>
              </OnboardingGate>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.ONBOARDING_COMPANY}
          element={
            <ProtectedRoute>
              <OnboardingGate>
                <OnboardingLayout>
                  <Company mode="onboarding" />
                </OnboardingLayout>
              </OnboardingGate>
            </ProtectedRoute>
          }
        />

        <Route
          path={ROUTES.ONBOARDING_SUBSCRIPTION}
          element={
            <ProtectedRoute>
              <OnboardingGate>
                <OnboardingLayout>
                  <Subscription mode="onboarding" />
                </OnboardingLayout>
              </OnboardingGate>
            </ProtectedRoute>
          }
        />

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <OnboardingGate>
                {renderProtectedLayout({
                  content: (
                    <Routes>
                      {isSuperAdmin && (
                        <>
                       
                          <Route
                            path={ROUTES.DASHBOARD}
                            element={<Navigate to={ROUTES.SUPER_ADMIN_DASHBOARD} replace />}
                          />
                          <Route
                            path={ROUTES.SUPER_ADMIN_DASHBOARD}
                            element={<SuperAdminDashboard />}
                          />
                          <Route
                            path={ROUTES.SUPER_ADMIN_COMPANIES}
                            element={<SuperAdminCompanies />}
                          />
                          <Route
                            path={ROUTES.SUPER_ADMIN_COMPANY_DETAILS}
                            element={<SuperAdminCompanyDetails />}
                          />
                          <Route
                            path={ROUTES.SUPER_ADMIN_SUBSCRIPTION}
                            element={<SuperAdminSubscription />}
                          />
                          <Route
                            path={ROUTES.SUPER_ADMIN_AUDIT_LOGS}
                            element={<SuperAdminAuditLogs />}
                          />
                          <Route
                            path={ROUTES.SUPER_ADMIN_SETTINGS}
                            element={<SuperAdminGlobalSettings />}
                          />
                          <Route
                            path={ROUTES.PROFILE}
                            element={<Profile mode="profile" />}
                          />
                          <Route
                            path="*"
                            element={<Navigate to={ROUTES.SUPER_ADMIN_DASHBOARD} replace />}
                          />
                        </>
                      )}

                      {!isSuperAdmin && isEmployee && (
                        <>
                          <Route
                            path={ROUTES.DASHBOARD}
                            element={<Navigate to={ROUTES.EMPLOYEE_COMPANY_INFORMATION} replace />}
                          />
                        </>
                      )}

                    

                      {!isSuperAdmin && !isEmployee && (
                        <Route
                          path={ROUTES.DASHBOARD}
                          element={<Dashboard />}
                        />
                      )}

                      {!isSuperAdmin && canAccessEmployees && (
                        <Route
                          path={ROUTES.EMPLOYEES}
                          element={<Employees />}
                        />
                      )}

                      {!isSuperAdmin && hasPermission(user, 'settings.view') && (
                        <Route
                          path={ROUTES.DEPARTMENTS}
                          element={<Departments />}
                        />
                      )}

                      {!isSuperAdmin && hasPermission(user, 'settings.view') && (
                        <Route
                          path={ROUTES.DESIGNATIONS}
                          element={<Designations />}
                        />
                      )}

                      {!isSuperAdmin && canAccessLeave && <Route
                        path={ROUTES.LEAVE}
                        element={<Leave />}
                      />}

                      {!isSuperAdmin && canAccessAttendance && <Route
                        path={ROUTES.ATTENDANCE}
                        element={<Attendance />}
                      />}

                      {!isSuperAdmin && canAccessAttendance && (
                        <Route
                          path="/attendance/employee/:employeeId/summary"
                          element={<AttendanceSummaryPage />}
                        />
                      )}

                      {!isSuperAdmin && isEmployee && (
                        <Route
                          path={ROUTES.EMPLOYEE_COMPANY_INFORMATION}
                          element={<CompanyRule />}
                        />
                      )}

                      {!isSuperAdmin && canAccessMeetings && (
                        <Route
                          path={ROUTES.MEETINGS}
                          element={<Meetings />}
                        />
                      )}

                      {!isSuperAdmin && canAccessPayroll && (
                        <Route
                          path={ROUTES.PAYROLL}
                          element={<Payroll />}
                        />
                      )}

                      {!isSuperAdmin && canAccessSalary && <Route
                        path={ROUTES.SALARY_DASHBOARD}
                        element={<SalaryDashboard />}
                      />}

                      {!isSuperAdmin && canAccessReports && (
                        <Route
                          path={ROUTES.REPORTS_EMPLOYEES}
                          element={<ReportEmployees />}
                        />
                      )}

                      {!isSuperAdmin && canAccessPayroll && (
                        <Route
                          path={ROUTES.REPORTS_PAYROLL}
                          element={<ReportPayroll />}
                        />
                      )}

                      {!isSuperAdmin && canAccessReports && (
                        <Route
                          path={ROUTES.REPORTS_MEETINGS}
                          element={<ReportMeetings />}
                        />
                      )}

                      {!isSuperAdmin && canAccessSettings && (
                        <Route
                          path={ROUTES.SETTINGS_INFORMATION}
                          element={<Settings />}
                        />
                      )}

                      {!isSuperAdmin && canAccessSettings && (
                        <Route
                          path={ROUTES.SETTINGS_ROLES_PERMISSIONS}
                          element={<RolesPermissions />}
                        />
                      )}

                      {!isSuperAdmin && canAccessSettings && (
                        <Route
                          path={ROUTES.SETTINGS_COMPANY}
                          element={<Company mode="settings" />}
                        />
                      )}

                      {!isSuperAdmin && canAccessSettings && (
                        <Route
                          path={ROUTES.SETTINGS_SUBSCRIPTION}
                          element={<Subscription mode="settings" />}
                        />
                      )}

                      {!isSuperAdmin && <Route
                        path={ROUTES.PROFILE}
                        element={<Profile mode="profile" />}
                      />}

                      {!isSuperAdmin && isEmployee && (
                        <Route
                          path="*"
                          element={<Navigate to={ROUTES.EMPLOYEE_COMPANY_INFORMATION} replace />}
                        />
                      )}
                    </Routes>
                  ),
                })}
              </OnboardingGate>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );

}
