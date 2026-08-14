/**
 * Product names, customer names and free-text request descriptions all reach
 * these templates unmodified. Interpolated raw, a description containing an
 * `<a>` tag renders as a working link inside an email that looks like it came
 * from us — a phishing page delivered through our own domain's reputation.
 */
function esc(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailLayout(bodyHtml: string, previewText: string) {
  return `
    <div style="display:none;max-height:0;overflow:hidden;">${esc(previewText)}</div>
    <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#2a2420;">
      <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#a5732f;margin:0 0 24px;">
        MAA FURNITURE
      </p>
      ${bodyHtml}
      <p style="margin-top:32px;font-size:12px;color:#8a8078;">
        MAA FURNITURE &middot; Crafted for homes, built for generations.
      </p>
    </div>
  `;
}

type OrderItemLike = { name: string; quantity: number; lineTotal: string | number };
type OrderLike = {
  orderNumber: string;
  total: string | number;
  items: OrderItemLike[];
};

function itemsListHtml(items: OrderItemLike[]) {
  return items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;">${esc(i.quantity)} &times; ${esc(i.name)}</td><td style="padding:6px 0;text-align:right;">&#8377;${esc(i.lineTotal)}</td></tr>`
    )
    .join("");
}

export function orderConfirmationHtml(order: OrderLike) {
  return emailLayout(
    `
      <h1 style="font-size:22px;margin:0 0 8px;">Order confirmed</h1>
      <p style="color:#5c5349;">Order <strong>${esc(order.orderNumber)}</strong> has been placed and will be paid via Cash on Delivery.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
        ${itemsListHtml(order.items)}
        <tr><td style="padding-top:12px;font-weight:bold;border-top:1px solid #e5ddd2;">Total</td>
        <td style="padding-top:12px;font-weight:bold;text-align:right;border-top:1px solid #e5ddd2;">&#8377;${esc(order.total)}</td></tr>
      </table>
    `,
    `Order ${order.orderNumber} confirmed`
  );
}

export function orderStatusUpdateHtml(order: OrderLike, newStatus: string) {
  return emailLayout(
    `
      <h1 style="font-size:22px;margin:0 0 8px;">Order update</h1>
      <p style="color:#5c5349;">Order <strong>${esc(order.orderNumber)}</strong> is now <strong>${esc(newStatus)}</strong>.</p>
    `,
    `Order ${order.orderNumber} is now ${newStatus}`
  );
}

import { getSiteUrl } from "@/lib/site-url";

type CustomRequestLike = {
  name: string;
  phone: string;
  budgetRange?: string | null;
  description?: string | null;
};

/**
 * DPDP correspondence.
 *
 * These deliberately restate what was asked and by when it will be answered:
 * the Act gives the data principal a right to know how their request is being
 * handled, and an email they can keep is the cheapest way to discharge it.
 * None of them echoes the personal data the request was about.
 */

export function privacyRequestReceivedHtml(input: {
  requestType: string;
  slaDays: number;
}) {
  return emailLayout(
    `
      <h1 style="font-size:22px;margin:0 0 8px;">We received your request</h1>
      <p style="color:#5c5349;">You asked us to handle a <strong>${esc(input.requestType)}</strong> request for your personal data.</p>
      <p style="color:#5c5349;">We will respond within ${esc(input.slaDays)} days. If you did not make this request, reply to this email straight away.</p>
    `,
    `Your ${input.requestType.toLowerCase()} request`
  );
}

export function erasureScheduledHtml(input: {
  scheduledFor: Date;
  coolingOffDays: number;
  grievanceUrl: string;
}) {
  const when = input.scheduledFor.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return emailLayout(
    `
      <h1 style="font-size:22px;margin:0 0 8px;">Your account is scheduled for deletion</h1>
      <p style="color:#5c5349;">We have locked your account now, so nobody can sign in to it. Your personal data will be permanently deleted on <strong>${esc(when)}</strong>.</p>
      <p style="color:#5c5349;">If you change your mind before then, contact us through <a href="${esc(input.grievanceUrl)}" style="color:#a5732f;">our grievance page</a> within ${esc(input.coolingOffDays)} days and we will restore your account.</p>
      <p style="color:#5c5349;">Please note: we are required by tax law to keep a record of orders you have already placed. Those records will be kept, but your name, phone number and street address will be removed from them.</p>
    `,
    "Your account is scheduled for deletion"
  );
}

