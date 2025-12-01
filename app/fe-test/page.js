"use client";

import { useState } from "react";

export default function TestPage() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            setError(null);
            setResult(null);
        }
    };

    const handleSubmit = async () => {
        if (!selectedImage) return;

        setLoading(true);
        setError(null);
        setResult(null);

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
                    <div className="p-4 bg-gray-100 rounded">
                        <h3 className="font-bold mb-2">Result:</h3>
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
                    </div>
                )}
            </div>
        </div>
    );
}