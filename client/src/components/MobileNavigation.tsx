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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-around py-2 px-4">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                isActive 
                  ? "text-primary-600 dark:text-primary-500 bg-primary-50 dark:bg-primary-900" 
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileNavigation;
