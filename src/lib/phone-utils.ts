/**
 * Normalize a Kenyan phone number to the canonical +2547XXXXXXXX form.
 * Accepts 0712XXXXXX, 0112XXXXXX, 254712XXXXXX, +254712XXXXXX, with
 * spaces, dashes or parentheses.
 *
 * If the number doesn't match a recognized Kenyan pattern it is returned
 * stripped of common separators so it can still be compared verbatim.
 */
export function normalizePhone(phone: string): string {
  if (!phone) return ''
  let p = phone.trim().replace(/[\s\-()]/g, '')
  // 07XXXXXXXXX or 01XXXXXXXXX (10 digits, leading 0) → +2547XXXXXXXXX
  if (/^0\d{9}$/.test(p)) p = '+254' + p.slice(1)
  // 2547XXXXXXXXX or 2541XXXXXXXXX (12 digits, no +) → +2547XXXXXXXXX
  else if (/^254\d{9}$/.test(p)) p = '+' + p
  return p
}

/** Loose equality check that tolerates formatting differences. */
export function phonesMatch(a: string, b: string): boolean {
  return normalizePhone(a) === normalizePhone(b)
}
