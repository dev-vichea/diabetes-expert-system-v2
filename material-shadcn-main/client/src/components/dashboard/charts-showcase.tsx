import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer 
} from "recharts";

// Sample data for different chart types
const areaChartData = [
  { month: "Jan", sales: 24000, expenses: 12400 },
  { month: "Feb", sales: 18500, expenses: 8750 },
  { month: "Mar", sales: 32000, expenses: 15800 },
  { month: "Apr", sales: 27800, expenses: 13200 },
  { month: "May", sales: 21900, expenses: 9600 },
  { month: "Jun", sales: 29500, expenses: 16300 },
];

const lineChartData = [
  { day: "Mon", users: 24, sessions: 45 },
  { day: "Tue", users: 13, sessions: 32 },
  { day: "Wed", users: 98, sessions: 67 },
  { day: "Thu", users: 39, sessions: 54 },
  { day: "Fri", users: 48, sessions: 78 },
  { day: "Sat", users: 38, sessions: 56 },
  { day: "Sun", users: 43, sessions: 65 },
];

const pieChartData = [
  { name: "Desktop", value: 65, fill: "#22c55e" },
  { name: "Mobile", value: 28, fill: "#0c0a09" },
  { name: "Tablet", value: 7, fill: "#22c55e" },
];

const barChartData = [
  { category: "Q1", revenue: 120000, profit: 48000 },
  { category: "Q2", revenue: 190000, profit: 76000 },
  { category: "Q3", revenue: 155000, profit: 62000 },
  { category: "Q4", revenue: 225000, profit: 90000 },
];

const areaChartConfig = {
  sales: {
    label: "Sales",
    color: "#22c55e",
  },
  expenses: {
    label: "Expenses", 
    color: "#0c0a09",
  },
};

const lineChartConfig = {
  users: {
    label: "Users",
    color: "#22c55e",
  },
  sessions: {
    label: "Sessions",
    color: "#0c0a09",
  },
};

const barChartConfig = {
  revenue: {
    label: "Revenue",
    color: "#22c55e",
  },
  profit: {
    label: "Profit",
    color: "#0c0a09",
  },
};

const pieChartConfig = {
  desktop: {
    label: "Desktop",
    color: "#22c55e",
  },
  mobile: {
    label: "Mobile", 
    color: "#0c0a09",
  },
  tablet: {
    label: "Tablet",
    color: "#22c55e",
  },
};

export function ChartsShowcase() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Area Chart */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Sales vs Expenses</CardTitle>
          <p className="text-sm text-gray-500">Monthly comparison</p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={areaChartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0c0a09" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0c0a09" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  className="text-xs"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stackId="1"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#colorSales)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stackId="1"
                  stroke="#0c0a09"
                  strokeWidth={2}
                  fill="url(#colorExpenses)"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Line Chart */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">User Activity</CardTitle>
          <p className="text-sm text-gray-500">Weekly trends</p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={lineChartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="day" 
                  className="text-xs"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  className="text-xs"
                  axisLine={false}
                  tickLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#22c55e", strokeWidth: 2, fill: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="sessions"
                  stroke="#0c0a09"
                  strokeWidth={3}
                  dot={{ fill: "#0c0a09", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "#0c0a09", strokeWidth: 2, fill: "#fff" }}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Traffic Sources</CardTitle>
          <p className="text-sm text-gray-500">Device breakdown</p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={pieChartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Quarterly Performance</CardTitle>
          <p className="text-sm text-gray-500">Revenue and profit analysis</p>
        </CardHeader>
        <CardContent>
          <ChartContainer config={barChartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="category" 
                  className="text-xs"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  className="text-xs"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="revenue"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                  name="Revenue"
                />
                <Bar
                  dataKey="profit"
                  fill="#0c0a09"
                  radius={[4, 4, 0, 0]}
                  name="Profit"
                />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}