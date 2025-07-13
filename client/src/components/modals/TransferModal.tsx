import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Account, type InsertTransfer } from "@shared/schema";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
}

const transferSchema = z.object({
  fromAccountId: z.coerce.number().positive("Please select a source account"),
  toAccountId: z.coerce.number().positive("Please select a destination account"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  note: z.string().optional(),
  frequency: z.enum(["one-time", "weekly", "monthly"]).default("one-time"),
});

type TransferFormValues = z.infer<typeof transferSchema>;

const TransferModal = ({ isOpen, onClose, accounts }: TransferModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromAccountId: 0,
      toAccountId: 0,
      amount: 0,
      note: "",
      frequency: "one-time",
    },
  });
  
  const createTransferMutation = useMutation({
    mutationFn: async (data: TransferFormValues) => {
      const transferData: Partial<InsertTransfer> = {
        fromAccountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount: data.amount,
        date: new Date().toISOString(),
        note: data.note || undefined,
        status: "pending",
      };
      
      const res = await apiRequest('POST', '/api/transfers', transferData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Transfer Initiated",
        description: "Your transfer has been successfully initiated.",
      });
      onClose();
      queryClient.invalidateQueries({ queryKey: ['/api/transfers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
    },
    onError: () => {
      toast({
        title: "Transfer Failed",
        description: "There was an error processing your transfer. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: TransferFormValues) => {
    // Validate that accounts are different
    if (data.fromAccountId === data.toAccountId) {
      form.setError("toAccountId", { 
        message: "Source and destination accounts must be different" 
      });
      return;
    }
    
    // Validate sufficient funds
    const fromAccount = accounts.find(acc => acc.id === data.fromAccountId);
    if (fromAccount && fromAccount.balance < data.amount) {
      form.setError("amount", { 
        message: "Insufficient funds in the source account" 
      });
      return;
    }
    
    createTransferMutation.mutate(data);
  };
  
  const resetForm = () => {
    form.reset();
    onClose();
  };
  
  const setFrequency = (freq: string) => {
    form.setValue("frequency", freq as "one-time" | "weekly" | "monthly");
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={resetForm}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Money</DialogTitle>
          <DialogDescription>
            Transfer funds between your connected accounts.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fromAccountId"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>From Account</FormLabel>
                  <Select 
                    value={field.value.toString()} 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.name} ({account.accountNumber}) - ${account.balance.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="toAccountId"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>To Account</FormLabel>
                  <Select 
                    value={field.value.toString()} 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select destination account" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id.toString()}>
                          {account.name} ({account.accountNumber}) - ${account.balance.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input type="number" step="0.01" className="pl-8" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Frequency</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      type="button"
                      variant={field.value === "one-time" ? "secondary" : "outline"} 
                      onClick={() => setFrequency("one-time")}
                      className={field.value === "one-time" ? "border-primary" : ""}
                    >
                      One Time
                    </Button>
                    <Button 
                      type="button"
                      variant={field.value === "weekly" ? "secondary" : "outline"} 
                      onClick={() => setFrequency("weekly")}
                      className={field.value === "weekly" ? "border-primary" : ""}
                    >
                      Weekly
                    </Button>
                    <Button 
                      type="button"
                      variant={field.value === "monthly" ? "secondary" : "outline"} 
                      onClick={() => setFrequency("monthly")}
                      className={field.value === "monthly" ? "border-primary" : ""}
                    >
                      Monthly
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Note (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Add a note" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="flex space-x-2 justify-end">
              <Button variant="outline" type="button" onClick={resetForm}>
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createTransferMutation.isPending}
              >
                {createTransferMutation.isPending ? "Processing..." : "Transfer Now"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default TransferModal;
