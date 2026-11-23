/**
 * Vercel serverless function — verifies a Paystack transaction and only then
 * unlocks the student's certificate.
 *
 * Why this exists: the app is a static front-end, so anything shipped to the
 * browser is public. The Paystack *secret* key can therefore never live in the
 * front-end code — it lives here, server-side, and is read from the environment.
 *
 * Environment variables (Vercel → Settings → Environment Variables):
 *   PAYSTACK_SECRET_KEY   sk_test_... (test) or sk_live_... (live)
 *   AFRIBASE_URL          your AfriBase project URL   (falls back to VITE_AFRIBASE_URL)
 *   AFRIBASE_ANON_KEY     your AfriBase anon key      (falls back to VITE_AFRIBASE_ANON_KEY)
 */

const PAYSTACK_BASE = 'https://api.paystack.co'

const AFRIBASE_URL = String(process.env.AFRIBASE_URL || process.env.VITE_AFRIBASE_URL || '').replace(/\/+$/, '')
const AFRIBASE_ANON_KEY = process.env.AFRIBASE_ANON_KEY || process.env.VITE_AFRIBASE_ANON_KEY || ''
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ''

function json(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

/** Minimal AfriBase (PostgREST) call — same shape the front-end uses. */
async function afribase(path, init = {}) {
  const response = await fetch(`${AFRIBASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: AFRIBASE_ANON_KEY,
      Authorization: `Bearer ${AFRIBASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`AfriBase ${response.status}: ${detail}`)
  }
  return response.json().catch(() => null)
}

/** Vercel parses JSON bodies for us, but fall back to reading the stream. */
function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body)
  if (typeof req.body === 'string') {
    try {
      return Promise.resolve(JSON.parse(req.body))
    } catch {
      return Promise.resolve({})
    }
  }
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch {
        resolve({})
      }
    })
  })
}

/** ND / this-year matrics start with FH-; HND / last-year ones start with HND. */
const feeKeyFor = (matric) => (matric.startsWith('HND') ? 'certificate_fee_last' : 'certificate_fee_current')

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' })

  if (!PAYSTACK_SECRET_KEY) {
    return json(res, 500, { error: 'Paystack is not configured on the server yet.' })
  }
  if (!AFRIBASE_URL || !AFRIBASE_ANON_KEY) {
    return json(res, 500, { error: 'The database is not configured on the server yet.' })
  }

  const body = await readBody(req)
  const reference = String(body.reference || '').trim()
  const matric = String(body.matric || '').trim().toUpperCase()
  if (!reference || !matric) {
    return json(res, 400, { error: 'Missing payment reference or matric number.' })
  }

  try {
    // 1. Ask Paystack whether this reference was actually paid.
    const verifyResponse = await fetch(
      `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    )
    const verified = await verifyResponse.json().catch(() => null)
    const transaction = verified?.data

    if (!verifyResponse.ok || !transaction) {
      return json(res, 502, { error: 'Paystack could not verify that payment reference.' })
    }
    if (transaction.status !== 'success') {
      return json(res, 400, { error: `That payment is not complete (status: ${transaction.status}).` })
    }

    // 2. The amount paid must match the fee set for this student's cohort.
    const rows = await afribase(
      `class_settings?select=key,value&key=eq.${feeKeyFor(matric)}`
    )
    const feeNaira = Number(rows?.[0]?.value)
    if (!Number.isFinite(feeNaira) || feeNaira <= 0) {
      return json(res, 400, {
        error: 'The certificate fee has not been set yet. Please contact your lecturer.'
      })
    }
    const expectedKobo = Math.round(feeNaira * 100)
    if (Number(transaction.amount) !== expectedKobo) {
      return json(res, 400, {
        error: `Payment of ₦${Number(transaction.amount) / 100} does not match the ₦${feeNaira} certificate fee.`
      })
    }

    // 3. One payment reference can only unlock one certificate.
    const alreadyUsed = await afribase(
      `class_students?select=matric_number&certificate_payment_ref=eq.${encodeURIComponent(reference)}`
    )
    const takenByAnother = (alreadyUsed || []).some(
      (row) => String(row.matric_number || '').toUpperCase() !== matric
    )
    if (takenByAnother) {
      return json(res, 409, { error: 'That payment has already been used for another certificate.' })
    }

    // 4. Unlock it and keep the reference for reconciliation.
    const updated = await afribase(
      `class_students?matric_number=eq.${encodeURIComponent(matric)}`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          certificate_paid: true,
          certificate_payment_ref: transaction.reference,
          certificate_amount_paid: Number(transaction.amount),
          certificate_paid_at: new Date().toISOString()
        })
      }
    )
    if (!Array.isArray(updated) || !updated.length) {
      return json(res, 404, { error: 'That matric number is not on the class list.' })
    }

    return json(res, 200, { ok: true, reference: transaction.reference })
  } catch (error) {
    return json(res, 500, { error: error.message || 'Could not verify the payment.' })
  }
}
