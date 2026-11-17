import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type, x-webhook-secret',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const N8N_WEBHOOK_SECRET = Deno.env.get('N8N_WEBHOOK_SECRET')!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const secret = req.headers.get('X-Webhook-Secret');
  if (!secret || !N8N_WEBHOOK_SECRET || secret !== N8N_WEBHOOK_SECRET) {
    return json({ error: 'No autorizado' }, 401);
  }

  try {
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await sb
      .from('suppliers')
      .select('name')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('list-active-suppliers db error:', error);
      return json({ error: error.message }, 500);
    }

    const suppliers = (data || []).map((s) => s.name);
    return json({ suppliers });
  } catch (e) {
    console.error('list-active-suppliers error:', (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});
