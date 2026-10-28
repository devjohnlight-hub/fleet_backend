import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirestoreService } from '../../../infrastructure/firebase/firestore.service';
import { AdminAuditService } from './admin-audit.service';
import { AdminSubscriptionAdjustmentDto } from '../dtos/admin-mutations.dto';
import { StaffUser } from '../../domain/entities/staff-role';

interface SubscriptionState extends Record<string, unknown> {
  planId: string | null;
  status: string | null;
  endDate: string | null;
  permissions: Record<string, unknown> | null;
}

export interface SubscriptionAdjustmentResult {
  uid: string;
  before: SubscriptionState;
  after: SubscriptionState;
}

export class AdminSubscriptionService {
  constructor(
    private readonly firestoreService: FirestoreService,
    private readonly auditService: AdminAuditService,
  ) {}

  async adjust(
    staff: StaffUser,
    uid: string,
    dto: AdminSubscriptionAdjustmentDto,
  ): Promise<SubscriptionAdjustmentResult> {
    if (dto.planId === undefined && dto.status === undefined && dto.endDate === undefined) {
      throw new BadRequestException('Aucun changement demandé (planId, status ou endDate)');
    }

    const ref = this.firestoreService.collection('subscriptions').doc(uid);
    const snapshot = await ref.get();
    if (!snapshot.exists) throw new NotFoundException('Abonnement introuvable');
    const before = this.toState(snapshot);

    const update: Record<string, unknown> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Les permissions de l'abonnement sont une copie de celles du plan
    if (dto.planId !== undefined) {
      const plan = await this.firestoreService.collection('plans').doc(dto.planId).get();
      if (!plan.exists) throw new BadRequestException(`Plan inconnu : ${dto.planId}`);
      const permissions: unknown = plan.get('permissions');
      if (!permissions || typeof permissions !== 'object') {
        throw new BadRequestException(`Le plan ${dto.planId} n'a pas de permissions`);
      }
      update.planId = dto.planId;
      update.permissions = permissions;
    }
    if (dto.status !== undefined) update.status = dto.status;

    const endDate = dto.endDate
      ? new Date(dto.endDate)
      : (snapshot.get('endDate') as admin.firestore.Timestamp | undefined)?.toDate() ?? null;
    if (dto.endDate) update.endDate = admin.firestore.Timestamp.fromDate(endDate!);
    this.assertCoherent(
      dto.status ?? before.status,
      endDate,
      (snapshot.get('startDate') as admin.firestore.Timestamp | undefined)?.toDate() ?? null,
    );

    return this.auditService.record(
      staff,
      {
        action: 'subscription.adjust',
        targetType: 'subscription',
        targetId: uid,
        reason: dto.reason,
        before,
      },
      async () => {
        await ref.update(update);
        const after = this.toState(await ref.get());
        return { result: { uid, before, after }, after };
      },
    );
  }

  private assertCoherent(status: string | null, endDate: Date | null, startDate: Date | null): void {
    const now = Date.now();
    if (endDate && startDate && endDate <= startDate) {
      throw new BadRequestException('endDate doit être postérieure à startDate');
    }
    if ((status === 'active' || status === 'trial') && endDate && endDate.getTime() <= now) {
      throw new BadRequestException(`Un abonnement "${status}" ne peut pas avoir une date de fin passée`);
    }
    if (status === 'expired' && endDate && endDate.getTime() > now) {
      throw new BadRequestException('Un abonnement "expired" ne peut pas avoir une date de fin future');
    }
  }

  private toState(snapshot: admin.firestore.DocumentSnapshot): SubscriptionState {
    const endDate = snapshot.get('endDate') as admin.firestore.Timestamp | undefined;
    return {
      planId: snapshot.get('planId') ?? null,
      status: snapshot.get('status') ?? null,
      endDate: endDate ? endDate.toDate().toISOString() : null,
      permissions: snapshot.get('permissions') ?? null,
    };
  }
}
