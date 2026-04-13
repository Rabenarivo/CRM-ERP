import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
const API_URL = `${API_BASE_URL}/api/proforma`;

export const createProforma = (payload) => {
  return axios.post(`${API_URL}/save-proforma`, payload);
};
