import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'gate8.validador.event';

export type EventSession = {
  id: string;
  name: string;
  slug: string;
};

type Listener = (event: EventSession | null) => void;

let memory: EventSession | null = null;
const listeners = new Set<Listener>();

const storeOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

export function subscribeEvent(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit(event: EventSession | null) {
  for (const listener of listeners) listener(event);
}

function isSession(value: unknown): value is EventSession {
  if (!value || typeof value !== 'object') return false;
  const row = value as EventSession;
  return typeof row.id === 'string' && row.id.length > 0;
}

export async function saveEventSession(event: EventSession) {
  memory = event;
  emit(event);
  try {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(event), storeOptions);
  } catch {
    // Sessão segue na memória se o armazenamento seguro falhar.
  }
}

export async function readEventSession(): Promise<EventSession | null> {
  if (memory) return memory;
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY, storeOptions);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isSession(parsed)) return null;
    memory = {
      id: parsed.id,
      name: parsed.name || '',
      slug: parsed.slug || '',
    };
    return memory;
  } catch {
    return null;
  }
}

export async function clearEventSession() {
  memory = null;
  emit(null);
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY, storeOptions);
  } catch {
    // ignore
  }
}
