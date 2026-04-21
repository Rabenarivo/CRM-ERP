import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
const API_URL = `${API_BASE_URL}/api/departments`;

export const getDepartments = () => {
  return axios.get(`${API_URL}/list`);
};

export const createDepartment = (payload) => {
  return axios.post(`${API_URL}/save`, payload);
};

export const updateDepartment = (id, payload) => {
  return axios.put(`${API_URL}/${id}`, payload);
};

export const deleteDepartment = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};