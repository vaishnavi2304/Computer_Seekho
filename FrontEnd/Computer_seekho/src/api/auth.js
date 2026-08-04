import { client } from './client';

export const login = (staffUsername, staffPassword) =>
  client.post('/api/auth/login', { staffUsername, staffPassword }).then((r) => r.data);

export const loginWithGoogle = (idToken) =>
  client.post('/api/auth/google', { idToken }).then((r) => r.data);

export const changePassword = (payload) =>
  client.put('/api/auth/change-password', payload).then((r) => r.data);

export const logout = () => client.post('/api/auth/logout').then((r) => r.data);