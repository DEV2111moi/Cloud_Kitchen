import API from './axiosInstance';

export const getCookStats = () => API.get('/cook/stats');
export const getCookOrders = (params) => API.get('/cook/orders', { params });
export const updateOrderStatus = (id, status) => API.patch(`/cook/orders/${id}/status`, { status });
export const getCookMenu = () => API.get('/cook/menu');
export const createCookMenuItem = (data) => API.post('/cook/menu', data);
export const updateCookMenuItem = (id, data) => API.put(`/cook/menu/${id}`, data);
export const deleteCookMenuItem = (id) => API.delete(`/cook/menu/${id}`);
