# Photography

Drop the shop's photographs in this folder, then point each slot at its file
from **`/admin/site` → Photography**. Nothing here is referenced by filename
in code, so the names below are a convention, not a requirement — the admin
field is what actually selects the image.

## The slots

| Slot | Suggested file | Crop | Where it appears |
|---|---|---|---|
| Hero backdrop | `hero.jpg` | 16:9, wide | Behind the AQUA TCG lockup. **Optional** — left empty, the hero stays the flat ocean field it is now. |
| Singles wall | `wall.jpg` | 21:9, very wide | The full-bleed band between the wall reel and "what we stock". The showpiece. |
| At the counter | `counter.jpg` | 4:3 | Beside the "priced off live eBay UK data" copy. |
| James & Lewis | `founders.jpg` | 4:5, portrait | The story panel. |
| The shopfront | `storefront.jpg` | 16:9 | Leads "Visit us". Get the signage in frame. |

Set the alt text alongside each one in the same admin screen — it ships with
a sensible default, but if you swap a photo for a different subject, update
it to match.

## Sources

Two forms work:

- **A path under `/public`** — e.g. `/photography/wall.jpg`. Preferred:
  these are served through the Next image optimiser, so they are resized and
  converted per device.
- **A full `https://` URL** — served as-is, unoptimised, so any host works
  without touching `next.config.ts`. Fine for a quick swap; a local file is
  better for anything permanent.

## Sizing

Export at roughly **2× the largest display size** and let the optimiser do
the rest:

- wall band — 2400px wide
- hero backdrop, shopfront — 2000px wide
- counter, founders — 1200px wide

JPEG at quality 80 is plenty; the duotone treatment (see below) flattens
subtle tonal detail anyway.

## What the page does to them

Photographs do not appear raw. `components/marketing/PhotoFrame.tsx` applies
the house treatment so they sit inside the brand rather than on top of it:

- the pop-art frame — 3px ink outline, hard offset shadow;
- a duotone wash — `mix-blend-color` in ocean, which keeps the photograph's
  luminance (faces and card art stay readable) while pulling its hue toward
  the brand blue;
- the halftone dot grid used on the hero and story grounds;
- a wave seam on the bottom edge, in the ground colour below, so the photo
  rises out of the section instead of sitting on it.

This means you do **not** need to colour-grade anything before uploading.
Shoot it straight, upload it straight — consistency comes from the treatment,
not from the source files.

## Before any photo exists

Every slot renders a designed panel — wave crests, dot grid, the slot's
title in Archivo Black — rather than a gap or a broken image. The page is
presentable with zero photographs supplied, and each one you add upgrades a
panel in place. There is no half-finished state to avoid shipping.
