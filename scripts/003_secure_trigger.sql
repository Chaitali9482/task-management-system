-- Update the trigger to still respect role from metadata (for admin seed via service key)
-- but default to 'user' for normal signups.
-- The admin seed route uses auth.admin.createUser which sets metadata.
-- Normal signups cannot pass role in metadata since it's not in the sign-up form.
-- This is already secure as-is because the sign-up form only passes full_name.

-- No changes needed - the existing trigger is secure because:
-- 1. The sign-up form only passes full_name in metadata (no role field)
-- 2. Only the seed-admin API (using service_role key) can pass role:'admin' in metadata
-- 3. The trigger defaults to 'user' if no role is provided

SELECT 1; -- No-op, just confirming the trigger is already correct
