export class Logger {
  private static colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
  };

  static success(message: string) {
    console.log(`${this.colors.green}${this.colors.bright}[SUCCESS]${this.colors.reset} ${message}`);
  }

  static failed(message: string) {
    console.log(`${this.colors.red}${this.colors.bright}[FAILED]${this.colors.reset} ${message}`);
  }

  static check(message: string) {
    console.log(`${this.colors.blue}${this.colors.bright}[CHECK]${this.colors.reset} ${message}`);
  }

  static status(message: string) {
    console.log(`${this.colors.yellow}${this.colors.bright}[STATUS]${this.colors.reset} ${message}`);
  }

  static info(message: string) {
    console.log(`${this.colors.cyan}${this.colors.bright}[INFO]${this.colors.reset} ${message}`);
  }

  static error(message: string) {
    console.error(`${this.colors.red}${this.colors.bright}[ERROR]${this.colors.reset} ${message}`);
  }

  static warning(message: string) {
    console.log(`${this.colors.yellow}${this.colors.bright}[WARNING]${this.colors.reset} ${message}`);
  }

  static debug(message: string) {
    console.log(`${this.colors.gray}${this.colors.bright}[DEBUG]${this.colors.reset} ${message}`);
  }

  // Status indication methods for health checks and other status displays
  static statusOk(label: string, value?: string): string {
    const displayValue = value ? `: ${value}` : '';
    return `${this.colors.green}${this.colors.bright}[OK]${this.colors.reset} ${label}${displayValue}`;
  }

  static statusError(label: string, value?: string): string {
    const displayValue = value ? `: ${value}` : '';
    return `${this.colors.red}${this.colors.bright}[ERROR]${this.colors.reset} ${label}${displayValue}`;
  }

  static statusWarning(label: string, value?: string): string {
    const displayValue = value ? `: ${value}` : '';
    return `${this.colors.yellow}${this.colors.bright}[WARN]${this.colors.reset} ${label}${displayValue}`;
  }

  static statusMissing(label: string, value?: string): string {
    const displayValue = value ? `: ${value}` : '';
    return `${this.colors.red}${this.colors.bright}[MISSING]${this.colors.reset} ${label}${displayValue}`;
  }

  static statusInactive(label: string, value?: string): string {
    const displayValue = value ? `: ${value}` : '';
    return `${this.colors.gray}${this.colors.bright}[INACTIVE]${this.colors.reset} ${label}${displayValue}`;
  }

  static statusUnknown(label: string, value?: string): string {
    const displayValue = value ? `: ${value}` : '';
    return `${this.colors.cyan}${this.colors.bright}[UNKNOWN]${this.colors.reset} ${label}${displayValue}`;
  }

  // Generic status method that maps status strings to appropriate formatting
  static formatStatus(status: string, label: string, value?: string): string {
    switch (status.toLowerCase()) {
      case 'ok':
        return this.statusOk(label, value);
      case 'missing':
        return this.statusMissing(label, value);
      case 'mismatch':
        return this.statusWarning(label, value);
      case 'inactive':
        return this.statusInactive(label, value);
      case 'not_found':
        return this.statusUnknown(label, value);
      case 'error':
        return this.statusError(label, value);
      default:
        return this.statusUnknown(label, value);
    }
  }
}
