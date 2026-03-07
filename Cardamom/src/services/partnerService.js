import apiClient from "./apiClient";

export const getPartnerDashboard = async () => (await apiClient.get("/partner/dashboard")).data;
export const createPaymentRequest = async (payload) => (await apiClient.post("/partner/payment-requests", payload)).data;
