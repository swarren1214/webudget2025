import { Card, CardContent } from "@/components/ui/card";

interface SummaryCardProps {
  title: string;
  amount: number;
  change: number;
  changePercent: number;
  changeText: string;
  icon: string;
  iconColor: string;
  className?: string; // Custom class for the Card
  titleClassName?: string; // Custom class for the title
  amountClassName?: string; // Custom class for the amount
  changeClassName?: string; // Custom class for the change text
  iconClassName?: string; // Custom class for the icon
}

const SummaryCard = ({
  title,
  amount,
  change,
  icon,
  iconColor,
  className, // Custom class for the Card
  titleClassName, // Custom class for the title
  amountClassName, // Custom class for the amount
  changeClassName, // Custom class for the change text
  iconClassName, // Custom class for the icon
}: SummaryCardProps) => {

  return (
    <Card className={className}> {/* Apply custom className */}
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-gray-500 font-medium ${titleClassName}`}>{title}</h3> {/* Apply titleClassName */}
          <span className={`material-icons ${iconColor} ${iconClassName}`}>{icon}</span> {/* Apply iconClassName */}
        </div>
        <p className={`text-3xl font-bold tabular-nums ${amountClassName}`}> {/* Apply amountClassName */}
          ${Math.abs(amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
