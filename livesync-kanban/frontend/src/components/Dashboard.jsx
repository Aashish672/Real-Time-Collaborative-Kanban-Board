import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Layout, Plus, LogOut, Loader2, Trash2, User, Calendar, Layers } from 'lucide-react';

const Dashboard = () => {
    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newBoardName, setNewBoardName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBoards();
    }, []);

    const fetchBoards = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/boards/');
            setBoards(response.data);
        } catch (err) {
            setError('Failed to load boards. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBoard = async (e) => {
        e.preventDefault();
        if (!newBoardName.trim()) return;

        try {
            const response = await api.post('/api/boards/', { name: newBoardName });
            setBoards([...boards, response.data]);
            setNewBoardName('');
            setIsCreating(false);
        } catch (err) {
            console.error('Failed to create board:', err);
            setError('Failed to create board.');
        }
    };

    const handleDeleteBoard = async (e, boardId) => {
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this board?')) return;

        try {
            await api.delete(`/api/boards/${boardId}/`);
            setBoards(boards.filter(b => b.id !== boardId));
        } catch (err) {
            console.error('Failed to delete board:', err);
            setError('Failed to delete board.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        navigate('/login');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                <div className="text-center animate-fade-in">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading your boards...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100">
            {/* Header */}
            <header className="sticky top-0 z-40 backdrop-blur-lg bg-gray-950/80 border-b border-gray-800/50">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                                <Layout className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Your Boards</h1>
                                <p className="text-xs text-gray-500">{boards.length} board{boards.length !== 1 ? 's' : ''}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                to="/profile"
                                className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800/80 rounded-xl transition-smooth"
                                title="Profile"
                            >
                                <User className="w-5 h-5" />
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800/80 rounded-xl transition-smooth"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline text-sm font-medium">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-8">
                {error && (
                    <div className="mb-6 bg-red-900/20 border border-red-500/30 px-4 py-3 rounded-xl text-red-300 text-sm animate-fade-in">
                        {error}
                    </div>
                )}

                {/* Empty State */}
                {boards.length === 0 && !isCreating ? (
                    <div className="text-center py-20 animate-fade-in">
                        <div className="w-20 h-20 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Layers className="w-10 h-10 text-gray-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-300 mb-2">No boards yet</h2>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                            Create your first board to start organizing your tasks and projects.
                        </p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-smooth shadow-lg shadow-indigo-500/20"
                        >
                            <Plus className="w-5 h-5" />
                            Create First Board
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {boards.map((board, index) => (
                            <Link
                                key={board.id}
                                to={`/board/${board.id}`}
                                className="group relative bg-gray-900/60 border border-gray-800/80 p-5 rounded-2xl hover:border-indigo-500/40 hover:bg-gray-850/80 transition-smooth hover:shadow-xl hover:shadow-indigo-500/5 animate-fade-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Gradient Accent */}
                                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-2xl opacity-0 group-hover:opacity-100 transition-smooth" />

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-lg font-semibold text-gray-100 group-hover:text-white transition-smooth truncate pr-2">
                                            {board.name}
                                        </h2>
                                    </div>
                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-smooth">
                                        <button
                                            onClick={(e) => handleDeleteBoard(e, board.id)}
                                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-fast"
                                            title="Delete board"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                        <Layers className="w-3.5 h-3.5" />
                                        <span>{board.lists?.length || 0} lists</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{formatDate(board.created_at)}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {/* Create Board Card */}
                        {isCreating ? (
                            <form
                                onSubmit={handleCreateBoard}
                                className="flex flex-col p-5 bg-gray-900/60 border-2 border-indigo-500/50 rounded-2xl shadow-xl animate-fade-in"
                            >
                                <h3 className="text-sm font-semibold text-gray-300 mb-3">New Board</h3>
                                <input
                                    type="text"
                                    placeholder="Enter board name..."
                                    className="bg-gray-800/80 border border-gray-700 text-white rounded-xl px-4 py-3 mb-4 focus:border-indigo-500 placeholder-gray-500 text-sm"
                                    value={newBoardName}
                                    onChange={(e) => setNewBoardName(e.target.value)}
                                    autoFocus
                                />
                                <div className="flex gap-2 justify-end mt-auto">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCreating(false);
                                            setNewBoardName('');
                                        }}
                                        className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium transition-fast"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newBoardName.trim()}
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-fast"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="flex flex-col items-center justify-center p-5 bg-gray-900/30 border-2 border-dashed border-gray-800 rounded-2xl text-gray-500 hover:text-gray-300 hover:border-gray-700 hover:bg-gray-900/50 transition-smooth min-h-[144px] group"
                            >
                                <div className="w-12 h-12 bg-gray-800/80 group-hover:bg-gray-800 rounded-xl flex items-center justify-center mb-3 transition-smooth">
                                    <Plus className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-medium">Create New Board</span>
                            </button>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
