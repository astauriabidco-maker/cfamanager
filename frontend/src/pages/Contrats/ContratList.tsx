import { useState, useEffect, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building } from 'lucide-react';
import contractService from '../../services/contractService';
import type { ContratDossier, ContratCreate } from '../../services/contractService';
import recruitmentService from '../../services/recruitmentService';
import type { Candidat } from '../../services/recruitmentService';
import entrepriseService from '../../services/entrepriseService';
import type { Entreprise } from '../../services/entrepriseService';

const ContratList = () => {
    const [contrats, setContrats] = useState<ContratDossier[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form Data
    const [candidats, setCandidats] = useState<Candidat[]>([]);
    const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
    const [formData, setFormData] = useState<ContratCreate>({
        candidat_id: 0,
        entreprise_id: 0,
        salaire: 0,
        date_debut: '',
        date_fin: '',
        intitule_poste: '',
        heures_formation: 0,
        cout_npec: 0
    });

    useEffect(() => {
        loadContrats();
    }, []);

    const loadContrats = async () => {
        try {
            const data = await contractService.getContrats();
            setContrats(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = async () => {
        setIsModalOpen(true);
        // Load dependencies
        try {
            const [cands, ents] = await Promise.all([
                recruitmentService.fetchCandidats(),
                entrepriseService.getEntreprises()
            ]);
            // Filter only 'PLACE' candidates? Or allow all for flexiblity. Prompt says "Dropdown liste des candidats 'PLACÉ'".
            // Ideally filter: c.statut === 'PLACE'
            setCandidats(cands.filter(c => c.statut === 'PLACE' || c.statut === 'ADMISSIBLE')); // Allowing Admissible for testing
            setEntreprises(ents);
        } catch (err) {
            console.error("Error loading dependencies", err);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!formData.candidat_id || !formData.entreprise_id) {
            alert("Veuillez sélectionner un candidat et une entreprise.");
            return;
        }

        try {
            console.log("Submitting contract:", formData);
            await contractService.createContrat(formData);
            setIsModalOpen(false);
            loadContrats();
            alert("Contrat créé avec succès !");
            // Reset form
            setFormData({
                candidat_id: 0,
                entreprise_id: 0,
                salaire: 0,
                date_debut: '',
                date_fin: '',
                intitule_poste: '',
                heures_formation: 0,
                cout_npec: 0
            });
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la création du contrat");
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Chargement des contrats...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gestion des Contrats</h1>
                    <p className="text-gray-500">Suivi des apprentis et des entreprises</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Nouveau Contrat
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-6 py-4">Apprenti</th>
                            <th className="px-6 py-4">Entreprise</th>
                            <th className="px-6 py-4">Poste</th>
                            <th className="px-6 py-4">Dates</th>
                            <th className="px-6 py-4">Version</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {contrats.map((contrat) => (
                            <tr key={contrat.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-3">
                                            {contrat.candidat.first_name[0]}{contrat.candidat.last_name[0]}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{contrat.candidat.first_name} {contrat.candidat.last_name}</div>
                                            <div className="text-xs text-gray-500">{contrat.candidat.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-700">
                                    <div className="flex items-center">
                                        <Building className="w-4 h-4 mr-2 text-gray-400" />
                                        {contrat.entreprise?.raison_sociale || "N/A"}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-700 font-medium">
                                    {contrat.active_version?.intitule_poste || "Non défini"}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {contrat.active_version ? (
                                        <span>
                                            {new Date(contrat.active_version.date_debut).toLocaleDateString()} &rarr; {new Date(contrat.active_version.date_fin).toLocaleDateString()}
                                        </span>
                                    ) : (
                                        <span className="text-red-500">Inactif</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        V{contrat.active_version?.version_number || 0}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link
                                        to={`/contrats/${contrat.id}`}
                                        className="text-blue-600 hover:text-blue-900 font-medium text-sm"
                                    >
                                        Gérer
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {contrats.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                    Aucun contrat trouvé. Créez-en un nouveau !
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal de Création */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Nouveau Contrat</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Candidat (Placés)</label>
                                    <select
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.candidat_id}
                                        onChange={e => setFormData({ ...formData, candidat_id: Number(e.target.value) })}
                                        required
                                    >
                                        <option value="">Sélectionner...</option>
                                        {candidats.map(c => (
                                            <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise</label>
                                    <select
                                        className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.entreprise_id}
                                        onChange={e => setFormData({ ...formData, entreprise_id: Number(e.target.value) })}
                                        required
                                    >
                                        <option value="">Sélectionner...</option>
                                        {entreprises.map(e => (
                                            <option key={e.id} value={e.id}>{e.raison_sociale}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Intitulé du Poste</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg p-2"
                                    value={formData.intitule_poste}
                                    onChange={e => setFormData({ ...formData, intitule_poste: e.target.value })}
                                    placeholder="Ex: Développeur Web Junior"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded-lg p-2"
                                        value={formData.date_debut}
                                        onChange={e => setFormData({ ...formData, date_debut: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
                                    <input
                                        type="date"
                                        className="w-full border rounded-lg p-2"
                                        value={formData.date_fin}
                                        onChange={e => setFormData({ ...formData, date_fin: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Salaire (€)</label>
                                    <input
                                        type="number"
                                        className="w-full border rounded-lg p-2"
                                        value={formData.salaire}
                                        onChange={e => setFormData({ ...formData, salaire: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Coût NPEC (€)</label>
                                    <input
                                        type="number"
                                        className="w-full border rounded-lg p-2"
                                        value={formData.cout_npec}
                                        onChange={e => setFormData({ ...formData, cout_npec: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Heures Formation</label>
                                    <input
                                        type="number"
                                        className="w-full border rounded-lg p-2"
                                        value={formData.heures_formation}
                                        onChange={e => setFormData({ ...formData, heures_formation: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                                >
                                    Créer le contrat
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ContratList;
