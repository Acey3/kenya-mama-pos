import { useState, useEffect } from 'react';
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

export function useSales() {
  const { user } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<SalesStats>({
    todaySales: 0,
    todayTransactions: 0,
    todayProfit: 0,
    weeklySales: 0,
    weeklyTransactions: 0,
    weeklyProfit: 0,
    monthlySales: 0,
    monthlyTransactions: 0,
    monthlyProfit: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch business ID
  const fetchBusinessId = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (data && !error) {
      setBusinessId(data.id);
    } else {
      // No business found - stop loading
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessId();
  }, [user]);

  // Fetch sales and calculate stats
  const fetchSales = async () => {
    if (!businessId) return;

    setLoading(true);
    
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('business_id', businessId)
      .gte('created_at', startOfMonth)
      .order('created_at', { ascending: false });

    if (data && !error) {
      setSales(data);

      // Calculate stats
      const todaySalesData = data.filter(s => s.created_at >= startOfDay);
      const weeklySalesData = data.filter(s => s.created_at >= startOfWeek);
      const monthlySalesData = data;

      setStats({
        todaySales: todaySalesData.reduce((sum, s) => sum + Number(s.total_amount), 0),
        todayTransactions: todaySalesData.length,
        todayProfit: todaySalesData.reduce((sum, s) => sum + Number(s.profit), 0),
        weeklySales: weeklySalesData.reduce((sum, s) => sum + Number(s.total_amount), 0),
        weeklyTransactions: weeklySalesData.length,
        weeklyProfit: weeklySalesData.reduce((sum, s) => sum + Number(s.profit), 0),
        monthlySales: monthlySalesData.reduce((sum, s) => sum + Number(s.total_amount), 0),
        monthlyTransactions: monthlySalesData.length,
        monthlyProfit: monthlySalesData.reduce((sum, s) => sum + Number(s.profit), 0),
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchSales();
  }, [businessId]);

  // Record a new sale
  const recordSale = async (
    transactionId: string,
    totalAmount: number,
    profit: number,
    paymentMethod: string,
    items: SaleItem[]
  ): Promise<boolean> => {
    if (!businessId) {
      console.error('No business ID found');
      return false;
    }

    try {
      // Insert sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          business_id: businessId,
          transaction_id: transactionId,
          total_amount: totalAmount,
          profit: profit,
          payment_method: paymentMethod,
          items_count: items.reduce((sum, item) => sum + item.quantity, 0),
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Insert sale items
      const saleItems = items.map(item => ({
        sale_id: saleData.id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Refresh sales data
      await fetchSales();
      return true;
    } catch (error) {
      console.error('Error recording sale:', error);
      return false;
    }
  };

  // Get recent transactions
  const getRecentTransactions = (limit: number = 5) => {
    return sales.slice(0, limit).map(sale => ({
      id: sale.transaction_id,
      items: `${sale.items_count} items`,
      amount: Number(sale.total_amount),
      method: sale.payment_method === 'mpesa' ? 'M-Pesa' : 'Cash',
      time: new Date(sale.created_at).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
    }));
  };

  // Combined fetch that re-fetches business ID if needed
  const refreshData = async () => {
    if (!businessId) {
      await fetchBusinessId();
    }
    await fetchSales();
  };

  return {
    businessId,
    sales,
    stats,
    loading,
    recordSale,
    fetchSales: refreshData,
    getRecentTransactions,
  };
}
