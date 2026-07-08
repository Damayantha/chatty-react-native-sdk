import React from "react";
import { ChattyChatViewProps } from "./ChattyChatView";
export interface ChattyLauncherProps extends ChattyChatViewProps {
    /** "left" | "right", defaults to "right". */
    position?: "left" | "right";
}
/**
 * Floating launcher button + full-screen modal chat panel — the native-SDK
 * equivalent of widget.js's launcher button + iframe panel.
 */
export declare function ChattyLauncher(props: ChattyLauncherProps): React.JSX.Element;
