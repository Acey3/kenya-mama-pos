import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { record } = await req.json(); // Data from Supabase Webhook
    
    if (!record) throw new Error('No record found');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Get the business owner's email
    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .select('business_name, owner_id')
      .eq('id', record.business_id)
      .single();

    if (bizError || !business) throw new Error('Business not found');

    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(business.owner_id);
    
    if (userError || !user?.email) throw new Error('Owner email not found');

    // 2. Send Email via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (!RESEND_API_KEY) {
        console.error("RESEND_API_KEY not set");
        return new Response(JSON.stringify({ success: false, message: "Email service not configured" }), { status: 500 });
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev', // You need a verified domain in Resend
        to: [user.email],
        subject: `⚠️ Low Stock Alert: ${record.name}`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #d97706;">Low Stock Warning</h2>
            <p>Hello owner of <strong>${business.business_name}</strong>,</p>
            <p>This is an automated alert that one of your products is running low on stock.</p>
            <hr />
            <table style="width: 100%; text-align: left;">
              <tr><th>Product</th><td>${record.name}</td></tr>
              <tr><th>Current Stock</th><td style="color: #dc2626; font-weight: bold;">${record.stock}</td></tr>
              <tr><th>Threshold</th><td>${record.low_stock_threshold}</td></tr>
              <tr><th>Category</th><td>${record.category}</td></tr>
            </table>
            <hr />
            <p>Please log in to your POS dashboard to update your inventory.</p>
            <a href="https://mamaduka.com/dashboard/stock" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Manage Stock</a>
          </div>
        `,
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
