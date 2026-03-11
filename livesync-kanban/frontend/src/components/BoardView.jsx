import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../utils/api';
import CardModal from './CardModal';
import { Layout, Plus, Loader2, Trash2, X, User, UserPlus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const BoardView = () => {
    const { boardId } = useParams();
    const [boardData, setBoardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // UI State for creation
    const [isAddingList, setIsAddingList] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');
    const [addingCardToListId, setAddingCardToListId] = useState(null);
    const [newCardTitle, setNewCardTitle] = useState('');

    // Member State
    const [members, setMembers] = useState([]);
    const [labels, setLabels] = useState([]);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteUsername, setInviteUsername] = useState('');
    const [inviteError, setInviteError] = useState(null);
    const [inviteSuccess, setInviteSuccess] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        const socket = new WebSocket(`ws://localhost:8000/ws/board/${boardId}/`);
        socketRef.current = socket;

        socket.onopen = () => console.log('WebSocket Connected');
        socket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'board_update') {
                fetchBoard();
                fetchMembers();
            }
        };

        return () => {
            if (socket.readyState === WebSocket.OPEN) socket.close();
        };
    }, [boardId]);

    useEffect(() => {
        fetchBoard();
        fetchMembers();
        fetchLabels();
        fetchCurrentUser();
    }, [boardId]);

    const fetchCurrentUser = async () => {
        try {
            const response = await api.get('/api/profile/');
            setCurrentUser(response.data.username);
        } catch (err) {
            console.error('Failed to fetch current user:', err);
        }
    };

    const fetchLabels = async () => {
        try {
            const response = await api.get(`/api/labels/`);
            const boardLabels = response.data.filter(l => l.board === parseInt(boardId));
            setLabels(boardLabels);
        } catch (err) {
            console.error('Failed to fetch labels', err);
        }
    };

    const fetchMembers = async () => {
        try {
            const response = await api.get(`/api/boards/${boardId}/members/`);
            setMembers(response.data);
        } catch (err) {
            console.error('Failed to fetch members:', err);
        }
    };

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

    const broadcastUpdate = () => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type: 'board_update' }));
        }
    };

    const handleAddList = async (e) => {
        e.preventDefault();
        if (!newListTitle.trim()) return;

        try {
            await api.post('/api/lists/', {
                title: newListTitle,
                board: boardId,
                position: boardData.lists.length
            });
            setNewListTitle('');
            setIsAddingList(false);
            fetchBoard();
            broadcastUpdate();
        } catch (err) {
            console.error('Failed to add list:', err);
        }
    };

    const handleDeleteList = async (e, listId) => {
        e.stopPropagation();
        if (!window.confirm('Delete this list and all its cards?')) return;

        try {
            await api.delete(`/api/lists/${listId}/`);
            fetchBoard();
            broadcastUpdate();
        } catch (err) {
            console.error('Failed to delete list:', err);
        }
    };

    const handleAddCard = async (e, listId) => {
        e.preventDefault();
        if (!newCardTitle.trim()) return;

        try {
            const list = boardData.lists.find(l => l.id === listId);
            await api.post('/api/cards/', {
                title: newCardTitle,
                parent_list: listId,
                position: list.cards.length
            });
            setNewCardTitle('');
            setAddingCardToListId(null);
            fetchBoard();
            broadcastUpdate();
        } catch (err) {
            console.error('Failed to add card:', err);
        }
    };

    const handleDeleteCard = async (e, cardId) => {
        e.stopPropagation();
        try {
            await api.delete(`/api/cards/${cardId}/`);
            fetchBoard();
            broadcastUpdate();
        } catch (err) {
            console.error('Failed to delete card:', err);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviteError(null);
        setInviteSuccess(null);

        try {
            await api.post(`/api/boards/${boardId}/invite/`, { username: inviteUsername });
            setInviteSuccess(`Successfully invited ${inviteUsername}!`);
            setInviteUsername('');
            fetchMembers();
            broadcastUpdate();
            setTimeout(() => {
                setIsInviteModalOpen(false);
                setInviteSuccess(null);
            }, 1500);
        } catch (err) {
            setInviteError(err.response?.data?.error || 'Failed to invite user');
        }
    };

    const onDragEnd = async (result) => {
        const { source, destination, type } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        if (type === 'list') {
            const newLists = Array.from(boardData.lists);
            const [movedList] = newLists.splice(source.index, 1);
            newLists.splice(destination.index, 0, movedList);
            setBoardData({ ...boardData, lists: newLists });

            try {
                await api.post(`/api/lists/${movedList.id}/move/`, { position: destination.index });
                fetchBoard();
                broadcastUpdate();
            } catch (err) {
                console.error('Failed to move list:', err);
                fetchBoard();
            }
        } else if (type === 'card') {
            const sourceListId = parseInt(source.droppableId);
            const destListId = parseInt(destination.droppableId);
            const newLists = boardData.lists.map(list => ({ ...list, cards: [...list.cards] }));
            const sourceList = newLists.find(l => l.id === sourceListId);
            const destList = newLists.find(l => l.id === destListId);
            const [movedCard] = sourceList.cards.splice(source.index, 1);

            if (sourceListId === destListId) {
                sourceList.cards.splice(destination.index, 0, movedCard);
            } else {
                destList.cards.splice(destination.index, 0, movedCard);
            }

            setBoardData({ ...boardData, lists: newLists });

            try {
                await api.post(`/api/cards/${movedCard.id}/move/`, {
                    list_id: destListId,
                    position: destination.index
                });
                fetchBoard();
                broadcastUpdate();
            } catch (err) {
                console.error('Failed to move card:', err);
                fetchBoard();
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                <div className="text-center animate-fade-in">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading board...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-6">
                <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8 max-w-md text-center animate-fade-in">
                    <p className="text-red-200">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100 flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-40 backdrop-blur-lg bg-gray-950/80 border-b border-gray-800/50">
                <div className="px-6 py-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Link
                                to="/dashboard"
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/80 rounded-xl transition-smooth"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                                <Layout className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-white">{boardData?.name}</h1>
                                <p className="text-xs text-gray-500">{boardData?.lists?.length || 0} lists • {members.length} members</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Member Avatars */}
                            <div className="flex items-center -space-x-2">
                                {members.slice(0, 4).map((member, idx) => (
                                    <div
                                        key={member.id}
                                        className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 border-2 border-gray-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm hover:scale-110 hover:z-10 transition-smooth cursor-default"
                                        title={member.username}
                                        style={{ zIndex: 10 - idx }}
                                    >
                                        {member.username.substring(0, 2).toUpperCase()}
                                    </div>
                                ))}
                                {members.length > 4 && (
                                    <div className="w-8 h-8 rounded-xl bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-[10px] font-bold text-gray-300">
                                        +{members.length - 4}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setIsInviteModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/20 transition-smooth"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span className="hidden sm:inline">Share</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Board Content */}
            <div className="flex-1 p-6 overflow-x-auto scrollbar-thin">
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="board" type="list" direction="horizontal">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="flex gap-5 pb-4 min-h-[calc(100vh-120px)]"
                            >
                                {boardData?.lists?.map((list, index) => (
                                    <Draggable key={list.id} draggableId={`list-${list.id}`} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`flex-shrink-0 w-72 transition-smooth ${snapshot.isDragging ? 'rotate-1 scale-[1.02]' : ''
                                                    }`}
                                            >
                                                <div className={`bg-gray-900/70 backdrop-blur-sm rounded-2xl border shadow-xl flex flex-col max-h-[calc(100vh-160px)] transition-smooth ${snapshot.isDragging ? 'border-indigo-500/50 shadow-indigo-500/10' : 'border-gray-800/60'
                                                    }`}>
                                                    {/* List Header */}
                                                    <div
                                                        {...provided.dragHandleProps}
                                                        className="px-4 py-3 border-b border-gray-800/50 flex justify-between items-center cursor-grab active:cursor-grabbing"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <h3 className="font-semibold text-gray-200 text-sm truncate">{list.title}</h3>
                                                            <span className="text-[10px] text-gray-500 bg-gray-800/80 px-1.5 py-0.5 rounded-md flex-shrink-0">
                                                                {list.cards?.length || 0}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => handleDeleteList(e, list.id)}
                                                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-fast opacity-0 hover:opacity-100 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>

                                                    {/* Cards Container */}
                                                    <Droppable droppableId={String(list.id)} type="card">
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.droppableProps}
                                                                className={`flex-1 p-2 overflow-y-auto scrollbar-thin min-h-[80px] transition-smooth ${snapshot.isDraggingOver ? 'bg-indigo-500/5' : ''
                                                                    }`}
                                                            >
                                                                {list.cards?.map((card, cardIndex) => (
                                                                    <Draggable key={card.id} draggableId={`card-${card.id}`} index={cardIndex}>
                                                                        {(provided, snapshot) => (
                                                                            <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                {...provided.dragHandleProps}
                                                                                onClick={() => setSelectedCard({ ...card, listId: list.id })}
                                                                                className={`group mb-2 p-3 bg-gray-800/80 border rounded-xl cursor-pointer transition-smooth ${snapshot.isDragging
                                                                                        ? 'shadow-xl border-indigo-500 bg-gray-800 rotate-2 scale-105 z-50'
                                                                                        : 'border-gray-700/50 hover:border-gray-600 hover:bg-gray-800 hover:shadow-lg'
                                                                                    }`}
                                                                            >
                                                                                {/* Labels */}
                                                                                {card.labels?.length > 0 && (
                                                                                    <div className="flex flex-wrap gap-1 mb-2">
                                                                                        {card.labels.map(label => (
                                                                                            <div
                                                                                                key={label.id}
                                                                                                className="h-1.5 w-8 rounded-full"
                                                                                                style={{ backgroundColor: label.color }}
                                                                                                title={label.name}
                                                                                            />
                                                                                        ))}
                                                                                    </div>
                                                                                )}

                                                                                <div className="flex justify-between items-start gap-2">
                                                                                    <p className="text-sm text-gray-200 font-medium flex-1 leading-snug">{card.title}</p>
                                                                                    <button
                                                                                        onClick={(e) => handleDeleteCard(e, card.id)}
                                                                                        className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-fast rounded"
                                                                                    >
                                                                                        <Trash2 className="w-3 h-3" />
                                                                                    </button>
                                                                                </div>

                                                                                {/* Footer */}
                                                                                {(card.due_date || card.assigned_to) && (
                                                                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/30">
                                                                                        {card.due_date && (
                                                                                            <div className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${new Date(card.due_date) < new Date() && list.title !== 'Done'
                                                                                                    ? 'bg-red-900/50 text-red-300'
                                                                                                    : 'text-gray-500'
                                                                                                }`}>
                                                                                                {new Date(card.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                                            </div>
                                                                                        )}
                                                                                        {card.assigned_to && (
                                                                                            <div
                                                                                                className="ml-auto w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[8px] text-white font-bold"
                                                                                                title={card.assigned_to.username}
                                                                                            >
                                                                                                {card.assigned_to.username.substring(0, 2).toUpperCase()}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                ))}
                                                                {provided.placeholder}

                                                                {/* Add Card */}
                                                                {addingCardToListId === list.id ? (
                                                                    <form onSubmit={(e) => handleAddCard(e, list.id)} className="p-1">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Enter card title..."
                                                                            value={newCardTitle}
                                                                            onChange={(e) => setNewCardTitle(e.target.value)}
                                                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                                                                            autoFocus
                                                                        />
                                                                        <div className="flex gap-2 mt-2">
                                                                            <button type="submit" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-fast">Add</button>
                                                                            <button type="button" onClick={() => { setAddingCardToListId(null); setNewCardTitle(''); }} className="px-3 py-1.5 text-gray-400 hover:text-white text-xs transition-fast">Cancel</button>
                                                                        </div>
                                                                    </form>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => setAddingCardToListId(list.id)}
                                                                        className="w-full mt-1 px-3 py-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 rounded-lg text-xs font-medium transition-fast flex items-center gap-1.5"
                                                                    >
                                                                        <Plus className="w-3.5 h-3.5" /> Add card
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </Droppable>
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}

                                {/* Add List */}
                                {isAddingList ? (
                                    <div className="flex-shrink-0 w-72">
                                        <form onSubmit={handleAddList} className="bg-gray-900/70 backdrop-blur-sm rounded-2xl border border-indigo-500/50 p-4">
                                            <input
                                                type="text"
                                                placeholder="Enter list title..."
                                                value={newListTitle}
                                                onChange={(e) => setNewListTitle(e.target.value)}
                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                                                autoFocus
                                            />
                                            <div className="flex gap-2 mt-3">
                                                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-fast">Add</button>
                                                <button type="button" onClick={() => { setIsAddingList(false); setNewListTitle(''); }} className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-fast">Cancel</button>
                                            </div>
                                        </form>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsAddingList(true)}
                                        className="flex-shrink-0 w-72 h-fit px-4 py-3 bg-gray-900/40 hover:bg-gray-900/60 backdrop-blur-sm border-2 border-dashed border-gray-700/50 hover:border-gray-600 rounded-2xl text-gray-500 hover:text-gray-300 text-sm font-medium transition-smooth flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Add list
                                    </button>
                                )}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-800 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-white">Invite Member</h2>
                            <button onClick={() => setIsInviteModalOpen(false)} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-fast">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleInvite} className="p-5 space-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-400 block mb-2">Username</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        required
                                        value={inviteUsername}
                                        onChange={(e) => setInviteUsername(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 transition-smooth"
                                        placeholder="Enter username"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            {inviteError && <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-xs">{inviteError}</div>}
                            {inviteSuccess && <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 text-green-300 text-xs">{inviteSuccess}</div>}
                            <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-500/20 transition-smooth">
                                Send Invitation
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Card Modal */}
            {selectedCard && (
                <CardModal
                    card={selectedCard}
                    listId={selectedCard.listId}
                    members={members}
                    allLabels={labels}
                    boardOwner={boardData?.owner_username}
                    currentUser={currentUser}
                    onClose={() => setSelectedCard(null)}
                    onUpdate={() => {
                        fetchBoard();
                        broadcastUpdate();
                        fetchLabels();
                    }}
                />
            )}
        </div>
    );
};

export default BoardView;
