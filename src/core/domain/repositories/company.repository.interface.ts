import { Company } from '../entities/company';

export interface ICompanyRepository {
  findAll(): Promise<Company[]>;
  findById(id: string): Promise<Company | null>;
  create(data: {
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    contact: string;
    email?: string;
    logoUrl?: string;
  }): Promise<Company>;
  update(
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
  ): Promise<Company>;
  delete(id: string): Promise<void>;
}
