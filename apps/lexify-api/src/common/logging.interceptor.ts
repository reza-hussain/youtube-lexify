import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';

const SENSITIVE_KEYS = new Set(['password', 'token', 'access_token', 'id_token', 'secret']);

function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) =>
      SENSITIVE_KEYS.has(k.toLowerCase()) ? [k, '[redacted]'] : [k, v],
    ),
  );
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body, headers } = req;
    const userId: string | undefined = req.user?.id;
    const ip = (headers['x-forwarded-for'] as string)?.split(',')[0].trim() ?? req.ip;
    const userAgent = headers['user-agent'] ?? '';
    const startMs = Date.now();

    const safeBody = sanitize(body);

    return next.handle().pipe(
      tap((responseBody) => {
        const statusCode = context.switchToHttp().getResponse().statusCode;
        const durationMs = Date.now() - startMs;
        this.logger.log(
          `${method} ${url} ${statusCode} ${durationMs}ms | user=${userId ?? 'guest'} ip=${ip}`,
        );

        // Persist auth events and slow requests to SystemLog for long-term audit trail
        const isAuthEvent = url.includes('/auth/');
        const isSlow = durationMs > 3000;
        if (isAuthEvent || isSlow) {
          this.prisma.systemLog.create({
            data: {
              level: 'INFO',
              message: `${method} ${url} ${statusCode} ${durationMs}ms`,
              meta: { body: safeBody, userAgent, ip, durationMs, responseStatus: statusCode },
              userId: userId ?? null,
            },
          }).catch(() => {});
        }
      }),
      catchError((err) => {
        const durationMs = Date.now() - startMs;
        const statusCode = err.status ?? 500;
        this.logger.error(
          `${method} ${url} ${statusCode} ${durationMs}ms | user=${userId ?? 'guest'} ip=${ip} | ${err.message}`,
        );

        this.prisma.systemLog.create({
          data: {
            level: statusCode >= 500 ? 'ERROR' : 'WARN',
            message: `${method} ${url} ${statusCode} - ${err.message}`,
            meta: { body: safeBody, userAgent, ip, durationMs, error: err.message },
            userId: userId ?? null,
          },
        }).catch(() => {});

        return throwError(() => err);
      }),
    );
  }
}
