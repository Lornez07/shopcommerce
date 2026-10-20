import { createClient } from '@supabase/supabase-js';

/**
 * A JWT signed for the anon role looks exactly like a service role key until you
 * decode it, and the only symptom is "violates row-level security policy" three
 * layers away. Fail here instead.
 */
function assertServiceRoleKey(key: string) {
  const payload = key.split('.')[1];
  if (!payload) return; // newer sb_secret_ keys are not JWTs

  let role: string | undefined;
  try {
    role = JSON.parse(Buffer.from(payload, 'base64').toString('utf8')).role;
  } catch {
    return;
  }

  if (role && role !== 'service_role') {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY holds a "' +
        role +
        '" key. The webhook needs the service_role key, otherwise RLS rejects every write.'
    );
  }
}

/**
 * Service-role client. Bypasses RLS.
 *
 * Only for trusted server code that runs without a user session — the Stripe
 * webhook is the one caller. Never import this into a Client Component.
 */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase service role credentials are missing from the environment.');
  }

  assertServiceRoleKey(key);

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
