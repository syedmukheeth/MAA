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
