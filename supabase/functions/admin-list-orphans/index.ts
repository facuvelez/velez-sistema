import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !caller) {
      return new Response(JSON.stringify({ error: 'Sesión inválida' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: callerProfile } = await callerClient
      .from('profiles')
      .select('role')
      .eq('user_id', caller.id)
      .maybeSingle();

    if (callerProfile?.role !== 'Administrator') {
      return new Response(JSON.stringify({ error: 'Solo administradores' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Reunir todos los auth users (paginado)
    const authUsers: { id: string; email: string; created_at: string }[] = [];
    let page = 1;
    const perPage = 200;
    while (true) {
      const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page, perPage });
      if (listErr) throw listErr;
      for (const u of listData.users) {
        authUsers.push({ id: u.id, email: (u.email ?? '').toLowerCase(), created_at: u.created_at });
      }
      if (listData.users.length < perPage) break;
      page++;
    }

    const { data: profileRows, error: profErr } = await admin
      .from('profiles')
      .select('user_id');
    if (profErr) throw profErr;

    const profileIds = new Set((profileRows ?? []).map((p: any) => p.user_id));

    const orphans = authUsers
      .filter((u) => u.email.endsWith('@internal.app') && !profileIds.has(u.id))
      .map((u) => ({
        user_id: u.id,
        email: u.email,
        username: u.email.replace('@internal.app', ''),
        created_at: u.created_at,
      }));

    return new Response(JSON.stringify({ orphans }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('admin-list-orphans fatal:', e);
    return new Response(JSON.stringify({ error: e?.message || 'Error inesperado' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
