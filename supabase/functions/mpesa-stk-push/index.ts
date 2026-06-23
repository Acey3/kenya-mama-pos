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
    const { phoneNumber, amount } = await req.json();
    
    // Get the caller's auth token
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // 1. Get the merchant's M-Pesa credentials from the database
    // The RLS policy ensures we only get the business owned by the authenticated user
    const { data: business, error: dbError } = await supabaseClient
      .from('businesses')
      .select('id, business_name, mpesa_shortcode, mpesa_consumer_key, mpesa_consumer_secret, mpesa_passkey, is_mpesa_live')
      .single();

    if (dbError || !business) {
      throw new Error('Merchant M-Pesa credentials not found. Please configure them in Settings.');
    }

    const { 
      id: BUSINESS_ID,
      mpesa_shortcode: SHORTCODE, 
      mpesa_consumer_key: CONSUMER_KEY, 
      mpesa_consumer_secret: CONSUMER_SECRET, 
      mpesa_passkey: PASSKEY, 
      is_mpesa_live: IS_LIVE 
    } = business;

    if (!SHORTCODE || !CONSUMER_KEY || !CONSUMER_SECRET || !PASSKEY) {
      throw new Error('M-Pesa configuration is incomplete. Please check your Settings.');
    }

    const BASE_URL = IS_LIVE ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
    
    // Use SUPABASE_URL if available, otherwise fallback to project ID construction
    const projectUrl = Deno.env.get('SUPABASE_URL') || `https://${Deno.env.get('SUPABASE_PROJECT_ID')}.supabase.co`;
    const CALLBACK_URL = `${projectUrl}/functions/v1/mpesa-callback`;

    console.log(`Using Callback URL: ${CALLBACK_URL}`);

    // 2. Get Access Token
    const credentials = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
    const tokenResponse = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: { 'Authorization': `Basic ${credentials}` },
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to authenticate with M-Pesa. Check your Consumer Key and Secret.');
    }

    const { access_token: accessToken } = await tokenResponse.json();

    // 3. Prepare STK Push
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const password = btoa(`${SHORTCODE}${PASSKEY}${timestamp}`);
    
    // Safaricom is extremely strict. Phone number MUST be 254... and purely numeric.
    const formattedPhone = phoneNumber.replace(/\D/g, ''); 

    // AccountReference must not exceed 12 chars
    const safeRef = business.business_name 
      ? business.business_name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) 
      : 'POS';

    const stkPayload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: SHORTCODE, 
      PhoneNumber: formattedPhone,
      CallBackURL: CALLBACK_URL,
      AccountReference: safeRef || 'POS',
      TransactionDesc: 'POS Payment',
    };

    console.log("Sending STK Payload (omitting password):", { ...stkPayload, Password: '***' });

    // 4. Send Request
    const stkResponse = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPayload),
    });

    const stkResult = await stkResponse.json();
    console.log("M-Pesa API Response:", stkResult);

    if (stkResult.ResponseCode === '0') {
      
      // Save pending transaction to track it
      const { error: insertError } = await supabaseClient.from('mpesa_transactions').insert({
        checkout_request_id: stkResult.CheckoutRequestID,
        business_id: BUSINESS_ID,
        phone: formattedPhone,
        amount: Math.round(amount),
        status: 'pending'
      });

      if (insertError) {
        console.error("Failed to save pending txn to database:", insertError);
        throw new Error(`Failed to track payment: ${insertError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'STK Push sent successfully',
          checkoutRequestId: stkResult.CheckoutRequestID,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Return exactly what Safaricom said
      const errorMsg = stkResult.errorMessage || stkResult.ResultDesc || 'STK Push failed at M-Pesa';
      throw new Error(`Safaricom Error: ${errorMsg}`);
    }

  } catch (error: any) {
    console.error('M-Pesa Edge Function Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message || "Unknown error occurred" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
