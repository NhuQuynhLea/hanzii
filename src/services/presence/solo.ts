import type { PresenceService, PeerChanges } from "./types";

/** Offline fallback — "Chế độ một mình". */
export class SoloPresence implements PresenceService {
  readonly connected = false;
  async connect(): Promise<boolean> {
    return false;
  }
  disconnect(): void {}
  send(): void {}
  onPeers(_cb: (changes: PeerChanges) => void, _onError?: () => void): void {}
}
