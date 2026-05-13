export enum UserType {
  OWNER = 'owner',
  DRIVER = 'driver',
  ADMIN = 'admin',
}

export class FirestoreUser {
  constructor(
    private readonly id: string,
    private readonly email: string,
    private readonly name: string,
    private readonly role: string,
    private readonly userType: UserType,
    private readonly phoneNumber: string | null,
    private readonly photoUrl: string | null,
    private readonly fcmToken: string | null,
    private readonly traccarUserId: number | null,
    private readonly traccarPassword: string | null,
  ) {}

  getId(): string {
    return this.id;
  }

  getEmail(): string {
    return this.email;
  }

  getName(): string {
    return this.name;
  }

  getRole(): string {
    return this.role;
  }

  getUserType(): UserType {
    return this.userType;
  }

  getPhoneNumber(): string | null {
    return this.phoneNumber;
  }

  getPhotoUrl(): string | null {
    return this.photoUrl;
  }

  getFcmToken(): string | null {
    return this.fcmToken;
  }

  getTraccarUserId(): number | null {
    return this.traccarUserId;
  }

  getTraccarPassword(): string | null {
    return this.traccarPassword;
  }
}
