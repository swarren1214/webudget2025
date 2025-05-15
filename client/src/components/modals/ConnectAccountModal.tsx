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
import { createPlaidLinkToken, exchangePlaidPublicToken } from "@/lib/api";

interface ConnectAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const ConnectAccountModal = ({ isOpen, onClose }: ConnectAccountModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Create a link token when the modal opens
  useEffect(() => {
    if (isOpen && !linkToken) {
      createLinkTokenMutation.mutate();
    }
  }, [isOpen]);
  
  // Function to handle Plaid success
  const handlePlaidSuccess = useCallback(async (publicToken: string) => {
    try {
      const exchangeData = await exchangePlaidPublicToken(publicToken);
      toast({
        title: "Account Connected",
        description: "Your bank account has been successfully connected.",
      });
      onClose();
      queryClient.invalidateQueries({ queryKey: ['/api/accounts'] });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "There was an error connecting your account. Please try again.",
        variant: "destructive",
      });
    }
  }, [onClose, queryClient, toast]);
  
  // Function to open Plaid Link
  const openPlaidLink = useCallback(() => {
    if (!linkToken) return;
    
    // Create Plaid Link instance
    const handler = (window as any).Plaid.create({
      token: linkToken,
      onSuccess: (public_token: string) => {
        handlePlaidSuccess(public_token);
      },
      onExit: (err: any) => {
        if (err) {
          toast({
            title: "Connection Exited",
            description: err.error_message || "The connection process was canceled.",
            variant: "destructive",
          });
        }
      },
      onLoad: () => {
        // Handle the link loaded
      },
      receivedRedirectUri: window.location.href,
    });
    
    // Open Plaid Link
    handler.open();
  }, [linkToken, handlePlaidSuccess, toast]);
  
  // Mutation to create a link token
  const createLinkTokenMutation = useMutation({
    mutationFn: async () => {
      const response = await createPlaidLinkToken();
      return response;
    },
    onSuccess: (data) => {
      setLinkToken(data.link_token);
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Could not initialize bank connection. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const filteredBanks = popularBanks.filter(bank => 
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleConnectBank = () => {
    if (!selectedBank) return;
    
    // If we have a link token, open Plaid Link
    if (linkToken) {
      openPlaidLink();
    } else {
      toast({
        title: "Connection Error",
        description: "Could not initialize the connection. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Your Bank</DialogTitle>
          <DialogDescription>
            Select your bank to securely connect your accounts via Plaid API.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="max-h-60 overflow-y-auto space-y-3">
            {createLinkTokenMutation.isPending ? (
              <>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </>
            ) : (
              filteredBanks.map(bank => (
                <div 
                  key={bank.id}
                  className={`p-3 border border-gray-200 rounded-lg flex items-center hover:bg-gray-50 cursor-pointer ${
                    selectedBank?.id === bank.id ? 'border-primary border-2' : ''
                  }`}
                  onClick={() => setSelectedBank(bank)}
                >
                  <div className={`w-10 h-10 rounded-md flex items-center justify-center mr-3 ${bank.color}`}>
                    <span className="material-icons">{bank.logo}</span>
                  </div>
                  <p className="font-medium">{bank.name}</p>
                </div>
              ))
            )}
          </div>
          
          <div className="relative">
            <Input
              placeholder="Search for your bank..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConnectBank}
            disabled={!selectedBank || createLinkTokenMutation.isPending}
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectAccountModal;
