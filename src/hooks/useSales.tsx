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
    // console.log("Fetching sales for:", businessId);

    try {
        const now = new Date();
        // Native JS date math is annoying, but this works for "start of month"
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .eq('business_id', businessId)
            .gte('created_at', startOfMonth)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const allSales = data || [];
        setSales(allSales);

        // Filter dates locally to save DB calls
        const todayStr = new Date().toISOString().split('T')[0]; // "2024-01-20"
        
        // Simple "start of week" (Sunday) calculation
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        startOfWeek.setHours(0,0,0,0);

        const todayData = allSales.filter(s => s.created_at.startsWith(todayStr));
        const weeklyData = allSales.filter(s => new Date(s.created_at) >= startOfWeek);

        // DRY implementation (Don't Repeat Yourself)
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
      // 1. Create the main sale record
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

      // 2. Add the individual items
      // Mapping this explicitly to match DB columns
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

      // Update UI immediately
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
      method: sale.payment_method === 'mpesa' ? 'M-Pesa' : 'Cash',
      // simple formatter
      time: new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  };

  return {
    businessId,
    sales,
    stats,
    loading,
    recordSale,
    refreshSales: fetchSales,
    getRecentTransactions,
  };
}