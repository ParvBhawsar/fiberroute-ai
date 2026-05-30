export class UserFacingApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserFacingApiError';
  }
}

export interface RequestJsonOptions extends RequestInit {
  timeoutMs?: number;
  serviceName: string;
}

export async function requestJson<T>(url: string, { timeoutMs = 12000, serviceName, ...options }: RequestJsonOptions): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new UserFacingApiError(`${serviceName} is temporarily unavailable. Please try again in a few moments.`);
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new UserFacingApiError(`${serviceName} returned an unreadable response. Please try again.`);
    }
  } catch (error) {
    if (error instanceof UserFacingApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new UserFacingApiError(`${serviceName} took too long to respond. Please try again.`);
    }
    throw new UserFacingApiError(`${serviceName} could not be reached. Check the connection and try again.`);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function userMessageFromError(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}
