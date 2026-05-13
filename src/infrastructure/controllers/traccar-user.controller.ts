import { randomBytes } from 'crypto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { TraccarUserService } from '../../core/application/services/traccar-user.service';
import { FirestoreUserService } from '../../core/application/services/firestore-user.service';
import { CreateTraccarUserDto } from '../../core/application/dtos/create-traccar-user.dto';
import { UpdateTraccarUserDto } from '../../core/application/dtos/update-traccar-user.dto';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { TraccarLinkedGuard } from '../guards/traccar-linked.guard';

@UseGuards(FirebaseAuthGuard)
@Controller('traccar/users')
export class TraccarUserController {
  constructor(
    private readonly traccarUserService: TraccarUserService,
    private readonly firestoreUserService: FirestoreUserService,
  ) {}

  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.traccarUserService.findAll({
      userId,
      limit: limit !== undefined ? Number(limit) : undefined,
      offset: offset !== undefined ? Number(offset) : undefined,
      keyword,
    });
  }

  @Post()
  async create(@Body() dto: CreateTraccarUserDto, @Req() req: Request) {
    const traccarPassword = randomBytes(16).toString('hex');
    const traccarUser = await this.traccarUserService.create({
      ...dto,
      administrator: true,
      password: traccarPassword,
    } as any);
    const firebaseUid = (req['user'] as { id: string }).id;
    await this.firestoreUserService.upsert(firebaseUid, {
      traccarUserId: traccarUser.getId(),
      traccarPassword,
    });
    return traccarUser;
  }

  @Post('totp')
  generateTotp() {
    return this.traccarUserService.generateTotp();
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTraccarUserDto,
  ) {
    return this.traccarUserService.update(id, dto as any);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.traccarUserService.delete(id);
  }
}
