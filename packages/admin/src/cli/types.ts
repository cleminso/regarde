export class CLIError extends Error {
  constructor(
    message: string,
    public exitCode: number = 1,
  ) {
    super(message);
    this.name = "CLIError";
  }
}

// TODO: Move out to a properly named file, this is not a "types" but a tool factory
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
