"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Plus, Trash2, Star, ExternalLink, X } from "lucide-react";

const GENRES = ["horror", "action", "comedy", "drama", "sci-fi", "documentary"];

export default function DashboardPage() {
    const { user } = useUser();
    const [isAdding, setIsAdding] = useState(false);
    const [filter, setFilter] = useState("all");
    const [userSearch, setUserSearch] = useState("");
    const [newRec, setNewRec] = useState({ title: "", genre: "action", link: "", blurb: "" });

    const recommendations = useQuery(api.recommendations.listAll, { genre: filter });
    const myRole = useQuery(api.recommendations.getMyRole);
    const createRec = useMutation(api.recommendations.create);
    const removeRec = useMutation(api.recommendations.remove);
    const toggleStaffPick = useMutation(api.recommendations.toggleStaffPick);

    const isAdmin = myRole === "admin";

    // Client-side username filter applied on top of the genre query result
    const visibleRecs = recommendations?.filter((rec) =>
        userSearch.trim() === "" ||
        rec.username.toLowerCase().includes(userSearch.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await createRec(newRec);
        setNewRec({ title: "", genre: "action", link: "", blurb: "" });
        setIsAdding(false);
    };

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "60px 32px" }}>

            {/* Page header */}
            <div style={{
                display: "flex", alignItems: "flex-start",
                justifyContent: "space-between", marginBottom: 64,
                gap: 24, flexWrap: "wrap",
            }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <span className="mono-label" style={{ color: "#8B5CF6" }}>
                            authenticated session
                        </span>
                        <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#8B5CF6", boxShadow: "0 0 6px #8B5CF6" }} />
                        {isAdmin && <span className="mono-label" style={{ color: "#00F2FF" }}>ADMIN</span>}
                    </div>
                    <h1 style={{
                        fontSize: 36, fontWeight: 900,
                        letterSpacing: "-0.03em", color: "#F0F0F5", marginBottom: 8,
                    }}>
                        Your Hyped Shelf
                    </h1>
                    <p style={{ fontSize: 14, color: "rgba(240,240,245,0.35)", fontWeight: 400 }}>
                        {recommendations?.length ?? 0} movies on record
                    </p>
                </div>

                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="btn-cyan"
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 28px", fontSize: 11 }}
                >
                    <Plus size={14} strokeWidth={3} />
                    Add Movie
                </button>
            </div>

            {/* Add form */}
            {isAdding && (
                <div style={{
                    marginBottom: 64,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(0,242,255,0.15)",
                    borderRadius: 12,
                    padding: 40,
                    boxShadow: "0 0 40px rgba(0,242,255,0.05)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
                        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#F0F0F5", letterSpacing: "-0.01em" }}>
                            New Entry
                        </h2>
                        <button className="icon-btn" onClick={() => setIsAdding(false)}>
                            <X size={16} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                            <div>
                                <label className="mono-label" style={{ display: "block", marginBottom: 8 }}>Title</label>
                                <input
                                    className="tech-input"
                                    placeholder="e.g. Interstellar"
                                    value={newRec.title}
                                    onChange={(e) => setNewRec({ ...newRec, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="mono-label" style={{ display: "block", marginBottom: 8 }}>Genre</label>
                                <select
                                    className="tech-input"
                                    value={newRec.genre}
                                    onChange={(e) => setNewRec({ ...newRec, genre: e.target.value })}
                                    style={{ cursor: "pointer" }}
                                >
                                    {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <label className="mono-label" style={{ display: "block", marginBottom: 8 }}>Link (IMDb, Letterboxd…)</label>
                            <input
                                className="tech-input"
                                placeholder="https://"
                                value={newRec.link}
                                onChange={(e) => setNewRec({ ...newRec, link: e.target.value })}
                                required
                            />
                        </div>

                        <div style={{ marginBottom: 32 }}>
                            <label className="mono-label" style={{ display: "block", marginBottom: 8 }}>Why are you hyped?</label>
                            <textarea
                                className="tech-input"
                                placeholder="A short blurb…"
                                value={newRec.blurb}
                                onChange={(e) => setNewRec({ ...newRec, blurb: e.target.value })}
                                required
                                style={{ height: 96, resize: "none" }}
                            />
                        </div>

                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                            <button type="button" className="btn-ghost" onClick={() => setIsAdding(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-cyan" style={{ fontSize: 11, padding: "11px 28px" }}>
                                Save Entry
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search + Genre filters row */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 48 }}>
                {/* Username search */}
                <div style={{ position: "relative", maxWidth: 340 }}>
                    <span style={{
                        position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                        color: "rgba(240,240,245,0.25)", fontSize: 13, pointerEvents: "none",
                    }}>⌕</span>
                    <input
                        className="tech-input"
                        style={{ paddingLeft: 36 }}
                        placeholder="Search by username…"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                    />
                </div>

                {/* Genre chips */}
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
            </div>

            {/* Card grid */}
            {!visibleRecs ? (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: 20,
                }}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} style={{
                            height: 240, borderRadius: 8,
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            animation: "pulse 2s infinite",
                        }} />
                    ))}
                </div>
            ) : visibleRecs.length === 0 ? (
                <div style={{
                    border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 8,
                    padding: "80px 32px", textAlign: "center",
                    color: "rgba(240,240,245,0.25)",
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                }}>
          // No results for this filter. Try adding one.
                </div>
            ) : (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: 20,
                }}>
                    {visibleRecs.map((rec) => (
                        <div key={rec._id} className="glass-card" style={{ borderRadius: 8, padding: "28px 24px" }}>
                            {/* Top row */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                                <span className="mono-label" style={{ color: "#00F2FF" }}>{rec.genre}</span>
                                {rec.isStaffPick && (
                                    <div className="staff-pick-badge">★ Pick</div>
                                )}
                            </div>

                            <h3 style={{
                                fontSize: 18, fontWeight: 800,
                                color: "#F0F0F5", marginBottom: 12,
                                lineHeight: 1.2, letterSpacing: "-0.02em",
                            }}>
                                {rec.title}
                            </h3>

                            <p style={{
                                fontSize: 13, color: "rgba(240,240,245,0.4)",
                                lineHeight: 1.7, fontStyle: "italic", marginBottom: 24,
                                display: "-webkit-box" as any,
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical" as any,
                                overflow: "hidden",
                            }}>
                                "{rec.blurb}"
                            </p>

                            {/* Bottom row */}
                            <div style={{
                                borderTop: "1px solid rgba(255,255,255,0.05)",
                                paddingTop: 16,
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                            }}>
                                <span className="mono-label">@{rec.username}</span>

                                <div style={{ display: "flex", gap: 4 }}>
                                    <a
                                        href={rec.link} target="_blank" rel="noopener noreferrer"
                                        className="icon-btn" style={{ display: "inline-flex" }}
                                        title="Open link"
                                    >
                                        <ExternalLink size={15} />
                                    </a>

                                    {(isAdmin || rec.userId === user?.id) && (
                                        <button
                                            className="icon-btn danger"
                                            onClick={() => removeRec({ id: rec._id })}
                                            title="Delete"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    )}

                                    {isAdmin && (
                                        <button
                                            className="icon-btn"
                                            onClick={() => toggleStaffPick({ id: rec._id })}
                                            title={rec.isStaffPick ? "Remove staff pick" : "Mark as staff pick"}
                                            style={{ color: rec.isStaffPick ? "#A78BFA" : undefined }}
                                        >
                                            <Star size={15} fill={rec.isStaffPick ? "currentColor" : "none"} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
