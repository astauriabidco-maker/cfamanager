import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit3, Download, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import contractService from '../../services/contractService';
import pedagogyService from '../../services/pedagogyService';
import type { SessionDay } from '../../services/pedagogyService';
import type { ContratDossier, ContratVersion, ContratAvenant } from '../../services/contractService';
import CalendarView from '../../components/CalendarView';

const ContratDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [dossier, setDossier] = useState<ContratDossier | null>(null);
    const [activeVersion, setActiveVersion] = useState<ContratVersion | null>(null);
    const [history, setHistory] = useState<ContratVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAvenantModalOpen, setIsAvenantModalOpen] = useState(false);

    const [calendar, setCalendar] = useState<SessionDay[]>([]);
    const [activeTab, setActiveTab] = useState<'info' | 'calendar'>('info');

    // Avenant Form
    const [avenantData, setAvenantData] = useState<ContratAvenant>({});

    useEffect(() => {
        if (id) loadDetails();
    }, [id]);

    const loadDetails = async () => {
        try {
            if (!id) return;
            // Parallel fetch
            const [detail, hist, cal] = await Promise.all([
                contractService.getContratDetails(Number(id)),
                contractService.getContratHistory(Number(id)),
                // Safe fetch calendar (might be empty or fail if session not linked)
                pedagogyService.getApprentiCalendar(Number(id)).catch(() => [])
            ]);
            setDossier(detail.dossier);
            setActiveVersion(detail.active_version);
            setHistory(hist);
            setCalendar(cal);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openAvenantModal = () => {
        if (!activeVersion) return;
        // Pre-fill with current data
        setAvenantData({
            salaire: activeVersion.salaire,
            cout_npec: activeVersion.cout_npec,
            heures_formation: activeVersion.heures_formation,
            date_debut: activeVersion.date_debut,
            date_fin: activeVersion.date_fin,
            intitule_poste: activeVersion.intitule_poste,
            session_id: activeVersion.session_id // Include session in avenant
        });
        setIsAvenantModalOpen(true);
    };

    const handleAvenantSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        try {
            await contractService.createAvenant(Number(id), avenantData);
            setIsAvenantModalOpen(false);
            loadDetails(); // Refresh to see V(n+1)
            alert("Avenant enregistré avec succès. Une nouvelle version a été créée.");
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la création de l'avenant");
        }
    };

    const handleExportOpco = async () => {
        if (!id) return;
        try {
            await contractService.downloadOpcoZip(Number(id));
        } catch (error) {
            console.error(error);
            alert("Erreur lors du téléchargement");
        }
    };

    if (loading) return <div className="p-8">Chargement...</div>;
    if (!dossier) return <div className="p-8">Contrat introuvable</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <Link to="/contrats" className="mr-4 text-gray-500 hover:text-gray-800 transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                            Contrat {dossier.candidat?.first_name} {dossier.candidat?.last_name}
                            <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
                                {dossier.entreprise?.raison_sociale}
                            </span>
                        </h1>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'info' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Informations
                    </button>
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'calendar' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Calendrier Alternance
                    </button>
                </div>
            </div>

            {activeTab === 'info' ? (
                <div className="flex flex-col md:flex-row gap-6 flex-1">
                    {/* Zone A: Version Actuelle */}
                    <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <h2 className="text-lg font-bold text-gray-800">Version Actuelle (V{activeVersion?.version_number})</h2>
                            </div>
                            <button
                                onClick={openAvenantModal}
                                className="flex items-center text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-200"
                            >
                                <Edit3 className="w-4 h-4 mr-2" />
                                Créer un Avenant
                            </button>
                        </div>

                        {activeVersion ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Poste</label>
                                        <div className="text-lg font-medium text-gray-900 mt-1">{activeVersion.intitule_poste}</div>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Salaire</label>
                                        <div className="text-lg font-medium text-gray-900 mt-1">{activeVersion.salaire} €</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm text-gray-500">Date de début</label>
                                        <div className="font-medium">{new Date(activeVersion.date_debut).toLocaleDateString()}</div>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">Date de fin</label>
                                        <div className="font-medium">{new Date(activeVersion.date_fin).toLocaleDateString()}</div>
                                    </div>

                                </div>
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                    <label className="text-xs font-bold text-blue-400 uppercase tracking-wider">Session de Formation</label>
                                    <div className="text-lg font-medium text-blue-900 mt-1">
                                        {activeVersion.session_id ? `Session # ${activeVersion.session_id}` : 'Aucune session liée'}
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-4 mt-2">
                                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                        <div>Heures Formation: <span className="font-semibold">{activeVersion.heures_formation || '-'} h</span></div>
                                        <div>Coût NPEC: <span className="font-semibold">{activeVersion.cout_npec || '-'} €</span></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border-dashed border-2 border-gray-200">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                Aucune version active
                            </div>
                        )}
                    </div>

                    {/* Zone B: Actions & Historique */}
                    <div className="w-full md:w-80 flex flex-col gap-6">
                        {/* Export Card */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
                            <h3 className="font-bold text-lg mb-2">Export OPCO</h3>
                            <p className="text-blue-100 text-sm mb-6">Télécharger le dossier complet (Contrat, CERFA, Pièces) au format ZIP pour l'OPCO.</p>
                            <button
                                onClick={handleExportOpco}
                                className="w-full bg-white text-blue-700 font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-50 transition-colors flex items-center justify-center transform hover:scale-[1.02] duration-200"
                            >
                                <Download className="w-5 h-5 mr-2" />
                                Télécharger ZIP
                            </button>
                        </div>

                        {/* History List */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-1">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                                <Clock className="w-4 h-4 mr-2" />
                                Historique Versions
                            </h3>
                            <div className="space-y-4">
                                {history.length === 0 && <p className="text-sm text-gray-400 italic">Aucun historique.</p>}
                                {history.map(v => (
                                    <div key={v.id} className={`flex items-start p-3 rounded-lg border ${v.is_active ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                                        <div className={`w-2 h-2 mt-1.5 rounded-full mr-3 ${v.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                Version {v.version_number}
                                                {v.is_active && <span className="ml-2 text-xs text-green-700 bg-green-200 px-1.5 py-0.5 rounded">Active</span>}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                Du {new Date(v.date_debut).toLocaleDateString()} au {new Date(v.date_fin).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {v.salaire} € - {v.intitule_poste}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-h-[500px]">
                    <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                        <Calendar className="w-6 h-6 mr-3 text-indigo-600" />
                        Planning de Formation
                    </h2>
                    {!activeVersion?.session_id && (
                        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg mb-6 flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            Ce contrat n'est lié à aucune session de formation. Veuillez créer un avenant pour le lier à une session.
                        </div>
                    )}
                    <CalendarView days={calendar} />
                </div>
            )}

            {/* Modal Avenant */}
            {isAvenantModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg p-6 animate-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Créer un Avenant (V{activeVersion ? activeVersion.version_number + 1 : 1})</h2>
                        <p className="text-sm text-gray-500 mb-6">Cette action archivera la version actuelle et en créera une nouvelle active.</p>

                        <form onSubmit={handleAvenantSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Intitulé du Poste</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg p-2"
                                    value={avenantData.intitule_poste}
                                    onChange={e => setAvenantData({ ...avenantData, intitule_poste: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Démarrage Avenant</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded-lg p-2"
                                        value={avenantData.date_debut}
                                        onChange={e => setAvenantData({ ...avenantData, date_debut: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded-lg p-2"
                                        value={avenantData.date_fin}
                                        onChange={e => setAvenantData({ ...avenantData, date_fin: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau Salaire (€)</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-lg p-2 font-mono"
                                    value={avenantData.salaire}
                                    onChange={e => setAvenantData({ ...avenantData, salaire: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ID Session (Temporaire)</label>
                                <input
                                    type="number"
                                    placeholder="ID de la session (ex: 1)"
                                    className="w-full border rounded-lg p-2 font-mono"
                                    value={avenantData.session_id || ''}
                                    onChange={e => setAvenantData({ ...avenantData, session_id: Number(e.target.value) })}
                                />
                                <p className="text-xs text-gray-400 mt-1">Saisir manuellement l'ID de la session créée dans le module Pédagogie.</p>
                            </div>

                            <div className="flex justify-end space-x-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setIsAvenantModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md font-medium"
                                >
                                    Valider l'Avenant
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContratDetail;
