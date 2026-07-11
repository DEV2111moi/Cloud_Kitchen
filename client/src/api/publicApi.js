import API from './axiosInstance';

export const getMenu = (params) => API.get('/public/menu', { params });
export const getFeaturedCooks = (params) => API.get('/public/home-cooks', { params });
export const registerAsCook = (data) => API.post('/public/register-cook', data);

// Order and customer simulation api calls
export const signupCustomer = (data) => API.post('/auth/customer/signup', data);
export const loginCustomer = (data) => API.post('/auth/customer/login', data);
export const placeOrder = (data) => API.post('/public/orders', data);
export const getActiveOrders = (customerId) => API.get('/public/orders/active', { params: { customerId } });
