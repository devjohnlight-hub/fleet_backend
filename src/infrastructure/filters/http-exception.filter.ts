import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../../core/application/response/api-response';

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
