import type { CpeakRequest as Request, CpeakResponse as Response } from "cpeak";
import QRCode from "qrcode";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import type { LinkType, API } from "../shared/index.js";
import { DB } from "../database/index.js";
import type {
  IUrl,
  ISession,
  IUltraCode,
  IDigitCode,
  IView,
} from "../database/types.js";
import util from "../lib/util.js";
import { push as pushView } from "../redis/views-stream.js";
import {
  resolveCachedUrl,
  setCachedUrl,
  invalidateCachedUrl,
} from "../redis/cache.js";
import keys from "../config/keys.js";
import { isAllowlistedDomain } from "../lib/domain-allowlist.js";
import { refundUserCredit } from "../lib/rate-limit.js";
import {
  generateClassic,
  generateUltra,
  generateDigit,
  generateQRCode,
  processCode,
  validateCustomCode,
  validateAffixCode,
  createClassicCode,
  createQRCodeId,
} from "../lib/links.js";

const publicPath = fileURLToPath(new URL("../../public", import.meta.url));

// Helper functions to check affix code availability
const isAffixAvailable = async (code: string, userId: string) => {
  const existingCode = await DB.find<IUrl>(
    "SELECT id FROM urls WHERE shortened_url_id=$1 AND link_type='affix' AND user_id = $2",
    [code, userId],
  );

  return existingCode ? false : true;
};

// Helper function to check custom code availability
const isCustomAvailable = async (code: string) => {
  const existingCode = await DB.find<IUrl>(
    "SELECT id FROM urls WHERE shortened_url_id=$1 AND link_type='custom'",
    [code],
  );

  return existingCode ? false : true;
};

// Return the list of urls user has shortened
const getUrls = async (req: Request, res: Response) => {
  let whereClause = "";
  let queryParams: (number | undefined)[] = []; // will be either user id or session id
  let data;

  if (req.user) {
    whereClause = "urls.user_id = $1";
    queryParams = [req.user.id];
  } else if (req.signedCookies?.session_token) {
    const session = await DB.find<ISession>(
      "SELECT id FROM sessions WHERE session_token=$1",
      [req.signedCookies.session_token],
    );

    if (!session?.id) {
      return res.json({ urls: [], domain: keys.domain });
    }

    whereClause = "urls.session_id = $1";
    queryParams = [session.id];
  } else {
    // No user and no session token
    return res.json({ urls: [], domain: keys.domain });
  }

  data = await DB.findMany<IUrl>(
    `
    SELECT
      urls.id,
      urls.real_url,
      urls.link_type,
      COALESCE(ultra_codes.code, urls.shortened_url_id, digit_codes.code) AS code,
      COALESCE(ultra_codes.assigned_at, digit_codes.assigned_at) AS assigned_at,
      COALESCE(ultra_codes.expires_at, digit_codes.expires_at) AS expires_at
    FROM urls
    LEFT JOIN ultra_codes
      ON urls.id = ultra_codes.url_id
      AND urls.link_type = 'ultra'
    LEFT JOIN digit_codes
      ON urls.id = digit_codes.url_id
      AND urls.link_type = 'digit'
    WHERE ${whereClause}
    ORDER BY urls.created_at DESC;
  `,
    queryParams,
  );

  // Return the result
  res.json({
    urls: DB.cleanResult(data),
    domain: keys.domain,
  });
};

