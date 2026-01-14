import { useState, useEffect } from 'react';
import pedagogyService from '../../services/pedagogyService';
import type { Session } from '../../services/pedagogyService';
import { Calendar, Plus, Settings } from 'lucide-react';

const SessionManager = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isGenModalOpen, setIsGenModalOpen] = useState(false);

    // Create Form
    const [newData, setNewData] = useState({ nom: '', date_debut: '', date_fin: '', formation_rncp_id: '' });

    // Generate Form
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
    const [selectedDays, setSelectedDays] = useState<number[]>([]); // 0=Mon, ...

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const data = await pedagogyService.getSessions();
            setSessions(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await pedagogyService.createSession(newData);
            setIsCreateModalOpen(false);
            loadSessions();
            setNewData({ nom: '', date_debut: '', date_fin: '', formation_rncp_id: '' });
        } catch (e) {
            console.error(e);
            alert("Erreur création");
        }
    };

    const handleOpenGenerate = (id: number) => {
        console.log("Opening Generate for ID:", id);
        setSelectedSessionId(id);
        setSelectedDays([0]); // Default Monday
        setIsGenModalOpen(true);
    };

    const handleGenerate = async () => {
        console.log("Generating with:", selectedSessionId, selectedDays);
        if (!selectedSessionId) {
            console.error("No session ID selected");
            return;
        }
        try {
            console.log("Calling API...");
            const res = await pedagogyService.generateCalendar(selectedSessionId, selectedDays);
            console.log("API Response:", res);
            alert(res.message);
            setIsGenModalOpen(false);
        } catch (e) {
            console.error("API Error:", e);
            alert("Erreur génération");
        }
    };

    const toggleDay = (dayIndex: number) => {
        if (selectedDays.includes(dayIndex)) {
            setSelectedDays(selectedDays.filter(d => d !== dayIndex));
        } else {
            setSelectedDays([...selectedDays, dayIndex]);
        }
    };

    const daysMap = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Gestion des Sessions (Promotions)</h1>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700"
                >
                    <Plus className="w-5 h-5 mr-2" /> Nouvelle Session
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map(session => (
                    <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg text-gray-900">{session.nom}</h3>
                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                {session.formation_rncp_id || 'Sans RNCP'}
                            </span>
                        </div>
                        <div className="text-sm text-gray-500 mb-6 space-y-1">
                            <div>Du {new Date(session.date_debut).toLocaleDateString()}</div>
                            <div>Au {new Date(session.date_fin).toLocaleDateString()}</div>
                        </div>
                        <div className="border-t pt-4 flex justify-end">
                            <button
                                onClick={() => handleOpenGenerate(session.id)}
                                className="text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg text-sm font-medium flex items-center"
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                Générer Planning
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-96">
                        <h2 className="font-bold text-xl mb-4">Nouvelle Session</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input
                                className="w-full border p-2 rounded"
                                placeholder="Nom (ex: DevWeb 2024)"
                                value={newData.nom}
                                onChange={e => setNewData({ ...newData, nom: e.target.value })}
                                required
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="date" className="border p-2 rounded" value={newData.date_debut} onChange={e => setNewData({ ...newData, date_debut: e.target.value })} required />
                                <input type="date" className="border p-2 rounded" value={newData.date_fin} onChange={e => setNewData({ ...newData, date_fin: e.target.value })} required />
                            </div>
                            <input
                                className="w-full border p-2 rounded"
                                placeholder="Code RNCP (Optionnel)"
                                value={newData.formation_rncp_id}
                                onChange={e => setNewData({ ...newData, formation_rncp_id: e.target.value })}
                            />
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-3 py-2 text-gray-600">Annuler</button>
                                <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded">Créer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Generate Modal */}
            {isGenModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl w-96">
                        <div className="flex items-center mb-4 text-indigo-600">
                            <Settings className="w-6 h-6 mr-2" />
                            <h2 className="font-bold text-xl text-gray-900">Générateur de Jours</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Sélectionnez les jours récurrents de formation pour cette session.</p>

                        <div className="space-y-2 mb-6">
                            {daysMap.map((day, index) => (
                                <label key={index} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer border border-transparent hover:border-gray-200">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 text-indigo-600 rounded mr-3"
                                        checked={selectedDays.includes(index)}
                                        onChange={() => toggleDay(index)}
                                    />
                                    <span className="text-gray-700 font-medium">{day}</span>
                                </label>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsGenModalOpen(false)} className="px-3 py-2 text-gray-600">Fermer</button>
                            <button onClick={handleGenerate} className="px-4 py-2 bg-indigo-600 text-white rounded font-bold shadow-sm">
                                Générer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionManager;
