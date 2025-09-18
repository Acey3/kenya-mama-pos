import { 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  DollarSign,
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const stats = [
  {
    title: "Today's Sales",
    value: "KSh 12,450",
    change: "+8.2%",
    icon: DollarSign,
    positive: true
  },
  {
    title: "Items Sold",
    value: "89",
    change: "+12%",
    icon: ShoppingCart,
    positive: true
  },
  {
    title: "Low Stock Items",
    value: "5",
    change: "2 critical",
    icon: AlertTriangle,
    positive: false
  },
  {
    title: "Total Products",
    value: "234",
    change: "+3 new",
    icon: Package,
    positive: true
  }
];

const lowStockItems = [
  { name: "Coca Cola 500ml", stock: 2, critical: true },
  { name: "White Bread", stock: 5, critical: false },
  { name: "Milk 1L", stock: 3, critical: true },
  { name: "Sugar 2kg", stock: 8, critical: false },
];

const recentSales = [
  { item: "Coca Cola + Bread", amount: "KSh 180", time: "2 min ago" },
  { item: "Milk 1L x2", amount: "KSh 220", time: "8 min ago" },
  { item: "Sugar 2kg", amount: "KSh 280", time: "15 min ago" },
  { item: "Tea Leaves", amount: "KSh 150", time: "23 min ago" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your shop overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs ${stat.positive ? 'text-success' : 'text-warning'}`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" size="lg">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Start New Sale
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              <Package className="mr-2 h-5 w-5" />
              Add New Product
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg">
              <TrendingUp className="mr-2 h-5 w-5" />
              View Reports
            </Button>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5 text-warning" />
              Low Stock Alert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className={`text-sm ${item.critical ? 'text-destructive' : 'text-warning'}`}>
                      {item.stock} remaining {item.critical && '(Critical!)'}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Restock
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSales.map((sale, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{sale.item}</p>
                  <p className="text-sm text-muted-foreground">{sale.time}</p>
                </div>
                <p className="font-bold text-primary">{sale.amount}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}