// Get the url, shorten it and save to database
const shorten = async (req: Request<API.Url.ShortenBody>, res: Response) => {
  // Get the user id if the user is logged in
  let userId = req.user ? req.user.id : null;

  // Get the session token for when the user is not logged in
  let sessionToken = req.signedCookies?.session_token || null;

  const realUrl = req.body?.url;
  const type = req.body?.type as LinkType;

  let sessionId: number | undefined;
  if (!userId && sessionToken) {
    const session = await DB.find<ISession>(
      "SELECT id FROM sessions WHERE session_token=$1",
      [sessionToken],
    );
    sessionId = session?.id;
  }

  let insertedUrl: IUrl | null = null;
  let shortenedCode: string | undefined;
  let expiresAt: Date | undefined;
  let actualType: LinkType = type;
  let qrCodeId = createQRCodeId();

  if (type === "classic") {
    // Single atomic write path: pre-generate QR code and classic code in RAM,
    // reducing 3 sequential database operations down to 1 single insert round-trip.
    let attempts = 0;
    while (!insertedUrl && attempts < 5) {
      attempts++;
      const candidateCode = createClassicCode();
      try {
        insertedUrl = await DB.insert<IUrl>("urls", {
          real_url: realUrl,
          user_id: userId ? userId : undefined,
          session_id: sessionId,
          qr_code_id: qrCodeId,
          shortened_url_id: candidateCode,
          link_type: "classic",
        });
        shortenedCode = candidateCode;
      } catch (err: any) {
        if (err.code === "23505") {
          // Extremely rare unique collision: retry with fresh entropy
          qrCodeId = createQRCodeId();
          continue;
        }
        if (req.user) await refundUserCredit(req.user.id);
        throw err;
      }
    }

    if (!insertedUrl) {
      if (req.user) await refundUserCredit(req.user.id);
      throw { status: 500, message: "Could not generate unique shortened link" };
    }
  } else {
    // For ultra and digit types, insert base URL with QR code in 1 step, then assign code
    try {
      insertedUrl = await DB.insert<IUrl>("urls", {
        real_url: realUrl,
        user_id: userId ? userId : undefined,
        session_id: sessionId,
        qr_code_id: qrCodeId,
      });
    } catch (err) {
      if (req.user) await refundUserCredit(req.user.id);
      throw err;
    }

    if (!insertedUrl) {
      if (req.user) await refundUserCredit(req.user.id);
      throw { status: 500, message: "Could not create URL record" };
    }

    switch (type) {
      case "ultra": {
        if (!req.user) throw { status: 401, message: "Unauthorized" };
        try {
          const obj = await generateUltra(insertedUrl.id);
          expiresAt = obj.expiresAt;
          shortenedCode = obj.code;
        } catch (error) {
          await DB.delete<IUrl>("urls", `id=$1`, [insertedUrl.id]);
          await refundUserCredit(req.user.id);
          throw error;
        }
        break;
      }
      case "digit": {
        try {
          const obj = await generateDigit(insertedUrl.id);
          expiresAt = obj.expiresAt;
          shortenedCode = obj.code;
        } catch (error: any) {
          if (error?.status === 503) {
            shortenedCode = await generateClassic(insertedUrl.id);
            actualType = "classic";
          } else {
            await DB.delete<IUrl>("urls", `id=$1`, [insertedUrl.id]);
            if (req.user) await refundUserCredit(req.user.id);
            throw error;
          }
        }
        break;
      }
      default:
        throw { status: 400, message: "Invalid type" };
    }
  }

  // Pre-warm L1 (RAM) & L2 (Redis) cache immediately.
  // The first visitor who clicks will hit sub-millisecond cache with 0 PostgreSQL queries.
  if (insertedUrl && shortenedCode && realUrl) {
    const cachePayload = {
      id: insertedUrl.id,
      real_url: realUrl,
      link_type: actualType,
    };
    void setCachedUrl(`${actualType}:${shortenedCode}`, cachePayload);
    void setCachedUrl(`qr:${qrCodeId}`, cachePayload);
  }

  return res.json({
    URLId: insertedUrl!.id,
    realURL: realUrl,
    linkType: actualType,
    code: shortenedCode,
    expiresAt: expiresAt || null,
  });
};

// Change the type of a url (e.g. from classic to custom). User can do this from the customization modal
const changeUrlType = async (
  req: Request<API.Url.ChangeTypeBody>,
  res: Response,
) => {
  const id = Number(req.params?.id);
  const newType = req.body?.type as LinkType;

  if (!id || !newType) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  try {
    return await changeUrlTypeInternal(req, res, id, newType);
  } catch (error) {
    // rateLimitUrl already spent a credit for this, refund it on error
    if (req.user) await refundUserCredit(req.user.id);
    throw error;
  }
};

