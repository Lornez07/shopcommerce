'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createSupabaseRouteClient } from '@/lib/supabase/server';

export type Address = {
  id: string;
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
};

export type AddressInput = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  is_default?: boolean;
};

export type AddressResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const addressSchema = z.object({
  name: z.string().trim().min(1, 'Enter a recipient name.').max(120, 'Keep it under 120 characters.'),
  line1: z.string().trim().min(1, 'Enter a street address.').max(200, 'Keep it under 200 characters.'),
  line2: z.string().trim().max(200, 'Keep it under 200 characters.').optional(),
  city: z.string().trim().min(1, 'Enter a city.').max(120, 'Keep it under 120 characters.'),
  state: z
    .string()
    .trim()
    .length(2, 'Use the 2-letter state code.')
    .regex(/^[A-Za-z]{2}$/, 'Use the 2-letter state code.'),
  postal_code: z
    .string()
    .trim()
    .regex(/^[0-9]{5}(-[0-9]{4})?$/, 'Enter a 5-digit US postcode.'),
  is_default: z.boolean().optional()
});

function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !(key in fields)) {
      fields[key] = issue.message;
    }
  }

  return fields;
}

async function requireUser() {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createAddress(input: AddressInput): Promise<AddressResult> {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Check the highlighted fields.',
      fieldErrors: toFieldErrors(parsed.error)
    };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: 'Sign in to save an address.' };

  const { count } = await supabase
    .from('addresses')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // The first address is always the default, otherwise honour the checkbox.
  const makeDefault = parsed.data.is_default === true || (count ?? 0) === 0;

  if (makeDefault) {
    const { error: clearError } = await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);
    if (clearError) return { ok: false, error: clearError.message };
  }

  const { error } = await supabase.from('addresses').insert({
    user_id: user.id,
    name: parsed.data.name,
    line1: parsed.data.line1,
    line2: parsed.data.line2 ? parsed.data.line2 : null,
    city: parsed.data.city,
    state: parsed.data.state.toUpperCase(),
    postal_code: parsed.data.postal_code,
    is_default: makeDefault
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath('/account');
  return { ok: true };
}

export async function updateAddress(id: string, input: AddressInput): Promise<AddressResult> {
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Check the highlighted fields.',
      fieldErrors: toFieldErrors(parsed.error)
    };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: 'Sign in to edit this address.' };

  if (parsed.data.is_default === true) {
    const { error: clearError } = await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .neq('id', id);
    if (clearError) return { ok: false, error: clearError.message };
  }

  const { data, error } = await supabase
    .from('addresses')
    .update({
      name: parsed.data.name,
      line1: parsed.data.line1,
      line2: parsed.data.line2 ? parsed.data.line2 : null,
      city: parsed.data.city,
      state: parsed.data.state.toUpperCase(),
      postal_code: parsed.data.postal_code,
      is_default: parsed.data.is_default === true
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id');

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) return { ok: false, error: 'That address no longer exists.' };

  revalidatePath('/account');
  return { ok: true };
}

export async function deleteAddress(id: string): Promise<AddressResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: 'Sign in to delete this address.' };

  const { data, error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id');

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) return { ok: false, error: 'That address no longer exists.' };

  revalidatePath('/account');
  return { ok: true };
}

export async function setDefaultAddress(id: string): Promise<AddressResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: 'Sign in to change your default address.' };

  // Clear first: if the second write fails the user is left with no default,
  // which is visible and recoverable. The reverse order could leave two.
  const { error: clearError } = await supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', user.id)
    .neq('id', id);
  if (clearError) return { ok: false, error: clearError.message };

  const { data, error } = await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id');

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) return { ok: false, error: 'That address no longer exists.' };

  revalidatePath('/account');
  return { ok: true };
}
