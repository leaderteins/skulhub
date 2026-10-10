/** Validate and sanitize input strings */
export function sanitizeString(input: unknown, maxLength = 1000): string {
  if (typeof input !== 'string') return ''
  return input.trim().slice(0, maxLength)
}

export function validateEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 255
}

export function validatePhone(phone: unknown): boolean {
  if (typeof phone !== 'string') return false
  const cleaned = phone.replace(/[\s+\-()]/g, '')
  return /^\d{9,15}$/.test(cleaned)
}

export function validateAmount(amount: unknown): number {
  const n = Number(amount)
  if (isNaN(n) || n < 0 || n > 10000000) return 0
  return n
}
