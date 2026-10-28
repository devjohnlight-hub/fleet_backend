import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { FirestoreUserService } from '../../core/application/services/firestore-user.service';
import { UpdateFirestoreUserDto } from '../../core/application/dtos/update-firestore-user.dto';
import { RegisterFirestoreUserDto } from '../../core/application/dtos/register-firestore-user.dto';
import { LoginFirestoreUserDto } from '../../core/application/dtos/login-firestore-user.dto';
import { FirestoreUser } from '../../core/domain/entities/firestore-user.entity';
import { StaffRole } from '../../core/domain/entities/staff-role';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { StaffAuthGuard } from '../guards/staff-auth.guard';
import { StaffRoles } from '../decorators/staff-roles.decorator';

// Ne jamais sérialiser l'entité : elle contient traccarPassword et fcmToken
function toPublicUser(user: FirestoreUser | null) {
  if (!user) return null;
  return {
    id: user.getId(),
    email: user.getEmail(),
    name: user.getName(),
    role: user.getRole(),
    userType: user.getUserType(),
    phoneNumber: user.getPhoneNumber(),
    photoUrl: user.getPhotoUrl(),
    traccarUserId: user.getTraccarUserId(),
  };
}

@Controller('users')
export class FirestoreUserController {
  constructor(private readonly firestoreUserService: FirestoreUserService) {}

  private assertSelf(req: Request, id: string): void {
    if ((req['user'] as { id: string }).id !== id) {
      throw new ForbiddenException('Accès limité à votre propre compte');
    }
  }

  @Post('register')
  async register(@Body() dto: RegisterFirestoreUserDto) {
    return toPublicUser(await this.firestoreUserService.register(dto));
  }

  @Post('login')
  login(@Body() dto: LoginFirestoreUserDto) {
    return this.firestoreUserService.login(dto.email, dto.password);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  async getMe(@Req() req: Request) {
    const user = req['user'] as { id: string };
    return toPublicUser(await this.firestoreUserService.findById(user.id));
  }

  // Liste de tous les comptes : réservée au staff
  @UseGuards(StaffAuthGuard)
  @StaffRoles(StaffRole.SUPER_ADMIN)
  @Get()
  async findAll() {
    return (await this.firestoreUserService.findAll()).map(toPublicUser);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get(':id')
  async findById(@Req() req: Request, @Param('id') id: string) {
    this.assertSelf(req, id);
    return toPublicUser(await this.firestoreUserService.findById(id));
  }

  @UseGuards(FirebaseAuthGuard)
  @Put(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateFirestoreUserDto,
  ) {
    this.assertSelf(req, id);
    return toPublicUser(await this.firestoreUserService.update(id, dto));
  }

  @UseGuards(FirebaseAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Req() req: Request, @Param('id') id: string) {
    this.assertSelf(req, id);
    await this.firestoreUserService.delete(id);
  }
}
