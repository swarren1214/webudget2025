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
import logo from "@/assets/webudget-logo.png";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

function SidebarComponent({ className = "", onClose }: SidebarProps) {
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
      <aside className={`fixed top-0 left-0 z-40 h-screen transition-transform w-64 flex flex-col justify-between ${className}`} style={{ background: "linear-gradient(270deg, #1DCC67 0.19%, #009F23 99.92%)" }}>
        <div>
          <div className="p-6 flex items-center justify-center border-b border-transparent">
            <img src={logo} alt="WeBudget Logo" style={{ maxHeight: '40px', width: 'auto', display: 'block', margin: '0 auto' }} />
          </div>
          <nav className="py-4 px-3">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-4 py-3 cursor-pointer rounded-lg transition-colors font-medium text-white ${
                        isActive 
                          ? "bg-white/20" 
                          : "hover:bg-white/10"
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5 text-white" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        <div className="p-4 border-t border-white/10">
          <Button 
            className="w-full bg-white/20 text-white hover:bg-white/30 border-none sidebar-button"
            onClick={() => setShowConnectModal(true)}
            style={{ boxShadow: "none" }}
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

export default SidebarComponent;
