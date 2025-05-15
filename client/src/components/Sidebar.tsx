import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Building2, 
  ArrowLeftRight, 
  PieChart, 
  ArrowUp10,
  X
} from "lucide-react";
import { useState } from "react";
import ConnectAccountModal from "./modals/ConnectAccountModal";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

function Sidebar({ className = "", onClose }: SidebarProps) {
  const [location] = useLocation();
  const [showConnectModal, setShowConnectModal] = useState(false);
  
  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Accounts", href: "/accounts", icon: Building2 },
    { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
    { name: "Budgets", href: "/budgets", icon: PieChart },
    { name: "Transfers", href: "/transfers", icon: ArrowUp10 },
  ];
  
  return (
    <>
      <aside className={`w-64 bg-white border-r border-gray-200 flex flex-col ${className}`}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-primary flex items-center">
            <span className="material-icons mr-2">account_balance_wallet</span>
            WeBudget
          </h1>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <li key={item.name}>
                  <div 
                    className={`flex items-center px-4 py-3 cursor-pointer ${
                      isActive 
                        ? "text-primary bg-blue-50 border-l-4 border-primary" 
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                    onClick={() => window.location.href = item.href}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <Button 
            className="w-full"
            onClick={() => setShowConnectModal(true)}
          >
            <span className="material-icons mr-2">add</span>
            Connect Account
          </Button>
        </div>
      </aside>
      
      <ConnectAccountModal 
        isOpen={showConnectModal} 
        onClose={() => setShowConnectModal(false)} 
      />
    </>
  );
}

export default Sidebar;
