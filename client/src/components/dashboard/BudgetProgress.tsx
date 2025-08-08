import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { type BudgetCategory, type Transaction } from "@shared/schema";
import { Link } from "wouter";

interface BudgetProgressProps {
  categories: BudgetCategory[];
  transactions: Transaction[];
}

const BudgetProgress = ({ categories, transactions }: BudgetProgressProps) => {
  // Calculate spending for each category
  const categoriesWithSpending = Array.isArray(categories) ? categories.map(category => {
    const spent = transactions
      .filter(t => !t.isIncome && t.category === category.name)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const percentage = Math.min(Math.round((spent / category.limit) * 100), 100);
    
    return {
      ...category,
      spent,
      percentage
    };
  }) : [];
  
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold">Budget Progress</CardTitle>
        <Link href="/budgets">
          <Button variant="ghost" size="sm" className="text-primary dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {categoriesWithSpending.map(category => (
            <div key={category.id}>
              <div className="flex justify-between text-sm mb-1">
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full bg-${category.color} mr-2`}></span>
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="font-mono">
                  <span className={`font-medium`}>${category.spent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span> / <span className="text-muted-foreground">${category.limit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              </div>
              <Progress 
                value={category.percentage} 
                className={category.percentage > 99 ? 'bg-red-100' : ''} 
                indicatorClassName={category.percentage > 99 ? 'bg-red-500' : ''}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetProgress;
