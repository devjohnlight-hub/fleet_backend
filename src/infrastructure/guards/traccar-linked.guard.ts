import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { FirestoreUserService } from '../../core/application/services/firestore-user.service';

@Injectable()
export class TraccarLinkedGuard implements CanActivate {
  constructor(private readonly firestoreUserService: FirestoreUserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const firebaseUid = (request['user'] as { id: string })?.id;

    const user = await this.firestoreUserService.findById(firebaseUid);

    if (!user || user.getTraccarUserId() === null) {
      throw new NotFoundException(
        'Aucun compte Traccar associé à cet utilisateur',
      );
    }

    const requestUser = request['user'] as Record<string, unknown>;
    requestUser.traccarUserId = user.getTraccarUserId();
    requestUser.traccarEmail = user.getEmail();
    requestUser.traccarPassword = user.getTraccarPassword();

    return true;
  }
}
