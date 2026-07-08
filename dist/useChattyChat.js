import { useCallback, useEffect, useRef, useState } from "react";
import { ChattyClient, } from "./api";
import { getOrCreateSessionId } from "./session";
/**
 * Drives a full Chatty conversation: loads bot theme/config, manages the
 * persistent session id, sends messages, and polls for human-agent replies.
 * This is the native-SDK equivalent of widget.js's embed iframe lifecycle.
 */
export function useChattyChat(options) {
    const { botId, baseUrl, host, hostKey = "app", pollIntervalMs = 4000, visitorTimezone = "UTC" } = options;
    const clientRef = useRef(null);
    if (!clientRef.current) {
        clientRef.current = new ChattyClient({ botId, baseUrl, host });
    }
    const [theme, setTheme] = useState(null);
    const [ready, setReady] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [sending, setSending] = useState(false);
    const [aiPaused, setAiPaused] = useState(false);
    const [error, setError] = useState(null);
    const lastPollAt = useRef(new Date().toISOString());
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [t, sid] = await Promise.all([
                    clientRef.current.getTheme(),
                    getOrCreateSessionId(botId, hostKey),
                ]);
                if (cancelled)
                    return;
                setTheme(t);
                setSessionId(sid);
                if (t.welcome_message) {
                    setMessages([
                        {
                            id: "welcome",
                            role: "assistant",
                            text: t.welcome_message,
                            createdAt: new Date().toISOString(),
                        },
                    ]);
                }
                setReady(true);
            }
            catch (e) {
                if (!cancelled)
                    setError(e instanceof Error ? e.message : String(e));
            }
        })();
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [botId]);
    // Poll for human-agent messages once a session exists.
    useEffect(() => {
        if (!sessionId || !ready)
            return;
        const interval = setInterval(async () => {
            try {
                const res = await clientRef.current.poll(sessionId, lastPollAt.current);
                if (res.messages.length > 0) {
                    lastPollAt.current = res.messages[res.messages.length - 1].created_at;
                    setMessages((prev) => [
                        ...prev,
                        ...res.messages.map((m, i) => ({
                            id: `poll-${Date.now()}-${i}`,
                            role: (m.sender === "agent" ? "agent" : "assistant"),
                            text: m.content,
                            createdAt: m.created_at,
                        })),
                    ]);
                }
                setAiPaused(!!res.ai_paused);
            }
            catch {
                // silent — polling failures shouldn't surface as user-facing errors
            }
        }, pollIntervalMs);
        return () => clearInterval(interval);
    }, [sessionId, ready, pollIntervalMs]);
    const sendText = useCallback(async (text) => {
        if (!sessionId || !text.trim())
            return;
        const userMsg = {
            id: `local-${Date.now()}`,
            role: "user",
            text,
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setSending(true);
        setError(null);
        try {
            const res = await clientRef.current.sendMessage(sessionId, text, visitorTimezone);
            setAiPaused(!!res.ai_paused);
            if (!res.ai_paused && res.reply) {
                setMessages((prev) => [
                    ...prev,
                    { id: `reply-${Date.now()}`, role: "assistant", text: res.reply, createdAt: new Date().toISOString() },
                ]);
            }
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
        finally {
            setSending(false);
        }
    }, [sessionId, visitorTimezone]);
    const sendImage = useCallback(async (file, caption = "") => {
        if (!sessionId)
            return;
        setSending(true);
        setError(null);
        setMessages((prev) => [
            ...prev,
            {
                id: `local-img-${Date.now()}`,
                role: "user",
                text: caption,
                createdAt: new Date().toISOString(),
                fileUrl: file.uri,
                fileType: file.type,
            },
        ]);
        try {
            const res = await clientRef.current.sendMedia(sessionId, file, caption, visitorTimezone);
            setAiPaused(!!res.ai_paused);
            if (!res.ai_paused && res.reply) {
                setMessages((prev) => [
                    ...prev,
                    { id: `reply-${Date.now()}`, role: "assistant", text: res.reply, createdAt: new Date().toISOString() },
                ]);
            }
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
        finally {
            setSending(false);
        }
    }, [sessionId, visitorTimezone]);
    return { theme, ready, messages, sending, aiPaused, error, sendText, sendImage };
}
