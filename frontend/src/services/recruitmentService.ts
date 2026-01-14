import api from './api';

export interface Candidat {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    statut: 'NOUVEAU' | 'ADMISSIBLE' | 'ENTRETIEN' | 'PLACE' | 'REJETE';
    cv_filename?: string;
    tenant_id: number;
}

const recruitmentService = {
    fetchCandidats: async (): Promise<Candidat[]> => {
        const response = await api.get('/candidats/');
        return response.data;
    },

    uploadCV: async (file: File): Promise<Candidat> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/candidats/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    updateStatus: async (id: number, status: string): Promise<Candidat> => {
        const response = await api.patch(`/candidats/${id}/status`, null, {
            params: { status }
        });
        return response.data;
    }
};

export default recruitmentService;
