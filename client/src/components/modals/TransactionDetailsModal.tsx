import React, { useState } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "lucide-react";
import { updateTransaction } from "@/lib/supabaseApi";
import { FaRegFolderOpen, FaShoppingCart, FaUtensils, FaCar, FaHome, FaPiggyBank, FaBolt, FaRegSmile, FaRegMoneyBillAlt, FaRegHeart, FaRegStar, FaRegSun, FaRegMoon, FaRegLightbulb, FaRegGem, FaRegBell, FaRegCalendarAlt, FaRegClock, FaRegCreditCard, FaRegListAlt, FaRegChartBar, FaRegEnvelope, FaRegFileAlt, FaRegUser, FaRegThumbsUp, FaRegThumbsDown, FaRegCheckCircle, FaRegTimesCircle } from "react-icons/fa";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ICONS: Record<string, any> = {
  Groceries: FaShoppingCart,
  Dining: FaUtensils,
  "Dining Out": FaUtensils,
  Transport: FaCar,
  Transportation: FaCar,
  Home: FaHome,
  Savings: FaPiggyBank,
  Utilities: FaBolt,
  Fun: FaRegSmile,
  Income: FaRegMoneyBillAlt,
  Health: FaRegHeart,
  Favorites: FaRegStar,
  Day: FaRegSun,
  Night: FaRegMoon,
  Ideas: FaRegLightbulb,
  Luxury: FaRegGem,
  Alerts: FaRegBell,
  Calendar: FaRegCalendarAlt,
  Time: FaRegClock,
  Credit: FaRegCreditCard,
  List: FaRegListAlt,
  Charts: FaRegChartBar,
  Mail: FaRegEnvelope,
  Files: FaRegFileAlt,
  Folders: FaRegFolderOpen,
  User: FaRegUser,
  "Thumbs Up": FaRegThumbsUp,
  "Thumbs Down": FaRegThumbsDown,
  Check: FaRegCheckCircle,
  Times: FaRegTimesCircle,
};

interface Budget {
  name: string;
  color: string;
  icon: string;
}

interface TransactionDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: any | null;
  budgets: Budget[];
  onDelete?: (id: number) => void;
}

export default function TransactionDetailsDrawer({ open, onOpenChange, transaction, budgets, onDelete }: TransactionDetailsDrawerProps) {
  const [futureCategory, setFutureCategory] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedBudget, setSelectedBudget] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [initialState, setInitialState] = useState({ category: '', notes: '', futureCategory: false });

  React.useEffect(() => {
    if (open && transaction) {
      setFutureCategory(false);
      setNotes(transaction.notes || "");
      setSelectedBudget(transaction.category || budgets[0]?.name || "");
      setInitialState({
        category: transaction.category || budgets[0]?.name || '',
        notes: transaction.notes || '',
        futureCategory: false,
      });
    }
  }, [open, transaction, budgets]);

  const hasChanges =
    selectedBudget !== initialState.category ||
    notes !== initialState.notes ||
    futureCategory !== initialState.futureCategory;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const validTransactionData = {
        ...transaction,
        category: selectedBudget,
      };
      await updateTransaction(transaction.id, validTransactionData);
      setInitialState({ category: selectedBudget, notes, futureCategory });
      // Optionally close drawer or show success
    } finally {
      setIsSaving(false);
    }
  };

  if (!transaction) return null;

  return (
    <div
      className={`fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      aria-hidden={!open}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Transaction Details</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close drawer"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold">
                {transaction.description?.[0] || "?"}
              </div>
              <span className="text-xl font-semibold">{transaction.description}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col bg-gray-50 rounded-lg p-3">
                <span className="text-xs text-gray-500 mb-1">AMOUNT</span>
                <span className="text-lg font-semibold">${Number(transaction.amount).toLocaleString(undefined, {minimumFractionDigits:2})}</span>
              </div>
              <div className="flex flex-col bg-gray-50 rounded-lg p-3">
                <span className="text-xs text-gray-500 mb-1">DATE</span>
                <span className="text-lg font-semibold flex items-center gap-2"><Calendar className="w-4 h-4" />{new Date(transaction.date).toLocaleDateString()}</span>
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500 mb-1 block">BUDGET</span>
              <Select value={selectedBudget} onValueChange={async (val) => {
                setSelectedBudget(val);
                setIsUpdating(true);
                try {
                  await updateTransaction(transaction.id, { category: val });
                } finally {
                  setIsUpdating(false);
                }
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(() => {
                      const budget = budgets.find(b => b.name === selectedBudget);
                      if (!budget) return "Select budget";
                      const Icon = ICONS[budget.icon] || FaRegFolderOpen;
                      return (
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full font-medium text-sm" style={{ background: budget.color, color: '#fff' }}>
                          <Icon className="w-4 h-4" />
                          {budget.name}
                        </span>
                      );
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {budgets.map(budget => {
                    const Icon = ICONS[budget.icon] || FaRegFolderOpen;
                    return (
                      <SelectItem key={budget.name} value={budget.name}>
                        <span className="flex items-center gap-2 px-3 py-1 rounded-full font-medium text-sm" style={{ background: budget.color, color: '#fff' }}>
                          <Icon className="w-4 h-4" />
                          {budget.name}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-600">Use this category for all future transactions from this vendor?</span>
              <Switch checked={futureCategory} onCheckedChange={setFutureCategory} />
            </div>
            <div className="mt-2">
              <span className="text-xs text-gray-500 mb-1 block">LOCATION</span>
              <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                Map preview here
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs text-gray-500 mb-1 block">NOTES</span>
              <textarea
                className="w-full min-h-[60px] rounded-lg border border-gray-200 p-2 text-base bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-green-100"
                placeholder="Write notes here..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2">
          <Button type="button" variant="destructive" className="w-full sm:w-1/2" onClick={() => onDelete?.(transaction.id)}>
            Delete Transaction
          </Button>
          <Button type="button" className="w-full sm:w-1/2" onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </div>
  );
}