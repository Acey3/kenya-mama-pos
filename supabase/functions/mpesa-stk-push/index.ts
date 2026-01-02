import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Safaricom Daraja Sandbox credentials
const CONSUMER_KEY = 'your_consumer_key';
const CONSUMER_SECRET = 'your_consumer_secret';
const PASSKEY = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
const SHORTCODE = '174379';
const CALLBACK_URL = 'https://htzcagxhnydzqdejpjps.supabase.co/functions/v1/mpesa-callback';

// Sandbox URLs
const AUTH_URL = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
const STK_URL = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

async function getAccessToken(): Promise<string> {
  const credentials = btoa(`${CONSUMER_KEY}:${CONSUMER_SECRET}`);
  
  const response = await fetch(AUTH_URL, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get access token');
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

function generatePassword(timestamp: string): string {
  const data = `${SHORTCODE}${PASSKEY}${timestamp}`;
  return btoa(data);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber, amount } = await req.json();

    console.log('M-Pesa STK Push request:', { phoneNumber, amount });

    if (!phoneNumber || !amount) {
      return new Response(
        JSON.stringify({ success: false, message: 'Phone number and amount are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For sandbox testing, simulate successful response
    // In production, uncomment the actual API call below
    
    const mockTransactionId = `MPESA${Date.now()}`;
    console.log('Sandbox mode: Simulating successful STK push');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'STK Push sent successfully (Sandbox Mode)',
        transactionId: mockTransactionId,
        checkoutRequestId: mockTransactionId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

    /* Production code - uncomment when you have real credentials:
    const accessToken = await getAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);

    const stkPayload = {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phoneNumber,
      PartyB: SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL: CALLBACK_URL,
      AccountReference: 'MamaDuka',
      TransactionDesc: 'Payment for goods',
    };

    const stkResponse = await fetch(STK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(stkPayload),
    });

    const stkResult = await stkResponse.json();
    console.log('STK Push response:', stkResult);

    if (stkResult.ResponseCode === '0') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'STK Push sent successfully',
          checkoutRequestId: stkResult.CheckoutRequestID,
          transactionId: stkResult.MerchantRequestID,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: stkResult.errorMessage || 'STK Push failed',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    */
  } catch (error) {
    console.error('M-Pesa STK Push error:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
