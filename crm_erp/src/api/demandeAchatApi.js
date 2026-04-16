import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";
const API_URL = `${API_BASE_URL}/api/demandes-achat`;

export const getDemandesAchat = () => axios.get(API_URL);

export const createDemandeAchat = (data) => axios.post(API_URL, data);

export const updateDemandeAchatStatut = (id, statut) =>
	axios.patch(`${API_URL}/${id}/statut`, { statut });