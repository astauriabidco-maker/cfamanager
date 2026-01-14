import { useEffect, useState } from 'react';
import api from '../services/api';
import { Euro, TrendingUp, Users } from 'lucide-react';

interface DashboardMetrics {
    total_candidats: number;
    ca_previsionnel: number;
    ca_realise: number;
    taux_transformation: number;
}

const Dashboard = () => {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await api.get('/analytics/dashboard');
                // Backend returns: { total_candidats, ca_previsionnel, ca_realise, taux_transformation }
                setMetrics(response.data);
            } catch (err: any) {
                console.error('Error fetching dashboard metrics:', err);
                setError('Impossible de charger les données du dashboard.');
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                {/* Card 1: CA Prévisionnel */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                        <Euro className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">CA Prévisionnel</p>
                        <p className="text-2xl font-bold text-gray-800">
                            {metrics?.ca_previsionnel.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </p>
                    </div>
                </div>

                {/* Card 2: CA Réalisé */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                        <Euro className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">CA Réalisé</p>
                        <p className="text-2xl font-bold text-gray-800">
                            {metrics?.ca_realise.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </p>
                    </div>
                </div>

                {/* Card 3: Taux Transformation */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
                    <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Taux Transformation</p>
                        <p className="text-2xl font-bold text-gray-800">
                            {metrics?.taux_transformation.toFixed(1)}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Additional Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Volume Candidats</h3>
                    <div className="flex items-center">
                        <div className="flex-1">
                            <p className="text-3xl font-bold text-gray-900">{metrics?.total_candidats}</p>
                            <p className="text-sm text-gray-500">Total Candidats</p>
                        </div>
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400">
                    <p>Graphiques & Détails à venir...</p>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
