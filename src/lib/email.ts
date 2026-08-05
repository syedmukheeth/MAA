import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "MAA FURNITURE <support@maafurniture.shop>";

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
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn(`EMAIL SEND SKIPPED (RESEND_API_KEY not configured) [subject="${subject}"]`);
      return false;
    }
    const resend = new Resend(apiKey);
    const res = await resend.emails.send({ from: FROM, to, subject, html });
    if (res.error) {
      console.error(`EMAIL SEND FAILED [subject="${subject}"]:`, res.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`EMAIL SEND ERROR [subject="${subject}"]:`, err);
    return false;
  }
}
