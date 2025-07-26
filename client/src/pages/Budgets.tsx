import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type BudgetCategory, type Transaction } from "@shared/schema";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import NewBudgetWizardModal from "@/components/modals/NewBudgetWizardModal";
import { apiFetch } from '../utils/apiFetch';
import ErrorBoundary from "@/components/ErrorBoundary";

const budgetFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  limit: z.coerce.number().positive("Limit must be greater than 0"),
  color: z.string().min(1, "Color is required"),
  icon: z.string().min(1, "Icon is required"),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

function Budgets() {
  const [showAddBudgetDialog, setShowAddBudgetDialog] = useState(false);
  const [showEditBudgetDialog, setShowEditBudgetDialog] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<BudgetCategory | null>(null);
  
  // Fetch budget categories
  const { data: budgetCategories, isLoading: isLoadingBudgets } = useQuery<BudgetCategory[]>({
    queryKey: ['/budget-categories'],
    queryFn: async () => {
      const res = await apiFetch('/budget-categories');
      return res.json();
    }
  });
  
  // Fetch transactions
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ['/transactions'],
    queryFn: async () => {
      const res = await apiFetch('/transactions');
      return res.json();
    }
  });
  
  // Calculate spending by category
  const spendingByCategory = budgetCategories?.map(category => {
    const spent = transactions
      ?.filter(t => !t.isIncome && t.category === category.name)
      .reduce((sum, t) => sum + t.amount, 0) || 0;
      
    const percentage = (spent / category.limit) * 100;
    
    return {
      ...category,
      spent,
      remaining: Math.max(category.limit - spent, 0),
      percentage: Math.min(Math.round(percentage), 100)
    };
  }) || [];
  
  // Prepare data for pie chart
  const pieChartData = spendingByCategory.map(category => ({
    name: category.name,
    value: category.spent
  }));
  
  // A selection of colors for the pie chart
  const COLORS = ['#3B82F6', '#10B981', '#EF4444', '#9333EA', '#F59E0B', '#EC4899'];
  
  // Add budget form
  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      name: "",
      limit: 0,
      color: "blue-500",
      icon: "category"
    }
  });
  
  // Edit budget form
  const editForm = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      name: "",
      limit: 0,
      color: "",
      icon: ""
    }
  });
  
  // Set edit form values when a budget is selected
  const handleEditBudget = (budget: BudgetCategory) => {
    setSelectedBudget(budget);
    editForm.reset({
      name: budget.name,
      limit: budget.limit,
      color: budget.color,
      icon: budget.icon
    });
    setShowEditBudgetDialog(true);
  };
  
  // Handle form submission
  const onSubmit = (values: BudgetFormValues) => {
    console.log("Form values:", values);
    setShowAddBudgetDialog(false);
    form.reset();
  };
  
  // Handle edit form submission
  const onEditSubmit = (values: BudgetFormValues) => {
    console.log("Edit form values:", values);
    setShowEditBudgetDialog(false);
    editForm.reset();
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return '$' + amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Budgets</h1>
        <Button onClick={() => setShowAddBudgetDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Budget
        </Button>
      </div>
      
      <NewBudgetWizardModal open={showAddBudgetDialog} onOpenChange={setShowAddBudgetDialog} />
      
      {/* Budget Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBudgets || isLoadingTransactions ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="space-y-4">
                  {spendingByCategory.map(category => (
                    <div key={category.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <div className="flex items-center">
                          <span className={`w-3 h-3 rounded-full bg-${category.color} mr-2`}></span>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="font-mono">
                          <span className="font-medium">{formatCurrency(category.spent)}</span> / <span className="text-muted-foreground">{formatCurrency(category.limit)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-full">
                          <Progress value={category.percentage} className={`h-2 ${category.percentage >= 100 ? 'bg-red-100' : ''}`} />
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditBudget(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Budget Category</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the "{category.name}" budget category? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Spending Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingBudgets || isLoadingTransactions ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => formatCurrency(value as number)} 
                      />
                      <Legend formatter={(value) => <span className="text-sm">{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Edit Budget Dialog */}
      <Dialog open={showEditBudgetDialog} onOpenChange={setShowEditBudgetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Budget Category</DialogTitle>
            <DialogDescription>
              Modify your budget category settings.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Budget Limit</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                        <Input type="number" min={0} className="pl-8" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Wrap the Budgets component with ErrorBoundary
export default function BudgetsWithBoundary() {
  return (
    <ErrorBoundary>
      <Budgets />
    </ErrorBoundary>
  );
}
