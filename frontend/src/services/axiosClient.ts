import axios from "axios";

export const axiosClient = axios.create({
  baseURL: "http://127.0.0.1:8000/",
});

// Interceptor para 401
axiosClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token inválido o expirado: lo quitamos y forzamos login
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);