import api from './api';

export interface ContratCreate {
    candidat_id: number;
    entreprise_id: number;
    session_id?: number | null;
    salaire: number;
    cout_npec?: number;
    heures_formation?: number;
    date_debut: string;
    date_fin: string;
    intitule_poste: string;
}

export interface ContratAvenant {
    session_id?: number | null;
    salaire?: number;
    cout_npec?: number;
    heures_formation?: number;
    date_debut?: string;
    date_fin?: string;
    intitule_poste?: string;
}

export interface ContratVersion {
    id: number;
    version_number: number;
    salaire: number;
    cout_npec: number;
    heures_formation: number;
    date_debut: string;
    date_fin: string;
    intitule_poste: string;
    is_active: boolean;
}

export interface ContratDossier {
    id: number;
    candidat: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    };
    entreprise: {
        id: number;
        raison_sociale: string;
        siret: string;
    } | null;
    active_version?: ContratVersion;
    versions?: ContratVersion[];
}

const contractService = {
    getContrats: async (): Promise<ContratDossier[]> => {
        const response = await api.get('/contrats/');
        return response.data;
    },

    getContratDetails: async (id: number): Promise<{ dossier: ContratDossier, active_version: ContratVersion }> => {
        const response = await api.get(`/contrats/${id}`);
        return response.data;
    },

    getContratHistory: async (id: number): Promise<ContratVersion[]> => {
        const response = await api.get(`/contrats/${id}/history`);
        return response.data;
    },

    createContrat: async (data: ContratCreate) => {
        const response = await api.post('/contrats/', data);
        return response.data;
    },

    createAvenant: async (id: number, data: ContratAvenant) => {
        // trailing slash might be needed depending on strict slashes in router, let's play safe with exactly how it is defined
        // router: /{dossier_id}/avenant (no trailing slash usually in path param unless specified)
        // Checking backend: @router.put("/{dossier_id}/avenant") -> likely /api/contrats/123/avenant
        // but to handle docker redirects safely I might add slash if needed?
        // No, path params usually OK. But let's check Recrutement lesson: /candidats required /candidats/
        // Here it is /contrats/{id}/avenant. If I add slash /contrats/{id}/avenant/ it might fail 404 if not defined.
        // Let's try without slash first, as it's a specific resource path.
        const response = await api.put(`/contrats/${id}/avenant`, data);
        return response.data;
    },

    downloadOpcoZip: async (id: number) => {
        // We need to trigger a browser download. 
        // Best way with Axios and auth headers:
        const response = await api.get(`/contrats/${id}/export-zip`, {
            responseType: 'blob'
        });

        // Create a link and click it
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `export_contrat_${id}.zip`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};

export default contractService;
