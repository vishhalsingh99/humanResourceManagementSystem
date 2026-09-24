import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCog,
  CalendarDays,
  CreditCard,
  Banknote,
  X,
  ChevronDown,
  UserPlus,
  Layers,
  BarChart2,
  Clock,
  CalendarCheck,
  Building2,
  ShieldCheck,
  FileClock,
  SlidersHorizontal,
  LogOut,
} from 'lucide-react';
import { ROUTES } from '../../constants/routes.constants';
import { useApp } from '../../context/AppContext';
import { hasPermission, hasAnyPermission } from '../../utils/permissions';

const nav = [
  {
    label: null,
    items: [
      { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
      {
        to: ROUTES.EMPLOYEE_COMPANY_INFORMATION,
        label: 'Company Rules & Policies',
        icon: Building2,
        employeeOnly: true,
      },
    ],
  },
  {
    label: 'Employee',
    icon: UserPlus,
    permission: 'employee.view',
    items: [{ to: ROUTES.EMPLOYEES, label: 'Employee List', icon: Users }],
  },
  {
    label: 'Leave',
    icon: Clock,
    permission: ['leave.view', 'leave.view_all'],
    items: [{ to: ROUTES.LEAVE, label: 'Leave Requests', icon: Clock }],
  },
  {
    label: 'Attendance',
    icon: CalendarCheck,
    permission: ['attendance.view', 'attendance.view_all'],
    items: [{ to: ROUTES.ATTENDANCE, label: '', icon: CalendarCheck }],
  },
  {
    label: 'Meeting',
    icon: CalendarDays,
    permission: 'meeting.view',
    items: [{ to: ROUTES.MEETINGS, label: 'All Meetings', icon: CalendarDays }],
  },
  {
    label: 'Salary',
    icon: Banknote,
    permission: ['payroll.view', 'payroll.view_all'],
    items: [{ to: ROUTES.SALARY_DASHBOARD, label: 'Salary', icon: Banknote }],
  },
  {
    label: 'Master',
    icon: Layers,
    items: [
      { to: ROUTES.DEPARTMENTS, label: 'Departments', icon: Layers },
      { to: ROUTES.DESIGNATIONS, label: 'Designations', icon: Layers },
    ],
  },
  {
    label: 'Reports',
    icon: BarChart2,
    permission: 'reports.view',
    items: [
      { to: ROUTES.REPORTS_EMPLOYEES, label: 'Employee Report', icon: BarChart2 },
      { to: ROUTES.PAYROLL, label: 'Payroll Report', icon: BarChart2 },
      { to: ROUTES.REPORTS_MEETINGS, label: 'Meeting Report', icon: BarChart2 },
    ],
  },
  {
    label: 'Settings',
    icon: UserCog,
    permission: 'settings.view',
    items: [
      { to: ROUTES.SETTINGS_INFORMATION, label: 'Settings Information', icon: UserCog },
      { to: ROUTES.SETTINGS_ROLES_PERMISSIONS, label: 'Roles & Permissions', icon: ShieldCheck },
      { to: ROUTES.SETTINGS_COMPANY, label: 'Company', icon: Layers },
      { to: ROUTES.SETTINGS_SUBSCRIPTION, label: 'Subscription', icon: CreditCard },
    ],
  },
];

const filterNavByPermissions = (sections, user) => {
  const isEmployeeDefault = user?.role === 'employee';

  return sections
    .filter((section) =>
      !section.permission
        ? true
        : Array.isArray(section.permission)
          ? hasAnyPermission(user, section.permission)
          : hasPermission(user, section.permission)
    )
    .map((section) => ({
      ...section,
      items: (section.items || []).filter((item) => {
        const isHiddenEmployeeItem = isEmployeeDefault && item.to === ROUTES.DASHBOARD;
        const isHiddenNonEmployeeItem = item.employeeOnly && !isEmployeeDefault;
        const isHiddenMasterSection = isEmployeeDefault && section.label === 'Master';

        if (isHiddenEmployeeItem || isHiddenNonEmployeeItem || isHiddenMasterSection) return false;
        return !item.permission || hasPermission(user, item.permission);
      }),
    }))
    .filter((section) => section.items.length > 0);
};

const superAdminNav = [
  {
    label: null,
    items: [
      { to: ROUTES.SUPER_ADMIN_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
      { to: ROUTES.SUPER_ADMIN_COMPANIES, label: 'View All Companies', icon: Building2 },
    ],
  },
  {
    label: 'Company Management',
    icon: Building2,
    items: [{ to: ROUTES.SUPER_ADMIN_COMPANIES, label: 'Companies', icon: Building2 }],
  },
  {
    label: 'Subscription Management',
    icon: CreditCard,
    items: [{ to: ROUTES.SUPER_ADMIN_SUBSCRIPTION, label: 'Subscriptions', icon: CreditCard }],
  },
  {
    label: 'Audit Logs',
    icon: FileClock,
    items: [{ to: ROUTES.SUPER_ADMIN_AUDIT_LOGS, label: 'Audit Logs', icon: FileClock }],
  },
  {
    label: 'Global Settings',
    icon: SlidersHorizontal,
    items: [{ to: ROUTES.SUPER_ADMIN_SETTINGS, label: 'Settings', icon: SlidersHorizontal }],
  },
  {
    label: null,
    items: [
      { to: ROUTES.PROFILE, label: 'Profile', icon: ShieldCheck },
      { to: ROUTES.LOGIN, label: 'Logout', icon: LogOut, action: 'logout' },
    ],
  },
];

const navItemClass = ({ isActive, collapsed }) =>
  `flex min-h-10 items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-semibold no-underline transition duration-200 hover:scale-[1.02] ${
    collapsed ? 'h-11 w-11 justify-center px-0 py-0' : ''
  } ${
    isActive
      ? 'border border-red-500/40 bg-red-500/15 text-red-300 shadow-[0_0_16px_rgba(239,68,68,0.2)]'
      : 'border border-transparent text-neutral-400 hover:border-neutral-700 hover:bg-neutral-800/60 hover:text-neutral-100'
  }`;

function NavSection({ section, onLinkClick, collapsed }) {
  const location = useLocation();
  const isAnyActive = section.items.some((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );
  const [open, setOpen] = useState(isAnyActive);

  useEffect(() => {
    if (isAnyActive) setOpen(true);
  }, [isAnyActive]);

  if (!section.label) {
    return (
      <div className="flex flex-col gap-1">
        {section.items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={(event) => onLinkClick(event, item)}
            title={collapsed ? item.label : ''}
            className={({ isActive }) => navItemClass({ isActive, collapsed })}
          >
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
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onLinkClick}
        title={collapsed ? section.label : ''}
        className={({ isActive }) => navItemClass({ isActive, collapsed })}
      >
        <section.icon size={19} strokeWidth={1.8} className="shrink-0" />
        {!collapsed && <span>{section.label}</span>}
      </NavLink>
    );
  }

  if (collapsed) {
    return (
      <div className="group relative">
        <button
          title={section.label}
          onClick={() => setOpen((value) => !value)}
          className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-sm font-semibold transition duration-200 hover:scale-[1.02] ${
            isAnyActive
              ? 'border border-red-500/40 bg-red-500/15 text-red-300'
              : 'border border-transparent text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-100'
          }`}
        >
          <section.icon size={19} strokeWidth={1.8} className="shrink-0" />
        </button>

        <div className="pointer-events-none absolute left-14 top-1 whitespace-nowrap rounded-xl border border-neutral-700 bg-neutral-900 px-2 py-1 font-mono text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          {section.label}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((value) => !value)}
        className={`flex min-h-10 w-full cursor-pointer items-center justify-between rounded-xl px-2 py-2.5 text-sm font-semibold transition duration-200 ${
          isAnyActive
            ? 'text-neutral-100'
            : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-100'
        }`}
      >
        <span className="flex items-center gap-3">
          <section.icon size={19} strokeWidth={1.8} className="shrink-0" />
          <span>{section.label}</span>
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2.2}
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-1 flex flex-col gap-1 pl-7">
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={(event) => onLinkClick(event, item)}
              className={({ isActive }) =>
                `flex min-h-9 items-center gap-3 rounded-xl px-3 py-2 text-sm no-underline transition duration-200 ${
                  isActive
                    ? 'border border-red-500/30 bg-red-500/10 font-semibold text-red-300'
                    : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-100'
                }`
              }
            >
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

const sidebarShell = (extra) =>
  `fixed left-0 z-50 flex flex-col border-r border-neutral-800/80 bg-neutral-950/75 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.45)] transition-all duration-300 ease-in-out ${extra}`;

export default function Navbar({ onToggle, isOpen, collapsed, isMobile, user }) {
  const { logout, isImpersonating } = useApp();
  const [financialYearOpen, setFinancialYearOpen] = useState(true);
  const visibleNav = user?.role === 'SUPER_ADMIN' ? superAdminNav : filterNavByPermissions(nav, user);

  const handleLinkClick = (event, item) => {
    if (item?.action === 'logout') {
      event.preventDefault();
      logout();
      return;
    }

    if (isMobile) onToggle();
  };

  const topOffset = isImpersonating
    ? 'top-30 h-[calc(100vh-7.5rem)]'
    : 'top-20 h-[calc(100vh-5rem)]';

  if (isMobile) {
    return (
      <>
        {isOpen && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onToggle} />}

        <nav
          className={`${sidebarShell(
            `top-0 h-screen w-58 px-2 py-4 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`
          )}`}
        >
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setFinancialYearOpen((current) => !current)}
              className="flex min-h-12 w-full cursor-pointer items-center justify-between rounded-xl border border-neutral-800/80 bg-neutral-900/50 px-3 py-2 text-left text-neutral-100"
            >
              <div className="flex items-center gap-3">
                <CalendarDays size={20} strokeWidth={1.8} className="shrink-0 text-red-400" />
                <div className="text-sm">
                  <p className="m-0 text-sm font-bold text-neutral-100">Financial Year</p>
                  <p className="m-0 mt-0.5 font-mono text-xs font-medium tracking-tight text-neutral-400">
                    2026-2027
                  </p>
                </div>
              </div>
              <ChevronDown
                size={16}
                strokeWidth={2.2}
                className={`text-neutral-300 transition-transform duration-200 ${financialYearOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          <div className="mb-2 flex items-center justify-end px-1 lg:hidden">
            <button onClick={onToggle} className="cursor-pointer rounded-xl p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="sidebar-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto pr-2">
            {visibleNav.map((section, index) => (
              <NavSection key={index} section={section} onLinkClick={handleLinkClick} collapsed={false} />
            ))}
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
            <CalendarDays size={20} strokeWidth={1.8} className="shrink-0" />
          </div>
        </div>

        <div className="sidebar-scrollbar flex flex-1 flex-col items-center justify-start gap-3 overflow-y-auto px-2">
          {visibleNav.map((section, index) => (
            <NavSection key={index} section={section} onLinkClick={handleLinkClick} collapsed={collapsed} />
          ))}
        </div>
      </nav>
    );
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 top-18 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onToggle} />}
      <nav
        className={sidebarShell(
          `w-58 px-4 py-10 ${topOffset} ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`
        )}
      >
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setFinancialYearOpen((current) => !current)}
            className="flex min-h-12 w-full cursor-pointer items-center justify-between rounded-xl border border-neutral-800/80 bg-neutral-900/50 px-3 py-2 text-left text-neutral-100"
          >
            <div className="flex items-center gap-3">
              <CalendarDays size={20} strokeWidth={1.8} className="shrink-0 text-red-400" />
              <div>
                <p className="m-0 text-sm font-semibold text-neutral-100">Financial Year</p>
                <p className="m-0 mt-0.5 font-mono text-xs font-medium tracking-tight text-neutral-400">
                  2026-2027
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="mb-2 flex items-center justify-end px-1 lg:hidden">
          <button onClick={onToggle} className="cursor-pointer rounded-xl p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white lg:hidden">
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto pr-2">
          {visibleNav.map((section, index) => (
            <NavSection key={index} section={section} onLinkClick={handleLinkClick} collapsed={collapsed} />
          ))}
        </div>

        <div className="mt-4 border-t border-neutral-800 px-2 pt-4 font-mono text-xs font-medium text-neutral-500">
          Single-company workspace
        </div>
      </nav>
    </>
  );
}
