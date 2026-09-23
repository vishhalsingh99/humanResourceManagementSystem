import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ROUTES } from '../constants/routes.constants';
import { hasPermission as checkPermission, hasAnyPermission as checkAnyPermission } from '../utils/permissions';

const AppContext = createContext(null);

const onboardingDefaults = {
  profile_completed: false,
  company_completed: false,
  subscription_completed: false,
  onboarding_completed: false,
  profile: {},
  company: {},
  subscription: 'None',
};


const getOnboardingKey = (userData) => `hrmsOnboarding:${userData?.email || userData?.id || 'guest'}`;

const readOnboardingState = (userData) => {
  if (!userData) return onboardingDefaults;

  let savedOnboarding = {};
  try {
    savedOnboarding = JSON.parse(localStorage.getItem(getOnboardingKey(userData)) || '{}');
  } catch {
    savedOnboarding = {};
  }

  const completedFromUser = userData.onboarding_completed === true;
  const hasTenantDatabase = Boolean(
    userData.tenantDatabase || userData.tenant_database
  );

  return {
    ...onboardingDefaults,
    ...savedOnboarding,
    profile_completed: completedFromUser || Boolean(savedOnboarding.profile_completed),
    company_completed: completedFromUser || Boolean(savedOnboarding.company_completed),
    subscription_completed: (hasTenantDatabase && completedFromUser) || Boolean(savedOnboarding.subscription_completed),
    onboarding_completed: (hasTenantDatabase && completedFromUser) || Boolean(savedOnboarding.onboarding_completed),
  };
};
const getNextOnboardingPath = (state) => {
  if (!state?.profile_completed) return ROUTES.ONBOARDING_PROFILE;
  if (!state?.company_completed) return ROUTES.ONBOARDING_COMPANY;
  if (!state?.subscription_completed) return ROUTES.ONBOARDING_SUBSCRIPTION;
  return ROUTES.DASHBOARD;
};

const isJwtExpired = (tokenValue) => {
  if (!tokenValue) return true;

  try {
    const payload = JSON.parse(atob(tokenValue.split('.')[1]));
    return payload.exp ? payload.exp * 1000 <= Date.now() : false;
  } catch {
    return false;
  }
};

const clearStoredAuth = () => {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('hrmsToken');
  localStorage.removeItem('hrmsUser');
  localStorage.removeItem('hrmsSuperAdminToken');
  localStorage.removeItem('hrmsSuperAdminUser');
  delete axios.defaults.headers.common.Authorization;
};

