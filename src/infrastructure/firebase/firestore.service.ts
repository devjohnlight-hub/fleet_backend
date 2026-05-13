import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirestoreService {
  private readonly db: admin.firestore.Firestore;

  constructor(@Inject('FIREBASE_APP') firebaseApp: admin.app.App) {
    this.db = firebaseApp.firestore();
  }

  collection(name: string): admin.firestore.CollectionReference {
    return this.db.collection(name);
  }

  async findAll<T>(collection: string): Promise<T[]> {
    const snapshot = await this.db.collection(collection).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
  }

  async findById<T>(collection: string, id: string): Promise<T | null> {
    const doc = await this.db.collection(collection).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as T;
  }

  async findWhere<T>(
    collection: string,
    field: string,
    value: unknown,
  ): Promise<T[]> {
    const snapshot = await this.db
      .collection(collection)
      .where(field, '==', value)
      .get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
  }

  async create<T>(collection: string, data: Omit<T, 'id'>): Promise<T> {
    const ref = await this.db.collection(collection).add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const doc = await ref.get();
    return { id: doc.id, ...doc.data() } as T;
  }

  async update<T>(
    collection: string,
    id: string,
    data: Partial<T>,
  ): Promise<T> {
    const ref = this.db.collection(collection).doc(id);
    const clean = Object.fromEntries(
      Object.entries({ ...data }).filter(([, v]) => v !== undefined),
    );
    await ref.update(clean);
    const doc = await ref.get();
    return { id: doc.id, ...doc.data() } as T;
  }

  async upsert<T>(
    collection: string,
    id: string,
    data: Partial<T>,
  ): Promise<void> {
    const ref = this.db.collection(collection).doc(id);
    const clean = Object.fromEntries(
      Object.entries({ ...data }).filter(([, v]) => v !== undefined),
    );
    await ref.set(clean, { merge: true });
  }

  async delete(collection: string, id: string): Promise<void> {
    await this.db.collection(collection).doc(id).delete();
  }
}
