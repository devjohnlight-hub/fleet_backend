import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CompanyService } from '../../core/application/services/company.service';
import { CreateCompanyDto } from '../../core/application/dtos/create-company.dto';
import { UpdateCompanyDto } from '../../core/application/dtos/update-company.dto';

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
