import API from './axiosInstance';

export const getMenu = (params) => API.get('/public/menu', { params });
export const getFeaturedCooks = () => API.get('/public/home-cooks');
export const registerAsCook = (data) => API.post('/public/register-cook', data);

// Order and customer simulation api calls
export const getCustomers = () => API.get('/public/customers');
export const registerCustomer = (data) => API.post('/public/customers', data);
export const placeOrder = (data) => API.post('/public/orders', data);
export const getActiveOrders = (customerId) => API.get('/public/orders/active', { params: { customerId } });
