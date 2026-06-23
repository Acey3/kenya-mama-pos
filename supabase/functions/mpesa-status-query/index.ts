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
    const { checkoutRequestId } = await req.json();
    
    if (!checkoutRequestId) {
      throw new Error('Checkout Request ID is required');
    }

    // Get the caller's auth token
    const authHeader = req.headers.get('Authorization')!;
    const projectUrl = Deno.env.get('SUPABASE_URL') || `https://${Deno.env.get('SUPABASE_PROJECT_ID')}.supabase.co`;
    
    const supabaseClient = createClient(
      projectUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // 1. Get the merchant's M-Pesa credentials
    const { data: business, error: dbError } = await supabaseClient
      .from('businesses')
      .select('id, mpesa_shortcode, mpesa_consumer_key, mpesa_consumer_secret, mpesa_passkey, is_mpesa_live')
      .single();

    if (dbError || !business) {
      throw new Error('Merchant M-Pesa credentials not found.');
    }

    const { 
      mpesa_shortcode: SHORTCODE, 
      mpesa_consumer_key: CONSUMER_KEY, 
      mpesa_consumer_secret: CONSUMER_SECRET, 
      mpesa_passkey: PASSKEY, 
      is_mpesa_live: IS_LIVE 
    } = business;

    const BASE_URL = IS_LIVE ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';

    // 2. Get Access Token
    const credentials = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
    const tokenResponse = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: { 'Authorization': `Basic ${credentials}` },
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to authenticate with M-Pesa.');
    }

    const { access_token: accessToken } = await tokenResponse.json();

    // 3. Prepare Query Payload
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const password = btoa(`${SHORTCODE}${PASSKEY}${timestamp}`);

    const queryPayload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    // 4. Call Safaricom Query API
    const queryResponse = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryPayload),
    });

    const queryResult = await queryResponse.json();
    console.log("M-Pesa Query API Response:", queryResult);

    // 5. Interpret and Update Database
    // ResultCode "0" means SUCCESSFUL payment.
    let status = 'pending';
    let resultDesc = queryResult.ResultDesc || queryResult.errorMessage || 'Still pending';

    // Safaricom can return ResultCode as a string or number
    const resultCode = String(queryResult.ResultCode);

    if (resultCode === '0') {
      status = 'completed';
    } else if (queryResult.ResultCode !== undefined && resultCode !== '0') {
      // Any non-zero ResultCode means failure
      status = 'failed';
    }

    // Update the database with the result we just got
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: updateError } = await supabaseAdmin
      .from('mpesa_transactions')
      .update({
        status,
        result_desc: resultDesc,
        updated_at: new Date().toISOString()
      })
      .eq('checkout_request_id', checkoutRequestId);

    if (updateError) {
      console.error('Failed to update transaction status:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        status,
        message: resultDesc,
        raw: queryResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('M-Pesa Query Function Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message || "Unknown error occurred" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
