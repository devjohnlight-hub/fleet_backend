import * as admin from 'firebase-admin';
import { FirestoreService } from '../../../infrastructure/firebase/firestore.service';
import { StaffUser } from '../../domain/entities/staff-role';

const COLLECTION = 'admin_audit_logs';
const REDACTED = '[REDACTED]';
const SENSITIVE_KEY = /password|token|secret|privatekey|signedurl/i;

export interface AdminAuditEntry {
  action: string;
  targetType: string;
  targetId: string;
  result: 'success' | 'failure';
  reason?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  error?: string | null;
}

export class AdminAuditService {
  constructor(private readonly firestoreService: FirestoreService) {}

  // Append-only : aucune méthode de mise à jour ou de suppression n'est exposée
  async log(actor: StaffUser, entry: AdminAuditEntry): Promise<string> {
    const ref = await this.firestoreService.collection(COLLECTION).add({
      actorUid: actor.id,
      actorEmail: actor.email,
      actorRole: actor.role,
      requestId: actor.requestId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      result: entry.result,
      reason: entry.reason ?? null,
      before: this.redact(entry.before ?? null),
      after: this.redact(entry.after ?? null),
      error: entry.error ?? null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return ref.id;
  }

  private redact(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((v) => this.redact(v));
    if (value === null || typeof value !== 'object') return value ?? null;
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, SENSITIVE_KEY.test(k) ? REDACTED : this.redact(v)]),
    );
  }
}
