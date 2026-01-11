import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Layout, Plus, LogOut, Loader2 } from 'lucide-react';

const Dashboard = () => {
    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <Layout className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Your Boards</h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition duration-200"
                    >
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </header>

                {error ? (
                    <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-2xl text-center text-red-200">
                        {error}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {boards.map(board => (
                            <Link
                                key={board.id}
                                to={`/board/${board.id}`}
                                className="group relative bg-gray-900 border border-gray-800 p-6 rounded-2xl hover:border-indigo-500/50 hover:bg-gray-800/50 transition-all duration-300 shadow-xl"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-semibold group-hover:text-indigo-400 transition-colors">{board.name}</h2>
                                    <div className="p-2 bg-gray-800 rounded-lg">
                                        <Layout className="w-4 h-4 text-gray-500" />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {board.lists?.length || 0} lists • Created {new Date(board.created_at).toLocaleDateString()}
                                </p>
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-b-2xl"></div>
                            </Link>
                        ))}

                        <button className="flex flex-col items-center justify-center p-6 bg-gray-900/30 border-2 border-dashed border-gray-800 rounded-2xl text-gray-500 hover:text-white hover:border-indigo-500/50 hover:bg-gray-900/50 transition-all duration-300 min-h-[160px]">
                            <div className="bg-gray-800 p-3 rounded-full mb-3">
                                <Plus className="w-6 h-6" />
                            </div>
                            <span className="font-medium">Create New Board</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
