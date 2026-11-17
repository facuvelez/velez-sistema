-- 1.2C: Normalizar emails en auth.users
UPDATE auth.users u
SET email = lower(p.username) || '@internal.app',
    email_confirmed_at = COALESCE(u.email_confirmed_at, now()),
    updated_at = now()
FROM public.profiles p
WHERE p.user_id = u.id
  AND u.email IS DISTINCT FROM (lower(p.username) || '@internal.app');

-- Sincronizar auth.identities (solo identity_data; el campo email es generado y se recalcula solo)
UPDATE auth.identities i
SET identity_data = jsonb_set(
      jsonb_set(
        COALESCE(i.identity_data, '{}'::jsonb),
        '{email}',
        to_jsonb(lower(p.username) || '@internal.app')
      ),
      '{email_verified}',
      'true'::jsonb
    ),
    updated_at = now()
FROM public.profiles p
WHERE i.user_id = p.user_id
  AND i.provider = 'email';
