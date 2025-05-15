import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type Account } from "@shared/schema";
import { Plus } from "lucide-react";
import { Link } from "wouter";

interface ConnectedAccountsProps {
  accounts: Account[];
  onConnectAccount: () => void;
}

const ConnectedAccounts = ({ accounts, onConnectAccount }: ConnectedAccountsProps) => {
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
        <Button variant="link" size="sm" className="text-primary" onClick={onConnectAccount}>
          + Add Account
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {accounts.map(account => (
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
                {account.balance < 0 ? '-' : ''}${Math.abs(account.balance).toFixed(2)}
              </p>
            </div>
          ))}
          
          <div 
            className="p-3 border border-gray-200 rounded-lg flex items-center justify-between hover:bg-gray-50 cursor-pointer border-dashed"
            onClick={onConnectAccount}
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
