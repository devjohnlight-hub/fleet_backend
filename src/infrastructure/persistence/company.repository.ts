import { Injectable } from '@nestjs/common';
import { ICompanyRepository } from '../../core/domain/repositories/company.repository.interface';
import { PrismaService } from './prisma.service';
import { Company } from '../../core/domain/entities/company';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CompanyRepository implements ICompanyRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async findAll(): Promise<Company[]> {
    // Cache
    const cached = await this.redisService.get<Company[]>('companies');
    console.log('cached', cached);
    if (cached) return cached;
    const rows = await this.prisma.company.findMany();
    await this.redisService.set('companies', rows, 10);
    return rows.map((row) => this.toDomain(row));
  }

  async findById(id: string): Promise<Company | null> {
    // Cache per ID
    const cached = await this.redisService.get<Company>(`company:${id}`);
    if (cached) return cached;
    const row = await this.prisma.company.findUnique({ where: { id } });
    if (!row) return null;
    const domain = this.toDomain(row);
    // Store in cache with ttl 10 seconds
    await this.redisService.set(`company:${id}`, domain, 10);
    return domain;
  }

  async create(data: {
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    contact: string;
    email?: string;
    logoUrl?: string;
  }): Promise<Company> {
    const row = await this.prisma.company.create({ data });
    const domain = this.toDomain(row);
    // Invalidate related caches
    await this.redisService.del('companies');
    await this.redisService.del(`company:${domain.getId()}`);
    return domain;
  }

  async update(
    id: string,
    data: {
      name?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      contact?: string;
      email?: string;
      logoUrl?: string;
    },
  ): Promise<Company> {
    const row = await this.prisma.company.update({ where: { id }, data });
    const domain = this.toDomain(row);
    // Invalidate related caches
    await this.redisService.del('companies');
    await this.redisService.del(`company:${domain.getId()}`);
    return domain;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.company.delete({ where: { id } });
    // Invalidate related caches
    await this.redisService.del('companies');
    await this.redisService.del(`company:${id}`);
  }

  private toDomain(row: any): Company {
    return new Company(
      row.id,
      row.name,
      row.address,
      row.latitude,
      row.longitude,
      row.contact,
      row.email,
      row.logoUrl,
      row.createdAt,
      row.updatedAt,
      row.deletedAt,
    );
  }
}
