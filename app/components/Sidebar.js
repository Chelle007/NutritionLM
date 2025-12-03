"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X, Plus, FileText, User, Import, ChevronDown, ChevronUp, Trash2, MessageSquare, Library } from 'lucide-react';
import { createBrowserClient } from "@supabase/ssr";
import {
    COLOR_SECONDARY_LIGHT,
    COLOR_ACCENT_DARK,
    COLOR_CONTENT_BG
} from '../constants/colors';
import Image from 'next/image';

export default function Sidebar({
    isSidebarOpen,
    setIsSidebarOpen,
    isMobile,
    sources = [],
    telegramPhotos = [],
    setAttachment = { setAttachment },
    onOpenProfile,
    onSourceUpload,
    onSourceDelete,
    chatSessions = [],
    currentChatSessionId = null,
    onChatSessionSelect = null,
    onNewChat = null,
    onDeleteChatSession = null
}) {
    const [userFullName, setUserFullName] = useState('User');
    const [isExpanded, setIsExpanded] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [viewMode, setViewMode] = useState('library'); // 'library' or 'chat'
    const [deletingChatId, setDeletingChatId] = useState(null);
    const fileInputRef = useRef(null); 

    async function urlToFile(url) {
        const response = await fetch(url);
        const blob = await response.blob();
        return new File([blob], "telegram-photo.jpg", { type: blob.type });
    }

    useEffect(() => {
        async function loadUser() {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
                process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ""
            );

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from("users")
                .select("full_name")
                .eq("id", user.id)
                .single();

            if (data?.full_name) {
                setUserFullName(data.full_name);
            }
        }
        loadUser();
    }, []);

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const fileExtension = file.name.split('.').pop()?.toUpperCase() || '';
        const allowedTypes = ['PDF', 'DOCX', 'DOC', 'TXT', 'TEXT'];
        if (!allowedTypes.includes(fileExtension)) {
            alert(`File type not supported. Allowed types: ${allowedTypes.join(', ')}`);
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size exceeds 10MB limit');
            return;
        }

        setIsUploading(true);
        try {
            if (onSourceUpload) {
                await onSourceUpload(file);
            }
        } catch (error) {
            console.error('Error uploading source:', error);
            const errorMessage = error?.message || 'Failed to upload source. Please try again.';
            alert(errorMessage);
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeleteSource = async (sourceId, e) => {
        e.stopPropagation(); // Prevent any parent click handlers
        
        if (!confirm('Are you sure you want to delete this source?')) {
            return;
        }

        setDeletingId(sourceId);
        try {
            if (onSourceDelete) {
                await onSourceDelete(sourceId);
            }
        } catch (error) {
            console.error('Error deleting source:', error);
            alert('Failed to delete source. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Added today';
        if (diffDays === 2) return 'Added yesterday';
        if (diffDays <= 7) return `Added ${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    const formatChatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleDeleteChatSession = async (sessionId, e) => {
        e.stopPropagation();
        
        if (!confirm('Are you sure you want to delete this chat?')) {
            return;
        }

        setDeletingChatId(sessionId);
        try {
            if (onDeleteChatSession) {
                await onDeleteChatSession(sessionId);
            }
        } catch (error) {
            console.error('Error deleting chat session:', error);
            alert('Failed to delete chat. Please try again.');
        } finally {
            setDeletingChatId(null);
        }
    };

    return (
        <>
            <div
                className={`${isMobile ? 'w-80' : (isSidebarOpen ? 'w-80' : 'w-16')}
                transition-all duration-300 ease-in-out md:border-r md:border-gray-200 flex flex-col shrink-0
                fixed md:relative inset-y-0 left-0 z-40 md:z-auto overflow-hidden`}
                style={{
                    backgroundColor: COLOR_ACCENT_DARK,
                    transform: isMobile
                        ? (isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)')
                        : 'translateX(0)',
                    pointerEvents: isMobile && !isSidebarOpen ? 'none' : 'auto'
                }}
            >
                <div className={`h-16 flex ${!isMobile && !isSidebarOpen ? 'justify-center' : 'justify-between'} items-center ${isMobile ? 'px-4' : (isSidebarOpen ? 'pl-4 pr-4' : 'px-4')} ${isMobile ? 'transition-opacity duration-300' : ''} ${isSidebarOpen ? 'opacity-100' : (isMobile ? 'opacity-0' : 'opacity-100')}`}>
                    {(!isMobile && !isSidebarOpen) ? (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    ) : (
                        <>
                            {/* VIEW MODE TOGGLE */}
                            <div className="flex gap-1 p-1 rounded-lg bg-white/10">
                                <button
                                    onClick={() => setViewMode('library')}
                                    className={`flex items-center justify-center gap-2 px-6 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                        viewMode === 'library'
                                            ? 'bg-white text-gray-900'
                                            : 'text-gray-300 hover:text-white'
                                    }`}
                                >
                                    <Library className="w-4 h-4" />
                                    <span>Library</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('chat')}
                                    className={`flex items-center justify-center gap-2 px-6 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                        viewMode === 'chat'
                                            ? 'bg-white text-gray-900'
                                            : 'text-gray-300 hover:text-white'
                                    }`}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    <span>Chats</span>
                                </button>
                            </div>
                            
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>

                {/* CONTENT */}
                {(!isMobile && !isSidebarOpen) ? (
                    <div className="flex-1"></div>
                ) : (
                    <div className="p-4 flex-1 overflow-y-auto">
                        {/* CHAT HISTORY VIEW */}
                        {viewMode === 'chat' ? (
                            <>
                                <div className="flex justify-between items-center mb-3">
                                    <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                        Chat History
                                    </h2>
                                    <button
                                        onClick={() => {
                                            if (onNewChat) {
                                                onNewChat();
                                            }
                                        }}
                                        className="text-gray-400 hover:text-white transition-colors"
                                        title="New chat"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-1">
                                    {chatSessions.length === 0 ? (
                                        <div className="text-center py-6 text-gray-400 text-sm">
                                            No chats yet.<br />
                                            Click + to start a new chat.
                                        </div>
                                    ) : (
                                        chatSessions.map((session) => (
                                            <div
                                                key={session.id}
                                                onClick={() => {
                                                    if (onChatSessionSelect) {
                                                        onChatSessionSelect(session.id);
                                                    }
                                                }}
                                                className={`group relative rounded-lg p-3 cursor-pointer transition-colors ${
                                                    currentChatSessionId === session.id
                                                        ? 'bg-white text-gray-900'
                                                        : 'bg-white/5 hover:bg-white/10 text-white'
                                                }`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <MessageSquare className={`w-4 h-4 mt-0.5 shrink-0 ${
                                                        currentChatSessionId === session.id ? 'text-gray-600' : 'text-gray-400'
                                                    }`} />
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-sm font-medium truncate">
                                                            {session.title || 'New Chat'}
                                                        </h3>
                                                        <p className={`text-xs mt-0.5 ${
                                                            currentChatSessionId === session.id ? 'text-gray-500' : 'text-gray-400'
                                                        }`}>
                                                            {formatChatDate(session.updated_at || session.created_at)}
                                                        </p>
                                                    </div>
                                                    {currentChatSessionId === session.id && (
                                                        <button
                                                            onClick={(e) => handleDeleteChatSession(session.id, e)}
                                                            disabled={deletingChatId === session.id}
                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-all disabled:opacity-50"
                                                            title="Delete chat"
                                                        >
                                                            {deletingChatId === session.id ? (
                                                                <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* LIBRARY TITLE */}
                                <div className="flex justify-between items-center mb-3">
                                    <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                        Library
                                    </h2>

                            {telegramPhotos.length > 0 && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-gray-300 hover:text-white flex items-center gap-1 text-xs"
                                >
                                    {isExpanded ? (
                                        <>
                                            Collapse <ChevronUp className="w-4 h-4" />
                                        </>
                                    ) : (
                                        <>
                                            Expand <ChevronDown className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>

                        {/* LIBRARY BOX */}
                        <div
                            className="border border-dashed rounded-xl p-4 text-center transition-colors"
                            style={{ borderColor: 'rgba(255, 255, 255, 0.3)' }}
                        >

                            <div className="text-sm font-medium text-white">
                                Uploaded Photos from Telegram
                            </div>

                            <div className="text-xs text-gray-400">
                                {telegramPhotos.length === 0
                                    ? "No photos yet"
                                    : `${telegramPhotos.length} photos`}
                            </div>

                            {telegramPhotos.length > 0 && !isExpanded && (
                                <div className="mt-3 grid grid-cols-4 gap-2">
                                    {telegramPhotos.slice(0, 4).map((photo, index) => ( 
                                        <img
                                            key={index}
                                            src={photo.url}
                                            className="w-full h-16 rounded-md object-cover cursor-pointer hover:opacity-80 transition"
                                            onClick={async () => {
                                                const file = await urlToFile(photo.url);
                                                setAttachment({ file, preview: photo.url });
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {isExpanded && (
                                <div className="mt-3 grid grid-cols-4 gap-2">
                                    {telegramPhotos.map((photo, index) => (
                                        <img
                                            key={index}
                                            src={photo.url}
                                            className="w-full h-20 rounded-md object-cover cursor-pointer hover:opacity-80 transition"
                                            onClick={async () => {
                                                const file = await urlToFile(photo.url);
                                                setAttachment({ file, preview: photo.url });
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* SOURCES */}
                        <div className="flex justify-between items-center mt-6 mb-4">
                            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                Sources ({sources.length})
                            </h2>
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Upload source"
                            >
                                {isUploading ? (
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.docx,.doc,.txt"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>

                        <div className="space-y-3">
                            {sources.length === 0 ? (
                                <div className="text-center py-6 text-gray-400 text-sm">
                                    No sources uploaded yet.<br />
                                    Click the + button to upload.
                                </div>
                            ) : (
                                sources.map((source) => (
                                    <div 
                                        key={source.id} 
                                        className="group relative bg-white border rounded-xl p-3 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                                style={{ backgroundColor: COLOR_SECONDARY_LIGHT, color: COLOR_ACCENT_DARK }}>
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-medium truncate">{source.title || source.file_name}</h3>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {source.file_type} • {formatDate(source.created_at)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteSource(source.id, e)}
                                                disabled={deletingId === source.id}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-all disabled:opacity-50"
                                                title="Delete source"
                                            >
                                                {deletingId === source.id ? (
                                                    <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                            </>
                        )}

                    </div>
                )}
                
                <div className={`p-4 ${(isMobile || isSidebarOpen) ? 'border-t' : ''} ${isMobile ? 'transition-opacity duration-300' : ''} ${isSidebarOpen ? 'opacity-100' : (isMobile ? 'opacity-0' : 'opacity-100')}`} style={(isMobile || isSidebarOpen) ? { borderColor: 'rgba(255, 255, 255, 0.1)' } : {}}>
                    <button 
                        onClick={() => {
                            if (onOpenProfile) {
                                onOpenProfile();
                            }
                            if (isMobile) {
                                setIsSidebarOpen(false);
                            }
                        }}
                        className={`flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg cursor-pointer transition-colors w-full ${!isMobile && !isSidebarOpen ? 'justify-center' : 'text-left'}`}
                    >
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                            style={{ backgroundColor: COLOR_SECONDARY_LIGHT, color: COLOR_ACCENT_DARK }}
                        >
                            <User className="w-4 h-4" />
                        </div>
                        <div className={`flex-1 ${isMobile ? '' : (isSidebarOpen ? '' : 'hidden')}`}>
                            <div className="text-sm font-medium text-white">{userFullName}</div>
                            <div className="text-xs text-gray-400">Pro Plan</div>
                        </div>
                    </button>
                </div>

            </div>

            {/* MOBILE BACKDROP */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </>
    );
}
