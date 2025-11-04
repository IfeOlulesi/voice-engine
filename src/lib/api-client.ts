import { getCurrentUserToken } from './firebase-auth';

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiCall(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body, headers = {} } = options;

  try {
    // Get authentication token
    const token = await getCurrentUserToken();
    
    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...headers,
      },
    };

    // Add body if provided
    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }

    // Make the request
    const response = await fetch(endpoint, requestOptions);
    
    // Parse response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Check if request was successful
    if (!response.ok) {
      throw new ApiError(
        data?.error || data?.message || `HTTP ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors, auth errors, etc.
    console.error('API call failed:', error);
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      0,
      error
    );
  }
}

// Convenience methods
export const api = {
  get: (endpoint: string, options?: Omit<ApiOptions, 'method'>) =>
    apiCall(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint: string, body?: any, options?: Omit<ApiOptions, 'method' | 'body'>) =>
    apiCall(endpoint, { ...options, method: 'POST', body }),
  
  put: (endpoint: string, body?: any, options?: Omit<ApiOptions, 'method' | 'body'>) =>
    apiCall(endpoint, { ...options, method: 'PUT', body }),
  
  delete: (endpoint: string, options?: Omit<ApiOptions, 'method'>) =>
    apiCall(endpoint, { ...options, method: 'DELETE' }),
  
  patch: (endpoint: string, body?: any, options?: Omit<ApiOptions, 'method' | 'body'>) =>
    apiCall(endpoint, { ...options, method: 'PATCH', body }),
};