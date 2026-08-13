import crypto from "crypto";
import { getAppUrl } from "@/lib/appUrl";

export { getAppUrl };

export const PAYMONGO_METHOD_MAP = {
  GCASH: ["gcash", "qrph"],
  MAYA: ["paymaya", "qrph"],
};

export function isPaymongoConfigured() {
  return Boolean(process.env.PAYMONGO_SECRET_KEY?.trim());
}

export function isPaymongoMethodType(type) {
  return Boolean(PAYMONGO_METHOD_MAP[type] || type);
}

export function paymongoTypesFor(type) {
  return PAYMONGO_METHOD_MAP[type] || ["gcash", "qrph"];
}

function authHeader() {
  const key = process.env.PAYMONGO_SECRET_KEY || "";
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

async function paymongoFetch(path, { method = "GET", body } = {}) {
  const res = await fetch(`https://api.paymongo.com${path}`, {
    method,
    headers: {
      Authorization: authHeader(),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      json?.errors?.[0]?.detail ||
      json?.error?.message ||
      `PayMongo request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = json;
    throw err;
  }
  return json;
}

export async function createCheckoutSession({
  amount,
  depositId,
  methodType,
  description,
  customer,
}) {
  const centavos = Math.round(Number(amount) * 100);
  const payload = {
    data: {
      attributes: {
        send_email_receipt: false,
        show_description: true,
        show_line_items: true,
        description: description || "AUREX wallet deposit",
        line_items: [
          {
            currency: "PHP",
            amount: centavos,
            name: "AUREX Deposit",
            quantity: 1,
            description: `Wallet deposit ${depositId}`,
          },
        ],
        payment_method_types: paymongoTypesFor(methodType),
        success_url: `${getAppUrl()}/dashboard/deposit?paid=1&depositId=${depositId}`,
        cancel_url: `${getAppUrl()}/dashboard/deposit?canceled=1`,
        reference_number: depositId,
        metadata: {
          depositId,
          userId: customer?.id || "",
        },
      },
    },
  };

  try {
    return await paymongoFetch("/v2/checkout_sessions", {
      method: "POST",
      body: payload,
    });
  } catch (error) {
    if (error.status === 404 || error.status === 405) {
      return paymongoFetch("/v1/checkout_sessions", {
        method: "POST",
        body: payload,
      });
    }
    throw error;
  }
}

export async function retrieveCheckoutSession(sessionId) {
  try {
    return await paymongoFetch(`/v1/checkout_sessions/${sessionId}`);
  } catch (error) {
    if (error.status === 404) {
      return paymongoFetch(`/v2/checkout_sessions/${sessionId}`);
    }
    throw error;
  }
}

export async function expireCheckoutSession(sessionId) {
  if (!sessionId) return null;
  try {
    return await paymongoFetch(`/v1/checkout_sessions/${sessionId}/expire`, {
      method: "POST",
    });
  } catch {
    return null;
  }
}

export function getPaidPayment(sessionJson) {
  const attrs = sessionJson?.data?.attributes || {};
  const payments = attrs.payments || [];
  const paid = payments.find((payment) => {
    const status = payment?.attributes?.status || payment?.status;
    return status === "paid" || status === "succeeded";
  });
  if (paid) {
    return {
      id: paid.id,
      amount: paid.attributes?.amount ?? paid.amount,
    };
  }

  const intent = attrs.payment_intent;
  const intentStatus = intent?.attributes?.status || intent?.status;
  if (intentStatus === "succeeded") {
    return {
      id: intent?.id,
      amount: intent?.attributes?.amount ?? attrs.line_items?.[0]?.amount,
    };
  }

  if (attrs.status === "paid" || attrs.payment_status === "paid") {
    return {
      id: sessionJson?.data?.id,
      amount: attrs.line_items?.[0]?.amount ?? attrs.amount,
    };
  }
  return null;
}

export function parseWebhookEvent(body) {
  if (body?.data?.type && body?.data?.data) {
    return { type: body.data.type, resource: body.data.data };
  }
  if (body?.data?.attributes?.type) {
    return {
      type: body.data.attributes.type,
      resource: body.data.attributes.data,
    };
  }
  return { type: body?.type || "", resource: body?.data || body };
}

export function extractFulfillmentFromEvent(type, resource) {
  const attrs = resource?.attributes || {};
  const metadata = attrs.metadata || {};
  const payments = attrs.payments || [];
  const paid = payments.find((payment) => {
    const status = payment?.attributes?.status || payment?.status;
    return status === "paid" || status === "succeeded";
  });

  const resourceId = resource?.id || "";
  return {
    depositId: metadata.depositId || attrs.reference_number || null,
    sessionId: resourceId.startsWith("cs_") ? resourceId : null,
    paymentId:
      paid?.id || (resourceId.startsWith("pay_") ? resourceId : null),
    paidAmountCentavos: paid?.attributes?.amount ?? attrs.amount ?? null,
    type,
  };
}

export function verifyWebhookSignature(rawBody, signatureHeader) {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    String(signatureHeader)
      .split(",")
      .map((part) => {
        const [key, ...rest] = part.split("=");
        return [key.trim(), rest.join("=")];
      })
  );

  const timestamp = parts.t;
  if (!timestamp) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  return [parts.te, parts.li].filter(Boolean).some((signature) => {
    try {
      const left = Buffer.from(signature);
      const right = Buffer.from(expected);
      return left.length === right.length && crypto.timingSafeEqual(left, right);
    } catch {
      return false;
    }
  });
}
