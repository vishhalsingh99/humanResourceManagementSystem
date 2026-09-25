import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import Toast from '../common/Toast';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import AppRoutes from '../../routes';

export default function AppShell() {
  const { toast, clearToast, user, logout, isImpersonating, exitImpersonation, isInitialDataLoading } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen((open) => !open);
  }, []);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      <AppRoutes
        renderProtectedLayout={({ content }) => (
          <div className="app-ambient flex min-h-screen font-sans t-text-primary">
            {isImpersonating && (
              <div className="fixed inset-x-0 top-0 z-70 flex min-h-10 items-center justify-center gap-4 border-b border-red-500/30 bg-neutral-950/95 px-4 py-2 text-center text-sm font-semibold text-white backdrop-blur-md">
                <span>You are logged in as Company Admin</span>
                <span className="hidden font-mono text-xs text-neutral-400 sm:inline">Impersonated by Super Admin</span>
                <button
                  type="button"
                  onClick={exitImpersonation}
                  className="rounded-xl bg-red-500 px-3 py-1 text-sm font-semibold text-white shadow-[0_0_16px_rgba(239,68,68,0.3)] transition hover:bg-red-400 hover:scale-[1.02]"
                >
                  Exit Impersonation
                </button>
              </div>
            )}
            <Header
              profileOpen={profileOpen}
              setProfileOpen={setProfileOpen}
              onMenuToggle={() => {
                if (isMobile) {
                  setSidebarOpen((o) => !o);
                } else {
                  setSidebarCollapsed((o) => !o);
                }
              }}
              user={user}
              logout={logout}
            />

            <Sidebar
              isOpen={sidebarOpen}
              onToggle={handleSidebarToggle}
              collapsed={sidebarCollapsed}
              isMobile={isMobile}
              user={user}
            />

            <div
              className={`flex min-w-0 flex-1 flex-col pt-20 transition-all duration-300 ${
                isMobile ? 'lg:ml-60' : sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-60'
              }`}
            >
              <main className="flex-1">
                {isInitialDataLoading ? (
                  <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
                    <div className="flex flex-col items-center gap-4 text-neutral-400">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-800 border-t-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)]" />
                      <span className="font-mono text-sm font-medium">Loading workspace data...</span>
                    </div>
                  </div>
                ) : (
                  content
                )}
              </main>
              <Footer />
            </div>
          </div>
        )}
      />

      {toast && <Toast message={toast.msg} type={toast.type} onClose={clearToast} />}
    </>
  );
}
