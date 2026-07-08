import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { ChattyMessage, useChattyChat, UseChattyChatOptions } from "./useChattyChat";

export interface ChattyChatViewProps extends UseChattyChatOptions {
  /** Called once theme/config has loaded and the chat is ready to use. */
  onReady?: () => void;
  /** Called after every new assistant/agent message arrives (mirrors `chatty:message`). */
  onMessage?: (message: ChattyMessage) => void;
}

const FALLBACK_COLOR = "#f97316";

export function ChattyChatView(props: ChattyChatViewProps) {
  const { theme, ready, messages, sending, aiPaused, error, sendText } = useChattyChat(props);
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList<ChattyMessage>>(null);
  const color = theme?.primary_color || FALLBACK_COLOR;
  const lastMessageCount = useRef(0);

  React.useEffect(() => {
    if (ready) props.onReady?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  React.useEffect(() => {
    if (messages.length > lastMessageCount.current) {
      const newest = messages[messages.length - 1];
      if (newest.role !== "user") props.onMessage?.(newest);
      lastMessageCount.current = messages.length;
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    void sendText(text);
  };

  const handleStarter = (starter: string) => {
    if (sending) return;
    void sendText(starter);
  };

  if (!ready) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={color} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <View style={[styles.header, { backgroundColor: color }]}>
        {theme?.logo_url ? (
          <Image source={{ uri: theme.logo_url }} style={styles.avatar} />
        ) : null}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {theme?.name || "Chat"}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => <Bubble message={item} color={color} />}
        ListFooterComponent={sending ? <TypingIndicator color={color} /> : null}
      />

      {theme?.conversation_starters && theme.conversation_starters.length > 0 && messages.length <= 1 && (
        <View style={styles.starters}>
          {theme.conversation_starters.map((s, i) => (
            <TouchableOpacity key={i} style={styles.starterChip} onPress={() => handleStarter(s)}>
              <Text style={styles.starterText} numberOfLines={2}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {aiPaused && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>A human agent has taken over this conversation.</Text>
        </View>
      )}
      {error && (
        <View style={[styles.banner, styles.errorBanner]}>
          <Text style={styles.bannerText}>{error}</Text>
        </View>
      )}

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message…"
          placeholderTextColor="#9ca3af"
          multiline
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: color, opacity: input.trim() ? 1 : 0.5 }]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          <Text style={styles.sendButtonText}>{"↑"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message, color }: { message: ChattyMessage; color: string }) {
  const isUser = message.role === "user";
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant]}>
      <View
        style={[
          styles.bubble,
          isUser ? { backgroundColor: color, borderBottomRightRadius: 4 } : { backgroundColor: "#f3f4f6", borderBottomLeftRadius: 4 },
        ]}
      >
        {message.fileUrl ? <Image source={{ uri: message.fileUrl }} style={styles.attachedImage} /> : null}
        {message.text ? (
          <Text style={isUser ? styles.bubbleTextUser : styles.bubbleTextAssistant}>{message.text}</Text>
        ) : null}
      </View>
    </View>
  );
}

function TypingIndicator({ color }: { color: string }) {
  return (
    <View style={[styles.bubbleRow, styles.bubbleRowAssistant]}>
      <View style={[styles.bubble, { backgroundColor: "#f3f4f6" }]}>
        <ActivityIndicator size="small" color={color} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  avatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8, backgroundColor: "rgba(255,255,255,0.3)" },
  headerTitle: { color: "#fff", fontSize: 15, fontWeight: "700", flexShrink: 1 },
  messageList: { padding: 12, gap: 8 },
  bubbleRow: { flexDirection: "row", marginVertical: 3 },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubbleRowAssistant: { justifyContent: "flex-start" },
  bubble: { maxWidth: "78%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleTextUser: { color: "#fff", fontSize: 14, lineHeight: 20 },
  bubbleTextAssistant: { color: "#111827", fontSize: 14, lineHeight: 20 },
  attachedImage: { width: 180, height: 130, borderRadius: 10, marginBottom: 6 },
  starters: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  starterChip: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: "100%",
  },
  starterText: { fontSize: 12.5, color: "#374151" },
  banner: { backgroundColor: "#fef3c7", paddingHorizontal: 14, paddingVertical: 8 },
  errorBanner: { backgroundColor: "#fee2e2" },
  bannerText: { fontSize: 11.5, color: "#374151" },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: "#f9fafb",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
