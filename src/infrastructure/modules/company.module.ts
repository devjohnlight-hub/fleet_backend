import { Module } from '@nestjs/common';
import { CompanyController } from '../controllers/company.controller';
import { CompanyService } from '../../core/application/services/company.service';
import { PrismaService } from '../persistence/prisma.service';
import { CompanyRepository } from '../persistence/company.repository';

@Module({
  controllers: [CompanyController],
  providers: [
    PrismaService,
    CompanyRepository,
    {
      provide: CompanyService,
      useFactory: (repo: CompanyRepository) => new CompanyService(repo),
      inject: [CompanyRepository],
    },
  ],
})
export class CompanyModule {}
