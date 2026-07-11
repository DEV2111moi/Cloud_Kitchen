import API from './axiosInstance';

export const getStats = () => API.get('/dashboard/stats');
export const getChartData = () => API.get('/dashboard/charts');
