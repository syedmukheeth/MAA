import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "MAA FURNITURE <support@maafurniture.shop>";

// Instantiated once at module level — consistent with every other external
// client (Redis, Cloudinary, Prisma). Resend is stateless/HTTP so there is
// no connection resource to manage, but creating a new instance per call
// is unnecessary allocations.
let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  try {
    const resend = getResend();
    if (!resend) {
      console.warn(`EMAIL SEND SKIPPED (RESEND_API_KEY not configured) [subject="${subject}"]`);
      return false;
    }
    const res = await resend.emails.send({ from: FROM, to, subject, html });
    if (res.error) {
      // Resend's most common rejection is an unverified sending domain, and the
      // failure is otherwise invisible because callers only see `false`. Log the
      // sender so the cause is obvious from the deployment logs.
      console.error(
        `EMAIL SEND FAILED [from="${FROM}"] [subject="${subject}"]:`,
        res.error
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error(`EMAIL SEND ERROR [subject="${subject}"]:`, err);
    return false;
  }
}
