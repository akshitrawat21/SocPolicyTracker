import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  description?: string;
  color?: "blue" | "green" | "orange" | "red" | "purple";
}

const colorVariants = {
  blue: "bg-blue-100 text-blue-600",
  green: "bg-green-100 text-green-600",
  orange: "bg-orange-100 text-orange-600",
  red: "bg-red-100 text-red-600",
  purple: "bg-purple-100 text-purple-600",
};

export default function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  description,
  color = "blue",
}: MetricCardProps) {
  return (
    <Card className="metric-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
          </div>
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            colorVariants[color]
          )}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        
        {(trend || description) && (
          <div className="mt-4 flex items-center text-sm">
            {trend && (
              <div className={cn(
                "flex items-center",
                trendUp ? "text-green-600" : "text-red-600"
              )}>
                {trendUp ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                <span className="font-medium">{trend}</span>
              </div>
            )}
            {description && (
              <span className={cn(
                "text-muted-foreground",
                trend ? "ml-2" : ""
              )}>
                {description}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