const changeUrlTypeInternal = async (
  req: Request<API.Url.ChangeTypeBody>,
  res: Response,
  id: number,
  newType: LinkType,
) => {
  // ------- 1. Clean up the old code ------- //

  // First find the current url type and release the current code
  const currentLink = await DB.find<IUrl>(
    "SELECT real_url, link_type, shortened_url_id, qr_code_id FROM urls WHERE id=$1",
    [id],
  );

  const currentType = currentLink?.link_type;

  // Invalidate old short code from L1 & L2 cache
  if (currentLink?.shortened_url_id && currentType) {
    void invalidateCachedUrl(`${currentType}:${currentLink.shortened_url_id}`);
  }

  if (currentType === "ultra") {
    // set the old ultra code as unassigned
    await DB.update<IUltraCode>(
      "ultra_codes",
      {
        assigned_at: undefined,
        expires_at: undefined,
        url_id: undefined,
      },
      `url_id = $4`,
      [id],
    );
  }

  if (currentType === "digit") {
    // remove the old digit code from database
    await DB.delete<IDigitCode>("digit_codes", `url_id = $1`, [id]);
  }

  if (
    (currentType === "classic" && newType !== "classic") ||
    (currentType === "affix" && newType !== "affix") ||
    (currentType === "custom" && newType !== "custom")
  ) {
    // set shortened_url_id to null
    await DB.update<IUrl>(
      "urls",
      {
        shortened_url_id: undefined,
      },
      `id = $2`,
      [id],
    );
  }

  // ------- 2. Generate new code ------- //

  let newShortenedCode;
  let expiresAt;

  switch (newType) {
    case "classic":
      newShortenedCode = await generateClassic(id);
      break;

    case "ultra":
      if (!req.user) throw { status: 401, message: "Unauthorized" };
      {
        const obj = await generateUltra(id);
        expiresAt = obj.expiresAt;
        newShortenedCode = obj.code;
      }
      break;

    case "digit":
      {
        const obj = await generateDigit(id);
        expiresAt = obj.expiresAt;
        newShortenedCode = obj.code;
      }
      break;

    case "affix": {
      if (!req.user) throw { status: 401, message: "Unauthorized" };
      const affixCode = req.body?.code;

      if (!affixCode) throw { status: 400, message: "No code provided" };
      if (!validateAffixCode(affixCode)) {
        throw {
          status: 400,
          message:
            "Affix code must be 1-80 characters and contain only letters, numbers, hyphens, and underscores.",
        };
      }

      const available = await isAffixAvailable(affixCode, req.user.id);
      if (!available) {
        throw { status: 400, message: "Code is not available" };
      }

      // Update the url record with the affix code
      try {
        await DB.update<IUrl>(
          "urls",
          {
            shortened_url_id: affixCode,
            link_type: "affix",
          },
          `id = $3`,
          [id],
        );
      } catch (e: any) {
        if (e.code === "23505")
          throw { status: 400, message: "Code is not available" };
        throw e;
      }

      newShortenedCode = affixCode;
      break;
    }
    case "custom": {
      const customCode = req.body?.code;

      if (!customCode) throw { status: 400, message: "No code provided" };
      if (!validateCustomCode(customCode)) {
        throw {
          status: 400,
          message:
            "Custom code must be 7-80 characters, contain only letters, numbers, hyphens, and underscores, and cannot be a reserved word.",
        };
      }

      const available = await isCustomAvailable(customCode);
      if (!available) {
        throw { status: 400, message: "Code is not available" };
      }

      // Update the url record with the custom code
      try {
        await DB.update<IUrl>(
          "urls",
          {
            shortened_url_id: customCode,
            link_type: "custom",
          },
          `id = $3`,
          [id],
        );
      } catch (e: any) {
        if (e.code === "23505")
          throw { status: 400, message: "Code is not available" };
        throw e;
      }

      newShortenedCode = customCode;
      break;
    }

    default:
      throw { status: 400, message: "Invalid type" };
  }

  const typesWithExpiresAt = ["ultra", "digit"];

  // Pre-warm the newly assigned code in L1 & L2 cache
  if (newShortenedCode && currentLink?.real_url) {
    void setCachedUrl(`${newType}:${newShortenedCode}`, {
      id,
      real_url: currentLink.real_url,
      link_type: newType,
    });
  }

  return res.json({
    newType,
    expiresAt: typesWithExpiresAt.includes(newType) ? expiresAt : null,
    code: newShortenedCode,
  });
};

