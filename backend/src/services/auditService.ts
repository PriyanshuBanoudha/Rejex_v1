import { AuditLog } from '../models/AuditLog';

export interface AuditEntry {
  actorId?: string;
  actorEmail?: string;
  action: string;
  resource: string;
  resourceId?: string;
  eventId?: string;
  payload?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await AuditLog.create(entry);
  } catch (err) {
    // Audit failures should never block the main flow
    console.error('[Audit] Failed to write audit log:', err);
  }
}
