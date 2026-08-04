/**
 * Razorpay Payment SDK Client Scaffold (Test & Live modes)
 *
 * Setup:
 * 1. Sign up for free at https://dashboard.razorpay.com/signup
 * 2. Get Test Key ID and Key Secret from Settings -> API Keys
 * 3. Add NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env
 */

export function getRazorpayKeyId(): string {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
}

export function isRazorpayConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  );
}
