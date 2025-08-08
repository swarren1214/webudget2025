import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { AppWindow, Building, CreditCard, ArrowLeftRight, BarChart } from "lucide-react";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: AppWindow },
  { name: "Accounts", href: "/accounts", icon: Building },
  { name: "Transactions", href: "/transactions", icon: CreditCard },
  { name: "Budgets", href: "/budgets", icon: BarChart },
  { name: "Transfers", href: "/transfers", icon: ArrowLeftRight },
];

function Sidebar({ className, onClose }: SidebarProps) {
  const [location, navigate] = useLocation();

  return (
    <aside
      className={cn(
        "flex flex-col min-h-screen bg-gradient-to-r from-bigGrinch to-littleGrinch dark:bg-gray-900 text-white shadow-lg",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-20 px-6">
        <img
          src="/logo-white.png"
          alt="WeBudget Logo"
          className="h-10 w-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-col px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;

          return (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.href);
                onClose?.();
              }}
              className={cn(
                "group flex items-center w-full px-4 py-3 rounded-xl transition-colors text-base font-bold",
                isActive
                  ? "bg-white/15 text-white shadow-sm"
                  : "hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;