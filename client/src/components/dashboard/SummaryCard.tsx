import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  amount: number;
  change: number;
  changePercent: number;
  changeText: string;
  icon: string;
  iconColor: string;
}

const SummaryCard = ({ 
  title, 
  amount, 
  change, 
  changePercent, 
  changeText, 
  icon, 
  iconColor 
}: SummaryCardProps) => {
  const isPositive = change >= 0;
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-500 font-medium">{title}</h3>
          <span className={`material-icons ${iconColor}`}>{icon}</span>
        </div>
        <p className="text-3xl font-semibold tabular-nums">
          ${Math.abs(amount).toFixed(2)}
        </p>
        <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'} flex items-center mt-1`}>
          {isPositive ? (
            <ArrowUpIcon className="mr-1 h-4 w-4" />
          ) : (
            <ArrowDownIcon className="mr-1 h-4 w-4" />
          )}
          {isPositive ? '+' : '-'}${Math.abs(change).toFixed(2)} ({Math.abs(changePercent)}%) {changeText}
        </p>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
