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
} from '@nestjs/common';
import { TraccarUserService } from '../../core/application/services/traccar-user.service';
import { CreateTraccarUserDto } from '../../core/application/dtos/create-traccar-user.dto';
import { UpdateTraccarUserDto } from '../../core/application/dtos/update-traccar-user.dto';

@Controller('traccar/users')
export class TraccarUserController {
  constructor(private readonly traccarUserService: TraccarUserService) {}

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
  create(@Body() dto: CreateTraccarUserDto) {
    return this.traccarUserService.create(dto as any);
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
