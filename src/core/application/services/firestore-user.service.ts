import * as admin from 'firebase-admin';
import { UnauthorizedException } from '@nestjs/common';
import { FirestoreService } from '../../../infrastructure/firebase/firestore.service';
import {
  FirestoreUser,
  UserType,
} from '../../domain/entities/firestore-user.entity';

const COLLECTION = 'users';

interface FirebaseSignInResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
}

interface UserRaw {
  id: string;
  email: string;
  name: string;
  role: string;
  userType: UserType;
  phoneNumber: string | null;
  photoUrl: string | null;
  fcmToken: string | null;
  traccarUserId: number | null;
  traccarPassword: string | null;
}

export class FirestoreUserService {
  private readonly apiKey: string;

  constructor(private readonly firestoreService: FirestoreService) {
    this.apiKey = process.env.FIREBASE_API_KEY ?? '';
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ token: string; expiresIn: string }> {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    if (!response.ok) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const data = (await response.json()) as FirebaseSignInResponse;
    return { token: data.idToken, expiresIn: data.expiresIn };
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
    role: string;
    userType: UserType;
    phoneNumber?: string;
    photoUrl?: string;
  }): Promise<FirestoreUser> {
    const { password, ...firestoreData } = data;

    const authUser = await admin.auth().createUser({
      email: data.email,
      password,
      displayName: data.name,
      ...(data.phoneNumber ? { phoneNumber: data.phoneNumber } : {}),
      ...(data.photoUrl ? { photoURL: data.photoUrl } : {}),
    });

    await this.firestoreService
      .collection(COLLECTION)
      .doc(authUser.uid)
      .set({
        ...firestoreData,
        phoneNumber: firestoreData.phoneNumber ?? null,
        photoUrl: firestoreData.photoUrl ?? null,
        fcmToken: null,
      });

    return this.toDomain({
      id: authUser.uid,
      email: data.email,
      name: data.name,
      role: data.role,
      userType: data.userType,
      phoneNumber: data.phoneNumber ?? null,
      photoUrl: data.photoUrl ?? null,
      fcmToken: null,
      traccarUserId: null,
      traccarPassword: null,
    });
  }

  async findAll(): Promise<FirestoreUser[]> {
    const raws = await this.firestoreService.findAll<UserRaw>(COLLECTION);
    return raws.map((raw) => this.toDomain(raw));
  }

  async findById(id: string): Promise<FirestoreUser | null> {
    const raw = await this.firestoreService.findById<UserRaw>(COLLECTION, id);
    return raw ? this.toDomain(raw) : null;
  }

  async create(data: {
    email: string;
    name: string;
    role: string;
    userType: UserType;
    phoneNumber?: string | null;
    photoUrl?: string | null;
    fcmToken?: string | null;
  }): Promise<FirestoreUser> {
    const raw = await this.firestoreService.create<UserRaw>(COLLECTION, {
      email: data.email,
      name: data.name,
      role: data.role,
      userType: data.userType,
      phoneNumber: data.phoneNumber ?? null,
      photoUrl: data.photoUrl ?? null,
      fcmToken: data.fcmToken ?? null,
      traccarUserId: null,
      traccarPassword: null,
    });
    return this.toDomain(raw);
  }

  async upsert(id: string, data: Partial<UserRaw>): Promise<void> {
    await this.firestoreService.upsert<UserRaw>(COLLECTION, id, data);
  }

  async update(id: string, data: Partial<UserRaw>): Promise<FirestoreUser> {
    const raw = await this.firestoreService.update<UserRaw>(
      COLLECTION,
      id,
      data,
    );
    return this.toDomain(raw);
  }

  async delete(id: string): Promise<void> {
    await this.firestoreService.delete(COLLECTION, id);
  }

  private toDomain(raw: UserRaw): FirestoreUser {
    return new FirestoreUser(
      raw.id,
      raw.email,
      raw.name,
      raw.role,
      raw.userType,
      raw.phoneNumber ?? null,
      raw.photoUrl ?? null,
      raw.fcmToken ?? null,
      raw.traccarUserId ?? null,
      raw.traccarPassword ?? null,
    );
  }
}
