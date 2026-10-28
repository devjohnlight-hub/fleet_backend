import * as admin from 'firebase-admin';
import { FirestoreService } from '../../../infrastructure/firebase/firestore.service';
import { StaffUser } from '../../domain/entities/staff-role';
import { AdminAuditLogsQueryDto } from '../dtos/admin-queries.dto';
import { CursorPage, DEFAULT_PAGE_SIZE, paginate, toIso } from './admin-pagination';

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

  // Les filtres combinés à orderBy(createdAt) demandent des index composites Firestore
  async list(query: AdminAuditLogsQueryDto): Promise<CursorPage<Record<string, unknown>>> {
    const collection = this.firestoreService.collection(COLLECTION);
    let filtered: admin.firestore.Query = collection;
    for (const field of ['targetType', 'targetId', 'actorUid', 'action'] as const) {
      if (query[field]) filtered = filtered.where(field, '==', query[field]);
    }

    return paginate(
      filtered.orderBy('createdAt', 'desc'),
      collection,
      query.cursor,
      query.limit ?? DEFAULT_PAGE_SIZE,
      (doc) => ({ id: doc.id, ...doc.data(), createdAt: toIso(doc.get('createdAt')) }),
    );
  }

  // Exécute une mutation et la consigne, en succès comme en échec
  async record<T>(
    actor: StaffUser,
    entry: Omit<AdminAuditEntry, 'result' | 'after' | 'error'>,
    operation: () => Promise<{ result: T; after: Record<string, unknown> | null }>,
  ): Promise<T> {
    let outcome: { result: T; after: Record<string, unknown> | null };
    try {
      outcome = await operation();
    } catch (err) {
      await this.log(actor, {
        ...entry,
        result: 'failure',
        error: err instanceof Error ? err.message : 'Erreur inconnue',
      });
      throw err;
    }
    await this.log(actor, { ...entry, result: 'success', after: outcome.after });
    return outcome.result;
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
