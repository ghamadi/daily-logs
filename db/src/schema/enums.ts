/**
 * Utility type: extracts the union of values from an `as const` object.
 * Usage: Enum<typeof MessageChannel> -> 0 | 1 | 2 | 3
 */
export type Enum<T extends Record<string, string | number>> = T[keyof T];

/**
 * Numeric enums (stored as SMALLINT for efficiency)
 * Keep 0 reserved for "Unknown" to ease migrations.
 */
export const MessageChannel = {
  Unknown: 0,
  WhatsApp: 1,
  Web: 2,
  Api: 3,
} as const;
export type MessageChannel = Enum<typeof MessageChannel>;

export const MessageDirection = {
  Unknown: 0,
  Inbound: 1,
  Outbound: 2,
} as const;
export type MessageDirection = Enum<typeof MessageDirection>;

export const MessageType = {
  Unknown: 0,
  Text: 1,
  Image: 2,
  Audio: 3,
  Document: 4,
  System: 10,
} as const;
export type MessageType = Enum<typeof MessageType>;

export const EventType = {
  Unknown: 0,
  Note: 1,
} as const;
export type EventType = Enum<typeof EventType>;

export const EventStatus = {
  Unknown: 0,
  Proposed: 1,
  Confirmed: 2,
  Rejected: 3,
} as const;
export type EventStatus = Enum<typeof EventStatus>;

export const WorkspaceRole = {
  Unknown: 0,
  Member: 1,
  Admin: 2,
  Owner: 3,
} as const;
export type WorkspaceRole = Enum<typeof WorkspaceRole>;
