import apiClient from "./apiClient";

export const getAdminDashboard = async () => (await apiClient.get("/admin/dashboard")).data;
export const getStockSummary = async (params) => (await apiClient.get("/admin/stock", { params })).data;
export const getStockTransactions = async (params) => (await apiClient.get("/admin/stock/transactions", { params })).data;
export const getStockRecycleBin = async (params) => (await apiClient.get("/admin/stock/recycle-bin", { params })).data;
export const createPurchase = async (payload) => (await apiClient.post("/admin/purchases", payload)).data;
export const updatePurchase = async (purchaseId, payload) =>
  (await apiClient.put(`/admin/purchases/${purchaseId}`, payload)).data;
export const softDeletePurchase = async (purchaseId) =>
  (await apiClient.delete(`/admin/purchases/${purchaseId}`)).data;
export const restorePurchase = async (purchaseId) =>
  (await apiClient.post(`/admin/purchases/${purchaseId}/restore`)).data;
export const permanentDeletePurchase = async (purchaseId) =>
  (await apiClient.delete(`/admin/purchases/${purchaseId}/permanent`)).data;
export const addPurchasePayment = async (purchaseId, payload) =>
  (await apiClient.post(`/admin/purchases/${purchaseId}/payments`, payload)).data;
export const getPurchasePaymentTransactions = async (purchaseId) =>
  (await apiClient.get(`/admin/purchases/${purchaseId}/payments`)).data;
export const getSalesTransactions = async (params) => (await apiClient.get("/admin/sales/transactions", { params })).data;
export const getSalesRecycleBin = async (params) => (await apiClient.get("/admin/sales/recycle-bin", { params })).data;
export const getDealPaymentTransactions = async (dealId) =>
  (await apiClient.get(`/admin/deals/${dealId}/payments`)).data;
export const getBuyers = async () => (await apiClient.get("/admin/buyers")).data;
export const createBuyer = async (payload) => (await apiClient.post("/admin/buyers", payload)).data;
export const getApprovedPartners = async () => (await apiClient.get("/admin/partners/approved")).data;
export const getAvailableStocks = async () => (await apiClient.get("/admin/purchases/available")).data;
export const createDeal = async (payload) => (await apiClient.post("/admin/deals", payload)).data;
export const updateDeal = async (dealId, payload) => (await apiClient.put(`/admin/deals/${dealId}`, payload)).data;
export const softDeleteDeal = async (dealId) => (await apiClient.delete(`/admin/deals/${dealId}`)).data;
export const restoreDeal = async (dealId) => (await apiClient.post(`/admin/deals/${dealId}/restore`)).data;
export const permanentDeleteDeal = async (dealId) => (await apiClient.delete(`/admin/deals/${dealId}/permanent`)).data;
export const addDealPayment = async (dealId, payload) =>
  (await apiClient.post(`/admin/deals/${dealId}/payments`, payload)).data;
export const getExpenditures = async () => (await apiClient.get("/admin/expenditures")).data;
export const addExpenditure = async (payload) => (await apiClient.post("/admin/expenditures", payload)).data;
export const getUsers = async () => (await apiClient.get("/admin/users")).data;
export const approvePartner = async (userId) => apiClient.post(`/admin/users/${userId}/approve`);
export const rejectPartner = async (userId, notes = "") => apiClient.post(`/admin/users/${userId}/reject`, notes);
export const getPaymentRequests = async () => (await apiClient.get("/admin/payment-requests")).data;
export const approvePaymentRequest = async (id) => apiClient.post(`/admin/payment-requests/${id}/approve`);
export const rejectPaymentRequest = async (id, notes = "") => apiClient.post(`/admin/payment-requests/${id}/reject`, notes);
