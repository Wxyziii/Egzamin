export type Role = 'user' | 'support' | 'admin';
export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TicketStatus = 'Open' | 'In Progress' | 'Waiting' | 'Resolved';
export type MessageRole = 'user' | 'support' | 'admin' | 'system';
export type ViewKey =
  | 'create'
  | 'myTickets'
  | 'queue'
  | 'claimed'
  | 'status'
  | 'allTickets'
  | 'users'
  | 'statistics'
  | 'system'
  | 'knowledge'
  | 'messages';

export type Session = {
  username: string;
  role: Role;
  matchedGroup: string;
  source: string;
  checkedBy: string;
};

export type AuthResponse =
  | ({ status: 'auto_login_ok' | 'manual_login_ok' } & Session)
  | { status: 'manual_login_required'; message: string }
  | { status: 'ad_error'; message: string }
  | { status: 'login_failed'; message: string };

export type TicketMessage = {
  id: string;
  author: string;
  role: MessageRole;
  body: string;
  createdAt: string;
  internal?: boolean;
};

export type Ticket = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  status: TicketStatus;
  createdBy: string;
  assignedTo?: string;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
};

export type Notification = {
  id: string;
  ticketId: string;
  recipient: string;
  text: string;
  createdAt: string;
  read?: boolean;
};

export type HelpdeskState = {
  tickets: Ticket[];
  notifications: Notification[];
  selectedTicketId?: string;
};

export type NewTicketInput = {
  title: string;
  description: string;
  category: string;
  priority: Priority;
};
