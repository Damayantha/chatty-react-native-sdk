import AsyncStorage from "@react-native-async-storage/async-storage";
function randomId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
/**
 * Mirrors the web widget's session id scheme (`chatty_sid_{botId}_{hostKey}` in
 * localStorage) so the same visitor is recognized whether they arrive via web
 * or the native app, when `hostKey` is shared deliberately.
 */
export async function getOrCreateSessionId(botId, hostKey = "app") {
    const key = `chatty_sid_${botId}_${hostKey}`;
    const existing = await AsyncStorage.getItem(key);
    if (existing)
        return existing;
    const sid = `v-${randomId()}`;
    await AsyncStorage.setItem(key, sid);
    return sid;
}
