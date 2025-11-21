import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

export const channelApi = {
  getChannels: async () => {
    const { data } = await api.get('/channels');
    return data.data || data;
  },

  getChannel: async (id: string) => {
    const { data } = await api.get(`/channels/${id}`);
    return data.data || data;
  },

  createChannel: async (payload: { name: string; access_type: string }) => {
    const { data } = await api.post('/channels/create', payload);
    return data;
  },

  deleteChannel: async (id: string) => {
    const { data } = await api.delete(`/channels/${id}`);
    return data;
  },

  joinChannel: async (id: string) => {
    const { data } = await api.post(`/channels/${id}/join`);
    return data;
  },

  leaveChannel: async (id: string) => {
    const { data } = await api.post(`/channels/${id}/leave`);
    return data;
  },
  changeChannelType: async (id: string, access_type: string) => {
    const { data } = await api.put(`channels/${id}/access/${access_type}`)
    return data;
  },
  changeChannelName: async (id: string, name: string) => {
    const { data } = await api.patch(`channels/${id}/change-name/${name}`)
    return data
  },
};

export const userApi = {
  register: async (input: { username: string; email: string; password: string }) => {
    const { data } = await api.post('/user/register', input);
    return data;
  },

  login: async (input: { email: string; password: string }) => {
    const { data } = await api.post('/user/login', input);
    return data;
  },

  logout: async () => {
    const { data } = await api.post('/user/logout');
    return data;
  },

  getCurrentUser: async () => {
    const { data } = await api.get('/user/me');
    return data.data;
  },
};
