"use client";

import { useState } from "react";

export default function TestPage() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [nutritionLoading, setNutritionLoading] = useState(false);
    const [nutritionData, setNutritionData] = useState(null);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setError(null);
            setResult(null);
            setNutritionData(null);
        }
    };

    const handleSubmit = async () => {
        if (!selectedImage) return;

        setLoading(true);
        setError(null);
        setResult(null);
        setNutritionData(null);

        try {
            const formData = new FormData();
            formData.append("image", selectedImage);

            const response = await fetch("/api/ingredients", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to process image");
            }

            // Data is already parsed JSON from the API
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGetNutrition = async () => {
        if (!result || !result.food_name || !result.ingredients) {
            setError("Please extract ingredients first");
            return;
        }

        setNutritionLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/nutritionist", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    food_name: result.food_name,
                    ingredients: result.ingredients,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to get nutrition data");
            }

            setNutritionData(data.nutritions);
        } catch (err) {
            setError(err.message);
        } finally {
            setNutritionLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Ingredient Test</h1>

            <div className="space-y-4">
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    disabled={loading}
                    className="block"
                />

                <button
                    onClick={handleSubmit}
                    disabled={!selectedImage || loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
                >
                    {loading ? "Processing..." : "Submit"}
                </button>

                {error && (
                    <div className="p-4 bg-red-100 text-red-800 rounded">
                        {error}
                    </div>
                )}

                {result && (
                    <div className="p-4 bg-gray-100 rounded space-y-4">
                        <h3 className="font-bold mb-2">Ingredients Extracted:</h3>
                        {result.food_name && (
                            <p className="mb-2">
                                <strong>Food:</strong> {result.food_name}
                            </p>
                        )}
                        {result.ingredients && Array.isArray(result.ingredients) && (
                            <div>
                                <strong>Ingredients:</strong>
                                <ul className="list-disc list-inside ml-2">
                                    {result.ingredients.map((ingredient, index) => (
                                        <li key={index}>{ingredient}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {result.caption && !result.food_name && (
                            <pre className="whitespace-pre-wrap">{result.caption}</pre>
                        )}

                        {/* Button to get nutrition data */}
                        {result.food_name && result.ingredients && (
                            <button
                                onClick={handleGetNutrition}
                                disabled={nutritionLoading}
                                className="mt-4 px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400"
                            >
                                {nutritionLoading ? "Analyzing Nutrition..." : "Get Nutrition Info"}
                            </button>
                        )}
                    </div>
                )}

                {/* Nutrition Data Display */}
                {nutritionData && typeof nutritionData === 'object' && (
                    <div className="p-4 bg-blue-50 rounded">
                        <h3 className="font-bold mb-4">Nutrition Analysis:</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(nutritionData).map(([key, value]) => (
                                <div key={key} className="bg-white p-3 rounded border">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium capitalize">
                                            {key}
                                        </span>
                                        <span className="text-sm text-gray-600">
                                            {value}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${Math.min(value, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}