import {ENV} from '../config/environment';
import {HttpError} from './HttpError';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export class HttpClient {
  private baseURL: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelayMs: number;
  private authToken: string | null = null;

  constructor() {
    this.baseURL = ENV.API_BASE_URL;
    this.timeout = ENV.API_TIMEOUT;
    this.maxRetries = ENV.API_MAX_RETRIES;
    this.retryDelayMs = ENV.API_RETRY_DELAY_MS;
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  clearAuthToken(): void {
    this.authToken = null;
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', endpoint, data, options);
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, options);
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    data?: unknown,
    options?: RequestOptions,
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const timeout = options?.timeout ?? this.timeout;
    const maxRetries = options?.retries ?? this.maxRetries;

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
        console.log(
          `[HttpClient] Retry ${attempt}/${maxRetries} for ${method} ${endpoint} after ${delay}ms`,
        );
        await this.sleep(delay);
      }

      try {
        return await this.executeRequest<T>(method, url, endpoint, data, timeout, options);
      } catch (error) {
        lastError = error;
        if (!this.isRetryable(error)) {
          break;
        }
      }
    }

    throw lastError;
  }

  private async executeRequest<T>(
    method: HttpMethod,
    url: string,
    endpoint: string,
    data?: unknown,
    timeout?: number,
    options?: RequestOptions,
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    this.logRequest(method, endpoint, data);

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: data !== undefined ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      this.handleError(error, endpoint);
      throw error;
    }

    clearTimeout(timeoutId);

    const bodyText = await response.text();
    this.logResponse(method, endpoint, response.status, bodyText);

    if (!response.ok) {
      throw new HttpError(response.status, bodyText);
    }

    if (!bodyText) {
      return undefined as T;
    }

    try {
      return JSON.parse(bodyText) as T;
    } catch {
      throw new Error(`[HttpClient] Failed to parse response for ${method} ${endpoint}: ${bodyText}`);
    }
  }

  private isRetryable(error: unknown): boolean {
    if (error instanceof HttpError) {
      // Retry on server errors (5xx) but not on client errors (4xx)
      return error.statusCode >= 500;
    }
    // Retry on network errors (AbortError = timeout, TypeError = no connection)
    if (error instanceof Error) {
      return error.name === 'TypeError';
    }
    return false;
  }

  private handleError(error: unknown, endpoint: string): void {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error(`[HttpClient] Request timeout: ${endpoint}`);
      } else if (error.name === 'TypeError') {
        console.error(`[HttpClient] Network error (no connection?): ${endpoint}`, error.message);
      } else {
        console.error(`[HttpClient] Unexpected error for ${endpoint}:`, error.message);
      }
    }
  }

  private logRequest(method: HttpMethod, endpoint: string, data?: unknown): void {
    if (__DEV__) {
      console.log(`[HttpClient] --> ${method} ${endpoint}`, data ?? '');
    }
  }

  private logResponse(method: HttpMethod, endpoint: string, status: number, body: string): void {
    if (__DEV__) {
      const preview = body.length > 200 ? `${body.slice(0, 200)}…` : body;
      console.log(`[HttpClient] <-- ${status} ${method} ${endpoint}`, preview);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const httpClient = new HttpClient();
