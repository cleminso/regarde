export interface CommandContext {
  args: Record<string, any>;
}

export interface CommandFlag {
  name: string;
  type: "string" | "boolean" | "number";
  mandatory: boolean;
  options: string[];
  description: string;
}

export interface Command {
  name: string;
  description: string;
  flags: CommandFlag[];
  handler: (ctx: CommandContext) => Promise<any>;
}

export interface ArgParserTool {
  name: string;
  description: string;
  flags: Array<{
    name: string;
    type: "string" | "boolean" | "number";
    mandatory: boolean;
    options: string[];
    description: string;
  }>;
  handler: (ctx: { args: Record<string, any> }) => Promise<any>;
}

export class CLIError extends Error {
  constructor(
    message: string,
    public exitCode: number = 1,
  ) {
    super(message);
    this.name = "CLIError";
  }
}

export async function withAdminService<T>(
  operation: (admin: any) => Promise<T>,
): Promise<T> {
  const { AdminService } = await import("../services/admin.js");
  const admin = new AdminService();

  try {
    await admin.initialize();
    const result = await operation(admin);
    await admin.cleanup();
    return result;
  } catch (error) {
    await admin.cleanup();
    throw error;
  }
}
