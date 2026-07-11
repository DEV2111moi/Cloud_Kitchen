import API from './axiosInstance';

export const getHomeCooks = (params) => API.get('/home-cooks', { params });
export const getHomeCook = (id) => API.get(`/home-cooks/${id}`);
export const createHomeCook = (data) => API.post('/home-cooks', data);
export const updateHomeCook = (id, data) => API.put(`/home-cooks/${id}`, data);
export const updateHomeCookStatus = (id, status) => API.patch(`/home-cooks/${id}/status`, { status });
export const deleteHomeCook = (id) => API.delete(`/home-cooks/${id}`);
