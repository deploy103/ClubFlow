export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function invariant(
  condition: unknown,
  message: string,
  statusCode = 400,
): asserts condition {
  if (!condition) {
    throw new AppError(statusCode, message);
  }
}
