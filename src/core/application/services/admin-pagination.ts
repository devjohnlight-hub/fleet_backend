import { BadRequestException } from '@nestjs/common';
import * as admin from 'firebase-admin';

export const DEFAULT_PAGE_SIZE = 50;

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// Le curseur est l'ID du dernier document renvoyé ; la requête doit avoir un orderBy
export async function paginate<T>(
  query: admin.firestore.Query,
  collection: admin.firestore.CollectionReference,
  cursor: string | undefined,
  limit: number,
  map: (doc: admin.firestore.QueryDocumentSnapshot) => T,
): Promise<CursorPage<T>> {
  let paged = query;
  if (cursor) {
    const last = await collection.doc(cursor).get();
    if (!last.exists) throw new BadRequestException('Curseur invalide');
    paged = paged.startAfter(last);
  }

  const snapshot = await paged.limit(limit + 1).get();
  const docs = snapshot.docs.slice(0, limit);
  const hasMore = snapshot.size > limit;
  return {
    items: docs.map(map),
    nextCursor: hasMore ? docs[docs.length - 1].id : null,
    hasMore,
  };
}

export function toIso(value: unknown): string | null {
  return value instanceof admin.firestore.Timestamp
    ? value.toDate().toISOString()
    : null;
}
