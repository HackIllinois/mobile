import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import Toast from 'react-native-toast-message';
import * as SecureStore from "expo-secure-store";
import { resetToAuth } from "./lib/navigationRef";

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
        const jwt = await SecureStore.getItemAsync("jwt");
        if (jwt) {
          const cleaned = jwt.replace(/#$/, '');
          config.headers.Authorization = /^Bearer\s/i.test(cleaned)
            ? cleaned
            : `Bearer ${cleaned}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      
      (error: AxiosError) => {
        if (error.response) {
          const data = error.response.data as any;
          if (
            (data.error && data.error === AuthenticationErrorType.NoToken) ||
            data.error === AuthenticationErrorType.TokenInvalid ||
            data.error === AuthenticationErrorType.TokenExpired
          ) {
            void this.redirectToSignIn();
          } else {
            this.handleError(error.response.status, data?.error, data?.message);
          }
        } else {
          // Handle cases like network timeout/no internet
          Toast.show({
            type: 'error',
            text1: 'Network Error',
            text2: 'Please check your internet connection',
          });
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.get(url, config);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.post(url, data, config);
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.put(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance.delete(url, config);
  }

  public async redirectToSignIn(): Promise<void> {
    // TODO: Implement actual navigation redirect
    console.log("REDIRECT TO SIGN IN PAGE");
    await SecureStore.deleteItemAsync("jwt"); // erase jwt
    resetToAuth();
  }

  private handleError(status: number, errorType?: string, message?: string): void {
    let error_message: string;

    if (message && errorType) {
      error_message = `${errorType}: ${message}`;
    } else {
      switch (status) {
        case 400: error_message = "Bad Request: The request was invalid"; break;
        case 401: error_message = "Unauthorized: Invalid authentication"; break;
        case 403: error_message = "Forbidden: Access denied"; break;
        case 404: error_message = "Not Found: Resource doesn't exist"; break;
        case 429: error_message = "Too Many Requests: Rate limit exceeded"; break;
        case 500: error_message = "Internal Server Error: Server is down"; break;
        default:  error_message = `HTTP Error: Received status code ${status}`; break;
      }
    }

    // Trigger the global toast
    Toast.show({
      type: 'error',
      text1: 'API Error',
      text2: error_message,
      position: 'top', // Adjust to 'bottom' if you want to see if it hits your custom error
    });

    console.error(error_message);
  }
}

const api = new API();
export default api;