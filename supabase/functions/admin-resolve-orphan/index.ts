import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const ALLOWED_ROLES = ['Administrator', 'Administracion', 'Operator', 'Alineador'] as const;

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

    const body = await req.json().catch(() => null);
    const userId = (body?.user_id ?? '').toString();
    const action = (body?.action ?? '').toString();
    const role = (body?.role ?? 'Operator').toString();

    if (!userId || !['delete', 'create_profile'].includes(action)) {
      return new Response(JSON.stringify({ error: 'Parámetros inválidos' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (action === 'delete') {
      const { error: delErr } = await admin.auth.admin.deleteUser(userId);
      if (delErr) {
        return new Response(JSON.stringify({ error: delErr.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // Cleanup por si quedó profile
      await admin.from('profiles').delete().eq('user_id', userId);
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // action === 'create_profile'
    if (!ALLOWED_ROLES.includes(role as any)) {
      return new Response(JSON.stringify({ error: 'Rol inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: userData, error: getErr } = await admin.auth.admin.getUserById(userId);
    if (getErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado en auth' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const email = (userData.user.email ?? '').toLowerCase();
    const username = email.replace('@internal.app', '') || (userData.user.user_metadata?.username ?? 'user');

    const { error: upsertErr } = await admin
      .from('profiles')
      .upsert({ user_id: userId, username, role }, { onConflict: 'user_id' });

    if (upsertErr) {
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, username, role }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('admin-resolve-orphan fatal:', e);
    return new Response(JSON.stringify({ error: e?.message || 'Error inesperado' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
