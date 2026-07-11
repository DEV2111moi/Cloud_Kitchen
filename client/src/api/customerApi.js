import API from './axiosInstance';

export const getCustomers = (params) => API.get('/customers', { params });
export const getCustomer = (id) => API.get(`/customers/${id}`);
export const updateCustomer = (id, data) => API.put(`/customers/${id}`, data);
export const updateCustomerStatus = (id, status) => API.patch(`/customers/${id}/status`, { status });
export const deleteCustomer = (id) => API.delete(`/customers/${id}`);
