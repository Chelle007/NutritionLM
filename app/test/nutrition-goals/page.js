"use client";

import { useState } from "react";

export default function NutritionGoalsTest() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleGetOptimalNutrition = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch("/api/optimal-nutrition", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to get optimal nutrition");
            }

            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Optimal Nutrition Test</h1>

            <div className="space-y-4">
                <button
                    onClick={handleGetOptimalNutrition}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
                >
                    {loading ? "Processing..." : "Get Optimal Nutrition"}
                </button>

                {error && (
                    <div className="p-4 bg-red-100 text-red-800 rounded">
                        {error}
                    </div>
                )}

                {result && result.nutritionGoals && (
                    <div className="p-4 bg-gray-100 rounded">
                        <h3 className="font-bold mb-4">Optimal Nutrition Goals:</h3>
                        {result.nutritionGoals[0]?.nutrition_goals && (
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(result.nutritionGoals[0].nutrition_goals).map(([key, value]) => (
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
                                                className="bg-green-600 h-2 rounded-full"
                                                style={{ width: `${Math.min(value, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!result.nutritionGoals[0]?.nutrition_goals && (
                            <pre className="whitespace-pre-wrap bg-white p-4 rounded border">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

