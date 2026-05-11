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
import { TraccarGroupService } from '../../core/application/services/traccar-group.service';
import { CreateTraccarGroupDto } from '../../core/application/dtos/create-traccar-group.dto';
import { UpdateTraccarGroupDto } from '../../core/application/dtos/update-traccar-group.dto';

@Controller('traccar/groups')
export class TraccarGroupController {
  constructor(private readonly traccarGroupService: TraccarGroupService) {}

  @Get()
  findAll(
    @Query('all') all?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.traccarGroupService.findAll({
      all: all !== undefined ? all === 'true' : undefined,
      userId: userId !== undefined ? Number(userId) : undefined,
      limit: limit !== undefined ? Number(limit) : undefined,
      offset: offset !== undefined ? Number(offset) : undefined,
      keyword,
    });
  }

  @Post()
  create(@Body() dto: CreateTraccarGroupDto) {
    return this.traccarGroupService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTraccarGroupDto,
  ) {
    return this.traccarGroupService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.traccarGroupService.delete(id);
  }
}
