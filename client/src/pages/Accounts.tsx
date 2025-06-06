import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import ConnectAccountModal from "@/components/modals/ConnectAccountModal";
import { type Account, type InsertAccount } from "@shared/schema";
import { Plus } from "lucide-react";
import { createAccount } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function Accounts() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch accounts data
  const { data: accounts, isLoading } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
  });
  
  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: async (accountData: InsertAccount) => {
      return createAccount(accountData);
    },
    onSuccess: (account) => {
      setSelectedAccountId(account.id);
      setShowConnectModal(true);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleConnectAccount = async () => {
    // Create a new account first
    createAccountMutation.mutate({
      userId: 1, // In a real app, this would come from the user's session
      name: "New Account",
      type: "checking",
      balance: 0,
      accountNumber: "****1234",
      institutionName: "Unknown Bank",
      institutionLogo: "",
      isConnected: false
    });
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <Button onClick={handleConnectAccount}>
          <Plus className="mr-2 h-4 w-4" />
          Connect Account
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid gap-4">
          <Skeleton className="h-[150px] w-full" />
          <Skeleton className="h-[150px] w-full" />
          <Skeleton className="h-[150px] w-full" />
        </div>
      ) : (
        <div className="grid gap-4">
          {accounts?.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
          
          <Button
            variant="outline"
            className="border-dashed h-[100px] mt-2"
            onClick={handleConnectAccount}
          >
            <Plus className="mr-2 h-5 w-5" />
            Connect New Account
          </Button>
        </div>
      )}
      
      <ConnectAccountModal 
        isOpen={showConnectModal} 
        onClose={() => {
          setShowConnectModal(false);
          setSelectedAccountId(null);
        }}
        accountId={selectedAccountId || 0}
      />
    </>
  );
}

interface AccountCardProps {
  account: Account;
}

function AccountCard({ account }: AccountCardProps) {
  const getIconForAccountType = (type: string) => {
    switch (type) {
      case 'checking':
        return 'account_balance';
      case 'savings':
        return 'savings';
      case 'credit':
        return 'credit_card';
      default:
        return 'account_balance';
    }
  };
  
  const getColorForAccountType = (type: string) => {
    switch (type) {
      case 'checking':
        return 'bg-blue-100 text-blue-600';
      case 'savings':
        return 'bg-green-100 text-green-600';
      case 'credit':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <div className={`w-10 h-10 rounded-md flex items-center justify-center mr-3 ${getColorForAccountType(account.type)}`}>
            <span className="material-icons">{getIconForAccountType(account.type)}</span>
          </div>
          {account.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{account.institutionName}</p>
            <p className="text-sm text-muted-foreground">{account.accountNumber}</p>
          </div>
          <div className="mt-2 md:mt-0">
            <p className={`text-2xl font-semibold ${account.balance < 0 ? 'text-red-500' : ''}`}>
              ${Math.abs(account.balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
            <p className="text-sm text-muted-foreground">
              {account.balance < 0 ? 'Current Debt' : 'Available Balance'}
            </p>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm">View Transactions</Button>
          <Button variant="outline" size="sm">Settings</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default Accounts;
