import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Download, TrendingUp, DollarSign, ShoppingCart, FileText, FileSpreadsheet, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { exportToPDF, exportToExcel, exportDetailedTransactionsPDF, exportDetailedTransactionsExcel } from "@/lib/exportUtils";
import { useSales, SaleWithItems } from "@/hooks/useSales";
import { useBusiness } from "@/hooks/useBusiness";
import { toast } from "@/hooks/use-toast";

export default function Reports() {
  const { t } = useTranslation();
  const { 
    stats, 
    loading, 
    getRecentTransactions, 
    getTransactionsByPeriod, 
    getTopProductsByPeriod,
    refreshSales 
  } = useSales();
  const { businessName } = useBusiness();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Update timestamp whenever stats change (realtime updates)
  useEffect(() => {
    setLastUpdated(new Date());
  }, [stats]);

  const recentTransactions = getRecentTransactions(5);
  const periodTransactions = getTransactionsByPeriod(selectedPeriod);
  const topProducts = getTopProductsByPeriod(selectedPeriod);

  const getSalesDataForPeriod = () => {
    switch (selectedPeriod) {
      case 'daily':
        return {
          sales: stats.todaySales,
          transactions: stats.todayTransactions,
          profit: stats.todayProfit,
        };
      case 'weekly':
        return {
          sales: stats.weeklySales,
          transactions: stats.weeklyTransactions,
          profit: stats.weeklyProfit,
        };
      case 'monthly':
        return {
          sales: stats.monthlySales,
          transactions: stats.monthlyTransactions,
          profit: stats.monthlyProfit,
        };
    }
  };

  const currentData = getSalesDataForPeriod();
  const periodLabel = selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1);

  const handleExportPDF = () => {
    try {
      exportToPDF({
        period: periodLabel,
        sales: currentData.sales,
        transactions: currentData.transactions,
        profit: currentData.profit,
        topProducts: topProducts,
      }, businessName);
      toast({
        title: t('reports.exportSuccess'),
        description: `${periodLabel} report exported as PDF`,
      });
    } catch (error) {
      toast({
        title: t('reports.exportFailed'),
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportExcel = () => {
    try {
      exportToExcel({
        period: periodLabel,
        sales: currentData.sales,
        transactions: currentData.transactions,
        profit: currentData.profit,
        topProducts: topProducts,
      }, businessName);
      toast({
        title: t('reports.exportSuccess'),
        description: `${periodLabel} report exported as Excel`,
      });
    } catch (error) {
      toast({
        title: t('reports.exportFailed'),
        description: "Failed to export Excel. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportDetailedPDF = () => {
    try {
      exportDetailedTransactionsPDF(
        periodTransactions as SaleWithItems[],
        periodLabel,
        businessName
      );
      toast({
        title: t('reports.exportSuccess'),
        description: `${periodLabel} detailed transactions exported as PDF`,
      });
    } catch (error) {
      toast({
        title: t('reports.exportFailed'),
        description: "Failed to export. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportDetailedExcel = () => {
    try {
      exportDetailedTransactionsExcel(
        periodTransactions as SaleWithItems[],
        topProducts,
        periodLabel,
        businessName
      );
      toast({
        title: t('reports.exportSuccess'),
        description: `${periodLabel} detailed report with all items exported`,
      });
    } catch (error) {
      toast({
        title: t('reports.exportFailed'),
        description: "Failed to export. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    refreshSales();
    toast({
      title: "Refreshing...",
      description: "Fetching latest sales data",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('reports.title')}</h1>
          <p className="text-muted-foreground">{t('reports.subtitle')}</p>
          <p className="text-xs text-muted-foreground mt-1">
            🔴 Live • Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                {t('reports.exportReport')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Summary Report</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Summary PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Summary Excel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Detailed Transactions</DropdownMenuLabel>
              <DropdownMenuItem onClick={handleExportDetailedPDF}>
                <FileText className="mr-2 h-4 w-4" />
                All Transactions PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportDetailedExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Full Report with Items (Excel)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as 'daily' | 'weekly' | 'monthly')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">{t('reports.daily')}</TabsTrigger>
          <TabsTrigger value="weekly">{t('reports.weekly')}</TabsTrigger>
          <TabsTrigger value="monthly">{t('reports.monthly')}</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedPeriod} className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{periodLabel} {t('reports.sales')}</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  KSh {currentData.sales.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">{currentData.transactions} transactions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('reports.transactions')}</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentData.transactions}</div>
                <p className="text-xs text-muted-foreground">
                  Avg: KSh {currentData.transactions > 0 ? Math.round(currentData.sales / currentData.transactions).toLocaleString() : 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('reports.profit')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  KSh {currentData.profit.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {currentData.sales > 0 ? Math.round((currentData.profit / currentData.sales) * 100) : 0}% margin
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Top Products - Dynamic */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t('reports.topProducts')} ({periodLabel})</span>
                  <Badge variant="outline" className="text-xs">Live</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No sales data for this period</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div key={product.name} className="flex items-center justify-between">
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
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t('reports.recentTransactions')}</span>
                  <Badge variant="outline" className="text-xs">Live</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No recent transactions</p>
                  </div>
                ) : (
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
                          KSh {transaction.amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.businessInsights')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold text-success">💰 Revenue Highlights</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {topProducts.length > 0 && (
                      <li>• Top seller: {topProducts[0].name} ({topProducts[0].quantity} units)</li>
                    )}
                    <li>• Total products sold: {periodTransactions.reduce((sum, t) => sum + t.items_count, 0)} items</li>
                    <li>• Average transaction: KSh {currentData.transactions > 0 ? Math.round(currentData.sales / currentData.transactions).toLocaleString() : 0}</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">📱 Payment Methods</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• M-Pesa: {periodTransactions.filter(t => t.payment_method === 'mpesa').length} transactions</li>
                    <li>• Cash: {periodTransactions.filter(t => t.payment_method === 'cash').length} transactions</li>
                    <li>• M-Pesa revenue: KSh {periodTransactions.filter(t => t.payment_method === 'mpesa').reduce((sum, t) => sum + Number(t.total_amount), 0).toLocaleString()}</li>
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
