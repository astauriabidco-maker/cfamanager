import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { Upload, FileText, User, MoreHorizontal, FilePlus } from 'lucide-react';
import recruitmentService from '../services/recruitmentService';
import type { Candidat } from '../services/recruitmentService';

const COLUMNS = {
    NOUVEAU: 'Nouveaux',
    ADMISSIBLE: 'Admissibles',
    ENTRETIEN: 'Entretiens',
    PLACE: 'Placés'
};

const Recrutement = () => {
    const [candidats, setCandidats] = useState<Candidat[]>([]);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadCandidats();
    }, []);

    const loadCandidats = async () => {
        try {
            console.log('Fetching candidats...');
            const data = await recruitmentService.fetchCandidats();
            console.log('Candidats received:', data);

            if (Array.isArray(data)) {
                console.log('First candidate status:', data[0]?.statut);
                setCandidats(data);
            } else {
                console.error('Data is not an array:', data);
            }
        } catch (error) {
            console.error('Erreur chargement candidats', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        const newStatus = destination.droppableId;
        const candidatId = parseInt(draggableId);

        // Optimistic Update
        const oldCandidats = [...candidats];

        setCandidats(prev => prev.map(c => {
            if (c.id === candidatId) {
                return { ...c, statut: newStatus as any };
            }
            return c;
        }));

        try {
            await recruitmentService.updateStatus(candidatId, newStatus);
        } catch (error) {
            console.error("Failed to update status", error);
            // Rollback
            setCandidats(oldCandidats);
            alert("Erreur lors de la mise à jour du statut");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                setLoading(true);
                const newCandidat = await recruitmentService.uploadCV(file);
                // Add new candidate to list (Optimistic UI usually, but here we wait for result as it parses data)
                setCandidats(prev => [newCandidat, ...prev]);
            } catch (error) {
                console.error("Upload failed", error);
                alert("Erreur lors de l'upload du CV");
            } finally {
                setLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    const getCandidatsByStatus = (status: string) => {
        return candidats.filter(c => c.statut === status);
    };

    if (loading && candidats.length === 0) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Recrutement</h1>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf"
                        onChange={handleFileUpload}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                    >
                        <FilePlus className="w-4 h-4 mr-2" />
                        Ajouter un CV
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="flex h-full space-x-4 min-w-[1000px]">
                        {Object.entries(COLUMNS).map(([statusKey, statusLabel]) => (
                            <Droppable key={statusKey} droppableId={statusKey}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex-1 bg-gray-100 rounded-xl p-4 flex flex-col min-w-[250px] ${snapshot.isDraggingOver ? 'bg-blue-50 ring-2 ring-blue-200' : ''}`}
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-semibold text-gray-700">{statusLabel}</h3>
                                            <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
                                                {getCandidatsByStatus(statusKey).length}
                                            </span>
                                        </div>

                                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                                            {getCandidatsByStatus(statusKey).map((candidat, index) => (
                                                <Draggable
                                                    key={candidat.id}
                                                    draggableId={candidat.id.toString()}
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group ${snapshot.isDragging ? 'rotate-2 shadow-xl opacity-90' : ''}`}
                                                            style={{ ...provided.draggableProps.style }}
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-center">
                                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-3">
                                                                        {candidat.first_name[0]}{candidat.last_name[0]}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-medium text-gray-800 text-sm">{candidat.first_name} {candidat.last_name}</h4>
                                                                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{candidat.email || 'Pas d\'email'}</p>
                                                                    </div>
                                                                </div>
                                                                {candidat.cv_filename && (
                                                                    <FileText className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        ))}
                    </div>
                </DragDropContext>
            </div>
        </div>
    );
};

export default Recrutement;
