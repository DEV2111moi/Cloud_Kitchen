import API from './axiosInstance';

export const getOrders = (params) => API.get('/orders', { params });
export const assignDeliveryPartner = (orderId, deliveryPartnerId) => 
  API.patch(`/orders/${orderId}/assign-delivery`, { deliveryPartnerId });
export const updateOrderStatus = (orderId, status) => 
  API.patch(`/orders/${orderId}/status`, { status });
