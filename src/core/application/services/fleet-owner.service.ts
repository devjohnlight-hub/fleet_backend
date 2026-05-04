import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { IFleetOwnerRepository } from '../../domain/repositories/fleet-owner.repository.interface';
import { FleetOwner } from '../../domain/entities/fleet-owner.entity';

export class FleetOwnerService {
  constructor(
    private readonly fleetOwnerRepository: IFleetOwnerRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<{ accessToken: string }> {
    const existing = await this.fleetOwnerRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const fleetOwner = new FleetOwner(
      crypto.randomUUID(),
      name,
      email,
      hashedPassword,
      null,
      null,
      new Date(),
      new Date(),
      null,
    );

    const saved = await this.fleetOwnerRepository.save(fleetOwner);
    return { accessToken: this.signToken(saved) };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string }> {
    const fleetOwner = await this.fleetOwnerRepository.findByEmail(email);
    if (!fleetOwner || !fleetOwner.getPassword()) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const passwordValid = await bcrypt.compare(
      password,
      fleetOwner.getPassword()!,
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    return { accessToken: this.signToken(fleetOwner) };
  }

  async loginWithGoogle(profile: {
    googleId: string;
    email: string;
    name: string;
  }): Promise<{ accessToken: string }> {
    const fleetOwner = await this.findOrCreateSocial({
      socialId: profile.googleId,
      email: profile.email,
      name: profile.name,
      findBySocialId: (id) => this.fleetOwnerRepository.findByGoogleId(id),
      buildEntity: (id, name, email) =>
        new FleetOwner(
          id,
          name,
          email,
          null,
          profile.googleId,
          null,
          new Date(),
          new Date(),
          null,
        ),
    });

    return { accessToken: this.signToken(fleetOwner) };
  }

  async loginWithFacebook(profile: {
    facebookId: string;
    email: string;
    name: string;
  }): Promise<{ accessToken: string }> {
    const fleetOwner = await this.findOrCreateSocial({
      socialId: profile.facebookId,
      email: profile.email,
      name: profile.name,
      findBySocialId: (id) => this.fleetOwnerRepository.findByFacebookId(id),
      buildEntity: (id, name, email) =>
        new FleetOwner(
          id,
          name,
          email,
          null,
          null,
          profile.facebookId,
          new Date(),
          new Date(),
          null,
        ),
    });

    return { accessToken: this.signToken(fleetOwner) };
  }

  private async findOrCreateSocial(opts: {
    socialId: string;
    email: string;
    name: string;
    findBySocialId: (id: string) => Promise<FleetOwner | null>;
    buildEntity: (id: string, name: string, email: string) => FleetOwner;
  }): Promise<FleetOwner> {
    let fleetOwner = await opts.findBySocialId(opts.socialId);
    if (!fleetOwner)
      fleetOwner = await this.fleetOwnerRepository.findByEmail(opts.email);
    if (!fleetOwner) {
      fleetOwner = await this.fleetOwnerRepository.save(
        opts.buildEntity(crypto.randomUUID(), opts.name, opts.email),
      );
    }
    return fleetOwner;
  }

  private signToken(fleetOwner: FleetOwner): string {
    return this.jwtService.sign({
      sub: fleetOwner.getId(),
      email: fleetOwner.getEmail(),
    });
  }
}
