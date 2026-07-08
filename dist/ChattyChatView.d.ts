import React from "react";
import { ChattyMessage, UseChattyChatOptions } from "./useChattyChat";
export interface ChattyChatViewProps extends UseChattyChatOptions {
    /** Called once theme/config has loaded and the chat is ready to use. */
    onReady?: () => void;
    /** Called after every new assistant/agent message arrives (mirrors `chatty:message`). */
    onMessage?: (message: ChattyMessage) => void;
}
export declare function ChattyChatView(props: ChattyChatViewProps): React.JSX.Element;