export function erasureCompletedHtml(input: { retentionYears: number }) {
  return emailLayout(
    `
      <h1 style="font-size:22px;margin:0 0 8px;">Your data has been deleted</h1>
      <p style="color:#5c5349;">Your account, saved addresses, cart and any custom furniture enquiries have been permanently deleted, along with any photos you uploaded.</p>
      <p style="color:#5c5349;">Your past invoices remain in our accounts for ${esc(input.retentionYears)} years as Indian tax law requires, but your name, phone number and street address have been removed from them.</p>
      <p style="color:#5c5349;">This is the last email you will receive from us.</p>
    `,
    "Your data has been deleted"
  );
}

export function grievanceAcknowledgedHtml(input: {
  slaDays: number;
  officerName: string;
}) {
  return emailLayout(
    `
      <h1 style="font-size:22px;margin:0 0 8px;">We received your complaint</h1>
      <p style="color:#5c5349;">${esc(input.officerName)} will look into it and respond within ${esc(input.slaDays)} days.</p>
      <p style="color:#5c5349;">If you are not satisfied with our response, you may complain to the Data Protection Board of India.</p>
    `,
    "We received your complaint"
  );
}

/** Sent to the grievance officer, not the customer. */
export function grievanceNotificationHtml(input: {
  category: string;
  body: string;
  adminUrl: string;
}) {
  return emailLayout(
    `
      <h1 style="font-size:22px;margin:0 0 8px;">New privacy grievance</h1>
      <p style="color:#5c5349;">Category: <strong>${esc(input.category)}</strong></p>
      <p style="color:#5c5349;">${esc(input.body)}</p>
      <p style="margin-top:16px;"><a href="${esc(input.adminUrl)}" style="color:#a5732f;">Open the privacy request queue</a></p>
    `,
    "New privacy grievance"
  );
}

/**
 * Security alert to the Data Protection Officer.
 *
 * Carries NO personal data — not the affected email address, not an IP, not a
 * name. This is an unencrypted message to a mailbox, and a breach alert that
 * leaks the data it is warning about is its own incident. The identifying
 * detail stays behind the login at /admin/security.
 */
export function securityAlertHtml(input: {
  severity: string;
  eventType: string;
  summary: string;
  occurrences: number;
  windowMinutes: number;
  dashboardUrl: string;
}) {
  const isCritical = input.severity === "CRITICAL";
  return emailLayout(
    `
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${isCritical ? "#b3261e" : "#a5732f"};">
        ${esc(input.severity)} security alert
      </p>
      <h1 style="font-size:22px;margin:0 0 8px;">${esc(input.eventType)}</h1>
      <p style="color:#5c5349;">${esc(input.summary)}</p>
      <p style="color:#5c5349;">
        This has happened <strong>${esc(input.occurrences)}</strong> time(s) in the last
        ${esc(input.windowMinutes)} minutes. Further alerts of this type are paused for that
        window so a single incident cannot flood your inbox.
      </p>
      <p style="margin-top:16px;">
        <a href="${esc(input.dashboardUrl)}" style="color:#a5732f;">Review it in the security dashboard</a>
      </p>
      <p style="margin-top:24px;font-size:12px;color:#8a8078;">
        Details are deliberately not included in this email. If this turns out to be a
        personal data breach, DPDP section 8(6) requires notifying the Data Protection
        Board of India and every affected person — see docs/privacy/08-breach-response.md.
      </p>
    `,
    `${input.severity} security alert: ${input.eventType}`
  );
}

export function customRequestNotificationHtml(request: CustomRequestLike) {
  const adminUrl = `${getSiteUrl()}/admin/requests`;
  return emailLayout(
    `
      <h1 style="font-size:22px;margin:0 0 8px;">New custom furniture request</h1>
      <p style="color:#5c5349;"><strong>${esc(request.name)}</strong> &middot; ${esc(request.phone)}</p>
      ${request.budgetRange ? `<p style="color:#5c5349;">Budget: ${esc(request.budgetRange)}</p>` : ""}
      ${request.description ? `<p style="color:#5c5349;">${esc(request.description)}</p>` : ""}
      <p style="margin-top:16px;"><a href="${adminUrl}" style="color:#a5732f;">View in admin dashboard</a></p>
    `,
    `New request from ${request.name}`
  );
}