// Resolve a processed code (+ username, for affix links) back to its urls record.
// Raw database fallback (L3) queried on cold cache misses.
async function resolveUrlRecord(
  processedCode: { type: LinkType; code: string },
  username?: string,
): Promise<IUrl | null> {
  switch (processedCode.type) {
    case "ultra":
      return DB.find<IUrl>(
        `
        SELECT urls.real_url, urls.id, urls.link_type
        FROM urls
        JOIN ultra_codes
          ON urls.id = ultra_codes.url_id
        WHERE ultra_codes.code = $1
      `,
        [processedCode.code],
      );
    case "classic":
      return DB.find<IUrl>(
        `SELECT real_url, id, link_type FROM urls WHERE shortened_url_id=$1`,
        [processedCode.code],
      );
    case "digit":
      return DB.find<IUrl>(
        `
        SELECT urls.real_url, urls.id, urls.link_type
        FROM urls
        JOIN digit_codes
          ON urls.id = digit_codes.url_id
        WHERE digit_codes.code = $1
      `,
        [processedCode.code],
      );
    case "affix":
      if (!username) return null;

      return DB.find<IUrl>(
        `
        SELECT urls.real_url, urls.id, urls.link_type
        FROM urls
        JOIN users
          ON urls.user_id = users.id
        JOIN usernames
          ON users.id = usernames.user_id
        WHERE urls.shortened_url_id = $1
          AND usernames.username = $2
      `,
        [processedCode.code, username],
      );
    case "qr":
      return DB.find<IUrl>(
        `SELECT real_url, id, link_type FROM urls WHERE qr_code_id=$1`,
        [processedCode.code],
      );
    case "custom":
      return DB.find<IUrl>(
        `SELECT real_url, id, link_type FROM urls WHERE shortened_url_id=$1`,
        [processedCode.code],
      );
    default:
      return null;
  }
}

export function buildLookupKey(
  type: LinkType,
  code: string,
  username?: string,
): string {
  return username ? `${type}:${username}:${code}` : `${type}:${code}`;
}

