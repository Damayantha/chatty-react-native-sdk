import React, { useEffect, useState } from "react";
import { TouchableOpacity, Text, StyleSheet, Modal, SafeAreaView, View, Platform } from "react-native";
import { ChattyChatView, ChattyChatViewProps } from "./ChattyChatView";
import { ChattyClient, ChattyTheme } from "./api";

export interface ChattyLauncherProps extends ChattyChatViewProps {
  /** "left" | "right", defaults to "right". */
  position?: "left" | "right";
}

const FALLBACK_COLOR = "#f97316";

/**
 * Floating launcher button + full-screen modal chat panel — the native-SDK
 * equivalent of widget.js's launcher button + iframe panel.
 */
export function ChattyLauncher(props: ChattyLauncherProps) {
  const { position = "right", ...chatProps } = props;
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [color, setColor] = useState(FALLBACK_COLOR);

  useEffect(() => {
    let cancelled = false;
    new ChattyClient({ botId: props.botId, baseUrl: props.baseUrl, host: props.host })
      .getTheme()
      .then((t: ChattyTheme) => {
        if (!cancelled && t.primary_color) setColor(t.primary_color);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.botId]);

  return (
    <>
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: color, [position]: 20 } as object,
        ]}
        onPress={() => {
          setOpen(true);
          setUnread(0);
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonIcon}>💬</Text>
        {unread > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" presentationStyle={Platform.OS === "ios" ? "pageSheet" : undefined}>
        <SafeAreaView style={styles.modalSafeArea}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setOpen(false)}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <ChattyChatView
            {...chatProps}
            onMessage={(m) => {
              if (!open) setUnread((u) => u + 1);
              chatProps.onMessage?.(m);
            }}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    bottom: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    zIndex: 999,
  },
  buttonIcon: { fontSize: 24 },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  modalSafeArea: { flex: 1, backgroundColor: "#fff" },
  closeButton: { alignSelf: "flex-end", padding: 14 },
  closeButtonText: { fontSize: 18, color: "#6b7280" },
});
