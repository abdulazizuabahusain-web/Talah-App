import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";

const SEEN_KEY = "talah:connects_seen_at";

type Listener = (count: number) => void;
const listeners = new Set<Listener>();
let _count = 0;

function notify() {
  listeners.forEach((l) => l(_count));
}

export async function refreshConnects(): Promise<void> {
  try {
    const [res, seenRaw] = await Promise.all([
      api.getConnections(),
      AsyncStorage.getItem(SEEN_KEY),
    ]);
    const lastSeen = seenRaw ? Number(seenRaw) : 0;
    _count = res.connections.filter((g) => g.formedAt > lastSeen).length;
    notify();
  } catch {
    // silent — non-critical
  }
}

export async function markConnectsSeen(): Promise<void> {
  await AsyncStorage.setItem(SEEN_KEY, String(Date.now()));
  _count = 0;
  notify();
}

export function subscribeConnects(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getConnectsCount(): number {
  return _count;
}
