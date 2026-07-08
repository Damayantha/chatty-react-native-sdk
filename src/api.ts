export const DEFAULT_BASE_URL = "https://personaliai-api-376030619262.us-central1.run.app";

export interface ChattyTheme {
  name?: string;
  primary_color?: string;
  /** "style:logoBgColor:launcherShape" */
  widget_style?: string;
  logo_url?: string;
  welcome_message?: string;
  send_button_style?: string;
  conversation_starters?: string[];
  teaser_message?: string;
  avatar_icon?: string;
  avatar_url?: string;
}

export interface ChattyChatResponse {
  reply: string;
  session_id: string;
  ai_paused?: boolean;
}

export interface ChattyMediaResponse extends ChattyChatResponse {
  file_url?: string;
  file_type?: string;
}

export interface ChattyPollMessage {
  content: string;
  created_at: string;
  sender: string;
}

export interface ChattyPollResponse {
  messages: ChattyPollMessage[];
  ai_paused?: boolean;
}

export interface ChattyClientOptions {
  botId: string;
  /** Override the backend base URL (defaults to the production Cloud Run service). */
  baseUrl?: string;
  /** Value sent as the `host` field — must match an entry in the bot's allowed_domains if one is configured. */
  host?: string;
}

function buildUrl(baseUrl: string, path: string, params: Record<string, string | undefined>): string {
  const url = new URL(path, baseUrl);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, v);
  }
  return url.toString();
}

/**
 * Thin HTTP client for the Chatty widget API (`/api/widget/*`). No auth header —
 * bot_id alone identifies the bot, optionally restricted by allowed_domains via `host`.
 */
export class ChattyClient {
  private baseUrl: string;
  private botId: string;
  private host?: string;

  constructor(options: ChattyClientOptions) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.botId = options.botId;
    this.host = options.host;
  }

  async getTheme(): Promise<ChattyTheme> {
    const url = buildUrl(this.baseUrl, "/api/widget/theme", {
      bot_id: this.botId,
      t: String(Date.now()),
    });
    const res = await fetch(url);
    if (!res.ok) throw new Error(`getTheme failed: ${res.status}`);
    return res.json();
  }

  async sendMessage(sessionId: string, text: string, visitorTimezone = "UTC"): Promise<ChattyChatResponse> {
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
    if (res.status === 429) throw new ChattyRateLimitError();
    if (res.status === 403) throw new ChattyDomainNotAllowedError();
    if (!res.ok) throw new Error(`sendMessage failed: ${res.status}`);
    return res.json();
  }

  /**
   * Send an image/file attachment. `file` must be a React Native file-uri descriptor
   * ({ uri, name, type }) as accepted by RN's FormData/Blob polyfill.
   */
  async sendMedia(
    sessionId: string,
    file: { uri: string; name: string; type: string },
    text = "",
    visitorTimezone = "UTC"
  ): Promise<ChattyMediaResponse> {
    const form = new FormData();
    form.append("bot_id", this.botId);
    form.append("session_id", sessionId);
    form.append("text", text);
    form.append("visitor_timezone", visitorTimezone);
    if (this.host) form.append("host", this.host);
    form.append("file", file);

    const res = await fetch(buildUrl(this.baseUrl, "/api/widget/chat/media", {}), {
      method: "POST",
      body: form,
    });
    if (res.status === 429) throw new ChattyRateLimitError();
    if (res.status === 403) throw new ChattyDomainNotAllowedError();
    if (!res.ok) throw new Error(`sendMedia failed: ${res.status}`);
    return res.json();
  }

  /** Poll for new messages (e.g. from a human agent) since the given ISO timestamp. */
  async poll(sessionId: string, after: string): Promise<ChattyPollResponse> {
    const url = buildUrl(this.baseUrl, "/api/widget/poll", {
      bot_id: this.botId,
      session_id: sessionId,
      after,
    });
    const res = await fetch(url);
    if (!res.ok) throw new Error(`poll failed: ${res.status}`);
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
