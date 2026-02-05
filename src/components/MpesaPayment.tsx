import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Phone, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MpesaPaymentProps {
  amount: number;
  onSuccess?: (transactionId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export function MpesaPayment({ amount, onSuccess, onError, onCancel }: MpesaPaymentProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  // Quick helper to fix Kenyan numbers
  // Accepts 07xx, 2547xx, or just 7xx
  const formatPhone = (phone: string) => {
    // strip spaces and weird chars first
    let p = phone.replace(/\D/g, '');
    
    if (p.startsWith('0')) {
      return '254' + p.slice(1);
    }
    if (p.startsWith('254')) {
      return p;
    }
    // assume they missed the prefix if it's 9 digits
    if (p.length === 9) {
        return '254' + p;
    }
    return p;
  };

  const handlePay = async () => {
    if (!phoneNumber || amount <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please check the phone number and amount.",
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setStatus('processing');
    console.log("Starting STK push for:", phoneNumber, amount); // debug log

    try {
      const formatted = formatPhone(phoneNumber);
      
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          phoneNumber: formatted,
          amount: Math.ceil(amount), // ensure no decimals just in case
        },
      });

      if (error) {
        console.error("Supabase Func Error:", error);
        throw error;
      }

      console.log("STK Result:", data);

      if (data?.success) {
        setStatus('success');
        toast({
          title: "STK Push Sent",
          description: "Check your phone to enter PIN.",
          duration: 5000,
        });
        
        // Give the user a moment to read the toast before closing
        setTimeout(() => {
            onSuccess?.(data.transactionId || 'temp-id');
        }, 2000);

      } else {
        throw new Error(data?.message || 'STK push failed');
      }

    } catch (err: any) {
      console.error('Payment crashed:', err);
      setStatus('error');
      
      const msg = err.message || t('mpesa.failed');
      toast({
        title: "Payment Error",
        description: msg,
        variant: 'destructive',
      });
      
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-[#00A650]" /> {/* Safaricom Green */}
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
              autoFocus // nice to have
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label>{t('mpesa.amount')}</Label>
          <div className="text-3xl font-bold text-gray-900">
            KSh {amount.toLocaleString()}
          </div>
        </div>

        {/* Status Feedback UI */}
        {status === 'processing' && (
          <div className="flex items-center gap-3 text-sm text-blue-600 bg-blue-50 p-3 rounded-md animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Sending request to phone...</span>
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-3 text-sm text-green-700 bg-green-50 p-3 rounded-md">
            <CheckCircle className="h-4 w-4" />
            <span>Request sent! Check your phone.</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-3 text-sm text-red-600 bg-red-50 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>Connection failed. Try again.</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
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