// ─── Multi-Tier Cached Resolver ──────────────────────────────────────────────
// Layer 1: Node.js In-Memory LRU Map (< 0.05ms)
// Layer 2: Redis Cluster Cache with Hashtag Routing (< 0.40ms)
// Layer 3: PostgreSQL Fallback with Automatic Cache Population (~ 3-5ms)
async function getUrlRecord(
  processedCode: { type: LinkType; code: string },
  username?: string,
): Promise<IUrl | null> {
  const lookupKey = buildLookupKey(
    processedCode.type,
    processedCode.code,
    username,
  );

  // 1. Check L1 / L2 Cache
  const cached = await resolveCachedUrl(lookupKey);
  if (cached === "__404__") {
    return null;
  }
  if (cached) {
    return {
      id: cached.id,
      real_url: cached.real_url,
      link_type: cached.link_type,
      shortened_url_id: processedCode.code,
      qr_code_id: processedCode.type === "qr" ? processedCode.code : "",
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  // 2. Cold Miss: Query PostgreSQL (L3)
  const url = await resolveUrlRecord(processedCode, username);

  // 3. Populate L1 & L2 Cache
  if (url) {
    void setCachedUrl(lookupKey, {
      id: url.id,
      real_url: url.real_url,
      link_type: url.link_type,
    });
  } else {
    // Negative cache for 30s to defend PostgreSQL against enumeration attacks
    void setCachedUrl(lookupKey, "__404__");
  }

  return url;
}

/** @TODO FIX ERROR RETURN IN CPEAK SEND FILE */
// Redirect to the real url
const redirect = async (req: Request, res: Response) => {
  res.setHeader("X-Robots-Tag", "noindex");

  const code = req.params?.id;

  if (!code) {
    return res
      .status(404)
      .sendFile(path.join(publicPath, "./404.html"), "text/html");
  }

  const processedCode = processCode(code, req.params?.username, req.url);

  if (!processedCode) {
    return res
      .status(404)
      .sendFile(path.join(publicPath, "./404.html"), "text/html");
  }

  const url = await getUrlRecord(processedCode, req.params?.username);

  if (!url) {
    return res
      .status(404)
      .sendFile(path.join(publicPath, "./404.html"), "text/html");
  }

  // Handling the views logic

  const ip = util.getClientIp(req);
  const userAgent = req.headers["user-agent"] || "";
  const acceptLang = req.headers["accept-language"] || "";
  const referrer = req.headers["referer"] || "";

  const fingerprintSource = `${ip}::${userAgent}::${acceptLang}`;
  const visitorHash = crypto
    .createHash("sha256")
    .update(fingerprintSource)
    .digest("hex");

  const viewData = {
    url_id: url.id,
    ip_address: ip ?? undefined,
    user_agent: userAgent,
    referrer: referrer,
    link_type: processedCode.type !== "qr" ? url.link_type : undefined,
    via_qr: processedCode.type === "qr" ? true : false,
    visitor_hash: visitorHash,
  };

  if (keys.redisEnabled) {
    // Save the view with the hash to redis stream. The janitor will drain the stream every second and save to database in batches.
    // This is to handle high traffic and avoid database overload during peak times.
    pushView(viewData);
  } else {
    // We have this in case we want to run the server without Redis, but it should not be the default in production because it can cause performance issues.
    await DB.insert<IView>("views", viewData);
  }

  if (isAllowlistedDomain(url.real_url)) {
    res.redirect(url.real_url);
  } else {
    const queryString = new URLSearchParams({
      type: processedCode.type,
      code: processedCode.code,
    });
    if (req.params?.username) queryString.set("username", req.params.username);
    res.redirect(`/redirect-warning?${queryString.toString()}`);
  }
};

// Shown before redirecting to a non-whitelisted destination, so visitors can see
// where they're actually being sent before continuing.
const redirectWarningPage = async (req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, "./redirect-warning.html"), "text/html");
};

// Called client-side by redirect-warning.html to fetch the destination it should show
const redirectWarningData = async (req: Request, res: Response) => {
  const type = req.query?.type as LinkType | undefined;
  const code = req.query?.code as string | undefined;
  const username = req.query?.username as string | undefined;

  const url =
    type && code ? await getUrlRecord({ type, code }, username) : null;

  res.json({ realUrl: url?.real_url ?? null });
};

// Delete a url record and purge from multi-tier cache
const remove = async (req: Request, res: Response) => {
  const id = Number(req.params?.id);
  if (!id) throw { status: 400, message: "Missing URL ID" };

  const existing = await DB.find<IUrl>(
    "SELECT shortened_url_id, qr_code_id, link_type FROM urls WHERE id=$1",
    [id],
  );

  await DB.delete<IUrl>("urls", `id=$1`, [id]);

  if (existing) {
    if (existing.shortened_url_id) {
      void invalidateCachedUrl(`${existing.link_type}:${existing.shortened_url_id}`);
    }
    if (existing.qr_code_id) {
      void invalidateCachedUrl(`qr:${existing.qr_code_id}`);
    }
  }

  res.json({ message: "deleted" });
};

