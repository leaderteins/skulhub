// src/lib/mpesa.ts
// Safaricom Daraja M-Pesa STK Push integration utilities.
//
// Daraja API docs: https://developer.safaricom.co.ke
//
// Endpoints (sandbox):
//   OAuth:    https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials
//   STK Push: https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest
//   Query:    https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query
//
// Endpoints (production):
//   OAuth:    https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials
//   STK Push: https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest
//   Query:    https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query
//
// All network calls are server-side only. This module is imported only from
// API routes / server components.

import type { School } from '@prisma/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Subset of the School model needed for Daraja calls. */
export interface MpesaSchool {
  id: string
  name: string
  mpesaConsumerKey: string | null
  mpesaConsumerSecret: string | null
  mpesaPasskey: string | null
  mpesaShortcode: string | null
  mpesaEnv: string
  mpesaCallbackUrl: string | null
  mpesaAccountRef: string | null
}

export interface MpesaConfigStatus {
  configured: boolean
  missing: string[]
  env: 'sandbox' | 'production'
  shortcode: string | null
  callbackUrl: string | null
}

export interface OAuthResult {
  access_token: string
  expires_in: number
}

export interface StkPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
}

export interface StkPushError {
  requestId?: string
  errorCode?: string
  errorMessage?: string
}

export interface CallbackMetadataItem {
  Name: string
  Value?: string | number
}

export interface CallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResultCode: number
      ResultDesc: string
      CallbackMetadata?: { Item: CallbackMetadataItem[] }
    }
  }
}

export interface ParsedCallback {
  checkoutRequestId: string
  merchantRequestId: string
  resultCode: number
  resultDesc: string
  success: boolean
  amount?: number
  mpesaReceiptNumber?: string
  balance?: string
  transactionDate?: string
  phoneNumber?: string
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function mpesaBaseUrl(env: string): string {
  return env === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'
}

function oauthUrl(env: string): string {
  return `${mpesaBaseUrl(env)}/oauth/v1/generate?grant_type=client_credentials`
}

function stkPushUrl(env: string): string {
  return `${mpesaBaseUrl(env)}/mpesa/stkpush/v1/processrequest`
}

function stkQueryUrl(env: string): string {
  return `${mpesaBaseUrl(env)}/mpesa/stkpushquery/v1/query`
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Determine whether a School has the minimum Daraja credentials configured. */
export function getMpesaConfigStatus(school: MpesaSchool): MpesaConfigStatus {
  const missing: string[] = []
  if (!school.mpesaConsumerKey) missing.push('Consumer Key')
  if (!school.mpesaConsumerSecret) missing.push('Consumer Secret')
  if (!school.mpesaPasskey) missing.push('Passkey')
  if (!school.mpesaShortcode) missing.push('Shortcode')
  return {
    configured: missing.length === 0,
    missing,
    env: school.mpesaEnv === 'production' ? 'production' : 'sandbox',
    shortcode: school.mpesaShortcode,
    callbackUrl: school.mpesaCallbackUrl,
  }
}

// ---------------------------------------------------------------------------
// Phone number normalisation
// ---------------------------------------------------------------------------

/**
 * Normalise a Kenyan phone number to the international format Daraja expects:
 * 2547XXXXXXXX (no leading +, no spaces). Accepts:
 *   - 0712345678, 0112345678, +254712345678, 254712345678, 712345678
 */
export function normalizeMpesaPhone(input: string): string {
  let p = (input || '').trim().replace(/[\s\-()]/g, '')
  if (!p) return ''
  // Remove leading +
  if (p.startsWith('+')) p = p.slice(1)
  // Convert 07XX / 011XX → 2547XX / 25411XX
  if (p.startsWith('0')) p = '254' + p.slice(1)
  // Convert bare 7XX / 11XX → 2547XX / 25411XX (no leading 0 or 254)
  else if (!p.startsWith('254') && /^7\d{8}$/.test(p)) p = '254' + p
  else if (!p.startsWith('254') && /^1\d{8}$/.test(p)) p = '254' + p
  return p
}

// ---------------------------------------------------------------------------
// Timestamp / password helpers
// ---------------------------------------------------------------------------

/** YYYYMMDDHHmmss — Daraja's required timestamp format. */
export function darajaTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  )
}

