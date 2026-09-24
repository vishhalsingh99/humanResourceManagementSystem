import { Menu, CircleUserRound, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.constants';
import { useApp } from '../../context/AppContext';
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
  const roleLabel = user?.roleName || user?.role || 'Admin';
  const companyName =
    onboarding?.company?.companyName || 'HRMS';

  const companyLogo =
    buildUploadedFileUrl(onboarding?.company?.logoPreview);
  const navigate = useNavigate();

  return (
    <header className={`fixed inset-x-0 z-60 h-20 border-b border-slate-800 bg-[#111827] ${isImpersonating ? 'top-10' : 'top-0'}`}>
      <div className="flex w-full items-center justify-between px-4 py-3 lg:px-6">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          {!hideMenu && (
            <button
              onClick={onMenuToggle}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <Menu size={22} className="stroke-[2.5]" />
            </button>
          )}

          <div className=" sm:flex items-center gap-3">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt="Company Logo"
                className=" hidden sm:flex h-10 w-10 object-contain"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded bg-  font-bold text-blue-600">
                {/* {companyName ? companyName.charAt(0) : ''} */}
              </div>
            )}

            <p className="text-xl font-semibold tracking-tight text-white">
              {companyName}
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setProfileOpen((open) => !open)}
            className="flex cursor-pointer items-center gap-3 rounded-md px-1 py-1 text-slate-200 transition hover:bg-slate-800 sm:px-3"
          >
            <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-sm font-bold uppercase text-white">
              {(user?.name || 'User').charAt(0)}
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <p className="m-0 text-sm font-semibold">{user?.name || 'User'}</p>
              <ChevronDown size={16} className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {profileOpen && (
            <div className=" absolute  right-0  -6 top-full z-50 mt-3.5 w-72 rounded-sm border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <CircleUserRound size={26} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {user?.name || 'HR Admin'}
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      {user?.email || 'example@gmail.com'}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-600">
                  <span className="font-semibold">Role:</span>{' '}
                  {String(roleLabel).charAt(0).toUpperCase() + String(roleLabel).slice(1)}
                </p>
              </div>

              <div className="p-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate(ROUTES.PROFILE);
                    setProfileOpen(false);
                  }}
                  className="w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600"
                >
                  Profile
                </button>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setProfileOpen(false);
                  }}
                  className="mt-1 w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
