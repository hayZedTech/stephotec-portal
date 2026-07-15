"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { errorToast } from "@/lib/toast";
import { IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function LoginPage() {
    const { login } = useAuth();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        console.log("Login page mounted");
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Form submitted, preventDefault called");
        setError("");
        setLoading(true);

        try {
            console.log("Attempting login...");
            await login({
                username: username.trim(),
                password,
            });
        } catch (err) {
            console.error("Login error caught:", err);
            const errorMsg = err?.response?.data?.detail || err?.message || "Invalid credentials. Please try again.";
            console.log("Setting error:", errorMsg);
            setError(errorMsg);
            errorToast(err, errorMsg);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{
            backgroundImage: 'url(/images/login_image.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
        }}>
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40"></div>
            
            <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg">

                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-zinc-900">
                        Stephotec Portal
                    </h1>

                    <p className="mt-1 text-sm text-zinc-500">
                        Sign in to continue
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    <div>
                        <label className="text-xs font-medium text-zinc-600">
                            Username / Student ID
                        </label>

                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                            placeholder="SE/26/0001"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-zinc-600">
                            Password
                        </label>

                        <div className="relative mt-1">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg border border-zinc-200 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                placeholder="••••••••"
                                required
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700"
                                disabled={loading}
                            >
                                {showPassword ? (
                                    <VisibilityOff size={18} />
                                ) : (
                                    <Visibility size={18} />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full cursor-pointer rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>

                    {error && (
                        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                            {error}
                        </div>
                    )}

                </form>

            </div>
        </div>
    );
}