export function AppProvider({ children }) {
  const navigate = useNavigate();
  const savedToken = localStorage.getItem('hrmsToken') || '';
  const savedSessionExpired = Boolean(savedToken && isJwtExpired(savedToken));

  // ── Auth 
  const [user, setUser] = useState(() => {
    if (savedSessionExpired) return null;
    const saved = localStorage.getItem('hrmsUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => (savedSessionExpired ? '' : savedToken));
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !savedSessionExpired && localStorage.getItem('isLoggedIn') === 'true' && Boolean(savedToken)
  );
  const [onboarding, setOnboarding] = useState(() => readOnboardingState(user));
  const [isImpersonating, setIsImpersonating] = useState(() => Boolean(user?.isImpersonation));

  const setAuthState = (userData, tokenValue) => {
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('hrmsToken', tokenValue);
    localStorage.setItem('hrmsUser', JSON.stringify(userData));
    const onboardingState = readOnboardingState(userData);
    setIsLoggedIn(true);
    setUser(userData);
    setToken(tokenValue);
    setIsImpersonating(Boolean(userData?.isImpersonation));
    setOnboarding(onboardingState);
    return onboardingState;
  };

  const updateOnboarding = useCallback((updates) => {
    if (!user) return onboardingDefaults;

    const nextState = {
      ...onboarding,
      ...updates,
    };

    nextState.onboarding_completed =
      nextState.profile_completed &&
      nextState.company_completed &&
      nextState.subscription_completed;

    localStorage.setItem(getOnboardingKey(user), JSON.stringify(nextState));
    setOnboarding(nextState);
    return nextState;
  }, [onboarding, user]);

  const loadOnboarding = useCallback(async (userData = user, tokenValue = token) => {
    if (!userData?.tenantId && !userData?.tenant_id) return null;

    const response = await axios.get('/api/auth/onboarding', {
      headers: tokenValue ? { Authorization: `Bearer ${tokenValue}` } : undefined,
    });
    const nextState = {
      ...onboardingDefaults,
      ...response.data,
    };

    localStorage.setItem(getOnboardingKey(userData), JSON.stringify(nextState));
    setOnboarding(nextState);
    return nextState;
  }, [token, user]);

  const completeOnboardingStep = useCallback((step, data = {}) => {
    const stepUpdates = {
      profile: {
        ...onboarding.profile,
        ...(step === 'profile' ? data : {}),
      },
      company: {
        ...onboarding.company,
        ...(step === 'company' ? data : {}),
      },
      subscription: step === 'subscription' ? data.subscription : onboarding.subscription,
      [`${step}_completed`]: true,
    };

    return updateOnboarding(stepUpdates);
  }, [onboarding, updateOnboarding]);

  const completeTenantOnboarding = useCallback(async (subscription) => {
    const nextState = {
      ...onboarding,
      subscription,
      subscription_completed: true,
      onboarding_completed: true,
    };

    const response = await axios.post('/api/auth/onboarding/complete', {
      profile: nextState.profile,
      company: nextState.company,
      subscription,
    });

    localStorage.setItem('hrmsToken', response.data.token);
    localStorage.setItem('hrmsUser', JSON.stringify(response.data.user));
    localStorage.setItem(getOnboardingKey(response.data.user), JSON.stringify(nextState));
    axios.defaults.headers.common.Authorization = `Bearer ${response.data.token}`;

    setUser(response.data.user);
    setToken(response.data.token);
    setOnboarding(nextState);

    return { ...response.data, onboarding: nextState };
  }, [onboarding]);

  const uploadCompanyLogo = useCallback((file) => {
    const formData = new FormData();
    formData.append('logo', file);
    return axios.post('/api/auth/onboarding/company-logo', formData);
  }, []);

  const updateCompanyOnboarding = useCallback(async (company, logoFile = null) => {
    let payload = { company };
    let config;

    // Existing company updates send multipart data when a new logo file is selected.
    if (logoFile) {
      const formData = new FormData();
      Object.entries(company).forEach(([key, value]) => {
        formData.append(key, value ?? '');
      });
      formData.append('logo', logoFile);
      payload = formData;
    }

    const response = await axios.put('/api/auth/onboarding/company', payload, config);
    const nextState = {
      ...onboarding,
      ...response.data.onboarding,
      company: response.data.onboarding?.company || company,
      company_completed: true,
    };

    localStorage.setItem(getOnboardingKey(user), JSON.stringify(nextState));
    setOnboarding(nextState);
    return { ...response.data, onboarding: nextState };
  }, [onboarding, user]);

  const updateProfileOnboarding = useCallback(async (profile) => {
    const response = await axios.put('/api/auth/onboarding/profile', { profile });
    const nextState = {
      ...onboarding,
      ...response.data.onboarding,
      profile: response.data.onboarding?.profile || profile,
      profile_completed: true,
    };

    localStorage.setItem(getOnboardingKey(user), JSON.stringify(nextState));
    setOnboarding(nextState);
    return { ...response.data, onboarding: nextState };
  }, [onboarding, user]);

  const updateSubscriptionOnboarding = useCallback(async (subscription) => {
    const response = await axios.put('/api/auth/onboarding/subscription', { subscription });
    const nextState = {
      ...onboarding,
      ...response.data.onboarding,
      subscription: response.data.onboarding?.subscription || subscription,
      subscription_completed: true,
    };

    localStorage.setItem(getOnboardingKey(user), JSON.stringify(nextState));
    setOnboarding(nextState);
    return { ...response.data, onboarding: nextState };
  }, [onboarding, user]);

  const refreshUserProfile = useCallback(async () => {
    if (!token) return null;

    const response = await axios.get('/api/auth/profile');
    const refreshedUser = response.data;
    if (!refreshedUser) return null;

    setAuthState(refreshedUser, token);
    return refreshedUser;
  }, [token]);

  async function login(email, password) {
    const response = await axios.post('/api/auth/login', { email, password });
    const { user: loggedInUser, token: loginToken } = response.data;
    let onboardingState = setAuthState(loggedInUser, loginToken);

    if (loggedInUser?.role === 'SUPER_ADMIN') {
      navigate(ROUTES.SUPER_ADMIN_DASHBOARD);
      return;
    }

    if (response.data.onboarding) {
      onboardingState = {
        ...onboardingDefaults,
        ...response.data.onboarding,
      };
      // localStorage.setItem(getOnboardingKey(loggedInUser), JSON.stringify(onboardingState));
      setOnboarding(onboardingState);
    } else if (loggedInUser?.tenantId || loggedInUser?.tenant_id) {
      try {
        onboardingState = await loadOnboarding(loggedInUser, loginToken) || onboardingState;
      } catch (error) {
        if (error.response?.status !== 404) {
          showToast(error.response?.data?.error || 'Unable to load company details', 'error');
        }
      }
    }

    if (loggedInUser?.role === 'employee') {
      navigate(ROUTES.EMPLOYEE_COMPANY_INFORMATION);
      return;
    }
    navigate(getNextOnboardingPath(onboardingState));
  }

  async function register(name, email, password, role = 'admin') {
    const response = await axios.post('/api/auth/register', { name, email, password, role });

    const onboardingState = setAuthState(response.data.user, response.data.token);
    navigate(getNextOnboardingPath(onboardingState));
  }

  async function requestSignupOTP(name, email, password, role = 'admin') {
    const response = await axios.post('/api/auth/signup/send-otp', { name, email, password, role });
    return response.data;
  }

  async function verifySignupOTP(email, otp) {
    const response = await axios.post('/api/auth/signup/verify-otp', { email, otp });
    const onboardingState = setAuthState(response.data.user, response.data.token);
    navigate(getNextOnboardingPath(onboardingState));
    return response.data;
  }
  //  send OTP
  async function sendOTP(email) {
  const response = await axios.post(
    '/api/auth/send-otp',
    { email }
  );


  return response.data;
}
// verify email and OTP
async function verifyOTP(email, otp) {
  const response = await axios.post(
    '/api/auth/verify-otp',
    { email, otp }
  );

  return response.data;
}
// Forgot password flow: reset password
async function resetPassword(resetToken, newPassword) {
  const response = await axios.post(
    '/api/auth/reset-password',
    { resetToken, newPassword }
  );

  return response.data;
}

  function logout() {
    clearStoredAuth();
    setIsLoggedIn(false);
    setUser(null);
    setToken('');
    setIsImpersonating(false);
    setOnboarding(onboardingDefaults);
    navigate('/login');
  }

  async function startImpersonation(impersonationUser, impersonationToken) {
    if (!user || user.role !== 'SUPER_ADMIN') return;

    localStorage.setItem('hrmsSuperAdminToken', token);
    localStorage.setItem('hrmsSuperAdminUser', JSON.stringify(user));
    const onboardingState = setAuthState(impersonationUser, impersonationToken);
    axios.defaults.headers.common.Authorization = `Bearer ${impersonationToken}`;

    try {
      const loadedOnboarding = await loadOnboarding(impersonationUser, impersonationToken);
      if (loadedOnboarding) {
        setOnboarding(loadedOnboarding);
      }
    } catch {
      setOnboarding(onboardingState);
    }

    navigate(ROUTES.DASHBOARD);
  }

  function exitImpersonation() {
    const superAdminToken = localStorage.getItem('hrmsSuperAdminToken');
    const savedSuperAdminUser = localStorage.getItem('hrmsSuperAdminUser');

    if (!superAdminToken || !savedSuperAdminUser) {
      logout();
      return;
    }

    const superAdminUser = JSON.parse(savedSuperAdminUser);
    localStorage.removeItem('hrmsSuperAdminToken');
    localStorage.removeItem('hrmsSuperAdminUser');
    setAuthState(superAdminUser, superAdminToken);
    setOnboarding(readOnboardingState(superAdminUser));
    navigate(ROUTES.SUPER_ADMIN_DASHBOARD);
  }

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common.Authorization;
    }
  }, [token]);

  useEffect(() => {
    if (!isLoggedIn || !token || user?.role === 'SUPER_ADMIN') return;
    refreshUserProfile().catch(() => {});
  }, [isLoggedIn, token, user?.role, refreshUserProfile]);

  useEffect(() => {
    if (savedSessionExpired) {
      clearStoredAuth();
    }
  }, [savedSessionExpired]);

  // ── Toast ──
  const [defaultRole, setDefaultRole] = useState(() => localStorage.getItem('hrmsDefaultRole') || 'admin');
  const [toast, setToast] = useState(null);

  const setDefaultRoleValue = (role) => {
    localStorage.setItem('hrmsDefaultRole', role);
    setDefaultRole(role);
  };

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    if (!isLoggedIn || !user || user.role === 'SUPER_ADMIN' || (!user.tenantId && !user.tenant_id)) return;

    loadOnboarding().catch((error) => {
      if (error.response?.status !== 404) {
        showToast(error.response?.data?.error || 'Unable to load company details', 'error');
      }
    });
  }, [isLoggedIn, user, loadOnboarding, showToast]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const message = error.response?.data?.error;
        const isExpiredToken =
          error.response?.status === 401 &&
          (message === 'Token expired' || message === 'Invalid token');

        if (isExpiredToken) {
          clearStoredAuth();
          setIsLoggedIn(false);
          setUser(null);
          setToken('');
          setOnboarding(onboardingDefaults);
          showToast('Session expired. Please sign in again.', 'error');
          navigate(ROUTES.LOGIN, { replace: true });
        }

        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, [navigate, showToast]);

  // ── Shared data ──
  const [employees, setEmployees] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const loadEmployees = useCallback(async (status = 'active') => {
    const res = await axios.get('/api/employees', { params: { status } });
    setEmployees(res.data);
  }, []);

  const loadMeetings = useCallback(async () => {
    const res = await axios.get('/api/meetings');
    setMeetings(res.data);
  }, []);

  const loadPayrolls = useCallback(async () => {
    const res = await axios.get('/api/payroll');
    setPayrolls(res.data);
  }, []);

  const loadLeaves = useCallback(async () => {
    const employeeId = user?.employeeId || user?.employee_id;
    const endpoint = checkPermission(user, 'leave.view_all')
      ? '/api/leaves'
      : employeeId
      ? `/api/leaves/employee/${employeeId}`
      : '/api/leaves';
    const res = await axios.get(endpoint);
    setLeaves(res.data);
  }, [user]);

  const loadAttendance = useCallback(async () => {
    const employeeId = user?.employeeId || user?.employee_id;
    const endpoint = checkPermission(user, 'attendance.view_all')
      ? '/api/attendance'
      : employeeId
      ? `/api/attendance/employee/${employeeId}`
      : '/api/attendance';
    const res = await axios.get(endpoint);
    setAttendance(res.data);
  }, [user]);

  const loadDepartments = useCallback(async () => {
    const res = await axios.get('/api/departments');
    setDepartments(res.data);
  }, []);

  const loadDesignations = useCallback(async () => {
    const res = await axios.get('/api/designations');
    setDesignations(res.data);
  }, []);

  // Pre-fetch all data once the user is logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    if (user?.role === 'SUPER_ADMIN') return;
    if (checkAnyPermission(user, ['attendance.view', 'attendance.view_all'])) loadAttendance();
    if (checkAnyPermission(user, ['leave.view', 'leave.view_all'])) loadLeaves();
    if (checkPermission(user, 'employee.view')) loadEmployees();
    if (checkPermission(user, 'meeting.view')) loadMeetings();
    if (checkPermission(user, 'payroll.view_all')) loadPayrolls();
    if (checkPermission(user, 'settings.view')) {
      loadDepartments();
      loadDesignations();
    }
  }, [isLoggedIn, user, loadEmployees, loadMeetings, loadPayrolls, loadLeaves, loadAttendance, loadDepartments, loadDesignations]);

  return (
    <AppContext.Provider value={{
      // auth
      isLoggedIn, user, onboarding, updateOnboarding, completeOnboardingStep, completeTenantOnboarding, uploadCompanyLogo, updateCompanyOnboarding, updateProfileOnboarding, updateSubscriptionOnboarding, refreshUserProfile, loadOnboarding, getNextOnboardingPath,
      defaultRole, setDefaultRole: setDefaultRoleValue, login, register, requestSignupOTP, verifySignupOTP, logout, isImpersonating, startImpersonation, exitImpersonation,
      hasPermission: (permissionKey) => checkPermission(user, permissionKey),
      hasAnyPermission: (permissionKeys) => checkAnyPermission(user, permissionKeys),
      // toast
      toast, showToast, clearToast,
      // data + loaders
      employees, loadEmployees,
      meetings, loadMeetings,
      payrolls, loadPayrolls,
      leaves, loadLeaves,
      attendance, loadAttendance,
      departments, loadDepartments,
      designations, loadDesignations,
      // OTP and password reset functions
      sendOTP,
      verifyOTP,
      resetPassword,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
