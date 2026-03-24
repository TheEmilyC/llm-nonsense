export enum LorebookStatus {
  ServerUnavailable = "server-unavailable",
  NotInitialized = "not-initalized",
  IndexMissing = "index-missing",
  Ready = "ready",
}

interface LorebookServerUnavailable {
  status: LorebookStatus.ServerUnavailable;
}

interface LorebookUnitialized {
  status: LorebookStatus.NotInitialized;
}

interface LorebookIndexMissing {
  status: LorebookStatus.IndexMissing;
  name: string;
}

interface indexEntry {
  filename: string;
  name: string;
  summary: string;
  tags: string[];
  keys: string[];
}

interface LorebookReady {
  status: LorebookStatus.Ready;
  name: string;
  index: indexEntry[];
}

export type Lorebook =
  | LorebookServerUnavailable
  | LorebookUnitialized
  | LorebookIndexMissing
  | LorebookReady;
