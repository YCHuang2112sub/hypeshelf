import type { Metadata } from "next";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import {
    SignInButton,
    SignUpButton,
    SignedIn,
    SignedOut,
    UserButton,
    SignOutButton,
} from "@clerk/nextjs";

export const metadata: Metadata = {
    title: "HypeShelf",
    description: "Collect and share the stuff you're hyped about.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
            </head>
            <body>
                <ConvexClientProvider>
                    {/* Ambient background blobs */}
                    <div style={{
                        position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none"
                    }}>
                        <div style={{
                            position: "absolute", top: "-10%", right: "5%",
                            width: 600, height: 600,
                            background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
                            borderRadius: "50%",
                        }} />
                        <div style={{
                            position: "absolute", bottom: "10%", left: "-5%",
                            width: 500, height: 500,
                            background: "radial-gradient(circle, rgba(0,242,255,0.08) 0%, transparent 70%)",
                            borderRadius: "50%",
                        }} />
                    </div>

                    <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
                        {/* HEADER */}
                        <header style={{
                            position: "sticky", top: 0, zIndex: 50,
                            background: "rgba(5,5,10,0.8)",
                            backdropFilter: "blur(24px)",
                            WebkitBackdropFilter: "blur(24px)",
                            borderBottom: "1px solid rgba(255,255,255,0.05)",
                        }}>
                            <div style={{
                                maxWidth: 1200, margin: "0 auto",
                                padding: "0 32px",
                                height: 72,
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                            }}>
                                {/* Logo */}
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{
                                        width: 32, height: 32,
                                        background: "linear-gradient(135deg, #00F2FF, #8B5CF6)",
                                        borderRadius: 6,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        boxShadow: "0 0 18px rgba(0,242,255,0.4)",
                                    }}>
                                        <span style={{ fontSize: 14, fontWeight: 900, color: "#000" }}>H</span>
                                    </div>
                                    <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", color: "#F0F0F5" }}>
                                        Hype<span className="glow-cyan">Shelf</span>
                                    </span>
                                </div>

                                {/* Nav */}
                                <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
                                    <SignedOut>
                                        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                                            <SignInButton mode="modal">
                                                <button className="btn-ghost">Sign In</button>
                                            </SignInButton>
                                            <SignUpButton mode="modal">
                                                <button className="btn-cyan">Join Now</button>
                                            </SignUpButton>
                                        </div>
                                    </SignedOut>
                                    <SignedIn>
                                        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                                            <SignOutButton>
                                                <button className="mono-label" style={{ cursor: "pointer" }}>// Disconnect</button>
                                            </SignOutButton>
                                            <div style={{
                                                padding: 2,
                                                background: "linear-gradient(135deg, #00F2FF, #8B5CF6)",
                                                borderRadius: "50%",
                                            }}>
                                                <div style={{ background: "#05050A", borderRadius: "50%", padding: 2 }}>
                                                    <UserButton />
                                                </div>
                                            </div>
                                        </div>
                                    </SignedIn>
                                </nav>
                            </div>
                        </header>

                        {/* MAIN */}
                        <main style={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
                            {children}
                        </main>

                        {/* FOOTER */}
                        <footer style={{
                            borderTop: "1px solid rgba(255,255,255,0.04)",
                            padding: "40px 32px",
                            marginTop: 80,
                        }}>
                            <div style={{
                                maxWidth: 1200, margin: "0 auto",
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                gap: 16,
                            }}>
                                <span className="mono-label">&copy; 2026 HypeShelf — All systems nominal</span>
                                <div style={{ display: "flex", gap: 32 }}>
                                    <span className="mono-label">v1.0.0</span>
                                    <span className="mono-label">Status: Online</span>
                                </div>
                            </div>
                        </footer>
                    </div>
                </ConvexClientProvider>
            </body>
        </html>
    );
}
