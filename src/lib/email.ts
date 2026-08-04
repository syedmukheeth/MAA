import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM ?? "MAA FURNITURE <onboarding@resend.dev>";

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
    const res = await resend.emails.send({ from: FROM, to, subject, html });
    if (res.error) {
      console.error(`EMAIL SEND FAILED [to=${to}, subject="${subject}"]:`, res.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`EMAIL SEND ERROR [to=${to}, subject="${subject}"]:`, err);
    return false;
  }
}
