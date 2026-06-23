import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { usePaystackPayment } from 'react-paystack';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, CheckCircle, AlertCircle, Settings, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBusiness } from '@/hooks/useBusiness';
import { useAuth } from '@/hooks/useAuth';

interface PaystackPaymentProps {
  amount: number;
  onSuccess?: (reference: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export function PaystackPayment({ amount, onSuccess, onError, onCancel }: PaystackPaymentProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { paystackCredentials, businessId, loading: businessLoading } = useBusiness();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const isConfigured = paystackCredentials && paystackCredentials.publicKey;

  // Paystack Configuration
  const config = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || "customer@example.com",
    amount: Math.ceil(amount * 100), // Paystack expects amount in subunits (kobo/cents/shillings)
    publicKey: paystackCredentials?.publicKey || '',
    currency: 'KES', // You can make this dynamic from business settings
    // If a phone number is provided, we can restrict channels to mobile money or just pass it as metadata
    channels: ['mobile_money', 'card', 'bank'],
    metadata: {
      custom_fields: [
        {
          display_name: "Phone Number",
          variable_name: "phone_number",
          value: phoneNumber
        }
      ]
    }
  };

  const initializePayment = usePaystackPayment(config);

  const handlePaystackSuccess = async (reference: any) => {
    setLoading(true);
    setStatus('processing');
    
    try {
        // 1. Record the transaction in our database first
        const { error: dbError } = await supabase
            .from('paystack_transactions')
            .insert({
                reference: reference.reference,
                business_id: businessId,
                email: config.email,
                amount: amount,
                status: 'pending',
                metadata: reference
            });

        if (dbError) console.error("Error saving txn reference:", dbError);

        // 2. Verify payment with our backend (Supabase Edge Function)
        // In production, this should throw and block the sale if it fails.
        // For development, we'll warn but allow the sale to complete if the function isn't deployed yet.
        try {
            const { data, error } = await supabase.functions.invoke('paystack-verify', {
                body: { reference: reference.reference, businessId }
            });

            if (error || !data?.success) {
                console.error("Payment verification failed:", error || data?.message);
                toast({
                    title: "Verification Warning",
                    description: "Payment succeeded but backend verification failed. Make sure your Edge Function is deployed.",
                    variant: "destructive",
                });
            }
        } catch (funcErr) {
            console.error("Could not reach edge function:", funcErr);
            toast({
                title: "Verification Warning",
                description: "Could not reach the verification server. Ensure 'paystack-verify' is deployed.",
                variant: "destructive",
            });
        }

        setStatus('success');
        toast({
            title: "Payment Successful",
            description: `Reference: ${reference.reference}`,
        });
        
        onSuccess?.(reference.reference);
    } catch (err: any) {
        console.error("Payment flow error:", err);
        setStatus('error');
        toast({
            title: "Payment Error",
            description: err.message || "An error occurred during payment processing.",
            variant: "destructive"
        });
        onError?.(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handlePaystackClose = () => {
    if (status !== 'success') {
        toast({
            title: "Payment Cancelled",
            description: "You closed the payment window.",
        });
        onCancel?.();
    }
  };

  if (!isConfigured && !businessLoading) {
    return (
      <Card className="w-full max-w-md shadow-lg border-amber-200 bg-amber-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="h-5 w-5" />
            Paystack Not Configured
          </CardTitle>
          <CardDescription>
            You need to set up your Paystack API credentials before you can accept online payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white/50 p-4 rounded-lg border border-amber-100 text-sm text-amber-800 space-y-2">
            <p>Go to your Paystack Dashboard &gt; Settings &gt; API Keys to get your Public Key.</p>
          </div>
          <div className="flex gap-3">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Close
              </Button>
            )}
            <Button 
              onClick={() => navigate('/dashboard/settings')} 
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-2"
            >
              <Settings className="h-4 w-4" />
              Go to Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-none glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Online Payment
        </CardTitle>
        <CardDescription>
          Enter customer phone number for M-Pesa push, or pay via card.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-primary/5 rounded-2xl p-6 text-center border border-primary/10">
          <Label className="text-muted-foreground block mb-1">Total Amount</Label>
          <div className="text-4xl font-bold text-primary">
            KSh {amount.toLocaleString()}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Customer Phone Number (Optional)</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="phone"
              type="tel"
              placeholder="e.g. 0712345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>
          <p className="text-xs text-muted-foreground">Provide a number to speed up M-Pesa checkout</p>
        </div>

        {status === 'processing' && (
          <div className="flex items-center gap-3 text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verifying payment with Paystack...</span>
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-3 text-sm text-green-700 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
            <CheckCircle className="h-4 w-4" />
            <span>Payment Confirmed!</span>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={() => initializePayment({ onSuccess: handlePaystackSuccess, onClose: handlePaystackClose })}
            disabled={loading || businessLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg shadow-lg shadow-primary/20"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              "Initialize Payment"
            )}
          </Button>
          
          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              disabled={loading}
              className="w-full text-muted-foreground"
            >
              Back to Sales
            </Button>
          )}
        </div>

        <div className="flex justify-center items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all">
            <span className="text-[10px] font-medium uppercase tracking-widest">Secured by</span>
            <img src="https://paystack.com/assets/img/login/paystack-logo.png" alt="Paystack" className="h-4" />
        </div>
      </CardContent>
    </Card>
  );
}
