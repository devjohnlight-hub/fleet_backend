import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(config: ConfigService) {
    super({
      clientID: config.getOrThrow<string>('FACEBOOK_APP_ID'),
      clientSecret: config.getOrThrow<string>('FACEBOOK_APP_SECRET'),
      callbackURL: config.getOrThrow<string>('FACEBOOK_CALLBACK_URL'),
      scope: ['email'],
      profileFields: ['id', 'displayName', 'emails'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ): void {
    const { id, displayName, emails } = profile;

    done(null, {
      facebookId: id,
      name: displayName,
      email: emails?.[0]?.value ?? '',
    });
  }
}
