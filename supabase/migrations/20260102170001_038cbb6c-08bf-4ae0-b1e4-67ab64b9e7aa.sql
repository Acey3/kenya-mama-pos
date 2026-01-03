-- Create products table for inventory
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'Grocery',
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales table to track transactions
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL,
  transaction_id TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  profit DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  items_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sale_items table for individual items in a sale
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Products RLS policies (users can only see their business's products)
CREATE POLICY "Users can view their business products" 
ON public.products FOR SELECT 
USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert their business products" 
ON public.products FOR INSERT 
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update their business products" 
ON public.products FOR UPDATE 
USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete their business products" 
ON public.products FOR DELETE 
USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

-- Sales RLS policies
CREATE POLICY "Users can view their business sales" 
ON public.sales FOR SELECT 
USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert their business sales" 
ON public.sales FOR INSERT 
WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

-- Sale items RLS policies (through sales relationship)
CREATE POLICY "Users can view their sale items" 
ON public.sale_items FOR SELECT 
USING (sale_id IN (SELECT id FROM public.sales WHERE business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())));

CREATE POLICY "Users can insert their sale items" 
ON public.sale_items FOR INSERT 
WITH CHECK (sale_id IN (SELECT id FROM public.sales WHERE business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid())));

-- Create indexes for better performance
CREATE INDEX idx_products_business_id ON public.products(business_id);
CREATE INDEX idx_sales_business_id ON public.sales(business_id);
CREATE INDEX idx_sales_created_at ON public.sales(created_at);
CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);

-- Trigger for updated_at on products
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();