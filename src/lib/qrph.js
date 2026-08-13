/** GCash InstaPay P2P QR (EMVCo / QR Ph) from the merchant My QR. */
export const GCASH_P2P_PAYLOAD =
  "00020101021127830012com.p2pqrpay0111GXCHPHM2XXX02089996440303152170200000006560417DWQM4TK3JDO6NP7QE5204601653036085802PH5909ER***A V.6013Sapang Biabas6104123463040958";

function crc16ccitt(text) {
  let crc = 0xffff;
  for (let i = 0; i < text.length; i += 1) {
    crc ^= text.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function parseTlv(payload) {
  const tags = [];
  let i = 0;
  while (i + 4 <= payload.length) {
    const tag = payload.slice(i, i + 2);
    const len = Number(payload.slice(i + 2, i + 4));
    if (!Number.isFinite(len) || len < 0) break;
    const value = payload.slice(i + 4, i + 4 + len);
    tags.push({ tag, value });
    i += 4 + len;
    if (tag === "63") break;
  }
  return tags;
}

function buildTlv(tags) {
  return tags
    .map(({ tag, value }) => `${tag}${String(value.length).padStart(2, "0")}${value}`)
    .join("");
}

export function emvWithAmount(basePayload, pesos) {
  const amount = Number(pesos);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a valid deposit amount.");
  }

  const tags = parseTlv(basePayload).filter((item) => item.tag !== "63" && item.tag !== "54");
  const pmi = tags.find((item) => item.tag === "01");
  if (pmi) pmi.value = "12";

  const currencyIdx = tags.findIndex((item) => item.tag === "53");
  const insertAt = currencyIdx >= 0 ? currencyIdx + 1 : tags.length;
  tags.splice(insertAt, 0, { tag: "54", value: amount.toFixed(2) });

  const withoutCrc = `${buildTlv(tags)}6304`;
  return `${withoutCrc}${crc16ccitt(withoutCrc)}`;
}
