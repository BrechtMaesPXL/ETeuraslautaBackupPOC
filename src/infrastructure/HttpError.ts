export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly body: string,
  ) {
    super(`HTTP ${statusCode}: ${body}`);
    this.name = 'HttpError';
  }
}
