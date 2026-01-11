import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../utils/api';
import { Layout, MoreVertical, Plus, Loader2 } from 'lucide-react';

const BoardView = () => {
    const { boardId } = useParams();
    const [boardData, setBoardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBoard();
    }, [boardId]);

    const fetchBoard = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/boards/${boardId}/`);
            setBoardData(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch board data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result) => {
        const { destination, source, draggableId, type } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        // Optimistic Update
        const newBoardData = { ...boardData };

        if (type === 'list') {
            const listId = draggableId.replace('list-', '');
            const newLists = Array.from(newBoardData.lists);
            const [removed] = newLists.splice(source.index, 1);
            newLists.splice(destination.index, 0, removed);

            // Update positions locally
            const updatedLists = newLists.map((list, index) => ({
                ...list,
                position: index
            }));

            setBoardData({ ...newBoardData, lists: updatedLists });

            // API Call for List move
            try {
                await api.patch(`/api/lists/${listId}/`, {
                    position: destination.index
                });
            } catch (err) {
                console.error('Failed to sync list move:', err);
                fetchBoard(); // Rollback
            }
            return;
        }

        // Card Move
        const cardId = draggableId.replace('card-', '');
        const sourceList = newBoardData.lists.find(l => `list-${l.id}` === source.droppableId);
        const destList = newBoardData.lists.find(l => `list-${l.id}` === destination.droppableId);

        if (!sourceList || !destList) return;

        const sourceCards = Array.from(sourceList.cards);
        const destCards = source.droppableId === destination.droppableId
            ? sourceCards
            : Array.from(destList.cards);

        const [movedCard] = sourceCards.splice(source.index, 1);

        if (source.droppableId === destination.droppableId) {
            sourceCards.splice(destination.index, 0, movedCard);
            // Update parent list cards
            const updatedLists = newBoardData.lists.map(l =>
                `list-${l.id}` === source.droppableId ? { ...l, cards: sourceCards } : l
            );
            setBoardData({ ...newBoardData, lists: updatedLists });
        } else {
            destCards.splice(destination.index, 0, movedCard);
            // Update both lists
            const updatedLists = newBoardData.lists.map(l => {
                if (`list-${l.id}` === source.droppableId) return { ...l, cards: sourceCards };
                if (`list-${l.id}` === destination.droppableId) return { ...l, cards: destCards };
                return l;
            });
            setBoardData({ ...newBoardData, lists: updatedLists });
        }

        // API Call for Card Move
        try {
            await api.patch(`/api/cards/${cardId}/`, {
                parent_list: destList.id,
                position: destination.index
            });
        } catch (err) {
            console.error('Failed to sync card move:', err);
            fetchBoard(); // Rollback on error
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (error || !boardData) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                <p className="text-xl bg-red-900/20 p-4 border border-red-500/50 rounded-xl">
                    {error || 'Board not found'}
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
            {/* Header */}
            <header className="h-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-2 rounded-lg">
                        <Layout className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">{boardData.name}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition duration-200">
                        <Plus className="w-4 h-4" /> Share
                    </button>
                </div>
            </header>

            {/* Main Board Area */}
            <main className="flex-1 overflow-x-auto p-6">
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="board" type="list" direction="horizontal">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="flex gap-6 h-full items-start"
                            >
                                {boardData.lists.map((list, index) => (
                                    <Draggable key={list.id} draggableId={`list-${list.id}`} index={index}>
                                        {(provided) => (
                                            <div
                                                {...provided.draggableProps}
                                                ref={provided.innerRef}
                                                className="w-80 flex-shrink-0 flex flex-col bg-gray-900/50 border border-gray-800 rounded-xl max-h-full"
                                            >
                                                {/* List Header */}
                                                <div
                                                    {...provided.dragHandleProps}
                                                    className="p-4 flex items-center justify-between cursor-grab active:cursor-grabbing"
                                                >
                                                    <h3 className="font-semibold text-gray-200">{list.title}</h3>
                                                    <MoreVertical className="w-4 h-4 text-gray-500 hover:text-gray-300 cursor-pointer" />
                                                </div>

                                                {/* Cards Droppable Area */}
                                                <Droppable droppableId={`list-${list.id}`} type="card">
                                                    {(provided, snapshot) => (
                                                        <div
                                                            {...provided.droppableProps}
                                                            ref={provided.innerRef}
                                                            className={`p-3 flex-1 overflow-y-auto min-h-[50px] transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-indigo-900/10' : ''
                                                                }`}
                                                        >
                                                            {list.cards.map((card, cardIndex) => (
                                                                <Draggable key={card.id} draggableId={`card-${card.id}`} index={cardIndex}>
                                                                    {(provided, snapshot) => (
                                                                        <div
                                                                            {...provided.draggableProps}
                                                                            {...provided.dragHandleProps}
                                                                            ref={provided.innerRef}
                                                                            className={`mb-3 p-4 bg-gray-800 border border-gray-700 rounded-lg shadow-sm hover:border-gray-600 transition-all duration-200 ${snapshot.isDragging ? 'shadow-2xl border-indigo-500 bg-gray-750 rotate-3 z-50' : ''
                                                                                }`}
                                                                        >
                                                                            <p className="text-sm text-gray-100 font-medium">{card.title}</p>
                                                                            {card.description && (
                                                                                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{card.description}</p>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            {provided.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>

                                                {/* List Footer */}
                                                <div className="p-3 border-t border-gray-800">
                                                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition duration-200">
                                                        <Plus className="w-4 h-4" /> Add a card
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}

                                {/* Add New List Button */}
                                <button className="w-80 flex-shrink-0 h-12 flex items-center gap-2 px-4 bg-gray-900/30 border border-dashed border-gray-700 rounded-xl text-gray-400 hover:text-white hover:bg-gray-900/50 hover:border-gray-600 transition duration-200">
                                    <Plus className="w-5 h-5" /> Add another list
                                </button>
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </main>
        </div>
    );
};

export default BoardView;
