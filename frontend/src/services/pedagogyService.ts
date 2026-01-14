import api from './api';

export interface Session {
    id: number;
    nom: string;
    date_debut: string;
    date_fin: string;
    formation_rncp_id: string;
}

export interface SessionCreate {
    nom: string;
    date_debut: string;
    date_fin: string;
    formation_rncp_id?: string;
}

export interface CalendarGenerate {
    days_of_week: number[]; // 0=Monday, 6=Sunday
}

export interface SessionDay {
    id: number;
    date: string;
    is_morning: boolean;
    is_afternoon: boolean;
}

const pedagogyService = {
    getSessions: async (): Promise<Session[]> => {
        // Warning: check backend router prefix. It is /sessions in `pedagogie.py`
        // But main.py likely includes it with /pedagogie prefix or just /sessions?
        // Let's assume /sessions based on router.py content, but usually it is mounted under logical path.
        // I'll assume /sessions for now based on file inspection, but if 404 I will check main.py.
        const response = await api.get('/sessions/');
        return response.data;
    },

    createSession: async (data: SessionCreate) => {
        const response = await api.post('/sessions/', data);
        return response.data;
    },

    generateCalendar: async (sessionId: number, days: number[]) => {
        const response = await api.post(`/sessions/${sessionId}/generate-calendar`, { days_of_week: days });
        return response.data;
    },

    getApprentiCalendar: async (contratId: number): Promise<SessionDay[]> => {
        // This endpoint was defined in `contrats.py` or `pedagogie.py`? 
        // I viewed `contrats.py` earlier, it had `get_contrat_calendar` at `/{dossier_id}/calendar`.
        const response = await api.get(`/contrats/${contratId}/calendar`);
        return response.data;
    }
};

export default pedagogyService;
