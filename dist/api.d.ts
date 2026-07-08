export declare const DEFAULT_BASE_URL = "https://personaliai-api-376030619262.us-central1.run.app";
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
/**
 * Thin HTTP client for the Chatty widget API (`/api/widget/*`). No auth header —
 * bot_id alone identifies the bot, optionally restricted by allowed_domains via `host`.
 */
export declare class ChattyClient {
    private baseUrl;
    private botId;
    private host?;
    constructor(options: ChattyClientOptions);
    getTheme(): Promise<ChattyTheme>;
    sendMessage(sessionId: string, text: string, visitorTimezone?: string): Promise<ChattyChatResponse>;
    /**
     * Send an image/file attachment. `file` must be a React Native file-uri descriptor
     * ({ uri, name, type }) as accepted by RN's FormData/Blob polyfill.
     */
    sendMedia(sessionId: string, file: {
        uri: string;
        name: string;
        type: string;
    }, text?: string, visitorTimezone?: string): Promise<ChattyMediaResponse>;
    /** Poll for new messages (e.g. from a human agent) since the given ISO timestamp. */
    poll(sessionId: string, after: string): Promise<ChattyPollResponse>;
}
export declare class ChattyRateLimitError extends Error {
    constructor();
}
export declare class ChattyDomainNotAllowedError extends Error {
    constructor();
}
