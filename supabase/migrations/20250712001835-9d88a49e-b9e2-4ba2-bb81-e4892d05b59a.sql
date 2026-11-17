-- Update the encrypted password directly for Abel using the same algorithm
UPDATE auth.users 
SET encrypted_password = '$2a$10$' || md5('bondiola25' || 'abel_1752279314559@internal.app' || 'salt')
WHERE email = 'abel_1752279314559@internal.app';