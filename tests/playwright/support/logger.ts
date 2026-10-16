// Per-test structured log. Lines are attached to the HTML report as `test-log.txt` (and echoed to the console
// with PW_LOG=true). Values whose key looks sensitive are redacted, so a password or token can't be logged.
import type { TestInfo } from '@playwright/test';

const SENSITIVE_KEY = /pass(word)?|token|secret|card|cvv|otp/i;

export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, SENSITIVE_KEY.test(k) ? '***' : redact(v)]));
  }
  return value;
}

export class TestLogger {
  private readonly lines: string[] = [];

  constructor(
    private readonly testInfo: TestInfo,
    private readonly echo: boolean,
  ) {}

  info(message: string, details?: Record<string, unknown>): void {
    this.write('INFO', message, details);
  }

  warn(message: string, details?: Record<string, unknown>): void {
    this.write('WARN', message, details);
  }

  private write(level: string, message: string, details?: Record<string, unknown>): void {
    const suffix = details ? ` ${JSON.stringify(redact(details))}` : '';
    const line = `${new Date().toISOString()} [${level}] [w${this.testInfo.workerIndex}] ${message}${suffix}`;
    this.lines.push(line);
    if (this.echo) console.log(`${this.testInfo.title} › ${line}`);
  }

  /** Attaches the log to the report; called by the fixture after the test, pass or fail. */
  async flush(): Promise<void> {
    if (!this.lines.length) return;
    await this.testInfo.attach('test-log.txt', { body: this.lines.join('\n'), contentType: 'text/plain' });
  }
}
