import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Phone, CreditCard, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBusiness } from '@/hooks/useBusiness';

interface MpesaPaymentProps {
  amount: number;
  onSuccess?: (transactionId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export function MpesaPayment({ amount, onSuccess, onError, onCancel }: MpesaPaymentProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { mpesaCredentials, loading: businessLoading } = useBusiness();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'waiting_for_pin' | 'success' | 'error'>('idle');
  const [checkoutId, setCheckoutId] = useState<string | null>(null);

  const isConfigured = mpesaCredentials && 
    mpesaCredentials.shortcode && 
    mpesaCredentials.consumerKey && 
    mpesaCredentials.consumerSecret && 
    mpesaCredentials.passkey;

  // Quick helper to fix Kenyan numbers
  const formatPhone = (phone: string) => {
    let p = phone.replace(/\D/g, '');
    if (p.startsWith('0')) return '254' + p.slice(1);
    if (p.startsWith('254')) return p;
    if (p.length === 9) return '254' + p;
    return p;
  };

  // Listen for M-Pesa transaction updates via Realtime and Polling
  useEffect(() => {
    if (!checkoutId || status !== 'waiting_for_pin') return;

    const handleTransactionUpdate = (data: any) => {
      if (data && data.status !== 'pending') {
        setLoading(false);

        if (data.status === 'completed') {
          setStatus('success');
          toast({
            title: "Payment Received!",
            description: `Receipt: ${data.mpesa_receipt_number}`,
          });
          setTimeout(() => {
            onSuccess?.(data.mpesa_receipt_number || checkoutId);
          }, 1500);
          return true; // Finished
        } else if (data.status === 'failed') {
          setStatus('error');
          toast({
            title: "Payment Failed",
            description: data.result_desc || "The transaction was cancelled or failed.",
            variant: 'destructive',
          });
          return true; // Finished
        }
      }
      return false; // Still pending
    };

    // 1. Setup Realtime Subscription
    const channel = supabase
      .channel(`mpesa-${checkoutId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mpesa_transactions',
          filter: `checkout_request_id=eq.${checkoutId}`,
        },
        (payload) => {
          console.log('Realtime update received:', payload.new);
          handleTransactionUpdate(payload.new);
        }
      )
      .subscribe();

    // 2. Setup Polling (as a fallback)
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('mpesa_transactions')
          .select('status, mpesa_receipt_number, result_desc')
          .eq('checkout_request_id', checkoutId)
          .maybeSingle();

        if (error) {
            console.error("Polling error:", error);
            return;
        }

        if (handleTransactionUpdate(data)) {
          clearInterval(pollInterval);
          supabase.removeChannel(channel);
        }
      } catch (err) {
        console.error("Polling crash:", err);
      }
    }, 3000);

    // 3. Timeout after 2 minutes
    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
      if (status === 'waiting_for_pin') {
          setStatus('error');
          setLoading(false);
          toast({ 
            title: "Payment Timeout", 
            description: "We haven't received the payment confirmation yet. If you have paid, please wait a moment or check your M-Pesa messages.", 
            variant: "destructive" 
          });
      }
    }, 120000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [checkoutId, status, onSuccess, toast]);

  const handlePay = async () => {
    if (!phoneNumber || amount <= 0) {
      toast({ title: "Invalid Input", description: "Please check the phone number and amount.", variant: 'destructive' });
      return;
    }

    setLoading(true);
    setStatus('processing');

    try {
      const formatted = formatPhone(phoneNumber);
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: { phoneNumber: formatted, amount: Math.ceil(amount) },
      });

      if (error) {
        // If it's a FunctionsHttpError, the context contains the actual response body
        if (error.context) {
            try {
                const errorBody = await error.context.json();
                console.error("Supabase Func Error Details:", errorBody);
                throw new Error(errorBody.message || "Failed to trigger M-Pesa");
            } catch (e) {
                // If it wasn't JSON
                console.error("Supabase Func Raw Error:", error);
                throw error;
            }
        }
        throw error;
      }

      if (data?.success) {
        setStatus('waiting_for_pin');
        setCheckoutId(data.checkoutRequestId);
        toast({
          title: "STK Push Sent",
          description: "Please ask the customer to enter their PIN.",
          duration: 5000,
        });
      } else {
        throw new Error(data?.message || 'STK push failed');
      }

    } catch (err: any) {
      console.error('Payment crashed:', err);
      setStatus('error');
      setLoading(false);
      const msg = err.message || t('mpesa.failed');
      toast({ title: "Payment Error", description: msg, variant: 'destructive' });
      onError?.(msg);
    }
  };

  if (!isConfigured && !businessLoading) {
    return (
      <Card className="w-full max-w-md shadow-lg border-amber-200 bg-amber-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="h-5 w-5" />
            M-Pesa Not Configured
          </CardTitle>
          <CardDescription>
            You need to set up your M-Pesa Daraja API credentials before you can accept mobile payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white/50 p-4 rounded-lg border border-amber-100 text-sm text-amber-800 space-y-2">
            <p>Missing requirements:</p>
            <ul className="list-disc pl-5 space-y-1">
              {!mpesaCredentials?.shortcode && <li>Shortcode (Till/Paybill)</li>}
              {!mpesaCredentials?.consumerKey && <li>Consumer Key</li>}
              {!mpesaCredentials?.consumerSecret && <li>Consumer Secret</li>}
              {!mpesaCredentials?.passkey && <li>Online Passkey</li>}
            </ul>
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
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-[#00A650]" />
          {t('mpesa.title')}
        </CardTitle>
        <CardDescription>
          {t('mpesa.enterPin')}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">{t('mpesa.phoneNumber')}</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="phone"
              type="tel"
              placeholder="07XX XXX XXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="pl-10"
              disabled={loading}
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label>{t('mpesa.amount')}</Label>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            KSh {amount.toLocaleString()}
          </div>
        </div>

        {/* Status Feedback UI */}
        {status === 'processing' && (
          <div className="flex items-center gap-3 text-sm text-blue-600 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Sending request to phone...</span>
          </div>
        )}

        {status === 'waiting_for_pin' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Waiting for customer to enter PIN...</span>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-lg space-y-3">
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Already paid? If the status doesn't update automatically, you can manually check for the payment.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:text-blue-400"
                onClick={async () => {
                  setLoading(true);
                  try {
                    // Call Safaricom directly via our Query Edge Function
                    const { data, error } = await supabase.functions.invoke('mpesa-status-query', {
                      body: { checkoutRequestId: checkoutId },
                    });
                    
                    if (error) throw error;
                    
                    if (data?.success) {
                      // Status will be 'completed', 'failed', or 'pending'
                      if (data.status === 'completed') {
                        setStatus('success');
                        toast({ title: "Payment Verified!", description: "Safaricom has confirmed your payment." });
                        onSuccess?.(checkoutId || "");
                      } else if (data.status === 'failed') {
                        setStatus('error');
                        toast({ title: "Payment Failed", description: data.message, variant: "destructive" });
                      } else {
                        toast({ title: "Still Pending", description: "Safaricom says the payment is still being processed. Please wait a moment." });
                      }
                    }
                  } catch (err: any) {
                    console.error("Manual verification failed:", err);
                    toast({ title: "Verification Error", description: err.message || "Failed to check status", variant: "destructive" });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading && status !== 'waiting_for_pin'}
              >
                {loading && status !== 'waiting_for_pin' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Verify Payment Now
              </Button>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-3 text-sm text-green-700 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
            <CheckCircle className="h-4 w-4" />
            <span>Payment Confirmed! Generating receipt...</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>Transaction failed or cancelled.</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading && status !== 'waiting_for_pin'}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handlePay}
            disabled={loading || phoneNumber.length < 9}
            className="flex-1 bg-[#00A650] hover:bg-[#008B43] text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wait...
              </>
            ) : (
              t('mpesa.pay')
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}