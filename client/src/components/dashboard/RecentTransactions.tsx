import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { type Transaction } from "@shared/schema";
import { Link } from "wouter";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const RecentTransactions = ({ transactions }: RecentTransactionsProps) => {
  // Group transactions by date
  const groupedTransactions = Array.isArray(transactions) ? transactions.reduce<Record<string, Transaction[]>>((groups, transaction) => {
    const date = new Date(transaction.date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    let dateLabel;
    if (date.toDateString() === today.toDateString()) {
      dateLabel = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateLabel = 'Yesterday';
    } else {
      dateLabel = date.toLocaleDateString('en-US', { 
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
    
    if (!groups[dateLabel]) {
      groups[dateLabel] = [];
    }
    groups[dateLabel].push(transaction);
    return groups;
  }, {}) : {};
  
  // Function to get transaction icon based on category
  const getTransactionIcon = (category?: string | null) => {
    if (!category) return 'help_outline';
    
    switch (category.toLowerCase()) {
      case 'food':
        return 'restaurant';
      case 'transport':
        return 'directions_car';
      default:
        return 'help_outline';
    }
  };
  
  // Function to get transaction icon color based on category
  const getTransactionIconColor = (category?: string | null) => {
    if (!category) return 'bg-gray-200';
    
    switch (category.toLowerCase()) {
      case 'food':
        return 'bg-red-200';
      case 'transport':
        return 'bg-blue-200';
      default:
        return 'bg-gray-200';
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
        <Link href="/transactions">
          <Button variant="link" size="sm" className="text-primary">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
            <div key={date} className="border-b border-gray-100 pb-2 last:border-0">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
              
              <div className="space-y-1">
                {dateTransactions.map(transaction => (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between py-2 hover:bg-muted/50 rounded-lg px-2"
                  >
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${getTransactionIconColor(transaction.category)}`}>
                        <span className="material-icons">{getTransactionIcon(transaction.category)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">{transaction.category || 'Uncategorized'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold tabular-nums ${transaction.isIncome ? 'text-green-500' : 'text-red-500'}`}>
                        {transaction.isIncome ? '+' : '-'}${transaction.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.date).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
