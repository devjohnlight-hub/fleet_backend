import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CompanyService } from '../../core/application/services/company.service';
import { CreateCompanyDto } from '../../core/application/dtos/create-company.dto';
import { UpdateCompanyDto } from '../../core/application/dtos/update-company.dto';
import { StaffRole } from '../../core/domain/entities/staff-role';
import { StaffAuthGuard } from '../guards/staff-auth.guard';
import { StaffRoles } from '../decorators/staff-roles.decorator';

// Parcours fleet owner (Prisma) non utilisé par le mobile : réservé au super_admin
@UseGuards(StaffAuthGuard)
@StaffRoles(StaffRole.SUPER_ADMIN)
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  async create(@Body() dto: CreateCompanyDto) {
    return this.companyService.create(dto);
  }

  @Get()
  async findAll() {
    return this.companyService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.companyService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companyService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.companyService.delete(id);
  }
}
