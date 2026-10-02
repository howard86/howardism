export interface ReadObjectStore {
  get: (key: string, maxBytes: number) => Promise<Uint8Array>;
  metrics?: { retries: number };
}

/** Store implementations must preserve create-only writes and bound downloads. */
export interface ObjectStore {
  bucket?: string;
  get: (key: string, maxBytes: number) => Promise<Uint8Array>;
  head: (key: string) => Promise<{ bytes: number; sha256: string } | null>;
  metrics?: { retries: number };
  putIfAbsent: (key: string, bytes: Uint8Array) => Promise<void>;
}

export interface StoredObject {
  bytes: number;
  key: string;
  modifiedAt: string;
}
export interface MaintenanceStore extends ObjectStore {
  delete: (key: string) => Promise<void>;
  list: () => Promise<StoredObject[]>;
}
