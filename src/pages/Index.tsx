import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Smartphone, 
  Wifi, 
  Globe,
  ArrowRight,
  Check,
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import heroShop from "@/assets/hero-shop.jpg";
import shopExterior from "@/assets/shop-exterior.jpg";

const salesData = [
  { name: "Mon", sales: 4500 },
  { name: "Tue", sales: 3800 },
  { name: "Wed", sales: 5200 },
  { name: "Thu", sales: 4100 },
  { name: "Fri", sales: 6800 },
  { name: "Sat", sales: 8200 },
  { name: "Sun", sales: 5600 },
];

const categoryData = [
  { name: "Food", value: 45 },
  { name: "Beverages", value: 25 },
  { name: "Household", value: 20 },
  { name: "Other", value: 10 },
];

const COLORS = ["hsl(158, 64%, 52%)", "hsl(25, 95%, 65%)", "hsl(43, 96%, 56%)", "hsl(158, 30%, 70%)"];

const features = [
  {
    icon: ShoppingCart,
    title: "Quick Sales",
    description: "Record sales in seconds with our simple, intuitive interface"
  },
  {
    icon: Package,
    title: "Stock Management",
    description: "Track inventory and get alerts when stock is running low"
  },
  {
    icon: BarChart3,
    title: "Sales Reports",
    description: "View daily, weekly, and monthly reports to track your profits"
  },
  {
    icon: Smartphone,
    title: "M-Pesa Ready",
    description: "Accept mobile money payments seamlessly"
  },
  {
    icon: Wifi,
    title: "Works Offline",
    description: "Keep selling even without internet - data syncs automatically"
  },
  {
    icon: Globe,
    title: "Multilingual",
    description: "Use in English or Swahili - your choice"
  }
];

const stats = [
  { label: "Active Shops", value: "25+", icon: Users },
  { label: "Daily Transactions", value: "150+", icon: ShoppingCart },
  { label: "Revenue Tracked", value: "KSh 50k+", icon: DollarSign },
  { label: "Low Stock Alerts", value: "50+", icon: AlertTriangle },
];

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <ShoppingCart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Mama Duka</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Login</Link>
            </Button>
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="main-content">
      {/* Hero Section with Image */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroShop} 
            alt="Kenyan shopkeeper in their duka" 
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />
        </div>
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              Simple POS for{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Kenyan Shopkeepers
              </span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Track your sales, manage stock, and grow your business with the easiest 
              point-of-sale system designed for small shops in Kenya.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" asChild className="text-lg px-8">
                <Link to="/auth">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8 bg-background/80">
                <Link to="/auth">Login to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-primary/5 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-2xl font-bold text-foreground md:text-3xl">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              See Your Business at a Glance
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Get instant insights with beautiful charts and summaries. Know exactly how your shop is performing.
            </p>
          </div>

          {/* Dashboard Preview Cards */}
          <div className="mx-auto max-w-6xl">
            {/* Cost Summary Row */}
            <div className="mb-6 grid gap-4 md:grid-cols-4">
              <Card className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Today's Sales</p>
                      <p className="text-2xl font-bold text-foreground">KSh 12,450</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-primary">+15% from yesterday</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Weekly Revenue</p>
                      <p className="text-2xl font-bold text-foreground">KSh 47,200</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                      <DollarSign className="h-5 w-5 text-accent" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-primary">+8% from last week</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Items Sold</p>
                      <p className="text-2xl font-bold text-foreground">42</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Today's transactions</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Low Stock Items</p>
                      <p className="text-2xl font-bold text-destructive">7</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-destructive">Needs restocking</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Sales Trend Chart */}
              <Card className="border-border bg-card md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-foreground">Weekly Sales Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesData}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(158, 64%, 52%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(158, 64%, 52%)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fill: 'hsl(158, 8%, 46%)', fontSize: 12 }}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false}
                          tick={{ fill: 'hsl(158, 8%, 46%)', fontSize: 12 }}
                          tickFormatter={(value) => `${value / 1000}k`}
                        />
                        <Area
                          type="monotone"
                          dataKey="sales"
                          stroke="hsl(158, 64%, 52%)"
                          strokeWidth={2}
                          fill="url(#colorSales)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-foreground">Sales by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {categoryData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {categoryData.map((item, index) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index] }}
                        />
                        <span className="text-xs text-muted-foreground">{item.name} ({item.value}%)</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Shop Image & Features Section */}
      <section className="border-t border-border bg-secondary/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 grid items-center gap-12 md:grid-cols-2">
            <div className="relative">
              <div className="overflow-hidden rounded-2xl shadow-2xl">
                <img 
                  src={shopExterior} 
                  alt="Kenyan duka shop exterior" 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 rounded-xl border border-border bg-card p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                    <Check className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">25+ Shops</p>
                    <p className="text-sm text-muted-foreground">Trust Mama Duka</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="mb-6 text-3xl font-bold text-foreground md:text-4xl">
                Built for{" "}
                <span className="text-primary">Kenyan Dukas</span>
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                We understand the challenges of running a small shop. From Nairobi to Mombasa, 
                shopkeepers trust Mama Duka to manage their business.
              </p>
              <ul className="space-y-4">
                {[
                  "No complicated setup required",
                  "Works on any phone or tablet",
                  "Secure cloud backup for your data",
                  "Free to get started",
                  "M-Pesa integration included"
                ].map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
            Ready to Grow Your Business?
          </h2>
          <p className="mb-8 text-lg text-primary-foreground/80">
            Join thousands of shopkeepers already using Mama Duka POS
          </p>
          <Button 
            size="lg" 
            asChild 
            className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8"
          >
            <Link to="/auth">
              Register Your Shop Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <ShoppingCart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Mama Duka POS</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Mama Duka. Built with ❤️ for Kenyan shopkeepers.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
