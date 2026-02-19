// api.ts
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { logoutAndRedirect } from "./lib/auth"; // <-- adjust path if auth.ts is elsewhere

enum AuthenticationErrorType {
  NoToken = "NoToken",
  TokenInvalid = "TokenInvalid",
  TokenExpired = "TokenExpired",
}

class API {
  public axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: "https://adonix.hackillinois.org", // TODO: move to env
      timeout: 10000, // 10s
      headers: { "Content-Type": "application/json" },
    });

    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const jwt = await SecureStore.getItemAsync("jwt");
        if (jwt) {
          const cleaned = jwt.replace(/#$/, "");
          config.headers = config.headers ?? {};
          config.headers.Authorization = /^Bearer\s/i.test(cleaned)
            ? cleaned
            : `Bearer ${cleaned}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
      { synchronous: false, runWhen: () => true }
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // Network error / timeout: no response object
        if (!error.response) return Promise.reject(error);

        const status = error.response.status;
        const data = error.response.data as any;

        const isAuthError =
          status === 401 ||
          data?.error === AuthenticationErrorType.NoToken ||
          data?.error === AuthenticationErrorType.TokenInvalid ||
          data?.error === AuthenticationErrorType.TokenExpired;

        if (isAuthError) {
          await logoutAndRedirect();
          return Promise.reject(error);
        }

        this.handleError(status, data?.error, data?.message);
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    // keeps your existing calling style; returns AxiosResponse like before
    return this.axiosInstance.get(url, config) as unknown as Promise<T>;
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.axiosInstance.post(url, data, config) as unknown as Promise<T>;
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.axiosInstance.put(url, data, config) as unknown as Promise<T>;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.delete(url, config) as unknown as Promise<T>;
  }

  private handleError(status: number, errorType?: string, message?: string): void {
    if (message && errorType) {
      console.error(`${errorType}: ${message}`); // TODO: toast
      return;
    }

    let error_message: string;
    switch (status) {
      case 400:
        error_message = "Bad Request: The request was invalid or malformed";
        break;
      case 401:
        error_message = "Unauthorized: Invalid or missing authentication";
        break;
      case 403:
        error_message =
          "Forbidden: You don't have permission to access this resource";
        break;
      case 404:
        error_message = "Not Found: The requested resource doesn't exist";
        break;
      case 408:
        error_message =
          "Request Timeout: The server timed out waiting for the request";
        break;
      case 429:
        error_message = "Too Many Requests: Rate limit exceeded";
        break;
      case 500:
        error_message =
          "Internal Server Error: Something went wrong on the server";
        break;
      case 502:
        error_message = "Bad Gateway: Invalid response from upstream server";
        break;
      case 503:
        error_message =
          "Service Unavailable: The server is temporarily unavailable";
        break;
      case 504:
        error_message =
          "Gateway Timeout: Upstream server failed to respond in time";
        break;
      default:
        error_message = `HTTP Error: Received status code ${status}`;
        break;
    }
    console.error(error_message); // TODO: toast
  }
}

const api = new API();
export default api;
