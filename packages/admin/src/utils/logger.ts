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
}
