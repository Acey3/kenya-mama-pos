import { useState } from "react";
import { Plus, Minus, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

const products: Product[] = [
  { id: "1", name: "Coca Cola 500ml", price: 80, stock: 50, category: "Beverages" },
  { id: "2", name: "White Bread", price: 60, stock: 30, category: "Bakery" },
  { id: "3", name: "Milk 1L", price: 110, stock: 25, category: "Dairy" },
  { id: "4", name: "Sugar 2kg", price: 280, stock: 15, category: "Grocery" },
  { id: "5", name: "Tea Leaves 250g", price: 150, stock: 20, category: "Grocery" },
  { id: "6", name: "Cooking Oil 1L", price: 350, stock: 12, category: "Grocery" },
];

export default function Sales() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

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
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const clearCart = () => setCart([]);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Products Section */}
      <div className="lg:col-span-2 space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Sales</h1>
          <p className="text-muted-foreground">Select products to add to cart</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search products..."
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
                    <p className="text-sm text-muted-foreground">Stock: {product.stock}</p>
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
            <span>Cart ({itemCount})</span>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                Clear
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Cart is empty. Add products to start a sale.
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
                        KSh {item.price} each
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
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-2xl font-bold text-primary">KSh {total.toLocaleString()}</span>
                </div>
                
                <div className="space-y-2">
                  <Button className="w-full" size="lg">
                    Complete Sale (Cash)
                  </Button>
                  <Button variant="outline" className="w-full" size="lg">
                    M-Pesa Payment
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}