import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TraccarSessionService } from '../../core/application/services/traccar-session.service';
import { CreateTraccarSessionDto } from '../../core/application/dtos/create-traccar-session.dto';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { TraccarLinkedGuard } from '../guards/traccar-linked.guard';

@Controller('traccar/session')
export class TraccarSessionController {
  constructor(private readonly traccarSessionService: TraccarSessionService) {}

  @UseGuards(FirebaseAuthGuard, TraccarLinkedGuard)
  @Get()
  getSession(@Query('token') token?: string) {
    return this.traccarSessionService.getSession(token);
  }

  @Post()
  createSession(@Body() dto: CreateTraccarSessionDto) {
    return this.traccarSessionService.createSession(dto.email, dto.password);
  }

  @UseGuards(FirebaseAuthGuard, TraccarLinkedGuard)
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSession() {
    return this.traccarSessionService.deleteSession();
  }
}
