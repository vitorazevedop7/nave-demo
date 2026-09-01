import { createHash } from 'crypto';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PasswordResetRateLimiter {
  private readonly attempts = new Map<string, number[]>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(config: ConfigService) {
    this.maxAttempts = this.numberConfig(
      config.get<string>('PASSWORD_RESET_RATE_LIMIT_MAX'),
      5,
    );
    const windowMinutes = this.numberConfig(
      config.get<string>('PASSWORD_RESET_RATE_LIMIT_WINDOW_MINUTES'),
      15,
    );
    this.windowMs = windowMinutes * 60_000;
  }

  private numberConfig(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  assertAllowed(ip: string, email: string): void {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const emailKey = this.hashKey(`email:${email.trim().toLowerCase()}`);
    const ipKey = this.hashKey(`ip:${ip}`);

    this.consume(emailKey, this.maxAttempts, now, cutoff);
    this.consume(ipKey, this.maxAttempts * 5, now, cutoff);

    if (this.attempts.size > 10_000) {
      for (const [storedKey, timestamps] of this.attempts) {
        if (timestamps.every((timestamp) => timestamp <= cutoff)) {
          this.attempts.delete(storedKey);
        }
      }
    }
  }

  private hashKey(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private consume(
    key: string,
    limit: number,
    now: number,
    cutoff: number,
  ): void {
    const recent = (this.attempts.get(key) ?? []).filter(
      (attempt) => attempt > cutoff,
    );

    if (recent.length >= limit) {
      throw new HttpException(
        'Muitas solicitações. Tente novamente mais tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    recent.push(now);
    this.attempts.set(key, recent);
  }
}
