/**
 * Category Normalization and Subcategory Keyword Matching Utility
 * Maps natural language user requirements to authoritative catalog categories.
 */

export const CANONICAL_CATEGORIES = [
  'laptops',
  'monitors',
  'keyboards',
  'mice',
  'headphones',
  'furniture',
  'accessories',
] as const;

export type CanonicalCategoryId = (typeof CANONICAL_CATEGORIES)[number];

export function normalizeCategoryId(input: string): CanonicalCategoryId {
  if (!input) return 'accessories';
  const s = input.trim().toLowerCase().replace(/[-_\s]+/g, ' ');

  // 1. Direct canonical match
  if (CANONICAL_CATEGORIES.includes(s as CanonicalCategoryId)) {
    return s as CanonicalCategoryId;
  }

  // 2. Lamps, Lighting & ScreenBars (must precede 'screen' check in monitors!)
  if (
    s.includes('screenbar') ||
    s.includes('lamp') ||
    s.includes('light bar') ||
    s.includes('task lamp') ||
    s.includes('desk lamp') ||
    s.includes('lighting') ||
    s.includes('illumination')
  ) {
    return 'accessories';
  }

  // 3. Monitors & Displays
  if (
    s.includes('monitor') ||
    s.includes('display') ||
    s.includes('screen') ||
    s.includes('panel')
  ) {
    return 'monitors';
  }

  // 4. Keyboards
  if (
    s.includes('keyboard') ||
    s.includes('keypad') ||
    s.includes('typing') ||
    s.includes('switch')
  ) {
    return 'keyboards';
  }

  // 5. Mice
  if (
    s.includes('mouse') ||
    s.includes('mice') ||
    s.includes('trackball') ||
    s.includes('pointer') ||
    s.includes('trackpad')
  ) {
    return 'mice';
  }

  // 6. Headphones & Audio
  if (
    s.includes('headphone') ||
    s.includes('headset') ||
    s.includes('earphone') ||
    s.includes('earbud') ||
    s.includes('audio monitor') ||
    s.includes('listening')
  ) {
    return 'headphones';
  }

  // 7. Laptops & Mobile Workstations
  if (
    s.includes('laptop') ||
    s.includes('notebook') ||
    s.includes('ultrabook') ||
    s.includes('macbook') ||
    s.includes('thinkpad') ||
    s.includes('computer')
  ) {
    return 'laptops';
  }

  // 8. Furniture (desks, chairs, seating - excluding desk lamp which was caught above)
  if (
    s === 'furniture' ||
    s.includes('chair') ||
    s.includes('seating') ||
    s.includes('desk') ||
    s.includes('table') ||
    s.includes('stool')
  ) {
    return 'furniture';
  }

  // 9. Accessories (mics, mounts, arms, docks, cables, etc.)
  if (
    s.includes('mic') ||
    s.includes('dock') ||
    s.includes('hub') ||
    s.includes('mount') ||
    s.includes('arm') ||
    s.includes('cable') ||
    s.includes('pad') ||
    s.includes('webcam') ||
    s.includes('filter') ||
    s.includes('dongle') ||
    s.includes('accessory') ||
    s.includes('accessories')
  ) {
    return 'accessories';
  }

  return 'accessories';
}
