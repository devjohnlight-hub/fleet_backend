import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { FleetOwnerService } from '../../core/application/services/fleet-owner.service';
import { RegisterFleetOwnerDto } from '../../core/application/dtos/register-fleet-owner.dto';
import { LoginFleetOwnerDto } from '../../core/application/dtos/login-fleet-owner.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { FacebookAuthGuard } from '../guards/facebook-auth.guard';

@Controller('fleet-owners')
export class FleetOwnerController {
  constructor(private readonly fleetOwnerService: FleetOwnerService) {}

  @Post('register')
  async register(@Body() dto: RegisterFleetOwnerDto) {
    return this.fleetOwnerService.register(dto.name, dto.email, dto.password);
  }

  @Post('login')
  async login(@Body() dto: LoginFleetOwnerDto) {
    return this.fleetOwnerService.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout() {
    return { message: 'Déconnexion réussie' };
  }

  @UseGuards(GoogleAuthGuard)
  @Get('auth/google')
  googleLogin() {
    // Redirige automatiquement vers Google
  }

  @UseGuards(GoogleAuthGuard)
  @Get('auth/google/callback')
  async googleCallback(
    @Req() req: { user: { googleId: string; email: string; name: string } },
  ) {
    return this.fleetOwnerService.loginWithGoogle(req.user);
  }

  @UseGuards(FacebookAuthGuard)
  @Get('auth/facebook')
  facebookLogin() {
    // Redirige automatiquement vers Facebook
  }

  @UseGuards(FacebookAuthGuard)
  @Get('auth/facebook/callback')
  async facebookCallback(
    @Req() req: { user: { facebookId: string; email: string; name: string } },
  ) {
    return this.fleetOwnerService.loginWithFacebook(req.user);
  }
}
