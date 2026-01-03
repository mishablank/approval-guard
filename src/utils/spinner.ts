/**
 * Terminal spinner and progress indicator utilities
 */

export interface SpinnerOptions {
  text: string;
  color?: 'cyan' | 'green' | 'yellow' | 'red' | 'blue' | 'magenta';
}

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const COLORS: Record<string, string> = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
};

export class Spinner {
  private frameIndex = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private text: string;
  private color: string;
  private isSpinning = false;

  constructor(options: SpinnerOptions) {
    this.text = options.text;
    this.color = COLORS[options.color || 'cyan'];
  }

  start(): void {
    if (this.isSpinning || !process.stdout.isTTY) {
      // If not a TTY, just print the message
      if (!process.stdout.isTTY) {
        console.log(`... ${this.text}`);
      }
      return;
    }

    this.isSpinning = true;
    this.frameIndex = 0;

    // Hide cursor
    process.stdout.write('\x1b[?25l');

    this.intervalId = setInterval(() => {
      const frame = SPINNER_FRAMES[this.frameIndex];
      process.stdout.write(`\r${this.color}${frame}${COLORS.reset} ${this.text}`);
      this.frameIndex = (this.frameIndex + 1) % SPINNER_FRAMES.length;
    }, 80);
  }

  updateText(text: string): void {
    this.text = text;
  }

  succeed(text?: string): void {
    this.stop();
    const message = text || this.text;
    console.log(`${COLORS.green}✔${COLORS.reset} ${message}`);
  }

  fail(text?: string): void {
    this.stop();
    const message = text || this.text;
    console.log(`${COLORS.red}✖${COLORS.reset} ${message}`);
  }

  warn(text?: string): void {
    this.stop();
    const message = text || this.text;
    console.log(`${COLORS.yellow}⚠${COLORS.reset} ${message}`);
  }

  info(text?: string): void {
    this.stop();
    const message = text || this.text;
    console.log(`${COLORS.blue}ℹ${COLORS.reset} ${message}`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.isSpinning) {
      // Clear line and show cursor
      process.stdout.write('\r\x1b[K');
      process.stdout.write('\x1b[?25h');
      this.isSpinning = false;
    }
  }
}

export class ProgressBar {
  private current = 0;
  private total: number;
  private width: number;
  private description: string;

  constructor(total: number, description = '', width = 30) {
    this.total = total;
    this.width = width;
    this.description = description;
  }

  update(current: number, description?: string): void {
    this.current = current;
    if (description) {
      this.description = description;
    }
    this.render();
  }

  increment(description?: string): void {
    this.update(this.current + 1, description);
  }

  private render(): void {
    if (!process.stdout.isTTY) {
      return;
    }

    const percentage = Math.min(100, Math.round((this.current / this.total) * 100));
    const filled = Math.round((this.current / this.total) * this.width);
    const empty = this.width - filled;

    const bar = `${COLORS.green}${'█'.repeat(filled)}${COLORS.reset}${'░'.repeat(empty)}`;
    const status = `${this.current}/${this.total}`;

    process.stdout.write(`\r${bar} ${percentage}% ${status} ${this.description}`);
  }

  complete(message?: string): void {
    if (process.stdout.isTTY) {
      process.stdout.write('\r\x1b[K');
    }
    if (message) {
      console.log(`${COLORS.green}✔${COLORS.reset} ${message}`);
    }
  }
}

export function createSpinner(text: string, color?: SpinnerOptions['color']): Spinner {
  return new Spinner({ text, color });
}

export function createProgressBar(total: number, description?: string): ProgressBar {
  return new ProgressBar(total, description);
}

// Simple status indicators
export const symbols = {
  success: `${COLORS.green}✔${COLORS.reset}`,
  error: `${COLORS.red}✖${COLORS.reset}`,
  warning: `${COLORS.yellow}⚠${COLORS.reset}`,
  info: `${COLORS.blue}ℹ${COLORS.reset}`,
  arrow: `${COLORS.cyan}→${COLORS.reset}`,
  bullet: `${COLORS.cyan}•${COLORS.reset}`,
};

export function logSuccess(message: string): void {
  console.log(`${symbols.success} ${message}`);
}

export function logError(message: string): void {
  console.log(`${symbols.error} ${message}`);
}

export function logWarning(message: string): void {
  console.log(`${symbols.warning} ${message}`);
}

export function logInfo(message: string): void {
  console.log(`${symbols.info} ${message}`);
}
