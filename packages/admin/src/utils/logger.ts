const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
} as const;

function statusOk(label: string, value?: string): string {
  const displayValue = value ? `: ${value}` : "";
  return `${colors.green}${colors.bright}[OK]${colors.reset} ${label}${displayValue}`;
}

function statusError(label: string, value?: string): string {
  const displayValue = value ? `: ${value}` : "";
  return `${colors.red}${colors.bright}[ERROR]${colors.reset} ${label}${displayValue}`;
}

function statusWarning(label: string, value?: string): string {
  const displayValue = value ? `: ${value}` : "";
  return `${colors.yellow}${colors.bright}[WARN]${colors.reset} ${label}${displayValue}`;
}

function statusMissing(label: string, value?: string): string {
  const displayValue = value ? `: ${value}` : "";
  return `${colors.red}${colors.bright}[MISSING]${colors.reset} ${label}${displayValue}`;
}

function statusInactive(label: string, value?: string): string {
  const displayValue = value ? `: ${value}` : "";
  return `${colors.gray}${colors.bright}[INACTIVE]${colors.reset} ${label}${displayValue}`;
}

function statusUnknown(label: string, value?: string): string {
  const displayValue = value ? `: ${value}` : "";
  return `${colors.cyan}${colors.bright}[UNKNOWN]${colors.reset} ${label}${displayValue}`;
}

export const Logger = {
  success(message: string) {
    console.log(`${colors.green}${colors.bright}[SUCCESS]${colors.reset} ${message}`);
  },

  failed(message: string) {
    console.log(`${colors.red}${colors.bright}[FAILED]${colors.reset} ${message}`);
  },

  check(message: string) {
    console.log(`${colors.blue}${colors.bright}[CHECK]${colors.reset} ${message}`);
  },

  status(message: string) {
    console.log(`${colors.yellow}${colors.bright}[STATUS]${colors.reset} ${message}`);
  },

  info(message: string) {
    console.log(`${colors.cyan}${colors.bright}[INFO]${colors.reset} ${message}`);
  },

  error(message: string) {
    console.error(`${colors.red}${colors.bright}[ERROR]${colors.reset} ${message}`);
  },

  warning(message: string) {
    console.log(`${colors.yellow}${colors.bright}[WARNING]${colors.reset} ${message}`);
  },

  debug(message: string) {
    console.log(`${colors.gray}${colors.bright}[DEBUG]${colors.reset} ${message}`);
  },

  statusOk,
  statusError,
  statusWarning,
  statusMissing,
  statusInactive,
  statusUnknown,

  formatStatus(status: string, label: string, value?: string): string {
    switch (status.toLowerCase()) {
      case "ok":
        return statusOk(label, value);
      case "missing":
        return statusMissing(label, value);
      case "mismatch":
        return statusWarning(label, value);
      case "inactive":
        return statusInactive(label, value);
      case "not_found":
        return statusUnknown(label, value);
      case "error":
        return statusError(label, value);
      default:
        return statusUnknown(label, value);
    }
  },
};
