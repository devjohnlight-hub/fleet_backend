import * as admin from 'firebase-admin';
import { FirestoreService } from '../../../infrastructure/firebase/firestore.service';
import { AdminAuditService } from './admin-audit.service';
import { AdminCreateClientNoteDto } from '../dtos/admin-mutations.dto';
import { AdminCursorQueryDto } from '../dtos/admin-queries.dto';
import { StaffUser } from '../../domain/entities/staff-role';
import { CursorPage, DEFAULT_PAGE_SIZE, paginate, toIso } from './admin-pagination';

const COLLECTION = 'admin_client_notes';

export interface ClientNote {
  id: string;
  clientId: string;
  body: string;
  authorUid: string;
  authorEmail: string | null;
  createdAt: string | null;
}

// Notes internes append-only : ni modification ni suppression
export class AdminClientNoteService {
  constructor(
    private readonly firestoreService: FirestoreService,
    private readonly auditService: AdminAuditService,
  ) {}

  async create(staff: StaffUser, uid: string, dto: AdminCreateClientNoteDto): Promise<ClientNote> {
    // auth/user-not-found → 404 via HttpExceptionFilter
    await admin.auth().getUser(uid);

    return this.auditService.record(
      staff,
      { action: 'client.note.create', targetType: 'client', targetId: uid },
      async () => {
        const ref = await this.firestoreService.collection(COLLECTION).add({
          clientId: uid,
          body: dto.body,
          authorUid: staff.id,
          authorEmail: staff.email,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        const note = this.toNote(await ref.get());
        return { result: note, after: { noteId: note.id } };
      },
    );
  }

  async list(uid: string, query: AdminCursorQueryDto): Promise<CursorPage<ClientNote>> {
    const collection = this.firestoreService.collection(COLLECTION);
    return paginate(
      collection.where('clientId', '==', uid).orderBy('createdAt', 'desc'),
      collection,
      query.cursor,
      query.limit ?? DEFAULT_PAGE_SIZE,
      (doc) => this.toNote(doc),
    );
  }

  private toNote(doc: admin.firestore.DocumentSnapshot): ClientNote {
    return {
      id: doc.id,
      clientId: doc.get('clientId'),
      body: doc.get('body'),
      authorUid: doc.get('authorUid'),
      authorEmail: doc.get('authorEmail') ?? null,
      createdAt: toIso(doc.get('createdAt')),
    };
  }
}
