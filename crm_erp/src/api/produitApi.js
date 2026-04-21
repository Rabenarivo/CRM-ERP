import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
const API_URL = `${API_BASE_URL}/api/produits`;

export const filterProduitsByName = (param) => {
  const normalizedParam = (param || "").trim();
  return axios.get(`${API_URL}/filtres`, {
    params: { param: normalizedParam },
  });
};

export const getProduits = () => {
  return axios.get(`${API_URL}/list`);
};

export const assignProduitDepartment = (produitId, departmentId) => {
  return axios.put(`${API_URL}/${produitId}/department`, {
    departmentId,
  });
};

export const transferProduitToDepartment = (produitId, departmentId, quantite) => {
  return axios.post(`${API_URL}/${produitId}/transfer`, {
    departmentId,
    quantite,
  });
};
