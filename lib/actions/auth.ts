'use server';

import { headers } from 'next/headers';
import { createSupabaseRouteClient } from '@/lib/supabase/server';

export type MagicLinkResult = { ok: true } | { ok: false; error: string };

function looksLikeEmail(value: string): boolean {
  const at = value.indexOf('@');
  if (at < 1) return false;
  const domain = value.slice(at + 1);
  return domain.includes('.') && !domain.startsWith('.') && !domain.endsWith('.');
}

export async function signInWithMagicLink(
  email: string,
  redirectTo: string
): Promise<MagicLinkResult> {
  const trimmed = email.trim().toLowerCase();

  if (!looksLikeEmail(trimmed)) {
    return { ok: false, error: 'Enter a valid email address.' };
  }

  const headerList = await headers();
  const host = headerList.get('host') ?? 'localhost:3000';
  const protocol =
    headerList.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  const origin = protocol + '://' + host;
  const next = redirectTo.startsWith('/') ? redirectTo : '/';

  const supabase = await createSupabaseRouteClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: {
      emailRedirectTo: origin + '/callback?next=' + encodeURIComponent(next)
    }
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseRouteClient();
  await supabase.auth.signOut();
}