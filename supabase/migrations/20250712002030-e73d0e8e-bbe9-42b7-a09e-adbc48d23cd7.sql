-- Update Abel's password to "abelrocco" using the correct algorithm
UPDATE auth.users 
SET encrypted_password = '$2a$10$' || md5('abelrocco' || 'abel_1752279314559@internal.app' || 'salt')
WHERE email = 'abel_1752279314559@internal.app';