"use client";

import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useState } from "react";

const GENRES = ["horror", "action", "comedy", "drama", "sci-fi", "documentary"];

export default function HomePage() {
    const { isSignedIn } = useUser();
    const [filter, setFilter] = useState("all");

    // useQuery subscribes via WebSocket — auto-refreshes whenever DB changes
    const recommendations = useQuery(api.recommendations.listAll, { genre: filter });
    const isLoading = recommendations === undefined;

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px" }}>
            {/* Hero */}
            <section style={{
                padding: "120px 0 80px",
                display: "flex", flexDirection: "column", alignItems: "flex-start",
            }}>
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: 10,
                    border: "1px solid rgba(0,242,255,0.2)",
                    borderRadius: 2,
                    padding: "6px 16px",
                    marginBottom: 40,
                    background: "rgba(0,242,255,0.04)",
                }}>
                    <div style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: "#00F2FF",
                        boxShadow: "0 0 8px #00F2FF",
                    }} />
                    <span className="mono-label" style={{ color: "#00F2FF" }}>Live — Real-time updates</span>
                </div>

                <h1 style={{
                    fontSize: "clamp(40px, 6vw, 72px)",
                    fontWeight: 900,
                    lineHeight: 1.05,
                    letterSpacing: "-0.03em",
                    color: "#F0F0F5",
                    marginBottom: 24,
                }}>
                    Collect and share<br />
                    <span className="glow-cyan">the stuff</span> you&apos;re<br />
                    hyped about.
                </h1>

                <p style={{
                    fontSize: 17, color: "rgba(240,240,245,0.45)",
                    maxWidth: 480, lineHeight: 1.7, marginBottom: 48,
                    fontWeight: 400,
                }}>
                    HypeShelf is a curated public shelf for your favorite movies.
                    Simple, clean, and shared with the world.
                </p>

                <SignedOut>
                    <p className="mono-label" style={{ letterSpacing: "0.2em" }}>
                        ↓ Sign in to add yours ↓
                    </p>
                </SignedOut>

                <SignedIn>
                    <Link href="/dashboard">
                        <button className="btn-cyan" style={{ fontSize: 12, padding: "14px 36px" }}>
                            Open Dashboard →
                        </button>
                    </Link>
                </SignedIn>
            </section>

            {/* Divider */}
            <div style={{
                height: 1,
                background: "linear-gradient(90deg, rgba(0,242,255,0.4), rgba(139,92,246,0.4), transparent)",
                marginBottom: 64,
            }} />

            {/* Latest picks */}
            <section style={{ paddingBottom: 120 }}>
                <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", marginBottom: 40,
                }}>
                    <div>
                        <h2 style={{
                            fontSize: 22, fontWeight: 800,
                            color: "#F0F0F5", letterSpacing: "-0.02em", marginBottom: 4,
                        }}>
                            Latest Hypes
                        </h2>
                        <span className="mono-label">Real-time via Convex WebSocket</span>
                    </div>
                    <span className="mono-label">
                        {isLoading ? "loading..." : `${recommendations.length} entries`}
                    </span>
                </div>

                {/* Genre filter chips */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 48 }}>
                    <button
                        className={`genre-chip ${filter === "all" ? "active" : ""}`}
                        onClick={() => setFilter("all")}
                    >
                        All
                    </button>
                    {GENRES.map((g) => (
                        <button
                            key={g}
                            className={`genre-chip ${filter === g ? "active" : ""}`}
                            onClick={() => setFilter(g)}
                        >
                            {g}
                        </button>
                    ))}
                </div>

                {/* Skeleton loading state */}
                {isLoading && (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                        gap: 20,
                    }}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} style={{
                                height: 220, borderRadius: 8,
                                background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)",
                                backgroundSize: "200% 100%",
                                border: "1px solid rgba(255,255,255,0.05)",
                                animation: "shimmer 1.5s infinite",
                            }} />
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && recommendations.length === 0 && (
                    <div style={{
                        border: "1px dashed rgba(255,255,255,0.08)",
                        borderRadius: 8,
                        padding: "80px 32px",
                        textAlign: "center",
                        color: "rgba(240,240,245,0.25)",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13,
                    }}>
                        // No entries for this genre yet.
                    </div>
                )}

                {/* Cards */}
                {!isLoading && recommendations.length > 0 && (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                        gap: 20,
                    }}>
                        {recommendations.map((rec) => (
                            <div key={rec._id} className="glass-card" style={{ borderRadius: 8, padding: "28px 24px" }}>
                                {rec.isStaffPick && (
                                    <div className="staff-pick-badge" style={{ marginBottom: 16 }}>
                                        ★ Staff Pick
                                    </div>
                                )}
                                <h3 style={{
                                    fontSize: 17, fontWeight: 800,
                                    color: "#F0F0F5", marginBottom: 6, letterSpacing: "-0.01em",
                                }}>
                                    {rec.title}
                                </h3>
                                <span className="mono-label" style={{ color: "#00F2FF", marginBottom: 14, display: "block" }}>
                                    {rec.genre}
                                </span>
                                <p style={{
                                    fontSize: 13, color: "rgba(240,240,245,0.45)",
                                    lineHeight: 1.7, fontStyle: "italic", marginBottom: 24,
                                    display: "-webkit-box" as React.CSSProperties["display"],
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: "vertical" as React.CSSProperties["WebkitBoxOrient"],
                                    overflow: "hidden",
                                }}>
                                    &quot;{rec.blurb}&quot;
                                </p>
                                <div style={{
                                    paddingTop: 16,
                                    borderTop: "1px solid rgba(255,255,255,0.05)",
                                }}>
                                    {isSignedIn && (
                                        <span className="mono-label">@{rec.username}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <style>{`
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}
