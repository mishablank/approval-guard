import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  timestamp?: boolean;
}

class Logger {
  private level: LogLevel;
  private prefix: string;
  private showTimestamp: boolean;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? LogLevel.INFO;
    this.prefix = options.prefix ?? '';
    this.showTimestamp = options.timestamp ?? false;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private formatMessage(message: string): string {
    const parts: string[] = [];

    if (this.showTimestamp) {
      parts.push(chalk.gray(`[${new Date().toISOString()}]`));
    }

    if (this.prefix) {
      parts.push(chalk.cyan(`[${this.prefix}]`));
    }

    parts.push(message);

    return parts.join(' ');
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(this.formatMessage(chalk.gray(`[DEBUG] ${message}`)), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(this.formatMessage(chalk.blue('ℹ') + ` ${message}`), ...args);
    }
  }

  success(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(this.formatMessage(chalk.green('✓') + ` ${message}`), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.log(this.formatMessage(chalk.yellow('⚠') + ` ${message}`), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.formatMessage(chalk.red('✗') + ` ${message}`), ...args);
    }
  }

  table(data: Record<string, unknown>[]): void {
    if (this.level <= LogLevel.INFO) {
      console.table(data);
    }
  }

  divider(char = '─', length = 50): void {
    if (this.level <= LogLevel.INFO) {
      console.log(chalk.gray(char.repeat(length)));
    }
  }

  header(title: string): void {
    if (this.level <= LogLevel.INFO) {
      this.divider();
      console.log(chalk.bold.cyan(`  ${title}`));
      this.divider();
    }
  }

  riskBadge(score: number): string {
    if (score >= 80) {
      return chalk.bgRed.white.bold(` CRITICAL ${score} `);
    } else if (score >= 60) {
      return chalk.bgYellow.black.bold(` HIGH ${score} `);
    } else if (score >= 40) {
      return chalk.bgMagenta.white.bold(` MEDIUM ${score} `);
    } else if (score >= 20) {
      return chalk.bgBlue.white(` LOW ${score} `);
    }
    return chalk.bgGreen.white(` SAFE ${score} `);
  }

  formatAddress(address: string, truncate = true): string {
    if (!truncate) {
      return chalk.cyan(address);
    }
    const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;
    return chalk.cyan(truncated);
  }

  formatAmount(amount: string, isUnlimited: boolean): string {
    if (isUnlimited) {
      return chalk.red.bold('UNLIMITED');
    }
    return chalk.yellow(amount);
  }

  progressBar(current: number, total: number, width = 30): string {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((current / total) * width);
    const empty = width - filled;
    const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
    return `${bar} ${percentage}% (${current}/${total})`;
  }
}

export const logger = new Logger();

export function createLogger(options: LoggerOptions): Logger {
  return new Logger(options);
}

export default logger;
