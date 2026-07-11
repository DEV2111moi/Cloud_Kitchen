import API from './axiosInstance';

export const getDeliveryPartners = (params) => API.get('/delivery-partners', { params });
export const getDeliveryPartner = (id) => API.get(`/delivery-partners/${id}`);
export const createDeliveryPartner = (data) => API.post('/delivery-partners', data);
export const updateDeliveryPartner = (id, data) => API.put(`/delivery-partners/${id}`, data);
export const updateDeliveryPartnerStatus = (id, status) => API.patch(`/delivery-partners/${id}/status`, { status });
export const verifyDocuments = (id) => API.patch(`/delivery-partners/${id}/verify`);
export const assignOrder = (id, orderId) => API.patch(`/delivery-partners/${id}/assign`, { orderId });
export const deleteDeliveryPartner = (id) => API.delete(`/delivery-partners/${id}`);
