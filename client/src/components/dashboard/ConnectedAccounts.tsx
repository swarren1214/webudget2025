import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type Account } from "@shared/schema";
import { Plus } from "lucide-react";
import { Link } from "wouter";
import { usePlaidLink } from "react-plaid-link";
import { createPlaidLinkToken } from "@/lib/backendApi";
import { useEffect, useState } from "react";

interface ConnectedAccountsProps {
  accounts: Account[];
  onConnectAccount: (publicToken: string) => void;
}

const ConnectedAccounts = ({ accounts, onConnectAccount }: ConnectedAccountsProps) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const { linkToken } = await createPlaidLinkToken();
        setLinkToken(linkToken);
      } catch (error) {
        console.error("Failed to fetch Plaid Link token:", error);
      }
    };

    fetchLinkToken();
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken || "",
    onSuccess: (publicToken) => {
      console.log("Plaid Link success, public token:", publicToken);
      onConnectAccount(publicToken);
    },
  });

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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Connected Accounts</CardTitle>
        <Button
          variant="link"
          size="sm"
          className="text-primary"
          onClick={() => ready && open()}
        >
          + Add Account
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.isArray(accounts) ? accounts.map(account => (
            <div 
              key={account.id}
              className="p-3 border border-gray-200 rounded-lg flex items-center justify-between hover:bg-gray-50 cursor-pointer"
              onClick={() => window.location.href = `/accounts/${account.id}`}
            >
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-md flex items-center justify-center ${getColorForAccountType(account.type)}`}>
                  <span className="material-icons">{getIconForAccountType(account.type)}</span>
                </div>
                <div className="ml-3">
                  <p className="font-medium">{account.name}</p>
                  <p className="text-xs text-muted-foreground">{account.type.charAt(0).toUpperCase() + account.type.slice(1)} {account.accountNumber}</p>
                </div>
              </div>
              <p className={`font-semibold tabular-nums ${account.balance < 0 ? 'text-red-500' : ''}`}>
                {account.balance < 0 ? '-' : ''}${Math.abs(account.balance).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </p>
            </div>
          )) : (
            <p>No accounts connected.</p>
          )}
          
          <div 
            className="p-3 border border-gray-200 rounded-lg flex items-center justify-between hover:bg-gray-50 cursor-pointer border-dashed"
            onClick={() => ready && open()}
          >
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">
                <Plus className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="font-medium text-primary">Connect New Account</p>
                <p className="text-xs text-muted-foreground">Via Plaid API</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConnectedAccounts;
