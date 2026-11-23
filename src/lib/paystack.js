/**
 * Paystack helpers.
 *
 * Only the PUBLIC key reaches the browser — the inline popup collects the card
 * details, then our serverless function (`/api/verify-payment`) checks the
 * transaction with the secret key and unlocks the certificate.
 */

const INLINE_SRC = 'https://js.paystack.co/v1/inline.js'

const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ''
// Left blank on Vercel (same origin). Point it at a local/dev server if needed.
const apiBase = (import.meta.env.VITE_PAYMENT_API_URL || '').replace(/\/+$/, '')

export const isPaystackConfigured = Boolean(publicKey)

/** Injects the Paystack inline script once and resolves with the global. */
function loadInline() {
  if (window.PaystackPop) return Promise.resolve(window.PaystackPop)
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = INLINE_SRC
    script.async = true
    script.onload = () => resolve(window.PaystackPop)
    script.onerror = () => reject(new Error('Could not load the Paystack checkout.'))
    document.head.appendChild(script)
  })
}

/** A reference that is unique per attempt, e.g. AAPOLY-FH-SWD-25-0011-1732... */
export function makeReference(matricNumber) {
  return `AAPOLY-${String(matricNumber).toUpperCase()}-${Date.now()}`
}

/**
 * Opens the Paystack popup and resolves once the card charge succeeds.
 * Rejects with `{ cancelled: true }` when the student closes the popup.
 */
export async function payWithPaystack({ email, amountNaira, reference, matricNumber }) {
  if (!publicKey) throw new Error('Paystack is not configured yet.')

  const PaystackPop = await loadInline()
  return new Promise((resolve, reject) => {
    const handler = PaystackPop.setup({
      key: publicKey,
      email,
      amount: Math.round(Number(amountNaira) * 100), // Paystack works in kobo
      currency: 'NGN',
      ref: reference,
      metadata: { matric_number: matricNumber },
      callback: (response) => resolve(response),
      onClose: () => {
        const cancelled = new Error('Payment cancelled.')
        cancelled.cancelled = true
        reject(cancelled)
      }
    })
    handler.openIframe()
  })
}

/** Asks our server to verify the reference and unlock the certificate. */
export async function verifyPayment({ reference, matricNumber }) {
  const response = await fetch(`${apiBase}/api/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference, matric: matricNumber })
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || 'We could not verify that payment.')
  }
  return payload
}