/**
 * STK Push password = base64(Shortcode + Passkey + Timestamp).
 * All three values are concatenated in this exact order.
 */
export function darajaPassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')
}

// ---------------------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------------------

/**
 * Get an OAuth access token from Daraja using the school's consumer key/secret.
 * Uses HTTP Basic auth (base64(consumer_key:consumer_secret)).
 *
 * Returns null if credentials are missing or the request fails.
 */
export async function getMpesaAuthToken(school: MpesaSchool): Promise<{
  token: string
  error?: string
  raw?: OAuthResult
}> {
  if (!school.mpesaConsumerKey || !school.mpesaConsumerSecret) {
    return { token: '', error: 'Daraja consumer key/secret not configured' }
  }

  const auth = Buffer.from(
    `${school.mpesaConsumerKey}:${school.mpesaConsumerSecret}`
  ).toString('base64')

  try {
    const res = await fetch(oauthUrl(school.mpesaEnv), {
      method: 'GET',
      headers: { Authorization: `Basic ${auth}` },
      // Don't cache — OAuth tokens are short-lived
      cache: 'no-store',
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return {
        token: '',
        error: `Daraja OAuth failed: HTTP ${res.status} ${text.slice(0, 200)}`,
      }
    }

    const json = (await res.json()) as OAuthResult
    if (!json?.access_token) {
      return { token: '', error: 'Daraja OAuth returned no access_token' }
    }
    return { token: json.access_token, raw: json }
  } catch (e: any) {
    return {
      token: '',
      error: `Daraja OAuth network error: ${e?.message || String(e)}`,
    }
  }
}

// ---------------------------------------------------------------------------
// STK Push
// ---------------------------------------------------------------------------

export interface StkPushArgs {
  school: MpesaSchool
  phone: string          // already normalised to 2547XXXXXXXX
  amount: number
  accountReference: string  // shown in M-Pesa prompt (max 12 chars)
  transactionDesc: string   // short description (max 13 chars)
  callbackUrl?: string      // override school.mpesaCallbackUrl
}

/**
 * Initiate a Daraja STK Push request.
 * Returns the parsed Daraja response or throws an Error with a helpful message.
 */
export async function initiateStkPush({
  school,
  phone,
  amount,
  accountReference,
  transactionDesc,
  callbackUrl,
}: StkPushArgs): Promise<StkPushResponse> {
  if (!school.mpesaShortcode) throw new Error('Daraja shortcode (paybill) not configured')
  if (!school.mpesaPasskey) throw new Error('Daraja passkey not configured')

  const timestamp = darajaTimestamp()
  const password = darajaPassword(school.mpesaShortcode, school.mpesaPasskey, timestamp)
  const cb = callbackUrl || school.mpesaCallbackUrl || ''

  const body = {
    BusinessShortCode: school.mpesaShortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.round(amount),
    PartyA: phone,
    PartyB: school.mpesaShortcode,
    PhoneNumber: phone,
    CallBackURL: cb,
    AccountReference: accountReference.slice(0, 12),
    TransactionDesc: transactionDesc.slice(0, 13),
  }

  const { token, error } = await getMpesaAuthToken(school)
  if (error || !token) {
    throw new Error(error || 'Failed to obtain Daraja OAuth token')
  }

  const res = await fetch(stkPushUrl(school.mpesaEnv), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
    body: JSON.stringify(body),
  })

  const json = (await res.json().catch(() => ({}))) as StkPushResponse & StkPushError

  if (!res.ok) {
    const msg = json.errorMessage || json.ResponseDescription || `HTTP ${res.status}`
    throw new Error(`Daraja STK Push failed: ${msg}`)
  }

  // Daraja returns ResponseCode "0" on accepted request
  if (json.ResponseCode && json.ResponseCode !== '0') {
    throw new Error(
      `Daraja STK Push rejected: ${json.ResponseDescription || json.ResponseCode}`
    )
  }

  if (!json.CheckoutRequestID) {
    throw new Error('Daraja did not return a CheckoutRequestID')
  }

  return json
}

