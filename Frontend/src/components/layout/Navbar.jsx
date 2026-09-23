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
      { to: ROUTES.EMPLOYEE_COMPANY_INFORMATION, label: 'Company Rules & Policies', icon: Building2, employeeOnly: true },
    ],
  },
  {
    label: 'Employee',
    icon: UserPlus,
    permission: 'employee.view',
    items: [
      { to: ROUTES.EMPLOYEES, label: 'Employee List', icon: Users },
      { to: ROUTES.EMPLOYEE_DIRECTORY, label: 'Directory', icon: Layers },
    ],
  },

  {
    label: 'Leave',
    icon: Clock,
    permission: ['leave.view', 'leave.view_all'],
    items: [
      { to: ROUTES.LEAVE, label: 'Leave Requests', icon: Clock },
    ],
  },
  {
    label: 'Attendance',
    icon: CalendarCheck,
    permission: ['attendance.view', 'attendance.view_all'],
    items: [
      { to: ROUTES.ATTENDANCE, label: '', icon: CalendarCheck },

    ],
  },
  {
    label: 'Meeting',
    icon: CalendarDays,
    permission: 'meeting.view',
    items: [
      { to: ROUTES.MEETINGS, label: 'All Meetings', icon: CalendarDays },
    ],
  },
  {
    label: 'Salary',
    icon: Banknote,
    permission: ['payroll.view', 'payroll.view_all'],
    items: [
      { to: ROUTES.SALARY_DASHBOARD, label: 'Salary', icon: Banknote },
    ],
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
    .filter((section) => !section.permission || (Array.isArray(section.permission)
      ? hasAnyPermission(user, section.permission)
      : hasPermission(user, section.permission)))
    .map((section) => ({
      ...section,
      items: (section.items || []).filter((item) => {
        const isHiddenEmployeeItem = isEmployeeDefault && (
          
          item.to === ROUTES.DASHBOARD
        );
        const isHiddenNonEmployeeItem = item.employeeOnly && !isEmployeeDefault;
        const isHiddenMasterSection = isEmployeeDefault && section.label === 'Master';

        if (isHiddenEmployeeItem || isHiddenNonEmployeeItem || isHiddenMasterSection) return false;
        return !item.permission || hasPermission(user, item.permission);
      }),
    }))
    .filter((section) => section.items.length > 0);
};