// Generates and sends a QR code
const sendQrCode = async (req: Request, res: Response) => {
  const QR_CODE_VERSION = 4; // 33x33 matrix, 50 chars max
  const QR_CODE_ERROR_CORRECTION_LEVEL = "H"; // L, M, Q, H (L lowest, H highest)

  if (!req.params?.id) {
    throw { status: 400, message: "No URL ID provided" };
  }

  const download = req.query.download === "true" ? true : false;
  const type = req.query.type === "png" ? "png" : "svg";
  let size = Number(req.query.size); // only for png, valid options are: 256, 512, 1024, 2048

  // Validate size if type is png
  if (type === "png") {
    const validSizes = [256, 512, 1024, 2048];
    if (!validSizes.includes(size)) {
      size = 512; // default size
    }
  }

  const url = await DB.find<IUrl>(`SELECT qr_code_id FROM urls WHERE id=$1`, [
    req.params.id,
  ]);

  if (!url) {
    throw { status: 404, message: "URL not found" };
  }

  const data = `${keys.domain}/q/${url.qr_code_id}`;

  // This header is needed to trigger a browser download
  if (download) {
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${url.qr_code_id}.${type}"`,
    );
  }

  if (type === "svg") {
    const svg = await QRCode.toString(data, {
      type: "svg",
      version: QR_CODE_VERSION,
      margin: 0.5,

      errorCorrectionLevel: QR_CODE_ERROR_CORRECTION_LEVEL,
    });

    res.setHeader("Content-Type", "image/svg+xml");
    res.end(svg);
  } else {
    res.setHeader("Content-Type", "image/png");

    await QRCode.toFileStream(res, data, {
      version: QR_CODE_VERSION,
      margin: 0.5,
      errorCorrectionLevel: QR_CODE_ERROR_CORRECTION_LEVEL,
      width: size,
    });
  }
};

// Check to see if an affix code is available
const checkAffixAvailability = async (req: Request, res: Response) => {
  const code = req.params?.code;
  const userId = req.user?.id;

  if (!code) {
    return res.status(400).json({ message: "No code provided" });
  }

  // Check if user has already used this code, that's the only check required

  const available = await isAffixAvailable(code, userId!);
  res.json({ available });
};

// Check to see if a custom code is available
const checkCustomAvailability = async (req: Request, res: Response) => {
  const code = req.params?.code;

  if (!code) {
    return res.status(400).json({ message: "No code provided" });
  }

  const available = await isCustomAvailable(code);
  res.json({ available });
};

// Update the destination URL of an existing shortened link and refresh multi-tier cache
const updateRealUrl = async (
  req: Request<API.Url.UpdateRealUrlBody>,
  res: Response,
) => {
  const id = Number(req.params?.id);
  const newRealUrl = req.body?.url;

  if (!id || !newRealUrl) {
    throw { status: 400, message: "Missing parameters" };
  }

  const existing = await DB.find<IUrl>(
    "SELECT id, shortened_url_id, qr_code_id, link_type FROM urls WHERE id=$1",
    [id],
  );

  await DB.update<IUrl>("urls", { real_url: newRealUrl }, `id = $2`, [id]);

  if (existing) {
    const updatedPayload = {
      id: existing.id,
      real_url: newRealUrl,
      link_type: existing.link_type,
    };
    if (existing.shortened_url_id) {
      void setCachedUrl(
        `${existing.link_type}:${existing.shortened_url_id}`,
        updatedPayload,
      );
    }
    if (existing.qr_code_id) {
      void setCachedUrl(`qr:${existing.qr_code_id}`, updatedPayload);
    }
  }

  return res.json({ realUrl: newRealUrl });
};

// Return stats for a single shortened link
const getStats = async (req: Request, res: Response) => {
  const id = Number(req.params?.id);

  if (!id) {
    throw { status: 400, message: "Missing parameters" };
  }

  const row = await DB.find<{
    total: string;
    unique_visitors: string;
    qr_clicks: string;
    last_clicked: Date | null;
  }>(
    `SELECT
      COUNT(*) AS total,
      COUNT(DISTINCT visitor_hash) AS unique_visitors,
      COUNT(*) FILTER (WHERE via_qr = true) AS qr_clicks,
      MAX(created_at) AS last_clicked
    FROM views
    WHERE url_id = $1`,
    [id],
  );

  const stats: API.Url.Stats = {
    total: parseInt(row?.total ?? "0", 10),
    unique_visitors: parseInt(row?.unique_visitors ?? "0", 10),
    qr_clicks: parseInt(row?.qr_clicks ?? "0", 10),
    last_clicked: row?.last_clicked?.toISOString() ?? null,
  };

  return res.json(stats);
};

export default {
  getUrls,
  shorten,
  redirect,
  redirectWarningPage,
  redirectWarningData,
  remove,
  sendQrCode,
  changeUrlType,
  checkAffixAvailability,
  checkCustomAvailability,
  updateRealUrl,
  getStats,
};