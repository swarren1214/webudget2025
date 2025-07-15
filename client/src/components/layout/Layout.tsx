import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import MobileNavigation from "../MobileNavigation";
import Header from "./Header";
import { useMobileDetection } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const isMobile = useMobileDetection();
  const [location] = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setShowMobileSidebar(false);
  }, [location]);

  // Prevent background scroll when sidebar is open
  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", showMobileSidebar);
    return () => document.body.classList.remove("overflow-hidden");
  }, [showMobileSidebar]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar (fixed for desktop, overlay for mobile) */}
      <div>
        {/* Desktop Sidebar */}
        <div className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobile && showMobileSidebar && (
          <div
            className="fixed inset-0 z-40 bg-black/40"
            role="dialog"
            aria-modal="true"
            onClick={() => setShowMobileSidebar(false)}
          >
            <Sidebar
              className="w-64 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
              onClose={() => setShowMobileSidebar(false)}
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-20">
          <Header onMenuClick={() => setShowMobileSidebar(true)} />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNavigation />
      </div>
    </div>
  );
}

export default Layout;
