import { useState, useEffect, useCallback } from "react";
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
import { Search, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { createPlaidLinkToken, exchangePlaidPublicToken } from "@/lib/backendApi";

interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: number;
}

interface Bank {
  id: string;
  name: string;
  logo: string;
  color: string;
}

const popularBanks: Bank[] = [
  { id: "chase", name: "Chase", logo: "account_balance", color: "bg-blue-100 text-blue-600" },
  { id: "bofa", name: "Bank of America", logo: "account_balance", color: "bg-red-100 text-red-600" },
  { id: "wells", name: "Wells Fargo", logo: "account_balance", color: "bg-green-100 text-green-600" },
  { id: "capital", name: "Capital One", logo: "account_balance", color: "bg-purple-100 text-purple-600" }
];

const ConnectAccountModal = ({ isOpen, onClose, accountId }: ConnectAccountModalProps) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create a link token and open Plaid Link when the modal opens
  useEffect(() => {
    if (isOpen) {
      setLinkToken(null);
      createLinkTokenMutation.mutate();
    }
  }, [isOpen]);
  
  // Function to handle Plaid success
  const handlePlaidSuccess = useCallback(async (publicToken: string) => {
    try {
      await exchangePlaidPublicToken(publicToken, accountId);
      toast({
        title: "Account Connected",
        description: "Your bank account has been successfully connected.",
      });
      onClose();
      queryClient.invalidateQueries({ queryKey: ['/accounts'] });
      queryClient.invalidateQueries({ queryKey: ['/transactions'] });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "There was an error connecting your account. Please try again.",
        variant: "destructive",
      });
    }
  }, [onClose, queryClient, toast, accountId]);
  
  // Function to open Plaid Link
  const openPlaidLink = useCallback(() => {
    if (!linkToken) return;
    const handler = (window as any).Plaid.create({
      token: linkToken,
      onSuccess: (public_token: string, metadata: any) => {
        handlePlaidSuccess(public_token);
      },
      onExit: (err: any, metadata: any) => {
        if (err) {
          console.error("Plaid exit error:", err);
          toast({
            title: "Connection Exited",
            description: err.error_message || "The connection process was canceled.",
            variant: "destructive",
          });
        } else {
          onClose();
        }
      },
      onEvent: (eventName: string, metadata: any) => {
        console.log("Plaid event:", eventName, metadata);
      },
      onLoad: () => {
        console.log("Plaid Link loaded successfully");
      },
    });
    handler.open();
  }, [linkToken, handlePlaidSuccess, toast, onClose]);
  
  // Mutation to create a link token
  const createLinkTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await createPlaidLinkToken();
      return response;
    },
    onSuccess: (data) => {
      setLinkToken(data.linkToken);
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Could not initialize bank connection. Please try again.",
        variant: "destructive",
      });
      onClose();
    }
  });

  // Open Plaid Link as soon as linkToken is ready
  useEffect(() => {
    if (isOpen && linkToken) {
      openPlaidLink();
    }
  }, [isOpen, linkToken, openPlaidLink]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Your Bank</DialogTitle>
          <DialogDescription>
            Securely connect your accounts via Plaid API.
          </DialogDescription>
        </DialogHeader>
        <div className="py-8 flex flex-col items-center justify-center">
          {createLinkTokenMutation.isPending || !linkToken ? (
            <>
              <Skeleton className="h-10 w-2/3 mb-2" />
              <Skeleton className="h-10 w-2/3 mb-2" />
              <Skeleton className="h-10 w-2/3" />
              <p className="mt-4 text-muted-foreground">Preparing secure connection…</p>
            </>
          ) : null}
        </div>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectAccountModal;
