
-- Reset passwords for users with corrupted bcrypt hashes (len != 60)
UPDATE auth.users SET encrypted_password = crypt('abelrocco', gen_salt('bf')), updated_at = now() WHERE email = 'abel@internal.app';
UPDATE auth.users SET encrypted_password = crypt('jani', gen_salt('bf')), updated_at = now() WHERE email = 'jani@internal.app';
UPDATE auth.users SET encrypted_password = crypt('leo', gen_salt('bf')), updated_at = now() WHERE email = 'leo@internal.app';
