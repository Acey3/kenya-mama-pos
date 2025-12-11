import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Smartphone, 
  Wifi, 
  Globe,
  ArrowRight,
  Check
} from "lucide-react";

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

const benefits = [
  "No complicated setup required",
  "Works on any phone or tablet",
  "Secure cloud backup for your data",
  "Free to get started"
];

const Index = () => {
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

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto max-w-3xl">
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
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" asChild className="w-full sm:w-auto text-lg px-8">
                <Link to="/auth">
                  Start Free Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-lg px-8">
                <Link to="/auth">Login to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-secondary/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Everything You Need to Run Your Shop
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Mama Duka POS gives you all the tools to manage your business without any technical knowledge
            </p>
          </div>
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

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div>
                <h2 className="mb-6 text-3xl font-bold text-foreground md:text-4xl">
                  Built for{" "}
                  <span className="text-primary">Small Business Owners</span>
                </h2>
                <p className="mb-8 text-lg text-muted-foreground">
                  We understand the challenges of running a small shop. That's why we made 
                  Mama Duka POS simple, affordable, and reliable.
                </p>
                <ul className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 p-8">
                  <div className="flex h-full flex-col items-center justify-center rounded-xl border border-border bg-card p-6 shadow-xl">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
                      <ShoppingCart className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h3 className="mb-2 text-2xl font-bold text-foreground">Mama Duka</h3>
                    <p className="text-center text-muted-foreground">Your trusted business partner</p>
                  </div>
                </div>
              </div>
            </div>
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

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <ShoppingCart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Mama Duka POS</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Mama Duka. Built with ❤️ for Kenyan shopkeepers.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
