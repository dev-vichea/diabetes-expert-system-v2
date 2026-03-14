import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  Check, 
  X, 
  CreditCard, 
  Calendar, 
  Users, 
  Zap,
  Shield,
  Globe,
  Download,
  MoreVertical
} from "lucide-react";
import { cn } from "@/lib/utils";

const subscriptionPlans = [
  {
    id: "basic",
    name: "Basic",
    price: "$9",
    period: "/month",
    description: "Perfect for individuals getting started",
    features: [
      { name: "Up to 5 projects", included: true },
      { name: "10GB storage", included: true },
      { name: "Basic support", included: true },
      { name: "Advanced analytics", included: false },
      { name: "Team collaboration", included: false },
      { name: "Priority support", included: false },
    ],
    popular: false,
    buttonText: "Get Started",
    buttonVariant: "secondary" as const
  },
  {
    id: "pro",
    name: "Professional",
    price: "$29",
    period: "/month",
    description: "Best for growing teams and businesses",
    features: [
      { name: "Unlimited projects", included: true },
      { name: "100GB storage", included: true },
      { name: "Priority support", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Team collaboration", included: true },
      { name: "API access", included: false },
    ],
    popular: true,
    buttonText: "Upgrade Now",
    buttonVariant: "default" as const
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$99",
    period: "/month",
    description: "For large organizations with advanced needs",
    features: [
      { name: "Unlimited projects", included: true },
      { name: "Unlimited storage", included: true },
      { name: "24/7 premium support", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Team collaboration", included: true },
      { name: "Full API access", included: true },
    ],
    popular: false,
    buttonText: "Contact Sales",
    buttonVariant: "secondary" as const
  }
];

const currentSubscription = {
  plan: "Professional",
  status: "Active",
  nextBilling: "Jan 15, 2025",
  amount: "$29.00",
  usage: {
    projects: { current: 8, limit: "unlimited" },
    storage: { current: 45, limit: 100 },
    teamMembers: { current: 12, limit: 25 }
  }
};

const billingHistory = [
  {
    id: "inv_001",
    date: "Dec 15, 2024",
    amount: "$29.00",
    status: "Paid",
    description: "Professional Plan - Monthly"
  },
  {
    id: "inv_002",
    date: "Nov 15, 2024",
    amount: "$29.00",
    status: "Paid",
    description: "Professional Plan - Monthly"
  },
  {
    id: "inv_003",
    date: "Oct 15, 2024",
    amount: "$29.00",
    status: "Paid",
    description: "Professional Plan - Monthly"
  }
];

export default function Subscriptions() {
  const [autoRenew, setAutoRenew] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState("pro");

  return (
    <div className="h-full overflow-y-auto p-6 custom-scrollbar">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Current Subscription Status */}
        <Card className="bg-white dark:bg-stone-800 border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-stone-900 dark:text-white">
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Plan Information */}
              <div className="space-y-4">
                <div className="bg-stone-50 dark:bg-stone-700/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-stone-900 dark:text-white mb-3">Plan Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-stone-700 dark:text-stone-300">Plan</span>
                      <Badge variant="default">
                        {currentSubscription.plan}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-stone-700 dark:text-stone-300">Status</span>
                      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                        {currentSubscription.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-stone-700 dark:text-stone-300">Next Billing</span>
                      <span className="text-sm text-stone-900 dark:text-white">{currentSubscription.nextBilling}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-stone-700 dark:text-stone-300">Amount</span>
                      <span className="text-sm font-semibold text-stone-900 dark:text-white">{currentSubscription.amount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Usage Information */}
              <div className="space-y-4">
                <div className="bg-stone-50 dark:bg-stone-700/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-stone-900 dark:text-white mb-3">Usage</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-normal text-stone-700 dark:text-stone-300">Projects</span>
                        <span className="text-sm text-stone-900 dark:text-white">
                          {currentSubscription.usage.projects.current} / {currentSubscription.usage.projects.limit}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-normal text-stone-700 dark:text-stone-300">Storage</span>
                        <span className="text-sm text-stone-900 dark:text-white">
                          {currentSubscription.usage.storage.current}GB / {currentSubscription.usage.storage.limit}GB
                        </span>
                      </div>
                      <Progress 
                        value={(currentSubscription.usage.storage.current / currentSubscription.usage.storage.limit) * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-4 sm:col-span-2 lg:col-span-1">
                <div className="bg-stone-50 dark:bg-stone-700/30 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-stone-900 dark:text-white mb-3">Settings & Actions</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-normal text-stone-700 dark:text-stone-300">Auto-renewal</span>
                      <Switch 
                        checked={autoRenew}
                        onCheckedChange={setAutoRenew}
                      />
                    </div>
                    <div className="space-y-2">
                      <Button variant="secondary" className="w-full whitespace-nowrap text-xs sm:text-sm">
                        <CreditCard className="mr-2 w-4 h-4" />
                        Update Payment Method
                      </Button>
                      <Button variant="secondary" className="w-full whitespace-nowrap text-xs sm:text-sm">
                        <Download className="mr-2 w-4 h-4" />
                        Download Invoice
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan) => (
            <Card 
              key={plan.id} 
              className={cn(
                "relative bg-white dark:bg-stone-800 border border-stone-200 transition-all duration-200",
                plan.popular && "ring-2 ring-primary ring-opacity-50 scale-105",
                selectedPlan === plan.id && "ring-2 ring-primary"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-bold text-stone-900 dark:text-white">
                  {plan.name}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-stone-900 dark:text-white">{plan.price}</span>
                  <span className="text-stone-500 dark:text-stone-400">{plan.period}</span>
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-400 mt-2">
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-stone-400 mr-3 flex-shrink-0" />
                      )}
                      <span className={cn(
                        "text-sm",
                        feature.included 
                          ? "text-stone-900 dark:text-white" 
                          : "text-stone-500 dark:text-stone-400"
                      )}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.buttonVariant}
                  className="w-full mt-6 whitespace-nowrap"
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Billing History */}
        <Card className="bg-white dark:bg-stone-800 border border-stone-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-stone-900 dark:text-white">
              Billing History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 dark:bg-stone-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-normal text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-stone-800 divide-y divide-stone-200 dark:divide-stone-700">
                  {billingHistory.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-stone-50 dark:hover:bg-stone-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 dark:text-white">
                        {invoice.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-stone-900 dark:text-white">
                        {invoice.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-normal text-stone-900 dark:text-white">
                        {invoice.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant="default" 
                          className="bg-green-100 text-green-800 hover:bg-green-100"
                        >
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-normal">
                        <Button variant="secondary" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}