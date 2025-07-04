import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Banknote, Repeat, Settings } from "lucide-react";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Accounts", href: "/accounts", icon: Banknote },
  { name: "Transactions", href: "/transactions", icon: Repeat },
  { name: "Transfers", href: "/transfers", icon: Settings },
];

function Sidebar({ className, onClose }: SidebarProps) {
  const [location, navigate] = useLocation();

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-big-grinch text-white shadow-lg",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-20 px-6 border-b border-white/20">
        <img
          src="/logo-white.png"
          alt="WeBudget Logo"
          className="h-10 w-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
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
                "group flex items-center w-full px-3 py-2 rounded-md transition-colors text-sm font-medium",
                isActive
                  ? "bg-white text-big-grinch"
                  : "hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Footer (optional for user/account/settings links) */}
      <div className="px-4 py-4 border-t border-white/10">
        <button
          onClick={() => {
            // Future: open settings or sign out
            console.log("TODO: settings or sign out");
          }}
          className="text-sm text-white/80 hover:text-white"
        >
          Settings
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
