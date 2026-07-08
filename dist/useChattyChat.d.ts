import { ChattyClientOptions, ChattyTheme } from "./api";
export type ChattyRole = "user" | "assistant" | "agent";
export interface ChattyMessage {
    id: string;
    role: ChattyRole;
    text: string;
    createdAt: string;
    fileUrl?: string;
    fileType?: string;
}
export interface UseChattyChatOptions extends ChattyClientOptions {
    /** Distinguishes sessions across multiple native apps embedding the same bot. Defaults to "app". */
    hostKey?: string;
    /** Poll interval (ms) for human-agent messages while the chat is open. Defaults to 4000, matching the web widget. */
    pollIntervalMs?: number;
    visitorTimezone?: string;
}
export interface UseChattyChatResult {
    theme: ChattyTheme | null;
    ready: boolean;
    messages: ChattyMessage[];
    sending: boolean;
    aiPaused: boolean;
    error: string | null;
    sendText: (text: string) => Promise<void>;
    sendImage: (file: {
        uri: string;
        name: string;
        type: string;
    }, caption?: string) => Promise<void>;
}
/**
 * Drives a full Chatty conversation: loads bot theme/config, manages the
 * persistent session id, sends messages, and polls for human-agent replies.
 * This is the native-SDK equivalent of widget.js's embed iframe lifecycle.
 */
export declare function useChattyChat(options: UseChattyChatOptions): UseChattyChatResult;
