import { BarChart, Bar, ResponsiveContainer, XAxis, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";

interface MiniChartProps {
  data: number[];
  labels: string[];
  activeColor?: string;
}

export function MiniChart({ data, labels, activeColor = "#3b82f6" }: MiniChartProps) {
  const maxValue = Math.max(...data);
  
  // Transform data for Recharts
  const chartData = data.map((value, index) => ({
    label: labels[index],
    value: value,
    isActive: value === maxValue
  }));

  const chartConfig = {
    value: {
      label: "Value",
      color: activeColor,
    },
  };

  return (
    <div className="mt-4">
      <div className="h-24 mb-2">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis 
                dataKey="label" 
                axisLine={false}
                tickLine={false}
                tick={false}
              />
              <ChartTooltip
                content={<ChartTooltipContent hideLabel />}
                cursor={{ fill: "transparent" }}
              />
              <Bar 
                dataKey="value" 
                radius={[2, 2, 0, 0]}
                strokeWidth={0}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isActive ? activeColor : "hsl(var(--muted))"} 
                    className="transition-all duration-200"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
      
      <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
        {labels.map((label, index) => (
          <span key={index} className="text-center flex-1">{label}</span>
        ))}
      </div>
    </div>
  );
}
