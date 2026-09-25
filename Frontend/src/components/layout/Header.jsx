import { Menu, CircleUserRound, ChevronDown, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constants';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { buildUploadedFileUrl } from '../../utils';

export default function Header({
  profileOpen,
  setProfileOpen,
  onMenuToggle,
  user,
  logout,
  hideMenu = false,
}) {
  const { onboarding, isImpersonating } = useApp();
  const { theme, toggleTheme } = useTheme();
  const roleLabel = user?.roleName || user?.role || 'Admin';
  const companyName = onboarding?.company?.companyName || 'HRMS';
  const companyLogo = buildUploadedFileUrl(onboarding?.company?.logoPreview);
  const navigate = useNavigate();

  return (
    <header
      className={`ui-header fixed inset-x-0 z-60 h-20 ${isImpersonating ? 'top-10' : 'top-0'}`}
    >
      <div className="flex w-full items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          {!hideMenu && (
            <button
              onClick={onMenuToggle}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl t-text-muted transition hover:scale-[1.02] hover:bg-[var(--bg-input)] hover:text-[var(--text-heading)] hover:shadow-[0_0_16px_rgba(239,68,68,0.15)]"
            >
              <Menu size={22} className="stroke-[2.5]" />
            </button>
          )}

          <div className="flex items-center gap-3 sm:flex">
            {companyLogo ? (
              <img src={companyLogo} alt="Company Logo" className="hidden h-10 w-10 object-contain sm:flex" />
            ) : (
              <div className="hidden h-10 w-10 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 font-mono text-sm font-bold text-red-400 sm:flex">
                {companyName ? companyName.charAt(0) : 'H'}
              </div>
            )}
            <p className="text-xl font-semibold tracking-tight t-text-heading">{companyName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl t-text-muted transition hover:bg-red-500/10 hover:text-red-400"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Profile button */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen((open) => !open)}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-1 py-1 t-text-secondary transition hover:bg-[var(--bg-input)] sm:px-3"
            >
              <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-red-500 text-sm font-bold uppercase text-white shadow-[0_0_16px_rgba(239,68,68,0.35)]">
                {(user?.name || 'User').charAt(0)}
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                <p className="m-0 text-sm font-semibold t-text-primary">{user?.name || 'User'}</p>
                <ChevronDown size={16} className={`transition-transform t-text-muted ${profileOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {profileOpen && (
              <div className="ui-modal-box absolute right-0 top-full z-50 mt-3.5 w-72 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.12)]">
                <div className="border-b t-divider p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
                      <CircleUserRound size={26} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold t-text-primary">{user?.name || 'HR Admin'}</p>
                      <p className="truncate font-mono text-xs t-text-subtle">{user?.email || 'example@gmail.com'}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm t-text-muted">
                    <span className="font-semibold t-text-secondary">Role:</span>{' '}
                    {String(roleLabel).charAt(0).toUpperCase() + String(roleLabel).slice(1)}
                  </p>
                </div>

                <div className="p-2">
                  <button
                    type="button"
                    onClick={() => { navigate(ROUTES.PROFILE); setProfileOpen(false); }}
                    className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium t-text-muted transition hover:bg-[var(--bg-input)] hover:text-red-300"
                  >
                    Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => { logout(); setProfileOpen(false); }}
                    className="mt-1 w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-red-400 transition hover:bg-red-500/10"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
