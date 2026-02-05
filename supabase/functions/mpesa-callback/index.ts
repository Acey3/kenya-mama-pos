import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('M-Pesa Callback received:', JSON.stringify(body, null, 2));

    // M-Pesa sends the result in Body.stkCallback
    const stkCallback = body?.Body?.stkCallback;
    
    if (!stkCallback) {
      console.error('Invalid callback format - no stkCallback found');
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata
    } = stkCallback;

    console.log('Processing callback:', {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc
    });

    // ResultCode 0 = Success, anything else = failure
    if (ResultCode !== 0) {
      console.log('Payment failed or cancelled:', ResultDesc);
      return new Response(
        JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract payment details from CallbackMetadata
    let amount = 0;
    let mpesaReceiptNumber = '';
    let phoneNumber = '';
    let transactionDate = '';

    if (CallbackMetadata?.Item) {
      for (const item of CallbackMetadata.Item) {
        switch (item.Name) {
          case 'Amount':
            amount = item.Value;
            break;
          case 'MpesaReceiptNumber':
            mpesaReceiptNumber = item.Value;
            break;
          case 'PhoneNumber':
            phoneNumber = String(item.Value);
            break;
          case 'TransactionDate':
            transactionDate = String(item.Value);
            break;
        }
      }
    }

    console.log('Payment successful:', {
      amount,
      mpesaReceiptNumber,
      phoneNumber,
      transactionDate
    });

    // Initialize Supabase client with service role for backend operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store the M-Pesa transaction for reference
    // Note: The actual sale record should be created by the frontend when initiating payment
    // This callback confirms the payment was successful
    
    // Log the successful payment
    console.log(`✅ M-Pesa Payment Confirmed: ${mpesaReceiptNumber} - KSh ${amount} from ${phoneNumber}`);

    // You could also update a pending_payments table here if you have one
    // For now, we just acknowledge receipt

    return new Response(
      JSON.stringify({ 
        ResultCode: 0, 
        ResultDesc: 'Success',
        data: {
          mpesaReceiptNumber,
          amount,
          phoneNumber,
          checkoutRequestId: CheckoutRequestID
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Callback processing error:', error);
    // Always return success to M-Pesa to prevent retries
    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