// super Admin page
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
    items: [
      { to: ROUTES.SUPER_ADMIN_COMPANIES, label: 'Companies', icon: Building2 },
    ],
  },
  {
    label: 'Subscription Management',
    icon: CreditCard,
    items: [
      { to: ROUTES.SUPER_ADMIN_SUBSCRIPTION, label: 'Subscriptions', icon: CreditCard },
    ],
  },
  {
    label: 'Audit Logs',
    icon: FileClock,
    items: [
      { to: ROUTES.SUPER_ADMIN_AUDIT_LOGS, label: 'Audit Logs', icon: FileClock },
    ],
  },
  {
    label: 'Global Settings',
    icon: SlidersHorizontal,
    items: [
      { to: ROUTES.SUPER_ADMIN_SETTINGS, label: 'Settings', icon: SlidersHorizontal },
    ],
  },
  {
    label: null,
    items: [
      { to: ROUTES.PROFILE, label: 'Profile', icon: ShieldCheck },
      { to: ROUTES.LOGIN, label: 'Logout', icon: LogOut, action: 'logout' },
    ],      
  },
];



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
            className={({ isActive }) =>
              `flex min-h-10 items-center gap-3 rounded-[3px] px-2 py-2.5 text-sm font-semibold no-underline transition-colors duration-150 ${collapsed ? 'h-11 w-11 justify-center px-0 py-0' : ''
              } ${isActive
                ? 'bg-[#dbe7ff] text-[#3b57ff]'
                : 'text-slate-950 hover:bg-[#f3f6fb] hover:text-slate-950'
              }`
            }
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
        className={({ isActive }) =>
          `flex min-h-10 items-center gap-3 rounded-[3px] px-2 py-2.5 text-sm font-semibold no-underline transition-colors duration-150 ${collapsed ? 'h-11 w-11 justify-center px-0 py-0' : ''
          } ${isActive
            ? 'bg-[#dbe7ff] text-[#3b57ff]'
            : 'text-slate-950 hover:bg-[#f3f6fb] hover:text-slate-950'
          }`
        }
      >
        <section.icon size={19} strokeWidth={1.8} className="shrink-0" />
        {!collapsed && <span>{section.label}</span>}
      </NavLink>
    );
  }

  if (collapsed) {
    return (
      <div className="relative group">
        <button
          title={section.label}
          onClick={() => setOpen((value) => !value)}
          className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-[3px] text-sm font-semibold transition-colors duration-150 ${isAnyActive ? 'bg-[#dbe7ff] text-[#3b57ff]' : 'text-slate-950 hover:bg-[#f3f6fb] hover:text-slate-950'
            }`}
        >
          <section.icon size={19} strokeWidth={1.8} className="shrink-0" />
        </button>

        {/* Tooltip */}
        <div className="absolute left-14 top-1 rounded bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none whitespace-nowrap">
          {section.label}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((value) => !value)}
        className={`flex min-h-10 w-full cursor-pointer items-center justify-between rounded-[3px] px-2 py-2.5 text-sm font-semibold transition-colors duration-150 ${isAnyActive ? 'text-slate-950' : 'text-slate-950 hover:bg-[#f3f6fb] hover:text-slate-950'
          }`}
      >
        <span className="flex items-center gap-3">
          <section.icon size={19} strokeWidth={1.8} className="shrink-0" />
          <span>{section.label}</span>
        </span>
        <ChevronDown size={16} strokeWidth={2.2} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
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
                `flex min-h-9 items-center gap-3 rounded-[3px] px-3 py-2 text-sm no-underline transition-colors duration-150 ${isActive ? 'bg-[#dbe7ff] font-semibold text-[#3b57ff]' : 'text-slate-700 hover:bg-[#f3f6fb] hover:text-slate-950'
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

export default function Navbar({ onToggle, isOpen, collapsed, isMobile, user }) {
  const location = useLocation();
  const { logout, isImpersonating } = useApp();
  const [financialYearOpen, setFinancialYearOpen] = useState(true);
  const visibleNav = user?.role === 'SUPER_ADMIN'
    ? superAdminNav
    : filterNavByPermissions(nav, user);
  const handleLinkClick = (event, item) => {
    if (item?.action === 'logout') {
      event.preventDefault();
      logout();
      return;
    }

    if (isMobile) onToggle();
  };

  if (isMobile) {
    return (
      <>
        {isOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onToggle} />}

        <nav
          className={`fixed left-0 top-0 z-50 flex h-screen w-58 flex-col border-r border-slate-200 bg-white px-2 py-4 shadow-[3px_0_10px_rgba(15,23,42,0.08)] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0`}
        >


          <div className="mb-4">
            <button
              type="button"
              onClick={() => setFinancialYearOpen((current) => !current)}
              className="flex min-h-12 w-full cursor-pointer items-center justify-between rounded-[3px] bg-white px-0 py-1 text-left text-slate-950"
            >
              <div className="flex items-center gap-3">
                <CalendarDays size={20} strokeWidth={1.8} className="shrink-0" />
                <div className="text-sm">
                  <p className="m-0 text-sm font-bold text-slate-950">Financial Year</p>
                  <p className="m-0 mt-0.5 text-xs font-medium tracking-tight text-slate-800">2026-2027</p>
                </div>
              </div>
              <ChevronDown
                size={16}
                strokeWidth={2.2}
                className={`text-slate-950 transition-transform duration-200 ${financialYearOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          <div className="mb-2 flex items-center justify-end px-1 lg:hidden">
            <button onClick={onToggle} className="cursor-pointer text-slate-500 hover:text-slate-900">
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
      <nav className={`fixed left-0 z-50 flex w-20 flex-col border-r border-slate-200 bg-white py-4 shadow-[3px_0_10px_rgba(15,23,42,0.08)] transition-all duration-300 ease-in-out ${isImpersonating ? ' top-30 h-[calc(100vh-7.5rem)]' : 'top-20 h-[calc(100vh-56px)]'}`}>

        <div className="mb-4 flex flex-col items-center justify-center gap-2">
          <div className="flex top-20 w-11 items-center justify-center rounded-[3px]  font-bold text-[#3b57ff]">
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
      {isOpen && <div className="fixed inset-0  top-18 z-40 bg-black/40 lg:hidden" onClick={onToggle} />}
      {/* side bar */}
      <nav
        className={`fixed left-0 z-50 flex w-58 flex-col border-r border-slate-200 bg-white px-4 py-10 shadow-[3px_0_10px_rgba(15,23,42,0.08)] transition-transform duration-300 ${isImpersonating ? 'top-30 h-[calc(100vh-7.5rem)]' : 'top-20 h-[calc(100vh-56px)]'} ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0`}
      >
        {/* <CompanyBrand /> */}

        <div className="mb-4">
          <button
            type="button"
            onClick={() => setFinancialYearOpen((current) => !current)}
            className="flex min-h-12 w-full cursor-pointer items-center justify-between rounded-[3px] bg-white px-0 py-1 text-left text-slate-950"
          >
            <div className="flex items-center gap-3">
              <CalendarDays size={20} strokeWidth={1.8} className="shrink-0" />
              <div>
                <p className="m-0 text-sm font-semibold text-slate-950">Financial Year</p>
                <p className="m-0 mt-0.5 text-xs font-medium tracking-tight text-slate-800">2026-2027</p>
              </div>
            </div>
            {/* <ChevronDown
              size={16}
              strokeWidth={2.2}
              className={`text-slate-950 transition-transform duration-200 ${financialYearOpen ? 'rotate-180' : ''}`}
            /> */}
          </button>
        </div>

        <div className="mb-2 flex items-center justify-end px-1 lg:hidden">
          <button onClick={onToggle} className="cursor-pointer text-slate-500 hover:text-slate-900 lg:hidden">
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto pr-2">
          {visibleNav.map((section, index) => (
            <NavSection key={index} section={section} onLinkClick={handleLinkClick} collapsed={collapsed} />
          ))}
        </div>

        <div className="mt-4 border-t border-slate-200 px-4 py-16 text-center text-sm text-slate-700">
          box
        </div>
      </nav>
    </>
  );
}
