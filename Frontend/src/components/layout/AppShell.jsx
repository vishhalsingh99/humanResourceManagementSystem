import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import Toast from '../common/Toast';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import AppRoutes from '../../routes';

export default function AppShell() {
const { toast, clearToast, user, logout, isImpersonating, exitImpersonation } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen((open) => !open);
  }, []);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
 
  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(false); // On mobile, don't collapse sidebar
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
          <div className="flex min-h-screen bg-[#eef3f9]" style={{ fontFamily: "'Outfit', 'Segoe UI', Arial, sans-serif" }}>
            {isImpersonating && (
              <div className="fixed inset-x-0 top-0 z-70 flex min-h-10 items-center justify-center gap-4 bg-slate-950 px-4 py-2 text-center text-sm font-semibold text-white">
                <span>You are logged in as Company Admin</span>
                <span className="hidden text-slate-300 sm:inline">Impersonated by Super Admin</span>
                <button
                  type="button"
                  onClick={exitImpersonation}
                  className="rounded bg-white px-3 py-1 text-sm font-semibold text-slate-950 hover:bg-slate-100"
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

            <div className={`flex-1 min-w-0 flex flex-col pt- transition-all duration-300 ${isMobile ? 'lg:ml-60' : (sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-60')
              }`}>
              <main className="flex-1">
                {content}
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