// ---------------------------------------------------------------------------
// STK Query (poll Daraja directly)
// ---------------------------------------------------------------------------

export async function queryStkPushStatus(
  school: MpesaSchool,
  checkoutRequestId: string
): Promise<{ resultCode: number; resultDesc: string } | null> {
  if (!school.mpesaShortcode || !school.mpesaPasskey) return null
  const timestamp = darajaTimestamp()
  const password = darajaPassword(school.mpesaShortcode, school.mpesaPasskey, timestamp)

  const { token, error } = await getMpesaAuthToken(school)
  if (error || !token) return null

  try {
    const res = await fetch(stkQueryUrl(school.mpesaEnv), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
      body: JSON.stringify({
        BusinessShortCode: school.mpesaShortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
    })
    if (!res.ok) return null
    const json = (await res.json().catch(() => ({}))) as any
    return {
      resultCode: json?.ResultCode != null ? Number(json.ResultCode) : -1,
      resultDesc: json?.ResultDesc || '',
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Callback parsing
// ---------------------------------------------------------------------------

/**
 * Parse a Daraja STK Push callback body.
 * Daraja POSTs JSON of shape:
 *   { Body: { stkCallback: { MerchantRequestID, CheckoutRequestID, ResultCode,
 *                            ResultDesc, CallbackMetadata?: { Item: [...] } } } }
 */
export function parseCallback(body: any): ParsedCallback | null {
  try {
    const stk = body?.Body?.stkCallback
    if (!stk) return null

    const result: ParsedCallback = {
      merchantRequestId: stk.MerchantRequestID || '',
      checkoutRequestId: stk.CheckoutRequestID || '',
      resultCode: stk.ResultCode != null ? Number(stk.ResultCode) : -1,
      resultDesc: stk.ResultDesc || '',
      success: stk.ResultCode === 0,
    }

    const items = stk.CallbackMetadata?.Item || []
    for (const item of items) {
      const name = item?.Name
      const value = item?.Value
      if (name === 'Amount' && value != null) result.amount = Number(value)
      else if (name === 'MpesaReceiptNumber' && typeof value === 'string')
        result.mpesaReceiptNumber = value
      else if (name === 'Balance' && value != null) result.balance = String(value)
      else if (name === 'TransactionDate' && value != null)
        result.transactionDate = String(value)
      else if (name === 'PhoneNumber' && value != null)
        result.phoneNumber = String(value)
    }

    return result
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Server-side fetch helper for resolving school from request
// ---------------------------------------------------------------------------

/**
 * Resolve the school from a request's authenticated user. If the user is a
 * super_admin with no real school, falls back to the first non-platform school.
 */
export async function resolveSchoolFromRequest(req: Request): Promise<{
  school: MpesaSchool | null
  user: { id: string; name: string; email: string; role: string } | null
  error?: string
}> {
  // Lazy import to avoid pulling Prisma into client bundles
  const { getUserFromRequest } = await import('@/lib/auth-utils')
  const user = await getUserFromRequest(req)
  if (!user) {
    return { school: null, user: null, error: 'Not authenticated' }
  }

  if (user.school) {
    return {
      school: user.school as MpesaSchool,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }
  }

  // Fallback: first non-platform school (super-admin path)
  const { db } = await import('@/lib/db')
  const fallback = await db.school.findFirst({
    where: { slug: { not: 'platform' } },
    orderBy: { createdAt: 'asc' },
  })
  if (!fallback) {
    return {
      school: null,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      error: 'No school configured for this account',
    }
  }
  return {
    school: fallback as MpesaSchool,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  }
}

// ---------------------------------------------------------------------------
// Helpers for sane defaults
// ---------------------------------------------------------------------------

/** Generate a short, human-readable account reference from an invoice. */
export function buildAccountReference(invoiceNo: string, admissionNo?: string | null): string {
  // Daraja limit is 12 characters. Prefer invoice number (short) over admission no.
  const ref = (invoiceNo || admissionNo || 'SCHOOL').replace(/\s+/g, '').slice(0, 12)
  return ref
}
