import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('M-Pesa Callback received:', JSON.stringify(body, null, 2));

    const stkCallback = body?.Body?.stkCallback;
    
    if (!stkCallback) {
      console.error('Invalid callback body received from Safaricom');
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    let status = 'failed';
    let mpesaReceiptNumber = null;

    if (ResultCode === 0) {
      status = 'completed';
      if (CallbackMetadata?.Item) {
        for (const item of CallbackMetadata.Item) {
          if (item.Name === 'MpesaReceiptNumber') {
            mpesaReceiptNumber = item.Value;
          }
        }
      }
    } else {
      console.warn(`M-Pesa transaction failed with code ${ResultCode}: ${ResultDesc}`);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log(`Updating transaction ${CheckoutRequestID} to status: ${status}`);

    // Update the pending transaction with the final status
    const { error: updateError } = await supabaseAdmin
      .from('mpesa_transactions')
      .update({
        status,
        mpesa_receipt_number: mpesaReceiptNumber,
        result_desc: ResultDesc,
        updated_at: new Date().toISOString()
      })
      .eq('checkout_request_id', CheckoutRequestID);

    if (updateError) {
      console.error('Database update error in callback:', updateError);
    } else {
      console.log(`Successfully updated transaction ${CheckoutRequestID}`);
    }

    return new Response(
      JSON.stringify({ ResultCode: 0, ResultDesc: 'Accepted' }),
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
