import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};


//keys provided for Sandbox testing.                    
const CONSUMER_KEY = 'oQYWn49FVLpaKaznCskdC8RRcqWDANbgBQE8lRYATJ4lL0AI';
const CONSUMER_SECRET = 'VGMe542uvgnCMoc5S31WKXxryluVhVbGGyyOb1108YuseGMGx1hveLP2BbIYMOwr';
const PASSKEY = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
const SHORTCODE = '71326'; // Sandbox Paybill
const CALLBACK_URL = 'https://htzcagxhnydzqdejpjps.supabase.co/functions/v1/mpesa-callback';

// Toggle this to 'false' when you go live (production)
const IS_SANDBOX = true; 
const BASE_URL = IS_SANDBOX ? 'https://sandbox.safaricom.co.ke' : 'https://api.safaricom.co.ke';

async function getAccessToken(): Promise<string> {
  const credentials = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
  
  const response = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Auth Error:", errorText);
    throw new Error('Failed to get M-Pesa access token');
  }

  const data = await response.json();
  return data.access_token;
}

function generateTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  const second = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hour}${minute}${second}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, amount } = await req.json();
    console.log('Initiating STK Push for:', { phoneNumber, amount });

    if (!phoneNumber || !amount) {
      throw new Error('Phone number and amount are required');
    }

    // 1. Get Access Token
    const accessToken = await getAccessToken();
    console.log("Access Token received");

    // 2. Prepare Password
    const timestamp = generateTimestamp();
    const password = btoa(`${SHORTCODE}${PASSKEY}${timestamp}`);

    // 3. Prepare Payload
    // Note: Sandbox PartyB is often the Shortcode.
    // Ensure phoneNumber starts with 254 (no +)
    const formattedPhone = phoneNumber.replace('+', '').replace(/^0/, '254');

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
      AccountReference: 'MamaDuka',
      TransactionDesc: 'POS Payment',
    };

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
    console.log('STK Response:', stkResult);

    if (stkResult.ResponseCode === '0') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'STK Push sent successfully',
          checkoutRequestId: stkResult.CheckoutRequestID,
          merchantRequestId: stkResult.MerchantRequestID,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: stkResult.errorMessage || 'STK Push failed',
          details: stkResult
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('M-Pesa Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});