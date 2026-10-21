-- seed.sql — development content only.
-- NOT for production. Idempotent: re-running updates by slug.
-- Photography: Unsplash (unsplash.com/license), hotlinked from their CDN.
-- These are stand-in shots for the portfolio build. Replace them with your
-- own product photography before this runs as a real shop: each entry below
-- is a single URL, and the edit is local to this file.

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------

insert into public.categories (name, slug, description, image_url, sort_order)
values
  ('Ceramics', 'ceramics', 'Hand-thrown mugs, bowls and platters. Every piece is a slightly different shape.', 'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=750&q=80', 10),
  ('Textiles', 'textiles', 'Linen aprons, tea towels and napkins that soften with every wash.', 'https://images.unsplash.com/photo-1762539747176-5d8f166346de?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=750&q=80', 20),
  ('Pantry', 'pantry', 'Small-batch salts, preserves and coffee from makers we buy from ourselves.', 'https://images.unsplash.com/photo-1640348784724-93f7b14d8047?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=750&q=80', 30),
  ('Tools', 'tools', 'Wooden spoons, knives and prep gear built to be used daily.', 'https://images.unsplash.com/photo-1772453609632-2f4aa857f56e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=750&q=80', 40),
  ('Gifts', 'gifts', 'Boxed sets for housewarmings, thank-yous and the people who have everything.', 'https://images.unsplash.com/photo-1766425221306-4d44f4011d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=750&q=80', 50)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------

-- Keep the catalogue at 12 so /category/all fills 4x3, 3x4, 2x6 and 1x12
-- evenly at every breakpoint. Removes the older 13th product on re-seed.
delete from public.products where slug = 'weekend-host-set';

insert into public.products
  (category_id, name, slug, description, base_price_cents, images, variants, is_active, sort_order)
