import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { reference, businessId } = await req.json();
    
    if (!reference || !businessId) {
      throw new Error('Reference and Business ID are required');
    }

    // Use Service Role key to bypass RLS and get secret key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get the merchant's Paystack Secret Key
    const { data: business, error: dbError } = await supabaseAdmin
      .from('businesses')
      .select('paystack_secret_key')
      .eq('id', businessId)
      .single();

    if (dbError || !business?.paystack_secret_key) {
      throw new Error('Merchant Paystack credentials not found.');
    }

    const SECRET_KEY = business.paystack_secret_key;

    // 2. Verify with Paystack API
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (result.status && result.data.status === 'success') {
      // 3. Update the transaction in our database
      const { error: updateError } = await supabaseAdmin
        .from('paystack_transactions')
        .update({
          status: 'success',
          channel: result.data.channel,
          metadata: result.data,
          updated_at: new Date().toISOString()
        })
        .eq('reference', reference);

      if (updateError) {
        console.error("Database update error:", updateError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment verified successfully',
          data: result.data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Update as failed
      await supabaseAdmin
        .from('paystack_transactions')
        .update({
          status: 'failed',
          metadata: result.data || result,
          updated_at: new Date().toISOString()
        })
        .eq('reference', reference);

      throw new Error(result.message || 'Payment verification failed');
    }

  } catch (error: any) {
    console.error('Paystack Verify Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message || "Unknown error occurred" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
