import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  name: string;
  price: number;
  costPrice: number;
  stock: number;
  category: string;
  lowStockThreshold: number;
  businessId: string;
}

// keeping the DB interface separate to avoid type confusion
interface DBProduct {
  id: string;
  name: string;
  price: number;
  cost_price: number;
  stock: number;
  category: string;
  low_stock_threshold: number;
  business_id: string;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  // Memoizing this to avoid infinite loops
  const fetchBusinessId = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // assuming one business per owner for now
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    return business?.id || null;
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const bizId = await fetchBusinessId();
      if (!bizId) {
        console.log("No business ID found, skipping fetch");
        setLoading(false);
        return;
      }
      
      setBusinessId(bizId);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', bizId)
        .order('name');

      if (error) throw error;

      // annoying manual mapping because DB uses snake_case
      const mappedProducts: Product[] = (data || []).map((p: DBProduct) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price), // ensure these are numbers
        costPrice: Number(p.cost_price),
        stock: p.stock,
        category: p.category,
        lowStockThreshold: p.low_stock_threshold,
        businessId: p.business_id,
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.error('CRITICAL: Failed to fetch products', error);
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [fetchBusinessId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = async (product: Omit<Product, 'id' | 'businessId'>) => {
    const bizId = businessId || await fetchBusinessId();
    
    if (!bizId) {
      toast({ title: 'Error', description: 'Business not found. Try reloading.', variant: 'destructive'});
      return null;
    }

    // construct payload for DB
    const payload = {
        name: product.name,
        price: product.price,
        cost_price: product.costPrice,
        stock: product.stock,
        category: product.category,
        low_stock_threshold: product.lowStockThreshold,
        business_id: bizId,
    };

    console.log("Adding product:", payload);

    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Insert failed:', error);
      toast({ title: 'Error', description: 'Could not add product', variant: 'destructive'});
      return null;
    }

    // map back to frontend structure immediately so UI updates fast
    const newProduct: Product = {
      id: data.id,
      name: data.name,
      price: Number(data.price),
      costPrice: Number(data.cost_price),
      stock: data.stock,
      category: data.category,
      lowStockThreshold: data.low_stock_threshold,
      businessId: data.business_id,
    };

    setProducts(prev => [...prev, newProduct]);
    return newProduct;
  };

  const updateProduct = async (id: string, updates: Partial<Omit<Product, 'id' | 'businessId'>>) => {
    // Cleaner way to handle partial updates without a million 'if' statements
    const dbUpdates: any = {
        name: updates.name,
        price: updates.price,
        cost_price: updates.costPrice,
        stock: updates.stock,
        category: updates.category,
        low_stock_threshold: updates.lowStockThreshold
    };

    // remove undefined keys so we don't accidentally nullify data
    Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);

    const { error } = await supabase
      .from('products')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Update failed for id:', id, error);
      toast({ title: 'Error', description: 'Failed to save changes', variant: 'destructive'});
      return false;
    }

    // Optimistic UI update
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ));
    return true;
  };

  const deleteProduct = async (id: string) => {
    // Optimistic delete - remove from UI first to feel snappy
    const previousProducts = [...products];
    setProducts(prev => prev.filter(p => p.id !== id));

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete failed:', error);
      // revert UI if DB fails
      setProducts(previousProducts);
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive'});
      return false;
    }

    return true;
  };

  const updateStock = async (id: string, quantitySold: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return false;

    const newStock = Math.max(0, product.stock - quantitySold);
    return updateProduct(id, { stock: newStock });
  };

  return {
    products,
    loading,
    businessId,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    refreshProducts: fetchProducts,
  };
}