values
  (
    (select id from public.categories where slug = 'ceramics'),
    'Ridgeline Mug', 'ridgeline-mug',
    'A straight-sided mug with a thumb rest that lands where your hand already goes. Holds 350 ml to the brim, 300 ml comfortably. Glazed inside and out, dishwasher safe.',
    2800,
    array['https://images.unsplash.com/photo-1782351094137-14cef7134c18?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=1500&q=80'],
    '{"sizes":["250 ml","350 ml"],"colors":[{"name":"Salt","hex":"#EFEAE1"},{"name":"Ember","hex":"#C8552F"},{"name":"Ink","hex":"#232531"}]}'::jsonb,
    true, 10
  ),
  (
    (select id from public.categories where slug = 'ceramics'),
    'Low Tide Bowl', 'low-tide-bowl',
    'Wide, shallow bowl that works for noodles, salad or keys by the door. Unglazed foot ring keeps it steady.',
    3400,
    array['https://images.unsplash.com/photo-1587560555570-4d3f84dcee05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=1500&q=80'],
    '{"sizes":["Small","Large"],"colors":[{"name":"Bone","hex":"#F2EDE4"},{"name":"Slate","hex":"#5D6468"}]}'::jsonb,
    true, 20
  ),
  (
    (select id from public.categories where slug = 'ceramics'),
    'Field Platter', 'field-platter',
    'Long oval platter for a whole fish or a pile of roasted vegetables. Thrown, trimmed by hand, fired twice.',
    5200,
    array['https://images.unsplash.com/photo-1705948731485-6e4c6c180d0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=1500&q=80'],
    '{"sizes":["One size"],"colors":[{"name":"Cream","hex":"#EDE4D6"}]}'::jsonb,
    true, 30
  ),
  (
    (select id from public.categories where slug = 'textiles'),
    'Everyday Apron', 'everyday-apron',
    'Mid-weight linen with cross-back straps that stay off your neck. Two deep pockets, one small one for a phone. Washed before it ships, so it will not shrink on you.',
    6800,
    array['https://images.unsplash.com/photo-1729774091978-9811d5541a34?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=1500&q=80'],
    '{"sizes":["S/M","L/XL"],"colors":[{"name":"Clay","hex":"#B4684C"},{"name":"Ink","hex":"#232531"},{"name":"Oat","hex":"#D9CDB8"}]}'::jsonb,
    true, 10
  ),
  (
    (select id from public.categories where slug = 'textiles'),
    'Linen Tea Towel', 'linen-tea-towel',
    'Absorbs better than cotton and dries fast. Woven in a small mill in Lithuania, hemmed by hand.',
    1800,
    array['https://images.unsplash.com/photo-1591625591034-75d303d2e1a4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=1500&q=80'],
    '{"sizes":["One size"],"colors":[{"name":"Stripe","hex":"#C9C3B6"},{"name":"Plain","hex":"#E8E2D6"}]}'::jsonb,
    true, 20
  ),
  (
    (select id from public.categories where slug = 'textiles'),
    'Half-Moon Napkins, Set of 4', 'half-moon-napkins',
    'Circular napkins cut from the same linen as the aprons. They sit flat, wash well, and look better creased.',
    4200,
    array['https://images.unsplash.com/photo-1523212727988-82c430c79c8e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=1500&q=80'],
    '{"sizes":["Set of 4"],"colors":[{"name":"Olive","hex":"#6E7358"},{"name":"Rust","hex":"#A9502F"}]}'::jsonb,
    true, 30
  ),
  (
    (select id from public.categories where slug = 'pantry'),
    'Smoked Chili Salt', 'smoked-chili-salt',
    'Sea salt smoked over oak, then mixed with crushed Urfa chili. Good on eggs, tomatoes, and anything off the grill.',
    1400,
    array['https://images.unsplash.com/photo-1594813592990-2449cd47da8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=1500&q=80'],
    '{"sizes":["100 g","250 g"],"colors":[]}'::jsonb,
    true, 10
  ),
  (
    (select id from public.categories where slug = 'pantry'),
    'Fig and Black Pepper Preserve', 'fig-black-pepper-preserve',
    'Figs cooked down with a little sugar and a lot of cracked pepper. Sharp enough for cheese, sweet enough for toast.',
    1200,
    array['https://images.unsplash.com/photo-1635341814161-d696d538542c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=1500&q=80'],
    '{"sizes":["250 ml"],"colors":[]}'::jsonb,
    true, 20
  ),
  (
    (select id from public.categories where slug = 'pantry'),
    'Single-Origin Filter Coffee', 'single-origin-filter-coffee',
    'Washed Ethiopian, roasted weekly. Tastes like bergamot and apricot, not like a candle. Whole bean unless you ask otherwise.',
    1900,
    array['https://images.unsplash.com/photo-1695245503558-5cdb37f49092?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=1500&q=80'],
    '{"sizes":["250 g","1 kg"],"colors":[]}'::jsonb,
    true, 30
  ),
  (
    (select id from public.categories where slug = 'tools'),
    'Olive Wood Spoon', 'olive-wood-spoon',
    'One piece of olive wood, no glue. The bowl is deep enough for stew and shallow enough to scrape a pan.',
    2200,
    array['https://images.unsplash.com/photo-1538928760374-76c912ceddb7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=1500&q=80'],
    '{"sizes":["Small","Large"],"colors":[]}'::jsonb,
    true, 10
  ),
  (
    (select id from public.categories where slug = 'tools'),
    'Carbon Steel Paring Knife', 'carbon-steel-paring-knife',
    'A short, stiff blade for small work. Carbon steel takes an edge fast and will patina — keep it dry.',
    4600,
    array['https://images.unsplash.com/photo-1577431758723-481972426a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=1500&q=80'],
    '{"sizes":["One size"],"colors":[]}'::jsonb,
    true, 20
  ),
  (
    (select id from public.categories where slug = 'gifts'),
    'Morning Ritual Box', 'morning-ritual-box',
    'Two Ridgeline mugs, a bag of filter coffee and the smoked chili salt. Packed in a recycled board box with a hand-written card.',
    9600,
    array['https://images.unsplash.com/photo-1764764138546-cedd1745362b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=1500&q=80'],
    '{"sizes":["One size"],"colors":[]}'::jsonb,
    true, 10
  )
on conflict (slug) do update set
  category_id = excluded.category_id,
  name = excluded.name,
  description = excluded.description,
  base_price_cents = excluded.base_price_cents,
  images = excluded.images,
  variants = excluded.variants,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;
