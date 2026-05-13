import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirestoreService } from './firestore.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'FIREBASE_APP',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return admin.initializeApp({
          credential: admin.credential.cert({
            projectId: configService.getOrThrow<string>('FIREBASE_PROJECT_ID'),
            clientEmail: configService.getOrThrow<string>(
              'FIREBASE_CLIENT_EMAIL',
            ),
            privateKey: configService
              .getOrThrow<string>('FIREBASE_PRIVATE_KEY')
              .replace(/\\n/g, '\n'),
          }),
        });
      },
    },
    FirestoreService,
  ],
  exports: [FirestoreService],
})
export class FirebaseModule {}
