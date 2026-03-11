import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { User, Mail, Calendar, Layout, Award, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/api/profile/');
                setProfile(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
                <div className="text-center animate-fade-in">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-6">
                <div className="text-center animate-fade-in">
                    <div className="w-16 h-16 bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-red-400" />
                    </div>
                    <p className="text-gray-300 mb-4">Failed to load profile</p>
                    <Link to="/dashboard" className="text-indigo-400 hover:text-indigo-300 text-sm">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100">
            {/* Header */}
            <header className="sticky top-0 z-40 backdrop-blur-lg bg-gray-950/80 border-b border-gray-800/50">
                <div className="max-w-3xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <Link
                            to="/dashboard"
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-smooth"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">Back to Dashboard</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-6 py-10">
                {/* Profile Header Card */}
                <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-8 mb-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-indigo-500/20">
                                {profile.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-gray-900 rounded-full" title="Online" />
                        </div>

                        {/* Info */}
                        <div className="text-center sm:text-left flex-1">
                            <h1 className="text-2xl font-bold text-white mb-1">{profile.username}</h1>
                            <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-400">
                                <Mail className="w-4 h-4" />
                                <span className="text-sm">{profile.email}</span>
                            </div>
                            <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-500 mt-2">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm">Joined {formatDate(profile.date_joined)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
                    {/* Total Boards */}
                    <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 group hover:border-indigo-500/30 transition-smooth">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/20 transition-smooth">
                                <Layout className="w-5 h-5 text-indigo-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-400">Total Boards</span>
                        </div>
                        <p className="text-4xl font-bold text-white">{profile.boards_count}</p>
                        <p className="text-xs text-gray-500 mt-1">boards you're a member of</p>
                    </div>

                    {/* Owned Boards */}
                    <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 group hover:border-green-500/30 transition-smooth">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center group-hover:bg-green-500/20 transition-smooth">
                                <Award className="w-5 h-5 text-green-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-400">Owned Boards</span>
                        </div>
                        <p className="text-4xl font-bold text-white">{profile.owned_boards_count}</p>
                        <p className="text-xs text-gray-500 mt-1">boards you created</p>
                    </div>
                </div>

                {/* Account Section */}
                <div className="mt-6 bg-gray-900/60 border border-gray-800/80 rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Account Details</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-800/50">
                            <span className="text-gray-400 text-sm">Username</span>
                            <span className="text-white font-medium">{profile.username}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-800/50">
                            <span className="text-gray-400 text-sm">Email</span>
                            <span className="text-white font-medium">{profile.email}</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                            <span className="text-gray-400 text-sm">Member Since</span>
                            <span className="text-white font-medium">{formatDate(profile.date_joined)}</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
