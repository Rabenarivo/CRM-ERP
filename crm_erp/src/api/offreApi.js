import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
const API_URL = `${API_BASE_URL}/api/offres`;

export const createOffre = ({ demandeId, fournisseurId, offre }) => {
  return axios.post(`${API_URL}`, offre, {
    params: { demandeId, fournisseurId },
  });
};

export const getOffresByDemande = (demandeId) => {
  return axios.get(`${API_URL}/demande/${demandeId}`);
};

export const getAllOffres = () => {
  return axios.get(`${API_URL}/get-offre`);
};
