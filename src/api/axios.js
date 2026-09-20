import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://panipuristore.onrender.com/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
});

let activeRequestCount = 0;

const notifyRequestStart = () => {
  activeRequestCount += 1;
  window.dispatchEvent(new CustomEvent('panipuri:api-start', {
    detail: { activeRequestCount },
  }));
};

const notifyRequestEnd = () => {
  activeRequestCount = Math.max(0, activeRequestCount - 1);
  window.dispatchEvent(new CustomEvent('panipuri:api-end', {
    detail: { activeRequestCount },
  }));
};

axiosInstance.interceptors.request.use(
  (config) => {
    notifyRequestStart();
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = "Bearer " + token;
    }
    return config;
  },
  (error) => {
    notifyRequestEnd();
    return Promise.reject(error);
  },
);

axiosInstance.interceptors.response.use(
  (response) => {
    notifyRequestEnd();
    return response;
  },
  (error) => {
    notifyRequestEnd();
    return Promise.reject(error);
  },
);

export default axiosInstance;
