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
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* Desktop Sidebar - visible on large screens */}
      <Sidebar className="hidden lg:flex" />
      
      {/* Mobile Sidebar - conditionally visible */}
      {isMobile && showMobileSidebar && (
        <Sidebar 
          className="fixed inset-0 z-50 bg-white" 
          onClose={() => setShowMobileSidebar(false)}
        />
      )}
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <Header onMenuClick={() => setShowMobileSidebar(true)} />
        
        {/* Main Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <MobileNavigation />
      </main>
    </div>
  );
}

export default Layout;
