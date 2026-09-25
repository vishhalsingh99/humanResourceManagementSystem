import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, UserCog, CalendarDays, CreditCard, Banknote, X, ChevronDown,
  UserPlus, Layers, BarChart2, Clock, CalendarCheck, Building2, ShieldCheck, FileClock,
  SlidersHorizontal, LogOut,
} from 'lucide-react';
import { ROUTES } from '../../constants/routes.constants';
import { useApp } from '../../context/AppContext';
import { hasPermission, hasAnyPermission } from '../../utils/permissions';

const nav = [
  { label: null, items: [
    { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { to: ROUTES.EMPLOYEE_COMPANY_INFORMATION, label: 'Company Rules & Policies', icon: Building2, employeeOnly: true },
  ]},
  { label: 'Employee', icon: UserPlus, permission: 'employee.view', items: [{ to: ROUTES.EMPLOYEES, label: 'Employee List', icon: Users }] },
  { label: 'Leave', icon: Clock, permission: ['leave.view', 'leave.view_all'], items: [{ to: ROUTES.LEAVE, label: 'Leave Requests', icon: Clock }] },
  { label: 'Attendance', icon: CalendarCheck, permission: ['attendance.view', 'attendance.view_all'], items: [{ to: ROUTES.ATTENDANCE, label: '', icon: CalendarCheck }] },
  { label: 'Meeting', icon: CalendarDays, permission: 'meeting.view', items: [{ to: ROUTES.MEETINGS, label: 'All Meetings', icon: CalendarDays }] },
  { label: 'Salary', icon: Banknote, permission: ['payroll.view', 'payroll.view_all'], items: [{ to: ROUTES.SALARY_DASHBOARD, label: 'Salary', icon: Banknote }] },
  { label: 'Master', icon: Layers, items: [
    { to: ROUTES.DEPARTMENTS, label: 'Departments', icon: Layers },
    { to: ROUTES.DESIGNATIONS, label: 'Designations', icon: Layers },
  ]},
  { label: 'Reports', icon: BarChart2, permission: 'reports.view', items: [
    { to: ROUTES.REPORTS_EMPLOYEES, label: 'Employee Report', icon: BarChart2 },
    { to: ROUTES.PAYROLL, label: 'Payroll Report', icon: BarChart2 },
    { to: ROUTES.REPORTS_MEETINGS, label: 'Meeting Report', icon: BarChart2 },
  ]},
  { label: 'Settings', icon: UserCog, permission: 'settings.view', items: [
    { to: ROUTES.SETTINGS_INFORMATION, label: 'Settings Information', icon: UserCog },
    { to: ROUTES.SETTINGS_ROLES_PERMISSIONS, label: 'Roles & Permissions', icon: ShieldCheck },
    { to: ROUTES.SETTINGS_COMPANY, label: 'Company', icon: Layers },
    { to: ROUTES.SETTINGS_SUBSCRIPTION, label: 'Subscription', icon: CreditCard },
  ]},
];

const filterNavByPermissions = (sections, user) => {
  const isEmployeeDefault = user?.role === 'employee';
  return sections
    .filter((s) => !s.permission ? true : Array.isArray(s.permission) ? hasAnyPermission(user, s.permission) : hasPermission(user, s.permission))
    .map((s) => ({
      ...s,
      items: (s.items || []).filter((item) => {
        if (isEmployeeDefault && item.to === ROUTES.DASHBOARD) return false;
        if (item.employeeOnly && !isEmployeeDefault) return false;
        if (isEmployeeDefault && s.label === 'Master') return false;
        return !item.permission || hasPermission(user, item.permission);
      }),
    }))
    .filter((s) => s.items.length > 0);
};

const superAdminNav = [
  { label: null, items: [
    { to: ROUTES.SUPER_ADMIN_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { to: ROUTES.SUPER_ADMIN_COMPANIES, label: 'View All Companies', icon: Building2 },
  ]},
  { label: 'Company Management', icon: Building2, items: [{ to: ROUTES.SUPER_ADMIN_COMPANIES, label: 'Companies', icon: Building2 }] },
  { label: 'Subscription Management', icon: CreditCard, items: [{ to: ROUTES.SUPER_ADMIN_SUBSCRIPTION, label: 'Subscriptions', icon: CreditCard }] },
  { label: 'Audit Logs', icon: FileClock, items: [{ to: ROUTES.SUPER_ADMIN_AUDIT_LOGS, label: 'Audit Logs', icon: FileClock }] },
  { label: 'Global Settings', icon: SlidersHorizontal, items: [{ to: ROUTES.SUPER_ADMIN_SETTINGS, label: 'Settings', icon: SlidersHorizontal }] },
  { label: null, items: [
    { to: ROUTES.PROFILE, label: 'Profile', icon: ShieldCheck },
    { to: ROUTES.LOGIN, label: 'Logout', icon: LogOut, action: 'logout' },
  ]},
];

const navItemClass = ({ isActive, collapsed }) =>
  `flex min-h-10 items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-semibold no-underline transition duration-200 hover:scale-[1.02] ${collapsed ? 'h-11 w-11 justify-center px-0 py-0' : ''} ${
    isActive
      ? 'border border-red-500/40 bg-red-500/15 text-red-400 shadow-[0_0_16px_rgba(239,68,68,0.2)]'
      : 'border border-transparent t-text-muted hover:border-[var(--border-base)] hover:bg-[var(--bg-row-hover)] hover:t-text-primary'
  }`;

function NavSection({ section, onLinkClick, collapsed }) {
  const location = useLocation();
  const isAnyActive = section.items.some((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );
  const [open, setOpen] = useState(isAnyActive);

  useEffect(() => { if (isAnyActive) setOpen(true); }, [isAnyActive]);

  if (!section.label) {
    return (
      <div className="flex flex-col gap-1">
        {section.items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={(e) => onLinkClick(e, item)}
            title={collapsed ? item.label : ''}
            className={({ isActive }) => navItemClass({ isActive, collapsed })}>
            <item.icon size={19} strokeWidth={1.8} className="shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </div>
    );
  }

  if (section.items.length === 1) {
    const item = section.items[0];
    return (
      <NavLink to={item.to} end={item.end} onClick={onLinkClick}
        title={collapsed ? section.label : ''}
        className={({ isActive }) => navItemClass({ isActive, collapsed })}>
        <section.icon size={19} strokeWidth={1.8} className="shrink-0" />
        {!collapsed && <span>{section.label}</span>}
      </NavLink>
    );
  }

  if (collapsed) {
    return (
      <div className="group relative">
        <button title={section.label} onClick={() => setOpen((v) => !v)}
          className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-sm font-semibold transition duration-200 hover:scale-[1.02] ${
            isAnyActive ? 'border border-red-500/40 bg-red-500/15 text-red-400' : 'border border-transparent t-text-muted hover:bg-[var(--bg-row-hover)] hover:t-text-primary'
          }`}>
          <section.icon size={19} strokeWidth={1.8} className="shrink-0" />
        </button>
        <div className="pointer-events-none absolute left-14 top-1 whitespace-nowrap rounded-xl border t-border ui-card px-2 py-1 font-mono text-xs t-text-primary opacity-0 transition-opacity group-hover:opacity-100">
          {section.label}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => setOpen((v) => !v)}
        className={`flex min-h-10 w-full cursor-pointer items-center justify-between rounded-xl px-2 py-2.5 text-sm font-semibold transition duration-200 ${
          isAnyActive ? 't-text-primary' : 't-text-muted hover:bg-[var(--bg-row-hover)] hover:t-text-primary'
        }`}>
        <span className="flex items-center gap-3">
          <section.icon size={19} strokeWidth={1.8} className="shrink-0" />
          <span>{section.label}</span>
        </span>
        <ChevronDown size={16} strokeWidth={2.2} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-1 flex flex-col gap-1 pl-7">
          {section.items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={(e) => onLinkClick(e, item)}
              className={({ isActive }) =>
                `flex min-h-9 items-center gap-3 rounded-xl px-3 py-2 text-sm no-underline transition duration-200 ${
                  isActive ? 'border border-red-500/30 bg-red-500/10 font-semibold text-red-400' : 't-text-muted hover:bg-[var(--bg-row-hover)] hover:t-text-primary'
                }`
              }>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

const sidebarShell = (extra) =>
  `ui-sidebar fixed left-0 z-50 flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.20)] transition-all duration-300 ease-in-out ${extra}`;

export default function Navbar({ onToggle, isOpen, collapsed, isMobile, user }) {
  const { logout, isImpersonating } = useApp();
  const [financialYearOpen, setFinancialYearOpen] = useState(true);
  const visibleNav = user?.role === 'SUPER_ADMIN' ? superAdminNav : filterNavByPermissions(nav, user);

  const handleLinkClick = (e, item) => {
    if (item?.action === 'logout') { e.preventDefault(); logout(); return; }
    if (isMobile) onToggle();
  };

  const topOffset = isImpersonating ? 'top-30 h-[calc(100vh-7.5rem)]' : 'top-20 h-[calc(100vh-5rem)]';

  const yearWidget = (
    <button type="button" onClick={() => setFinancialYearOpen((c) => !c)}
      className="flex min-h-12 w-full cursor-pointer items-center justify-between rounded-xl border t-border bg-[var(--bg-input)] px-3 py-2 text-left t-text-primary">
      <div className="flex items-center gap-3">
        <CalendarDays size={20} strokeWidth={1.8} className="shrink-0 text-red-400" />
        <div className="text-sm">
          <p className="m-0 font-bold t-text-primary">Financial Year</p>
          <p className="m-0 mt-0.5 font-mono text-xs font-medium tracking-tight t-text-muted">2026-2027</p>
        </div>
      </div>
      <ChevronDown size={16} strokeWidth={2.2} className={`t-text-muted transition-transform duration-200 ${financialYearOpen ? 'rotate-180' : ''}`} />
    </button>
  );

  if (isMobile) {
    return (
      <>
        {isOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onToggle} />}
        <nav className={sidebarShell(`top-0 h-screen w-58 px-2 py-4 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`)}>
          <div className="mb-4">{yearWidget}</div>
          <div className="mb-2 flex items-center justify-end px-1 lg:hidden">
            <button onClick={onToggle} className="cursor-pointer rounded-xl p-1 t-text-muted hover:bg-[var(--bg-row-hover)] hover:t-text-primary">
              <X size={20} />
            </button>
          </div>
          <div className="sidebar-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto pr-2">
            {visibleNav.map((section, i) => <NavSection key={i} section={section} onLinkClick={handleLinkClick} collapsed={false} />)}
          </div>
        </nav>
      </>
    );
  }

  if (collapsed) {
    return (
      <nav className={sidebarShell(`w-20 py-4 ${topOffset}`)}>
        <div className="mb-4 flex flex-col items-center justify-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
            <CalendarDays size={20} strokeWidth={1.8} />
          </div>
        </div>
        <div className="sidebar-scrollbar flex flex-1 flex-col items-center justify-start gap-3 overflow-y-auto px-2">
          {visibleNav.map((section, i) => <NavSection key={i} section={section} onLinkClick={handleLinkClick} collapsed={collapsed} />)}
        </div>
      </nav>
    );
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 top-18 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onToggle} />}
      <nav className={sidebarShell(`w-58 px-4 py-10 ${topOffset} ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`)}>
        <div className="mb-4">{yearWidget}</div>
        <div className="mb-2 flex items-center justify-end px-1 lg:hidden">
          <button onClick={onToggle} className="cursor-pointer rounded-xl p-1 t-text-muted hover:bg-[var(--bg-row-hover)] hover:t-text-primary lg:hidden">
            <X size={20} />
          </button>
        </div>
        <div className="sidebar-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto pr-2">
          {visibleNav.map((section, i) => <NavSection key={i} section={section} onLinkClick={handleLinkClick} collapsed={collapsed} />)}
        </div>
        <div className="mt-4 border-t t-divider px-2 pt-4 font-mono text-xs font-medium t-text-subtle">
          Single-company workspace
        </div>
      </nav>
    </>
  );
}
