import api from './api';

export interface Entreprise {
    id: number;
    raison_sociale: string;
    siret: string;
    adresse?: string;
}

export interface EntrepriseCreate {
    raison_sociale: string;
    siret: string;
    adresse?: string;
}

const entrepriseService = {
    getEntreprises: async (): Promise<Entreprise[]> => {
        const response = await api.get('/entreprises/');
        return response.data;
    },

    createEntreprise: async (data: EntrepriseCreate): Promise<Entreprise> => {
        const response = await api.post('/entreprises/', data);
        return response.data;
    },
};

export default entrepriseService;
