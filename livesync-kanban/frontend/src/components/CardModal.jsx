import React, { useState, useEffect } from 'react';
import { X, Activity, User as UserIcon, Calendar, Tag, Plus, Check, MessageSquare, Send, Loader2 } from 'lucide-react';
import api from '../utils/api';

const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const CardModal = ({ card, listId, members, allLabels, boardOwner, currentUser, onClose, onUpdate }) => {
    const [title, setTitle] = useState(card.title);
    const [description, setDescription] = useState(card.description || '');
    const [comments, setComments] = useState([]);
    const [activities, setActivities] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [activeTab, setActiveTab] = useState('comments');
    const [isSaving, setIsSaving] = useState(false);

    // New Fields State
    const [assignedTo, setAssignedTo] = useState(card.assigned_to ? String(card.assigned_to.id) : '');
    const [selectedLabels, setSelectedLabels] = useState(card.labels ? card.labels.map(l => l.id) : []);
    const [dueDate, setDueDate] = useState(card.due_date ? card.due_date.split('T')[0] : '');

    // Label Creation State
    const [isCreatingLabel, setIsCreatingLabel] = useState(false);

    // Check if current user is owner
    const isOwner = boardOwner && currentUser && boardOwner === currentUser;

    useEffect(() => {
        fetchDetails();
    }, [card.id]);

    const fetchDetails = async () => {
        try {
            const commentsRes = await api.get(`/api/comments/?card_id=${card.id}`);
            setComments(commentsRes.data);
        } catch (err) {
            console.error('Failed to fetch comments', err);
        }

        try {
            const activityRes = await api.get(`/api/activity/?object_id=${card.id}`);
            setActivities(activityRes.data);
        } catch (err) {
            console.error('Failed to fetch activity', err);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                title,
                description,
                assigned_to_id: assignedTo ? parseInt(assignedTo) : null,
                label_ids: selectedLabels,
                due_date: dueDate ? `${dueDate}T00:00:00Z` : null
            };

            await api.patch(`/api/cards/${card.id}/`, payload);
            onUpdate();
            onClose();
        } catch (err) {
            console.error('Failed to update card', err);
            alert('Failed to save changes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            const res = await api.post('/api/comments/', { card: card.id, content: newComment });
            setComments([...comments, res.data]);
            setNewComment('');
        } catch (err) {
            console.error('Failed to add comment', err);
        }
    };

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div
                className="bg-gray-900 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col md:flex-row max-h-[90vh] overflow-hidden border border-gray-800"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Main Content (Left) */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-800 flex justify-between items-start bg-gray-900/80">
                        <div className="flex-1 mr-4">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-transparent text-xl font-semibold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded-lg px-2 py-1 w-full -ml-2 hover:bg-gray-800/50 transition-smooth"
                                placeholder="Card title..."
                            />
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-smooth md:hidden"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                        <div className="p-6 space-y-6">
                            {/* Description */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Add a more detailed description..."
                                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-gray-200 min-h-[120px] focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 resize-y placeholder-gray-500 text-sm transition-smooth"
                                />
                            </div>

                            {/* Tabs */}
                            <div className="flex items-center gap-1 border-b border-gray-800">
                                <button
                                    onClick={() => setActiveTab('comments')}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-smooth relative ${activeTab === 'comments'
                                            ? 'text-white'
                                            : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Comments
                                    {comments.length > 0 && (
                                        <span className="bg-gray-700 text-gray-300 text-xs px-1.5 py-0.5 rounded-full">
                                            {comments.length}
                                        </span>
                                    )}
                                    {activeTab === 'comments' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('activity')}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-smooth relative ${activeTab === 'activity'
                                            ? 'text-white'
                                            : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    <Activity className="w-4 h-4" />
                                    Activity
                                    {activeTab === 'activity' && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                                    )}
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="min-h-[200px]">
                                {activeTab === 'comments' ? (
                                    <div className="space-y-4">
                                        {/* Add Comment */}
                                        <form onSubmit={handleAddComment} className="flex gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                                ME
                                            </div>
                                            <div className="flex-1 flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    placeholder="Write a comment..."
                                                    className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-2.5 text-gray-200 text-sm focus:outline-none focus:border-indigo-500/50 placeholder-gray-500 transition-smooth"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!newComment.trim()}
                                                    className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-smooth"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </form>

                                        {/* Comments List */}
                                        {comments.length === 0 ? (
                                            <p className="text-gray-500 text-sm text-center py-8">No comments yet. Be the first to comment!</p>
                                        ) : (
                                            comments.map(comment => (
                                                <div key={comment.id} className="flex gap-3 animate-fade-in">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0">
                                                        {comment.user.username.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-baseline gap-2 flex-wrap">
                                                            <span className="font-medium text-gray-200 text-sm">{comment.user.username}</span>
                                                            <span className="text-xs text-gray-500">{timeAgo(comment.created_at)}</span>
                                                        </div>
                                                        <p className="text-gray-300 mt-1 text-sm leading-relaxed">{comment.content}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {activities.length === 0 ? (
                                            <p className="text-gray-500 text-sm text-center py-8">No activity yet.</p>
                                        ) : (
                                            activities.map(log => (
                                                <div key={log.id} className="flex gap-3 items-start py-2 animate-fade-in">
                                                    <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <Activity className="w-3 h-3 text-gray-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-gray-300 text-sm">
                                                            <span className="font-medium text-gray-200">{log.user.username}</span>
                                                            {' '}{log.action}
                                                        </p>
                                                        <span className="text-xs text-gray-500">{timeAgo(log.timestamp)}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar (Right) */}
                <div className="w-full md:w-72 bg-gray-850 border-t md:border-t-0 md:border-l border-gray-800 p-5 flex flex-col gap-5 overflow-y-auto scrollbar-thin">
                    <div className="hidden md:flex justify-end">
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-smooth"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-smooth flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>

                    <div className="space-y-5">
                        {/* Assignee */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                                <UserIcon className="w-3.5 h-3.5" />
                                Assignee
                                {!isOwner && <span className="text-[10px] text-yellow-500 normal-case">(Owner Only)</span>}
                            </label>
                            <select
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                disabled={!isOwner}
                                className={`w-full bg-gray-800/80 border border-gray-700/50 text-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 transition-smooth ${!isOwner ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                    }`}
                            >
                                <option value="">Unassigned</option>
                                {members.map(member => (
                                    <option key={member.user} value={member.user}>
                                        {member.username}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-2">
                                <Calendar className="w-3.5 h-3.5" /> Due Date
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full bg-gray-800/80 border border-gray-700/50 text-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 transition-smooth cursor-pointer"
                            />
                        </div>

                        {/* Labels */}
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2 mb-3">
                                <Tag className="w-3.5 h-3.5" /> Labels
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {allLabels.length === 0 ? (
                                    <p className="text-gray-500 text-xs">No labels created yet</p>
                                ) : (
                                    allLabels.map(label => {
                                        const isSelected = selectedLabels.includes(label.id);
                                        return (
                                            <button
                                                key={label.id}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedLabels(selectedLabels.filter(id => id !== label.id));
                                                    } else {
                                                        setSelectedLabels([...selectedLabels, label.id]);
                                                    }
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-smooth flex items-center gap-1.5 ${isSelected
                                                        ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900'
                                                        : 'opacity-60 hover:opacity-100'
                                                    }`}
                                                style={{ backgroundColor: label.color, color: '#fff' }}
                                            >
                                                {label.name}
                                                {isSelected && <Check className="w-3 h-3" />}
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            {/* Create Label */}
                            {!isCreatingLabel ? (
                                <button
                                    onClick={() => setIsCreatingLabel(true)}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-smooth"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Create new label
                                </button>
                            ) : (
                                <LabelCreator
                                    onCancel={() => setIsCreatingLabel(false)}
                                    onCreate={() => {
                                        setIsCreatingLabel(false);
                                        onUpdate();
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Label Creator Component
const LabelCreator = ({ onCancel, onCreate }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#6366F1');
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];

    const handleCreate = async () => {
        const path = window.location.pathname;
        const parts = path.split('/');
        const boardId = parts[2];

        if (name.trim() && boardId) {
            try {
                await api.post('/api/labels/', { board: boardId, name, color });
                onCreate();
            } catch (e) {
                console.error(e);
            }
        }
    };

    return (
        <div className="bg-gray-800/80 border border-gray-700/50 p-3 rounded-xl space-y-3 animate-fade-in">
            <input
                type="text"
                placeholder="Label name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-700/50 text-gray-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500/50 placeholder-gray-500"
                autoFocus
            />
            <div className="flex gap-1.5">
                {colors.map(c => (
                    <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-lg transition-smooth ${color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>
            <div className="flex justify-end gap-2">
                <button
                    onClick={onCancel}
                    className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-smooth"
                >
                    Cancel
                </button>
                <button
                    onClick={handleCreate}
                    disabled={!name.trim()}
                    className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-smooth"
                >
                    Create
                </button>
            </div>
        </div>
    );
};

export default CardModal;
