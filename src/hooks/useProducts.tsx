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

  const fetchBusinessId = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

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

      const mappedProducts: Product[] = (data || []).map((p: DBProduct) => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        costPrice: Number(p.cost_price),
        stock: p.stock,
        category: p.category,
        lowStockThreshold: p.low_stock_threshold,
        businessId: p.business_id,
      }));

      setProducts(mappedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
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
      toast({
        title: 'Error',
        description: 'Please set up your business first',
        variant: 'destructive',
      });
      return null;
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        price: product.price,
        cost_price: product.costPrice,
        stock: product.stock,
        category: product.category,
        low_stock_threshold: product.lowStockThreshold,
        business_id: bizId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding product:', error);
      toast({
        title: 'Error',
        description: 'Failed to add product',
        variant: 'destructive',
      });
      return null;
    }

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
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
    if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.lowStockThreshold !== undefined) dbUpdates.low_stock_threshold = updates.lowStockThreshold;

    const { error } = await supabase
      .from('products')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive',
      });
      return false;
    }

    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ));
    return true;
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
      return false;
    }

    setProducts(prev => prev.filter(p => p.id !== id));
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
