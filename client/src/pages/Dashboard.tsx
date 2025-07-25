import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import SummaryCard from "@/components/dashboard/SummaryCard";
import BudgetProgress from "@/components/dashboard/BudgetProgress";
import ConnectedAccounts from "@/components/dashboard/ConnectedAccounts";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ConnectAccountModal from "@/components/modals/ConnectAccountModal";
import TransferModal from "@/components/modals/TransferModal";
import { type Account, type BudgetCategory, type Transaction } from "@shared/schema";

function Dashboard() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch accounts data
  const { data: accounts, isLoading: isLoadingAccounts } = useQuery<Account[]>({
    queryKey: ['/accounts'],
  });
  
  // Fetch budget categories data
  const { data: budgetCategories, isLoading: isLoadingBudgets } = useQuery<BudgetCategory[]>({
    queryKey: ['/budget-categories'],
  });
  
  // Fetch recent transactions
  const { data: recentTransactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['/transactions/recent'],
  });
  
  // Calculate total balance
  const totalBalance = accounts?.reduce((sum, account) => sum + account.balance, 0) || 0;
  
  // Calculate monthly income and expenses
  const thisMonth = new Date();
  thisMonth.setDate(1);
  
  const monthlyIncome = recentTransactions
    ?.filter(t => t.isIncome && new Date(t.date) >= thisMonth)
    .reduce((sum, t) => sum + t.amount, 0) || 0;
  
  const monthlyExpenses = recentTransactions
    ?.filter(t => !t.isIncome && new Date(t.date) >= thisMonth)
    .reduce((sum, t) => sum + t.amount, 0) || 0;
  
  return (
    <>
      {/* Dashboard header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold mb-2 md:mb-0">Dashboard</h1>
        <div className="flex space-x-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search transactions..."
              className="pl-10 pr-4 py-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <Button variant="outline" size="sm" className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>
      
      {/* Financial Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {isLoadingAccounts ? (
          <>
            <Skeleton className="h-[150px] rounded-xl" />
            <Skeleton className="h-[150px] rounded-xl" />
            <Skeleton className="h-[150px] rounded-xl" />
          </>
        ) : (
          <>
            <SummaryCard 
              title="Total Balance" 
              amount={totalBalance}
              change={1520.25}
              changePercent={6.2}
              changeText="this month"
              icon="account_balance_wallet"
              iconColor="text-primary"
            />
            <SummaryCard 
              title="Monthly Income" 
              amount={monthlyIncome}
              change={240.00}
              changePercent={4.8}
              changeText="vs. last month"
              icon="trending_up"
              iconColor="text-green-500"
            />
            <SummaryCard 
              title="Monthly Expenses" 
              amount={monthlyExpenses}
              change={-120.45}
              changePercent={-3.1}
              changeText="vs. last month"
              icon="trending_down"
              iconColor="text-red-500"
            />
          </>
        )}
      </div>
      
      {/* Budget Progress Section */}
      <div className="mb-6">
        {isLoadingBudgets ? (
          <Skeleton className="h-[300px] rounded-xl" />
        ) : (
          <BudgetProgress categories={budgetCategories || []} transactions={recentTransactions || []} />
        )}
      </div>
      
      {/* Two Column Layout for Accounts and Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Connected Accounts Section */}
        <div className="lg:col-span-2">
          {isLoadingAccounts ? (
            <Skeleton className="h-[400px] rounded-xl" />
          ) : (
            <ConnectedAccounts 
              accounts={accounts || []} 
              onConnectAccount={() => setShowConnectModal(true)} 
            />
          )}
        </div>
        
        {/* Recent Transactions Section */}
        <div className="lg:col-span-3">
          {isLoadingTransactions ? (
            <Skeleton className="h-[400px] rounded-xl" />
          ) : (
            <RecentTransactions transactions={recentTransactions || []} />
          )}
        </div>
      </div>
      
      {/* Modals */}
      <ConnectAccountModal 
        isOpen={showConnectModal} 
        onClose={() => setShowConnectModal(false)} 
        accountId={0}
      />
      
      <TransferModal 
        isOpen={showTransferModal} 
        onClose={() => setShowTransferModal(false)}
        accounts={accounts || []}
      />
    </>
  );
}

export default Dashboard;
