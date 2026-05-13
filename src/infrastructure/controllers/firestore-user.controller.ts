import {
  Body,
  Controller,
  Delete,
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
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller('users')
export class FirestoreUserController {
  constructor(private readonly firestoreUserService: FirestoreUserService) {}

  @Post('register')
  register(@Body() dto: RegisterFirestoreUserDto) {
    return this.firestoreUserService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginFirestoreUserDto) {
    return this.firestoreUserService.login(dto.email, dto.password);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  getMe(@Req() req: Request) {
    const user = req['user'] as { id: string };
    return this.firestoreUserService.findById(user.id);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get()
  findAll() {
    return this.firestoreUserService.findAll();
  }

  @UseGuards(FirebaseAuthGuard)
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.firestoreUserService.findById(id);
  }

  @UseGuards(FirebaseAuthGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFirestoreUserDto) {
    return this.firestoreUserService.update(id, dto);
  }

  @UseGuards(FirebaseAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.firestoreUserService.delete(id);
  }
}
