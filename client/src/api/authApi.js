import API from './axiosInstance';

export const login = (credentials) => API.post('/auth/login', credentials);
export const getProfile = () => API.get('/auth/profile');
