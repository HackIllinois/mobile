import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

import * as SecureStore from "expo-secure-store";

enum AuthenticationErrorType {
  NoToken = "NoToken",
  TokenInvalid = "TokenInvalid",
  TokenExpired = "TokenExpired",
}

class API {
  public axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: "https://adonix.hackillinois.org", // TODO: change to env after we decide env naming
      timeout: 10000, // 10s
      headers: { "Content-Type": "application/json" },
    });
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // inject jwt into headers before request is made
        const jwt = await SecureStore.getItemAsync("jwt");
        if (jwt) {
          config.headers.Authorization = jwt;
        }
        return config;
      },
      (error) => Promise.reject(error),
      { synchronous: false, runWhen: () => true }
    );
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // this runs if response status not in 200s
        if (error.response) {
          const data = error.response.data as any;
          // it is an authentication error, redirect to sign in
          if (
            (data.error && data.error === AuthenticationErrorType.NoToken) ||
            data.error === AuthenticationErrorType.TokenInvalid ||
            data.error === AuthenticationErrorType.TokenExpired
          ) {
            this.redirectToSignIn();
          } else {
            this.handleError(error.response.status, data?.error, data?.message);
          }
          // else just handle error normally
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.get(url, config);
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.axiosInstance.post(url, data, config);
  }

  private redirectToSignIn(): void {
    // TODO: redirect to sign in page
    console.log("REDIRECT TO SIGN IN PAGE");
  }

  private handleError(
    status: number,
    errorType?: string,
    message?: string
  ): void {
    if (message && errorType) {
      // if endpoint already returns a message, use that message instead
      console.error(`${errorType}: ${message}`); // TODO: change console.error to toast
      return;
    }
    var error_message: string;
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
    console.error(error_message); // TODO: change console.error to toast
  }
}

const api = new API();
export default api;
