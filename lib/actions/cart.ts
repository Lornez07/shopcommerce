'use server';

import { revalidatePath } from 'next/cache';
import {
  createSupabaseRouteClient,
  createSupabaseServerClient
} from '@/lib/supabase/server';

export type CartVariant = { size?: string; color?: string };

export type CartLine = {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  image_url: string | null;
  unit_price_cents: number;
  quantity: number;
  variant: CartVariant;
  line_total_cents: number;
};

export type CartSummary = {
  items: CartLine[];
  item_count: number;
  subtotal_cents: number;
};

export type AddToCartResult =
  | { ok: true; itemCount: number }
  | { ok: false; error: string; reason?: 'auth' };

const EMPTY_CART: CartSummary = { items: [], item_count: 0, subtotal_cents: 0 };

type CartRow = {
  id: string;
  product_id: string;
  variant: CartVariant | null;
  quantity: number;
  products: {
    name: string;
    slug: string;
    base_price_cents: number;
    images: string[] | null;
  } | null;
};

function normaliseVariant(variant: CartVariant): CartVariant {
  const next: CartVariant = {};
  if (variant.size) next.size = variant.size;
  if (variant.color) next.color = variant.color;
  return next;
}

function sameVariant(a: CartVariant | null, b: CartVariant): boolean {
  const left = { size: a?.size ?? null, color: a?.color ?? null };
  const right = { size: b.size ?? null, color: b.color ?? null };
  return left.size === right.size && left.color === right.color;
}

export async function getCartSummary(): Promise<CartSummary> {
  // Called during RSC render by the cart page as well as from actions. This
  // client swallows cookie writes, which are illegal mid-render.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return EMPTY_CART;

  const { data: cart, error: cartError } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (cartError) throw new Error(`Could not load cart: ${cartError.message}`);
  if (!cart) return EMPTY_CART;

  const { data, error } = await supabase
    .from('cart_items')
    .select('id, product_id, variant, quantity, products(name, slug, base_price_cents, images)')
    .eq('cart_id', cart.id)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Could not load cart items: ${error.message}`);

  const items: CartLine[] = ((data ?? []) as unknown as CartRow[]).map((row) => {
    const product = row.products;
    const unit = product?.base_price_cents ?? 0;
    return {
      id: row.id,
      product_id: row.product_id,
      product_name: product?.name ?? 'Unavailable product',
      product_slug: product?.slug ?? '',
      image_url: product?.images?.[0] ?? null,
      unit_price_cents: unit,
      quantity: row.quantity,
      variant: row.variant ?? {},
      line_total_cents: unit * row.quantity
    };
  });

  return {
    items,
    item_count: items.reduce((total, item) => total + item.quantity, 0),
    subtotal_cents: items.reduce((total, item) => total + item.line_total_cents, 0)
  };
}

export async function getCartCount(): Promise<number> {
  const summary = await getCartSummary();
  return summary.item_count;
}

export async function addToCart(input: {
  productId: string;
  variant: CartVariant;
  quantity?: number;
}): Promise<AddToCartResult> {
  const quantity = Math.max(1, Math.floor(input.quantity ?? 1));
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: 'Sign in to add items to your cart.', reason: 'auth' };
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('id', input.productId)
    .eq('is_active', true)
    .maybeSingle();

  if (productError) return { ok: false, error: productError.message };
  if (!product) return { ok: false, error: 'That product is no longer available.' };

  const { data: existingCart, error: existingError } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingError) return { ok: false, error: existingError.message };

  let cartId = existingCart?.id;

  if (!cartId) {
    const { data: created, error: createError } = await supabase
      .from('carts')
      .insert({ user_id: user.id })
      .select('id')
      .single();

    if (createError) {
      // Another request may have created the cart between our read and insert.
      const { data: retry } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!retry) return { ok: false, error: createError.message };
      cartId = retry.id;
    } else {
      cartId = created.id;
    }
  }

  const variant = normaliseVariant(input.variant);

  const { data: lines, error: linesError } = await supabase
    .from('cart_items')
    .select('id, product_id, variant, quantity')
    .eq('cart_id', cartId);

  if (linesError) return { ok: false, error: linesError.message };

  const match = (lines ?? []).find(
    (line) =>
      line.product_id === input.productId &&
      sameVariant(line.variant as CartVariant | null, variant)
  );

  if (match) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: match.quantity + quantity })
      .eq('id', match.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from('cart_items').insert({
      cart_id: cartId,
      product_id: input.productId,
      variant,
      quantity
    });
    if (error) return { ok: false, error: error.message };
  }

  const summary = await getCartSummary();
  revalidatePath('/cart');
  revalidatePath('/product/' + input.productId);

  return { ok: true, itemCount: summary.item_count };
}

export type CartMutationResult =
  | { ok: true; data: CartSummary }
  | { ok: false; error: string; reason?: 'auth' };

async function requireUser() {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function updateCartItemQuantity(
  itemId: string,
  quantity: number
): Promise<CartMutationResult> {
  const next = Math.floor(quantity);

  if (!Number.isFinite(next) || next < 1) {
    return { ok: false, error: 'Quantity must be at least 1.' };
  }
  if (next > 99) {
    return { ok: false, error: 'Maximum quantity per item is 99.' };
  }

  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: 'Sign in to edit your cart.', reason: 'auth' };

  // .select() is required to tell "updated" from "RLS silently matched nothing".
  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity: next })
    .eq('id', itemId)
    .select('id');

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: 'That item is no longer in your cart.' };
  }

  revalidatePath('/cart');
  return { ok: true, data: await getCartSummary() };
}

export async function removeCartItem(itemId: string): Promise<CartMutationResult> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: 'Sign in to edit your cart.', reason: 'auth' };

  const { data, error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId)
    .select('id');

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: 'That item is no longer in your cart.' };
  }

  revalidatePath('/cart');
  return { ok: true, data: await getCartSummary() };
}