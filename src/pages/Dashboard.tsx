import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  DollarSign,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSales } from "@/hooks/useSales";
import { BusinessSetupWizard } from "@/components/BusinessSetupWizard";

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { stats, loading, businessId, getRecentTransactions, refreshSales } = useSales();
  
  const recentTransactions = getRecentTransactions(5);

  // Show setup wizard if no business exists
  if (!loading && !businessId) {
    return <BusinessSetupWizard onComplete={() => refreshSales()} />;
  }

  const dashboardStats = [
    {
      title: t('dashboard.todaysSales'),
      value: `KSh ${stats.todaySales.toLocaleString()}`,
      change: `${stats.todayTransactions} ${t('dashboard.transactions')}`,
      icon: DollarSign,
      positive: true
    },
    {
      title: t('dashboard.itemsSold'),
      value: stats.todayTransactions.toString(),
      change: t('dashboard.today'),
      icon: ShoppingCart,
      positive: true
    },
    {
      title: t('dashboard.todaysProfit'),
      value: `KSh ${stats.todayProfit.toLocaleString()}`,
      change: `${Math.round((stats.todayProfit / (stats.todaySales || 1)) * 100)}% ${t('dashboard.margin')}`,
      icon: TrendingUp,
      positive: true
    },
    {
      title: t('dashboard.weeklyTotal'),
      value: `KSh ${stats.weeklySales.toLocaleString()}`,
      change: `${stats.weeklyTransactions} ${t('dashboard.transactions')}`,
      icon: Package,
      positive: true
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
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
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" size="lg" onClick={() => navigate('/dashboard/sales')}>
              <ShoppingCart className="mr-2 h-5 w-5" />
              {t('dashboard.startNewSale')}
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => navigate('/dashboard/stock')}>
              <Package className="mr-2 h-5 w-5" />
              {t('dashboard.addNewProduct')}
            </Button>
            <Button variant="outline" className="w-full justify-start" size="lg" onClick={() => navigate('/dashboard/reports')}>
              <TrendingUp className="mr-2 h-5 w-5" />
              {t('dashboard.viewReports')}
            </Button>
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              {t('dashboard.monthlySummary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('dashboard.totalSales')}</span>
                <span className="font-bold text-xl">KSh {stats.monthlySales.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('dashboard.totalProfit')}</span>
                <span className="font-bold text-xl text-success">KSh {stats.monthlyProfit.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('dashboard.transactions')}</span>
                <span className="font-bold">{stats.monthlyTransactions}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentSales')}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('dashboard.noSalesYet')}</p>
              <Button className="mt-4" onClick={() => navigate('/dashboard/sales')}>
                {t('dashboard.startNewSale')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTransactions.map((sale, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{sale.items}</p>
                    <p className="text-sm text-muted-foreground">{sale.time} • {sale.method}</p>
                  </div>
                  <p className="font-bold text-primary">KSh {sale.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
