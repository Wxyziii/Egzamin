import { useCallback, useEffect, useMemo, useState } from 'react';
import { canCreateInternalNotes, normalizeRole } from '../components/helpers';
import { seedState } from '../data/seedData';
import type {
  HelpdeskState,
  NewTicketInput,
  Notification,
  Role,
  Session,
  Ticket,
  TicketMessage,
  Priority,
  TicketStatus
} from '../types/helpdesk';

const STORAGE_KEY = 'helpdeskReactState';
const CHANNEL_NAME = 'helpdesk-demo-sync';

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function loadState(): HelpdeskState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seedState;
  try {
    const parsed = JSON.parse(raw) as HelpdeskState;
    return {
      tickets: parsed.tickets?.length ? parsed.tickets : seedState.tickets,
      notifications: parsed.notifications ?? [],
      selectedTicketId: parsed.selectedTicketId ?? parsed.tickets?.[0]?.id
    };
  } catch {
    return seedState;
  }
}

export function saveState(state: HelpdeskState) {
  // localStorage gives exam/demo persistence without requiring a database server.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function nextTicketId(tickets: Ticket[]) {
  const max = tickets
    .map(ticket => Number(ticket.id.replace(/\D/g, '')))
    .filter(Boolean)
    .reduce((a, b) => Math.max(a, b), 2040);
  return `TK-${max + 1}`;
}

function messageRole(role: Role): TicketMessage['role'] {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === 'admin' ? 'admin' : normalizedRole === 'support' ? 'support' : 'user';
}

export function useHelpdeskStore(session: Session | null) {
  const [state, setState] = useState<HelpdeskState>(() => loadState());

  const persist = useCallback((updater: (current: HelpdeskState) => HelpdeskState) => {
    setState(current => {
      // React state mutation path: each update creates a new state object, so the UI refreshes instantly without manual browser reload.
      const next = updater(current);
      saveState(next);
      // Demo-only realtime simulation between tabs. A production version would use WebSockets, SSE, or database events.
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel(CHANNEL_NAME);
        channel.postMessage(next);
        channel.close();
      }
      return next;
    });
  }, []);

  useEffect(() => {
    // Demo-only sync: lets two browser tabs update tickets/notifications without refreshing.
    // This simulates realtime behavior for the exam; it is not the AD/C++ security boundary.
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        setState(JSON.parse(event.newValue) as HelpdeskState);
      }
    };
    window.addEventListener('storage', onStorage);

    let channel: BroadcastChannel | undefined;
    if ('BroadcastChannel' in window) {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = event => setState(event.data as HelpdeskState);
    }

    return () => {
      window.removeEventListener('storage', onStorage);
      channel?.close();
    };
  }, []);

  const selectTicket = useCallback((ticketId: string) => {
    persist(current => ({ ...current, selectedTicketId: ticketId }));
  }, [persist]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    persist(current => ({
      ...current,
      notifications: [
        { ...notification, id: id('NTF'), createdAt: new Date().toISOString() },
        ...current.notifications
      ]
    }));
  }, [persist]);

  const createTicket = useCallback((input: NewTicketInput) => {
    if (!session) return;
    const now = new Date().toISOString();
    persist(current => {
      const ticket: Ticket = {
        id: nextTicketId(current.tickets),
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority,
        status: 'Open',
        createdBy: session.username,
        messages: [{
          id: id('MSG'),
          author: session.username,
          role: 'user',
          body: input.description,
          createdAt: now
        }],
        createdAt: now,
        updatedAt: now
      };
      return { ...current, tickets: [ticket, ...current.tickets], selectedTicketId: ticket.id };
    });
  }, [persist, session]);

  const claimTicket = useCallback((ticketId: string) => {
    if (!session || normalizeRole(session.role) === 'user') return;
    const now = new Date().toISOString();
    const text = `${session.username} har tatt saken din. Du kan sende melding til support.`;
    persist(current => {
      const ticket = current.tickets.find(item => item.id === ticketId);
      const owner = ticket?.createdBy ?? '';
      return {
        ...current,
        tickets: current.tickets.map(item => item.id === ticketId ? {
          ...item,
          assignedTo: session.username,
          status: 'In Progress',
          updatedAt: now,
          messages: [...item.messages, {
            id: id('MSG'),
            author: 'System',
            role: 'system',
            body: text,
            createdAt: now
          }]
        } : item),
        notifications: owner ? [{
          id: id('NTF'),
          ticketId,
          recipient: owner,
          text,
          createdAt: now
        }, ...current.notifications] : current.notifications
      };
    });
  }, [persist, session]);

  const sendMessage = useCallback((ticketId: string, body: string, internal = false) => {
    if (!session || !body.trim()) return;
    const now = new Date().toISOString();
    const safeInternal = internal && canCreateInternalNotes(session.role);
    persist(current => ({
      ...current,
      tickets: current.tickets.map(ticket => ticket.id === ticketId ? {
        ...ticket,
        updatedAt: now,
        messages: [...ticket.messages, {
          id: id('MSG'),
          author: session.username,
          role: messageRole(session.role),
          body,
          internal: safeInternal,
          createdAt: now
        }]
      } : ticket)
    }));
  }, [persist, session]);

  const changeTicketStatus = useCallback((ticketId: string, status: TicketStatus) => {
    const now = new Date().toISOString();
    persist(current => ({
      ...current,
      tickets: current.tickets.map(ticket => ticket.id === ticketId ? { ...ticket, status, updatedAt: now } : ticket)
    }));
  }, [persist]);

  const changeTicketPriority = useCallback((ticketId: string, priority: Priority) => {
    const now = new Date().toISOString();
    persist(current => ({
      ...current,
      tickets: current.tickets.map(ticket => ticket.id === ticketId ? { ...ticket, priority, updatedAt: now } : ticket)
    }));
  }, [persist]);

  const selectedTicket = useMemo(
    () => state.tickets.find(ticket => ticket.id === state.selectedTicketId) ?? state.tickets[0],
    [state.selectedTicketId, state.tickets]
  );

  return {
    state,
    selectedTicket,
    createTicket,
    claimTicket,
    sendMessage,
    changeTicketStatus,
    changeTicketPriority,
    addNotification,
    selectTicket
  };
}
