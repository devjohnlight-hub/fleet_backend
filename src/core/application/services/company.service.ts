import { ICompanyRepository } from '../../domain/repositories/company.repository.interface';
import { Company } from '../../domain/entities/company';

export class CompanyService {
  constructor(private readonly companyRepository: ICompanyRepository) {}

  async findAll(): Promise<Company[]> {
    return this.companyRepository.findAll();
  }

  async findById(id: string): Promise<Company | null> {
    return this.companyRepository.findById(id);
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
    return this.companyRepository.create(data);
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
    return this.companyRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.companyRepository.delete(id);
  }
}
