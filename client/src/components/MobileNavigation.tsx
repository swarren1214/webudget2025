import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Building2, 
  ArrowLeftRight, 
  PieChart, 
  ArrowUp10
} from "lucide-react";

function MobileNavigation() {
  const [location] = useLocation();
  
  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Accounts", href: "/accounts", icon: Building2 },
    { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
    { name: "Budgets", href: "/budgets", icon: PieChart },
    { name: "Transfers", href: "/transfers", icon: ArrowUp10 },
  ];
  
  return (
    <nav className="lg:hidden flex items-center justify-around bg-white border-t border-gray-200 py-2 px-4">
      {navigation.map((item) => {
        const isActive = location === item.href;
        return (
          <div 
            key={item.name}
            className={`flex flex-col items-center cursor-pointer ${isActive ? "text-primary" : "text-gray-500"}`}
            onClick={() => window.location.href = item.href}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{item.name}</span>
          </div>
        );
      })}
    </nav>
  );
}

export default MobileNavigation;
