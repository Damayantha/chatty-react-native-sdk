export const DEFAULT_BASE_URL = "https://personaliai-api-376030619262.us-central1.run.app";
function buildUrl(baseUrl, path, params) {
    const url = new URL(path, baseUrl);
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined)
            url.searchParams.set(k, v);
    }
    return url.toString();
}
/**
 * Thin HTTP client for the Chatty widget API (`/api/widget/*`). No auth header —
 * bot_id alone identifies the bot, optionally restricted by allowed_domains via `host`.
 */
export class ChattyClient {
    constructor(options) {
        this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
        this.botId = options.botId;
        this.host = options.host;
    }
    async getTheme() {
        const url = buildUrl(this.baseUrl, "/api/widget/theme", {
            bot_id: this.botId,
            t: String(Date.now()),
        });
        const res = await fetch(url);
        if (!res.ok)
            throw new Error(`getTheme failed: ${res.status}`);
        return res.json();
    }
    async sendMessage(sessionId, text, visitorTimezone = "UTC") {
        const res = await fetch(buildUrl(this.baseUrl, "/api/widget/chat", {}), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bot_id: this.botId,
                session_id: sessionId,
                text,
                visitor_timezone: visitorTimezone,
                host: this.host,
            }),
        });
        if (res.status === 429)
            throw new ChattyRateLimitError();
        if (res.status === 403)
            throw new ChattyDomainNotAllowedError();
        if (!res.ok)
            throw new Error(`sendMessage failed: ${res.status}`);
        return res.json();
    }
    /**
     * Send an image/file attachment. `file` must be a React Native file-uri descriptor
     * ({ uri, name, type }) as accepted by RN's FormData/Blob polyfill.
     */
    async sendMedia(sessionId, file, text = "", visitorTimezone = "UTC") {
        const form = new FormData();
        form.append("bot_id", this.botId);
        form.append("session_id", sessionId);
        form.append("text", text);
        form.append("visitor_timezone", visitorTimezone);
        if (this.host)
            form.append("host", this.host);
        form.append("file", file);
        const res = await fetch(buildUrl(this.baseUrl, "/api/widget/chat/media", {}), {
            method: "POST",
            body: form,
        });
        if (res.status === 429)
            throw new ChattyRateLimitError();
        if (res.status === 403)
            throw new ChattyDomainNotAllowedError();
        if (!res.ok)
            throw new Error(`sendMedia failed: ${res.status}`);
        return res.json();
    }
    /** Poll for new messages (e.g. from a human agent) since the given ISO timestamp. */
    async poll(sessionId, after) {
        const url = buildUrl(this.baseUrl, "/api/widget/poll", {
            bot_id: this.botId,
            session_id: sessionId,
            after,
        });
        const res = await fetch(url);
        if (!res.ok)
            throw new Error(`poll failed: ${res.status}`);
        return res.json();
    }
}
export class ChattyRateLimitError extends Error {
    constructor() {
        super("Chatty: rate limit exceeded (30 messages / 60s per bot+IP)");
        this.name = "ChattyRateLimitError";
    }
}
export class ChattyDomainNotAllowedError extends Error {
    constructor() {
        super("Chatty: this app/host is not in the bot's allowed_domains list");
        this.name = "ChattyDomainNotAllowedError";
    }
}
