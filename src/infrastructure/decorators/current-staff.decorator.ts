import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { StaffUser } from '../../core/domain/entities/staff-role';

// À utiliser uniquement derrière StaffAuthGuard
export const CurrentStaff = createParamDecorator(
  (_data: unknown, context: ExecutionContext): StaffUser =>
    context.switchToHttp().getRequest<Request>()['staff'] as StaffUser,
);
