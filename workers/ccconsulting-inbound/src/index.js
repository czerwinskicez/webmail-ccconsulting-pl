import PostalMime from "postal-mime";
import { put } from "@vercel/blob";

const FALLBACK_FORWARD_TO = "root.woozie@gmail.com";

const MAX_PARSE_SIZE = 20 * 1024 * 1024; // 20 MB
const BLOB_TIMEOUT_MS = 10_000;

export default {
  async email(message, env, ctx) {
    const receivedAt = new Date().toISOString();

    const forwardTo =
      env.FORWARD_TO?.trim() || FALLBACK_FORWARD_TO;

    if (!env.FORWARD_TO) {
      console.warn("FORWARD_TO missing, using fallback destination");
    }

    if (!env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is missing");
    }

    let parsedEmail = null;
    let parseError = null;

    /*
     * PARSING
     *
     * Dużych wiadomości nie próbujemy ładować i parsować bez ograniczeń.
     */
    if (message.rawSize <= MAX_PARSE_SIZE) {
      try {
        parsedEmail = await PostalMime.parse(message.raw, {
          maxNestingDepth: 64,
          maxHeadersSize: 1024 * 1024, // 1 MB
          attachmentEncoding: "arraybuffer",
        });
      } catch (error) {
        parseError =
          error instanceof Error ? error.message : String(error);

        console.error("Email parsing failed:", parseError);
      }
    } else {
      parseError = `Message too large to parse: ${message.rawSize} bytes`;

      console.warn(parseError);
    }

    /*
     * Jeśli PostalMime poległ, nadal mamy podstawowe dane
     * bezpośrednio z Cloudflare EmailMessage.
     */
    const messageId =
      parsedEmail?.messageId ??
      message.headers.get("message-id") ??
      null;

    const subject =
      parsedEmail?.subject ??
      message.headers.get("subject") ??
      "";

    /*
     * Stabilne ID.
     *
     * Retry tego samego maila zapisze ten sam pathname
     * zamiast generować kolejny UUID.
     */
    const id = await createMessageId({
      messageId,
      from: message.from,
      to: message.to,
      date: message.headers.get("date"),
      subject,
      rawSize: message.rawSize,
    });

    const data = {
      schemaVersion: 1,

      id,
      direction: "inbound",

      receivedAt,

      envelope: {
        from: message.from,
        to: message.to,
      },

      from: parsedEmail?.from ?? null,
      sender: parsedEmail?.sender ?? null,

      to: parsedEmail?.to ?? [],
      cc: parsedEmail?.cc ?? [],
      bcc: parsedEmail?.bcc ?? [],
      replyTo: parsedEmail?.replyTo ?? [],

      subject,

      date:
        parsedEmail?.date ??
        message.headers.get("date") ??
        null,

      messageId,

      inReplyTo:
        parsedEmail?.inReplyTo ??
        message.headers.get("in-reply-to") ??
        null,

      references:
        parsedEmail?.references ??
        message.headers.get("references") ??
        null,

      deliveredTo: parsedEmail?.deliveredTo ?? null,
      returnPath: parsedEmail?.returnPath ?? null,

      text: parsedEmail?.text ?? "",
      html: parsedEmail?.html ?? "",

      /*
       * PostalMime zachowuje wszystkie nagłówki.
       * Przy błędzie parsera zapisujemy minimalny fallback.
       */
      headers:
        parsedEmail?.headers ??
        headersToArray(message.headers),

      rawSize: message.rawSize,

      parse: {
        success: Boolean(parsedEmail),
        error: parseError,
      },

      attachments:
        parsedEmail?.attachments?.map((a) => ({
          filename: a.filename ?? null,
          mimeType: a.mimeType ?? null,
          disposition: a.disposition ?? null,
          contentId: a.contentId ?? null,
          related: a.related ?? false,
          size:
            a.content instanceof ArrayBuffer
              ? a.content.byteLength
              : null,
        })) ?? [],
    };

    /*
     * Forward + Blob są niezależne.
     *
     * Błąd Blob nie może spowodować utraty maila w Gmailu.
     */
    const [forwardResult, blobResult] = await Promise.allSettled([
      forwardEmail(message, forwardTo),
      storeEmail(data, env),
    ]);

    if (forwardResult.status === "rejected") {
      console.error(
        "Forward failed:",
        getErrorMessage(forwardResult.reason)
      );
    } else {
      console.log("Email forwarded:", {
        id,
        destination: forwardTo,
      });
    }

    if (blobResult.status === "rejected") {
      console.error(
        "Blob storage failed:",
        getErrorMessage(blobResult.reason)
      );
    } else if (blobResult.value) {
      console.log("Email stored:", {
        id,
        pathname: blobResult.value.pathname,
      });
    }

    /*
     * Forward traktujemy jako krytyczny.
     *
     * Jeśli Gmail nie dostał wiadomości, chcemy aby Worker
     * zakończył się błędem.
     *
     * Storage jest dodatkową warstwą — jego błąd tylko logujemy.
     */
    if (forwardResult.status === "rejected") {
      throw forwardResult.reason;
    }
  },
};

async function forwardEmail(message, destination) {
  if (!message.canBeForwarded) {
    throw new Error("Cloudflare reports message cannot be forwarded");
  }

  return message.forward(destination);
}

async function storeEmail(data, env) {
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is missing");
  }

  const pathname = `emails/inbound/${data.id}.json`;

  return put(
    pathname,
    JSON.stringify(data),
    {
      access: "private",
      contentType: "application/json",

      /*
       * Retry Workera może próbować zapisać ten sam mail.
       * Stabilny pathname + overwrite daje logiczną idempotencję.
       */
      allowOverwrite: true,

      token: env.BLOB_READ_WRITE_TOKEN,

      abortSignal: AbortSignal.timeout(BLOB_TIMEOUT_MS),
    }
  );
}

async function createMessageId({
  messageId,
  from,
  to,
  date,
  subject,
  rawSize,
}) {
  /*
   * Message-ID jest najlepszym identyfikatorem,
   * ale nie ufamy mu jako pathname.
   * Hashujemy wszystko.
   */
  const source = [
    messageId ?? "",
    from ?? "",
    to ?? "",
    date ?? "",
    subject ?? "",
    String(rawSize ?? ""),
  ].join("\n");

  const bytes = new TextEncoder().encode(source);

  const digest = await crypto.subtle.digest(
    "SHA-256",
    bytes
  );

  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function headersToArray(headers) {
  return [...headers.entries()].map(([key, value]) => ({
    key,
    value,
  }));
}

function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : String(error);
}