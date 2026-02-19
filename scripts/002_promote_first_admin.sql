-- Run this AFTER you sign up to promote your account to admin.
-- Replace the email below with the email you used to sign up.
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'YOUR_EMAIL_HERE';
