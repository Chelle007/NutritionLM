"use client";

import { useState } from "react";

export default function WeeklyReportTest() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleGetWeeklyReport = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch("/api/weekly-report", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();
            console.log("/api/weekly-report data:", data);

            if (!response.ok) {
                throw new Error(data.error || "Failed to get weekly report");
            }

            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto text-black">
            <h1 className="text-2xl font-bold mb-6">Weekly Nutrition Report Test</h1>

            <div className="space-y-4">
                <button
                    onClick={handleGetWeeklyReport}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
                >
                    {loading ? "Loading..." : "Get Weekly Report"}
                </button>

                {error && (
                    <div className="p-4 bg-red-100 text-red-800 rounded">
                        {error}
                    </div>
                )}

                {result && (
                    <div className="space-y-6">
                        {/* Week Information */}
                        <div className="p-4 bg-gray-100 rounded">
                            <h3 className="font-bold mb-2">Week Period:</h3>
                            <p>
                                {result.week?.startDate} to {result.week?.endDate}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

