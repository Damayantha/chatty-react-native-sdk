# @chatty/react-native

Native React Native chat widget SDK for [Chatty](https://chatty.personaliai.com) — talks to the same `/api/widget/*` backend as the web widget, rendered with real React Native components (no WebView).

## Install

```bash
npm install @chatty/react-native @react-native-async-storage/async-storage
```

## Usage — floating launcher (recommended)

```tsx
import { ChattyLauncher } from "@chatty/react-native";

export default function App() {
  return (
    <>
      {/* ...your app... */}
      <ChattyLauncher botId="YOUR_BOT_ID" position="right" />
    </>
  );
}
```

## Usage — embedded full-screen chat

```tsx
import { ChattyChatView } from "@chatty/react-native";

function SupportScreen() {
  return <ChattyChatView botId="YOUR_BOT_ID" />;
}
```

## Usage — headless (build your own UI)

```tsx
import { useChattyChat } from "@chatty/react-native";

function CustomChat() {
  const { messages, sendText, sending, theme } = useChattyChat({ botId: "YOUR_BOT_ID" });
  // render messages and call sendText(text) yourself
}
```

## Notes

- If the bot has `allowed_domains` configured in the dashboard, pass a matching `host` prop — native apps don't send an `Origin`/`Referer` header, so without a matching `host` value, requests will be rejected with 403. Leave `allowed_domains` empty for mobile-only bots to skip this.
- Lead capture and meeting booking happen conversationally (the assistant decides to ask/act) — there's no separate REST call to trigger them from the SDK.
- Polling for human-agent takeover messages runs every 4s while the chat is mounted, matching the web widget.
