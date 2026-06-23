import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Sale {
  id: string;
  business_id: string;
  transaction_id: string;
  total_amount: number;
  profit: number;
  payment_method: string;
  items_count: number;
  created_at: string;
}

export interface SaleItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface SaleWithItems extends Sale {
  sale_items: SaleItem[];
}

export interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export interface SalesStats {
  todaySales: number;
  todayTransactions: number;
  todayProfit: number;
  weeklySales: number;
  weeklyTransactions: number;
  weeklyProfit: number;
  monthlySales: number;
  monthlyTransactions: number;
  monthlyProfit: number;
}

// Helper to avoid repeating the reduce logic 3 times
const getTotals = (data: Sale[]) => ({
    sales: data.reduce((sum, s) => sum + Number(s.total_amount), 0),
    transactions: data.length,
    profit: data.reduce((sum, s) => sum + Number(s.profit), 0)
});

export function useSales() {
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesWithItems, setSalesWithItems] = useState<SaleWithItems[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  
  // Initialize with zeros
  const [stats, setStats] = useState<SalesStats>({
    todaySales: 0, todayTransactions: 0, todayProfit: 0,
    weeklySales: 0, weeklyTransactions: 0, weeklyProfit: 0,
    monthlySales: 0, monthlyTransactions: 0, monthlyProfit: 0,
  });
  
  const [loading, setLoading] = useState(true);

  // One-time fetch for business ID
  useEffect(() => {
    async function getBizId() {
        if (!user) return;
        
        const { data } = await supabase
            .from('businesses')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle();
            
        if (data) setBusinessId(data.id);
        else setLoading(false);
    }
    getBizId();
  }, [user]);

  const fetchSales = useCallback(async () => {
    if (!businessId) return;

    setLoading(true);

    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Fetch sales with their items for detailed reports
        const { data, error } = await supabase
            .from('sales')
            .select(`
              *,
              sale_items (
                product_name,
                quantity,
                unit_price,
                total_price
              )
            `)
            .eq('business_id', businessId)
            .gte('created_at', startOfMonth)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const allSales = (data || []) as SaleWithItems[];
        setSalesWithItems(allSales);
        setSales(allSales.map(({ sale_items, ...sale }) => sale));

        // Calculate top products from sale_items
        const productMap = new Map<string, { quantity: number; revenue: number }>();
        
        for (const sale of allSales) {
          for (const item of sale.sale_items || []) {
            const existing = productMap.get(item.product_name) || { quantity: 0, revenue: 0 };
            productMap.set(item.product_name, {
              quantity: existing.quantity + item.quantity,
              revenue: existing.revenue + Number(item.total_price)
            });
          }
        }
        
        // Sort by revenue and take top 5
        const sortedProducts = Array.from(productMap.entries())
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
        
        setTopProducts(sortedProducts);

        // Filter dates locally to save DB calls
        const todayStr = new Date().toISOString().split('T')[0];
        
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        startOfWeek.setHours(0,0,0,0);

        const todayData = allSales.filter(s => s.created_at.startsWith(todayStr));
        const weeklyData = allSales.filter(s => new Date(s.created_at) >= startOfWeek);

        const t = getTotals(todayData);
        const w = getTotals(weeklyData);
        const m = getTotals(allSales);

        setStats({
            todaySales: t.sales, todayTransactions: t.transactions, todayProfit: t.profit,
            weeklySales: w.sales, weeklyTransactions: w.transactions, weeklyProfit: w.profit,
            monthlySales: m.sales, monthlyTransactions: m.transactions, monthlyProfit: m.profit,
        });

    } catch (err) {
        console.error("Failed to load sales stats:", err);
    } finally {
        setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // Real-time subscription for live updates
  useEffect(() => {
    if (!businessId) return;

    console.log('Setting up realtime subscription for sales...');
    
    const channel = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `business_id=eq.${businessId}`
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          // Refetch all data to ensure consistency
          fetchSales();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [businessId, fetchSales]);

  const recordSale = async (
    transactionId: string,
    totalAmount: number,
    profit: number,
    paymentMethod: string,
    items: SaleItem[]
  ) => {
    if (!businessId) {
        console.error("Cannot record sale: No Business ID");
        return false;
    }

    try {
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          business_id: businessId,
          transaction_id: transactionId,
          total_amount: totalAmount,
          profit: profit,
          payment_method: paymentMethod,
          items_count: items.reduce((acc, item) => acc + item.quantity, 0),
        })
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItemsPayload = items.map(item => ({
        sale_id: sale.id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItemsPayload);

      if (itemsError) throw itemsError;

      // Realtime will trigger refresh, but also do it manually for immediate feedback
      fetchSales();
      return true;

    } catch (error) {
      console.error('Transaction failed:', error);
      return false;
    }
  };

  const getRecentTransactions = (limit = 5) => {
    return sales.slice(0, limit).map(sale => ({
      id: sale.transaction_id,
      items: `${sale.items_count} items`,
      amount: Number(sale.total_amount),
      method: sale.payment_method === 'mpesa' ? 'M-Pesa' : sale.payment_method === 'paystack' ? 'Paystack' : 'Cash',
      time: new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  };

  // Get today's transactions with full item details
  const getTodayTransactionsWithItems = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    return salesWithItems.filter(s => s.created_at.startsWith(todayStr));
  };

  // Get filtered transactions by period
  const getTransactionsByPeriod = (period: 'daily' | 'weekly' | 'monthly') => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);

    switch (period) {
      case 'daily':
        return salesWithItems.filter(s => s.created_at.startsWith(todayStr));
      case 'weekly':
        return salesWithItems.filter(s => new Date(s.created_at) >= startOfWeek);
      case 'monthly':
        return salesWithItems;
      default:
        return salesWithItems;
    }
  };

  // Get top products for a specific period
  const getTopProductsByPeriod = (period: 'daily' | 'weekly' | 'monthly') => {
    const transactions = getTransactionsByPeriod(period);
    const productMap = new Map<string, { quantity: number; revenue: number }>();
    
    for (const sale of transactions) {
      for (const item of sale.sale_items || []) {
        const existing = productMap.get(item.product_name) || { quantity: 0, revenue: 0 };
        productMap.set(item.product_name, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + Number(item.total_price)
        });
      }
    }
    
    return Array.from(productMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  return {
    businessId,
    sales,
    salesWithItems,
    stats,
    loading,
    topProducts,
    recordSale,
    refreshSales: fetchSales,
    getRecentTransactions,
    getTodayTransactionsWithItems,
    getTransactionsByPeriod,
    getTopProductsByPeriod,
  };
}
