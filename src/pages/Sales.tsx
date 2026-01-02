import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Minus, Trash2, Search, Receipt, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MpesaPayment } from "@/components/MpesaPayment";
import { generateReceipt } from "@/lib/exportUtils";
import { useSales } from "@/hooks/useSales";
import { toast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  costPrice: number;
  stock: number;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

// Mock products with cost price for profit calculation
const products: Product[] = [
  { id: "1", name: "Coca Cola 500ml", price: 80, costPrice: 65, stock: 50, category: "Beverages" },
  { id: "2", name: "White Bread", price: 60, costPrice: 45, stock: 30, category: "Bakery" },
  { id: "3", name: "Milk 1L", price: 110, costPrice: 95, stock: 25, category: "Dairy" },
  { id: "4", name: "Sugar 2kg", price: 280, costPrice: 250, stock: 15, category: "Grocery" },
  { id: "5", name: "Tea Leaves 250g", price: 150, costPrice: 120, stock: 20, category: "Grocery" },
  { id: "6", name: "Cooking Oil 1L", price: 350, costPrice: 300, stock: 12, category: "Grocery" },
];

export default function Sales() {
  const { t } = useTranslation();
  const { recordSale } = useSales();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMpesaDialogOpen, setIsMpesaDialogOpen] = useState(false);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [lastTransactionId, setLastTransactionId] = useState("");
  const [lastTotal, setLastTotal] = useState(0);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(prevCart =>
      prevCart.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(0, Math.min(item.quantity + change, item.stock));
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const profit = cart.reduce((sum, item) => sum + ((item.price - item.costPrice) * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const clearCart = () => setCart([]);

  const completeCashSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Please add items to cart before completing sale",
        variant: "destructive",
      });
      return;
    }

    try {
      const items = cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));
      
      const transactionId = generateReceipt(items, total, "Cash");
      setLastTransactionId(transactionId);
      setLastTotal(total);
      
      // Record sale to database
      const saleItems = cart.map(item => ({
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));
      
      await recordSale(transactionId, total, profit, 'cash', saleItems);
      
      toast({
        title: "Sale Completed!",
        description: `Transaction ${transactionId} - KSh ${total.toLocaleString()} (Cash)`,
      });
      
      setIsReceiptDialogOpen(true);
      clearCart();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete sale. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMpesaPayment = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Please add items to cart before payment",
        variant: "destructive",
      });
      return;
    }
    setIsMpesaDialogOpen(true);
  };

  const handleMpesaSuccess = async () => {
    try {
      const items = cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));
      
      const transactionId = generateReceipt(items, total, "M-Pesa");
      setLastTransactionId(transactionId);
      setLastTotal(total);
      setIsMpesaDialogOpen(false);
      
      // Record sale to database
      const saleItems = cart.map(item => ({
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));
      
      await recordSale(transactionId, total, profit, 'mpesa', saleItems);
      
      toast({
        title: "M-Pesa Payment Received!",
        description: `Transaction ${transactionId} - KSh ${total.toLocaleString()}`,
      });
      
      setIsReceiptDialogOpen(true);
      clearCart();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate receipt.",
        variant: "destructive",
      });
    }
  };

  const printReceipt = () => {
    if (cart.length > 0) {
      const items = cart.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));
      generateReceipt(items, total, "Cash");
      toast({
        title: "Receipt Generated",
        description: "Receipt PDF has been downloaded",
      });
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4">
        <div>
          <h1 className="text-3xl font-bold">{t('sales.title')}</h1>
          <p className="text-muted-foreground">{t('sales.subtitle')}</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={t('sales.searchProducts')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{product.name}</h3>
                  <Badge variant="secondary">{product.category}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xl font-bold text-primary">KSh {product.price}</p>
                    <p className="text-sm text-muted-foreground">{t('sales.stock')}: {product.stock}</p>
                  </div>
                  <Button
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    size="sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{t('sales.cart')} ({itemCount})</span>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                {t('sales.clear')}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {t('sales.emptyCart')}
            </p>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        KSh {item.price} {t('sales.each')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, 1)}
                        disabled={item.quantity >= item.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">{t('sales.total')}:</span>
                  <span className="text-2xl font-bold text-primary">KSh {total.toLocaleString()}</span>
                </div>
                
                <div className="space-y-2">
                  <Button className="w-full" size="lg" onClick={completeCashSale}>
                    <Receipt className="mr-2 h-4 w-4" />
                    {t('sales.completeSale')} (Cash)
                  </Button>
                  <Button variant="outline" className="w-full" size="lg" onClick={handleMpesaPayment}>
                    <Smartphone className="mr-2 h-4 w-4" />
                    {t('sales.mpesaPayment')}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* M-Pesa Payment Dialog */}
      <Dialog open={isMpesaDialogOpen} onOpenChange={setIsMpesaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>M-Pesa Payment</DialogTitle>
            <DialogDescription>
              Enter customer's phone number to send payment request
            </DialogDescription>
          </DialogHeader>
          <MpesaPayment 
            amount={total} 
            onSuccess={handleMpesaSuccess}
            onCancel={() => setIsMpesaDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Receipt Success Dialog */}
      <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-success">✓ Sale Complete!</DialogTitle>
            <DialogDescription className="text-center">
              Transaction ID: {lastTransactionId}
            </DialogDescription>
          </DialogHeader>
          <div className="text-center space-y-4 py-4">
            <p className="text-2xl font-bold">KSh {lastTotal.toLocaleString()}</p>
            <p className="text-muted-foreground">Receipt has been downloaded</p>
            <Button onClick={() => setIsReceiptDialogOpen(false)} className="w-full">
              Start New Sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
