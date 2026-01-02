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
}

export function MpesaPayment({ amount, onSuccess, onError }: MpesaPaymentProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const formatPhoneNumber = (phone: string): string => {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('+254')) {
      cleaned = cleaned.substring(1);
    } else if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  };

  const handlePayment = async () => {
    if (!phoneNumber || amount <= 0) {
      toast({
        title: t('common.error'),
        description: 'Please enter a valid phone number',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setStatus('processing');

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          phoneNumber: formattedPhone,
          amount: Math.round(amount),
        },
      });

      if (error) throw error;

      if (data?.success) {
        setStatus('success');
        toast({
          title: t('mpesa.success'),
          description: t('mpesa.checkPhone'),
        });
        onSuccess?.(data.transactionId);
      } else {
        throw new Error(data?.message || 'Payment failed');
      }
    } catch (error: any) {
      console.error('M-Pesa payment error:', error);
      setStatus('error');
      const errorMessage = error.message || t('mpesa.failed');
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: 'destructive',
      });
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
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
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="07XX XXX XXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="pl-10"
              disabled={isProcessing}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t('mpesa.amount')}</Label>
          <div className="text-2xl font-bold text-primary">
            KSh {amount.toLocaleString()}
          </div>
        </div>

        {status === 'processing' && (
          <div className="flex items-center gap-2 text-muted-foreground p-3 bg-muted rounded-lg">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t('mpesa.checkPhone')}</span>
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-2 text-success p-3 bg-success/10 rounded-lg">
            <CheckCircle className="h-4 w-4" />
            <span>{t('mpesa.success')}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-destructive p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span>{t('mpesa.failed')}</span>
          </div>
        )}

        <Button
          onClick={handlePayment}
          disabled={isProcessing || !phoneNumber}
          className="w-full bg-[#00A650] hover:bg-[#008B43]"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('mpesa.processing')}
            </>
          ) : (
            <>
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg"
                alt="M-Pesa"
                className="h-5 w-5 mr-2"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              {t('mpesa.pay')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
