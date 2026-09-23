import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { resolveEventFromToken } from '@/lib/events';
import {
  clearEventSession,
  readEventSession,
  saveEventSession,
  subscribeEvent,
  type EventSession,
} from '@/lib/event-session';

type EventContextValue = {
  event: EventSession | null;
  loading: boolean;
  enter: (token: string) => Promise<void>;
  leave: () => Promise<void>;
};

const EventContext = createContext<EventContextValue | null>(null);

export function EventProvider({ children }: { children: ReactNode }) {
  const [event, setEvent] = useState<EventSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeEvent(setEvent);
    readEventSession()
      .then(setEvent)
      .finally(() => setLoading(false));
    return unsubscribe;
  }, []);

  const value = useMemo<EventContextValue>(
    () => ({
      event,
      loading,
      enter: async (token: string) => {
        const next = await resolveEventFromToken(token);
        await saveEventSession(next);
        setEvent(next);
      },
      leave: async () => {
        await clearEventSession();
        setEvent(null);
      },
    }),
    [event, loading]
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEventSession() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEventSession precisa estar dentro do EventProvider');
  }
  return context;
}
