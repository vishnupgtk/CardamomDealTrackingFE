import apiClient from "./apiClient";

export const registerPartner = (payload) => apiClient.post("/auth/register", payload);
export const login = async (payload) => {
  const { data } = await apiClient.post("/auth/login", payload);
  return data;
};
