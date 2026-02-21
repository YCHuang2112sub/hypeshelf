import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

// ─────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────

/**
 * Resolves the calling user's verified Clerk identity and their stored role.
 * Throws "Unauthenticated" if there is no valid session — this is the single
 * auth checkpoint used by every protected mutation.
 *
 * Role resolution strategy:
 *   - We look up the caller's userId in our own `users` table.
 *   - If no row exists (first-time user) we default to "user".
 *   - Roles are NEVER trusted from the client; they are always read server-side.
 */
async function requireAuth(ctx: QueryCtx | MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("Unauthenticated");
    }

    const userRow = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
        .unique();

    return {
        identity,
        userId: identity.subject,
        username: identity.name ?? identity.nickname ?? "Anonymous",
        role: (userRow?.role ?? "user") as "admin" | "user",
    };
}

// ─────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────

/**
 * Public — no auth required.
 * Returns the latest recommendations for the landing page.
 * isStaffPick is computed dynamically: true if the creator is an admin.
 */
export const listPublic = query({
    args: {},
    handler: async (ctx) => {
        // Build a set of admin userIds once
        const admins = await ctx.db.query("users")
            .filter((q) => q.eq(q.field("role"), "admin"))
            .collect();
        const adminIds = new Set(admins.map((a) => a.userId));

        const recs = await ctx.db
            .query("recommendations")
            .order("desc")
            .take(50);

        return recs.map((rec) => ({
            ...rec,
            isStaffPick: adminIds.has(rec.userId),
        }));
    },
});

/**
 * Returns all recommendations with optional genre filter.
 * isStaffPick is computed dynamically from the users table.
 */
export const listAll = query({
    args: { genre: v.optional(v.string()) },
    handler: async (ctx, args) => {
        // Build a set of admin userIds once
        const admins = await ctx.db.query("users")
            .filter((q) => q.eq(q.field("role"), "admin"))
            .collect();
        const adminIds = new Set(admins.map((a) => a.userId));

        let q = ctx.db.query("recommendations");
        if (args.genre && args.genre !== "all") {
            q = q.filter((f) => f.eq(f.field("genre"), args.genre));
        }
        const recs = await q.order("desc").collect();

        return recs.map((rec) => ({
            ...rec,
            isStaffPick: adminIds.has(rec.userId),
        }));
    },
});

/**
 * Returns only the caller's role — nothing more.
 * We deliberately expose the role only, not the entire users row,
 * to minimise the data surface available to the client.
 */
export const getMyRole = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const userRow = await ctx.db
            .query("users")
            .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
            .unique();

        // Return only the role string, not the DB row
        return (userRow?.role ?? "user") as "admin" | "user";
    },
});

// ─────────────────────────────────────────────
// MUTATIONS
// ─────────────────────────────────────────────

/**
 * Create a new recommendation.
 * Auth: any signed-in user.
 * The userId and username are resolved server-side from the Clerk JWT —
 * the client cannot supply or forge them.
 */
export const create = mutation({
    args: {
        title: v.string(),
        genre: v.string(),
        link: v.string(),
        blurb: v.string(),
    },
    handler: async (ctx, args) => {
        const { userId, username, role } = await requireAuth(ctx);

        return await ctx.db.insert("recommendations", {
            ...args,
            userId,
            username,
            isStaffPick: role === "admin", // auto staff-pick for admin posts
        });
    },
});

/**
 * Delete a recommendation.
 * Auth: admin (any) | user (own only).
 * Ownership is verified server-side against the stored userId field.
 */
export const remove = mutation({
    args: { id: v.id("recommendations") },
    handler: async (ctx, args) => {
        const { userId, role } = await requireAuth(ctx);

        const rec = await ctx.db.get(args.id);
        if (!rec) throw new Error("Not found");

        if (role !== "admin" && rec.userId !== userId) {
            throw new Error("Forbidden: you can only delete your own recommendations");
        }

        await ctx.db.delete(args.id);
    },
});

/**
 * Toggle the Staff Pick flag on a recommendation.
 * Auth: admin only — enforced server-side.
 */
export const toggleStaffPick = mutation({
    args: { id: v.id("recommendations") },
    handler: async (ctx, args) => {
        const { role } = await requireAuth(ctx);
        if (role !== "admin") {
            throw new Error("Forbidden: only admins can set Staff Picks");
        }

        const rec = await ctx.db.get(args.id);
        if (!rec) throw new Error("Not found");

        await ctx.db.patch(args.id, { isStaffPick: !rec.isStaffPick });
    },
});

/**
 * Assign a role to a user.
 * Auth: admin only — the caller must already be an admin.
 *
 * Security note: we validate the caller is an admin before allowing any
 * role change. Without this check, any authenticated user could escalate
 * their own privileges.
 */
export const setRole = mutation({
    args: {
        userId: v.string(),
        role: v.union(v.literal("admin"), v.literal("user")),
    },
    handler: async (ctx, args) => {
        const caller = await requireAuth(ctx);

        // 🔒 Only existing admins can promote/demote users
        if (caller.role !== "admin") {
            throw new Error("Forbidden: only admins can assign roles");
        }

        const existing = await ctx.db
            .query("users")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { role: args.role });
        } else {
            await ctx.db.insert("users", { userId: args.userId, role: args.role });
        }
    },
});
