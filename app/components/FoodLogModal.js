"use client";

import React from 'react';
import { 
    COLOR_SECONDARY_LIGHT,
    COLOR_ACCENT_DARK
} from '../constants/colors';
import { X, Utensils, Calendar, Clock, List, Apple } from 'lucide-react';
import Image from 'next/image';

export default function FoodLogModal({ isOpen, onClose, foodLog }) {
    if (!isOpen || !foodLog) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'Not available';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'Not available';
        // Handle time in format HH:MM:SS or HH:MM
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const ingredients = Array.isArray(foodLog.ingredients) 
        ? foodLog.ingredients 
        : (foodLog.ingredients && typeof foodLog.ingredients === 'object' 
            ? Object.values(foodLog.ingredients) 
            : []);

    const nutrition = foodLog.nutrition || {};

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div 
                className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Food Log Content */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="space-y-6">
                            {/* Food Image */}
                            {foodLog.image_url && (
                                <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden relative">
                                    <Image
                                        src={foodLog.image_url}
                                        alt={foodLog.food_name || 'Food image'}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </div>
                            )}

                            {/* Food Name */}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" 
                                     style={{ backgroundColor: COLOR_SECONDARY_LIGHT, color: COLOR_ACCENT_DARK }}>
                                    <Utensils className="w-6 h-6" style={{ color: COLOR_ACCENT_DARK }} />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold mb-1" style={{ color: COLOR_ACCENT_DARK }}>
                                        {foodLog.food_name || 'Unnamed Food'}
                                    </h2>
                                </div>
                            </div>

                            {/* Date and Time */}
                            <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: COLOR_SECONDARY_LIGHT }}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Date</p>
                                            <p className="text-sm font-medium">
                                                {formatDate(foodLog.record_date)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Time</p>
                                            <p className="text-sm font-medium">
                                                {formatTime(foodLog.record_time)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {foodLog.food_description && (
                                <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: COLOR_SECONDARY_LIGHT }}>
                                    <h3 className="text-lg font-semibold mb-3" style={{ color: COLOR_ACCENT_DARK }}>
                                        Description
                                    </h3>
                                    <p className="text-sm text-gray-700">
                                        {foodLog.food_description}
                                    </p>
                                </div>
                            )}

                            {/* Ingredients */}
                            {ingredients.length > 0 && (
                                <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: COLOR_SECONDARY_LIGHT }}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <List className="w-5 h-5" style={{ color: COLOR_ACCENT_DARK }} />
                                        <h3 className="text-lg font-semibold" style={{ color: COLOR_ACCENT_DARK }}>
                                            Ingredients
                                        </h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {ingredients.map((ingredient, index) => (
                                            <span 
                                                key={index}
                                                className="px-3 py-1.5 rounded-full text-sm font-medium"
                                                style={{ backgroundColor: COLOR_SECONDARY_LIGHT, color: COLOR_ACCENT_DARK }}
                                            >
                                                {typeof ingredient === 'string' ? ingredient : ingredient.name || ingredient}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Nutrition */}
                            {nutrition && Object.keys(nutrition).length > 0 && (
                                <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: COLOR_SECONDARY_LIGHT }}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Apple className="w-5 h-5" style={{ color: COLOR_ACCENT_DARK }} />
                                        <h3 className="text-lg font-semibold" style={{ color: COLOR_ACCENT_DARK }}>
                                            Nutrition
                                        </h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Object.entries(nutrition).map(([key, value]) => {
                                            const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
                                            const displayValue = numericValue;
                                            const percentage = Math.min(Math.max(numericValue, 0), 100);
                                            
                                            return (
                                                <div key={key} className="bg-gray-50 rounded-lg p-4">
                                                    <p className="text-sm font-medium text-gray-700 mb-2 capitalize">
                                                        {key.replace(/_/g, ' ')}
                                                    </p>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                                            <div 
                                                                className="h-full rounded-full transition-all"
                                                                style={{ 
                                                                    width: `${percentage}%`,
                                                                    backgroundColor: '#22C55E' // vibrant green
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-700 min-w-[3rem] text-right">
                                                            {displayValue}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Healthy Level */}
                            {foodLog.healthy_level !== null && foodLog.healthy_level !== undefined && (
                                <div className="bg-white rounded-xl p-6 shadow-sm border" style={{ borderColor: COLOR_SECONDARY_LIGHT }}>
                                    <h3 className="text-lg font-semibold mb-3" style={{ color: COLOR_ACCENT_DARK }}>
                                        Health Score
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all"
                                                style={{ 
                                                    width: `${foodLog.healthy_level}%`,
                                                    backgroundColor: foodLog.healthy_level >= 70 
                                                        ? '#4CAF50' 
                                                        : foodLog.healthy_level >= 40 
                                                            ? '#FF9800' 
                                                            : '#F44336'
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold" style={{ color: COLOR_ACCENT_DARK }}>
                                            {foodLog.healthy_level}/100
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

