import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
const API_URL = `${API_BASE_URL}/api/livraisons`;

export const createLivraison = (payload) => {
  return axios.post(`${API_URL}/save_livraison`, payload);
};

export const getLivraisonList = () => {
  return axios.get(`${API_URL}/list`);
};

export const getEnterpriseLivraisons = (connectedUserId) => {
  return axios.get(`${API_URL}/entreprise`, {
    params: { userId: connectedUserId },
  });
};

export const assignLivraison = (id, connectedUserId) => {
  return axios.patch(`${API_URL}/${id}/assign`, { userId: connectedUserId });
};

export const markLivraisonLivree = (id, payload) => {
  return axios.patch(`${API_URL}/${id}/livree`, payload);
};

export const getLivraisonById = (id) => {
  return axios.get(`${API_URL}/${id}`);
};

export const updateLivraison = (id, payload) => {
  return axios.put(`${API_URL}/${id}`, payload);
};

export const deleteLivraison = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};
