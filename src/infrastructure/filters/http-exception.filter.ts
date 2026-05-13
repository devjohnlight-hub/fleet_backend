import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../../core/application/response/api-response';

const FIREBASE_AUTH_MESSAGES: Record<string, string> = {
  'auth/email-already-exists': 'Cette adresse email est déjà utilisée',
  'auth/phone-number-already-exists': 'Ce numéro de téléphone est déjà utilisé',
  'auth/user-not-found': 'Utilisateur introuvable',
  'auth/invalid-email': 'Adresse email invalide',
  'auth/invalid-password': 'Mot de passe invalide',
  'auth/invalid-phone-number': 'Numéro de téléphone invalide',
  'auth/too-many-requests': 'Trop de tentatives, veuillez réessayer plus tard',
  'auth/id-token-expired': 'Session expirée, veuillez vous reconnecter',
  'auth/argument-error': 'Données invalides',
};

const FIREBASE_AUTH_STATUS: Record<string, number> = {
  'auth/email-already-exists': HttpStatus.CONFLICT,
  'auth/phone-number-already-exists': HttpStatus.CONFLICT,
  'auth/user-not-found': HttpStatus.NOT_FOUND,
  'auth/invalid-email': HttpStatus.BAD_REQUEST,
  'auth/invalid-password': HttpStatus.BAD_REQUEST,
  'auth/invalid-phone-number': HttpStatus.BAD_REQUEST,
  'auth/too-many-requests': HttpStatus.TOO_MANY_REQUESTS,
  'auth/id-token-expired': HttpStatus.UNAUTHORIZED,
  'auth/argument-error': HttpStatus.BAD_REQUEST,
};

interface FirebaseAuthError {
  errorInfo: { code: string; message: string };
  codePrefix: string;
}

function isFirebaseAuthError(e: unknown): e is FirebaseAuthError {
  return (
    typeof e === 'object' &&
    e !== null &&
    'codePrefix' in e &&
    (e as FirebaseAuthError).codePrefix === 'auth' &&
    'errorInfo' in e
  );
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    console.log(exception);
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (
      exception instanceof DOMException &&
      exception.name === 'TimeoutError'
    ) {
      response
        .status(HttpStatus.GATEWAY_TIMEOUT)
        .json(ApiResponse.error('Le serveur Traccar ne répond pas (timeout)'));
      return;
    }

    if (isFirebaseAuthError(exception)) {
      const code = exception.errorInfo.code;
      const status = FIREBASE_AUTH_STATUS[code] ?? HttpStatus.BAD_REQUEST;
      const message =
        FIREBASE_AUTH_MESSAGES[code] ?? exception.errorInfo.message;
      response.status(status).json(ApiResponse.error(message));
      return;
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = (() => {
      if (!(exception instanceof HttpException))
        return 'Erreur interne du serveur';
      const res = exception.getResponse();
      if (typeof res === 'string') return res;
      if (typeof res === 'object' && res !== null && 'message' in res) {
        const msg = (res as { message: string | string[] }).message;
        return Array.isArray(msg) ? msg.join(', ') : msg;
      }
      return exception.message;
    })();

    response.status(status).json(ApiResponse.error(message));
  }
}
