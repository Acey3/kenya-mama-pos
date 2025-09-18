import { useState } from "react";
import { Calendar, Download, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const salesData = {
  daily: {
    sales: 12450,
    transactions: 89,
    profit: 3420,
    topProducts: [
      { name: "Coca Cola 500ml", quantity: 25, revenue: 2000 },
      { name: "White Bread", quantity: 20, revenue: 1200 },
      { name: "Milk 1L", quantity: 15, revenue: 1650 },
    ]
  },
  weekly: {
    sales: 87150,
    transactions: 623,
    profit: 23940,
    topProducts: [
      { name: "Coca Cola 500ml", quantity: 175, revenue: 14000 },
      { name: "Sugar 2kg", quantity: 45, revenue: 12600 },
      { name: "Cooking Oil 1L", quantity: 32, revenue: 11200 },
    ]
  },
  monthly: {
    sales: 345600,
    transactions: 2487,
    profit: 95280,
    topProducts: [
      { name: "Coca Cola 500ml", quantity: 700, revenue: 56000 },
      { name: "Sugar 2kg", quantity: 180, revenue: 50400 },
      { name: "Cooking Oil 1L", quantity: 128, revenue: 44800 },
    ]
  }
};

const recentTransactions = [
  { id: "TXN001", items: "Coca Cola + Bread", amount: 180, method: "Cash", time: "10:30 AM" },
  { id: "TXN002", items: "Milk 1L x2", amount: 220, method: "M-Pesa", time: "10:22 AM" },
  { id: "TXN003", items: "Sugar 2kg", amount: 280, method: "Cash", time: "10:15 AM" },
  { id: "TXN004", items: "Tea Leaves", amount: 150, method: "M-Pesa", time: "10:08 AM" },
  { id: "TXN005", items: "Cooking Oil + Sugar", amount: 630, method: "Cash", time: "09:55 AM" },
];

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  const currentData = salesData[selectedPeriod];
  const periodLabel = selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Track your business performance and insights</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod as any}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPeriod} className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{periodLabel} Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  KSh {currentData.sales.toLocaleString()}
                </div>
                <p className="text-xs text-success">+12% from last {selectedPeriod.slice(0, -2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentData.transactions}</div>
                <p className="text-xs text-success">+8% from last {selectedPeriod.slice(0, -2)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  KSh {currentData.profit.toLocaleString()}
                </div>
                <p className="text-xs text-success">+15% from last {selectedPeriod.slice(0, -2)}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products ({periodLabel})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentData.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary">{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.quantity} units sold
                          </p>
                        </div>
                      </div>
                      <p className="font-bold text-primary">
                        KSh {product.revenue.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{transaction.items}</p>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{transaction.time}</span>
                          <Badge 
                            variant={transaction.method === "M-Pesa" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {transaction.method}
                          </Badge>
                        </div>
                      </div>
                      <p className="font-bold text-primary">
                        KSh {transaction.amount}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Business Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold text-success">💰 Revenue Highlights</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Beverages account for 40% of total sales</li>
                    <li>• M-Pesa payments increased by 25%</li>
                    <li>• Average transaction value: KSh {Math.round(currentData.sales / currentData.transactions)}</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-warning">⚠️ Areas for Improvement</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 5 products are running low on stock</li>
                    <li>• Peak sales time: 10 AM - 2 PM</li>
                    <li>• Consider stocking more dairy products</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}