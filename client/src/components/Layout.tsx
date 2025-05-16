import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Sidebar from "./Sidebar";
import MobileNavigation from "./MobileNavigation";
import Header from "./Header";
import { useMobileDetection } from "@/hooks/use-mobile";

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const isMobile = useMobileDetection();
  const [location] = useLocation();
  
  // Close mobile sidebar when route changes
  useEffect(() => {
    setShowMobileSidebar(false);
  }, [location]);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar (fixed for desktop, overlays for mobile) */}
      <div className="">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30">
          <Sidebar />
        </div>
        {/* Mobile Sidebar (overlay) */}
        {isMobile && showMobileSidebar && (
          <div className="fixed inset-0 z-40 bg-black/40">
            <Sidebar className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700" onClose={() => setShowMobileSidebar(false)} />
          </div>
        )}
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Header */}
        <div className="sticky top-0 z-20">
          <Header onMenuClick={() => setShowMobileSidebar(true)} />
        </div>
        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        {/* Mobile Bottom Navigation */}
        <MobileNavigation />
      </div>
    </div>
  );
}

export default Layout;
