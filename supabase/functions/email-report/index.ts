import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64, reportName, userEmail } = await req.json();

    if (!pdfBase64 || !userEmail) throw new Error('PDF Data and email are required');

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (!RESEND_API_KEY) {
        throw new Error('Email service not configured');
    }

    // Remove the data URI prefix if it exists (e.g., "data:application/pdf;base64,")
    const cleanBase64 = pdfBase64.includes('base64,') ? pdfBase64.split('base64,')[1] : pdfBase64;

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Mama Duka Reports <onboarding@resend.dev>',
        to: [userEmail],
        subject: `📊 POS Report Export: ${reportName}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Your Report is Ready</h2>
            <p>Please find your exported report <strong>${reportName}</strong> attached as a PDF file.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </div>
        `,
        attachments: [
          {
            content: cleanBase64,
            filename: `${reportName.replace(/\s+/g, '_')}.pdf`,
          },
        ],
      }),
    });

    const res = await emailResponse.json();

    return new Response(JSON.stringify(res), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
