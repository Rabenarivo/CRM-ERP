import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
const API_URL = `${API_BASE_URL}/api/users`;

export const getUsers = () => {
  return axios.get(`${API_URL}/list`);
};

export const createUser = (payload) => {
  return axios.post(`${API_URL}/save`, payload);
};

export const updateUser = (id, payload) => {
  return axios.put(`${API_URL}/${id}`, payload);
};

export const deleteUser = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};