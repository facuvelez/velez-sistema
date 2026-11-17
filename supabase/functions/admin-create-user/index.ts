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
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validar JWT del caller con anon key + el token enviado
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !caller) {
      return new Response(JSON.stringify({ error: 'Sesión inválida' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verificar que el caller sea Administrator
    const { data: callerProfile, error: profileErr } = await callerClient
      .from('profiles')
      .select('role')
      .eq('user_id', caller.id)
      .maybeSingle();

    if (profileErr || callerProfile?.role !== 'Administrator') {
      return new Response(JSON.stringify({ error: 'Solo administradores pueden crear usuarios' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => null);
    const username = (body?.username ?? '').toString().trim();
    const password = (body?.password ?? '').toString();
    const role = (body?.role ?? 'Operator').toString();

    if (!username || username.length < 2) {
      return new Response(JSON.stringify({ error: 'Username inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!password || password.length < 6) {
      return new Response(JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!ALLOWED_ROLES.includes(role as any)) {
      return new Response(JSON.stringify({ error: 'Rol inválido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Pre-check: username único en profiles (case-insensitive)
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .maybeSingle();

    if (existingProfile) {
      return new Response(JSON.stringify({ error: 'Ya existe un usuario con ese nombre de usuario' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const email = `${username.toLowerCase()}@internal.app`;

    // Pre-check: email ya registrado en auth.users (usuario huérfano sin profile)
    let orphanFound = false;
    try {
      let page = 1;
      const perPage = 200;
      while (true) {
        const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ page, perPage });
        if (listErr) break;
        const match = listData.users.find((u) => (u.email ?? '').toLowerCase() === email);
        if (match) { orphanFound = true; break; }
        if (listData.users.length < perPage) break;
        page++;
      }
    } catch (e) {
      console.error('listUsers error:', e);
    }

    if (orphanFound) {
      return new Response(JSON.stringify({
        error: 'Ya existe un usuario con ese nombre de usuario (huérfano en auth). Resolvelo desde "Usuarios huérfanos".',
        orphan: true,
      }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, role },
    });

    if (createErr || !created?.user) {
      console.error('createUser error:', createErr);
      const isEmailExists = (createErr as any)?.code === 'email_exists' || (createErr as any)?.status === 422;
      const msg = isEmailExists
        ? 'Ya existe un usuario con ese nombre de usuario'
        : (createErr?.message || 'Error al crear usuario');
      return new Response(JSON.stringify({ error: msg, orphan: isEmailExists }), {
        status: isEmailExists ? 409 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }


    // Upsert profile (el trigger handle_new_user lo intenta, pero forzamos por si falla)
    const { error: profileInsertErr } = await admin
      .from('profiles')
      .upsert({
        user_id: created.user.id,
        username,
        role,
      }, { onConflict: 'user_id' });

    if (profileInsertErr) {
      console.error('profile upsert error:', profileInsertErr);
    }

    return new Response(JSON.stringify({ success: true, user_id: created.user.id, username, email }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('admin-create-user fatal:', e);
    return new Response(JSON.stringify({ error: e?.message || 'Error inesperado' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
