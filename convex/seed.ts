import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * One-time bootstrap helper for the first admin.
 * Run via: npx convex run seed:grantAdmin '{"userId":"user_xxx"}'
 * This is an internalMutation — it cannot be called from the browser.
 */
export const grantAdmin = internalMutation({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("users")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { role: "admin" });
        } else {
            await ctx.db.insert("users", { userId: args.userId, role: "admin" });
        }

        console.log(`Granted admin to ${args.userId}`);
        return { success: true };
    },
});

/** Temporary no-arg bootstrap — run once, then delete this function. */
export const bootstrapAdmin = internalMutation({
    handler: async (ctx) => {
        const userId = "user_39xhjj48zeulZwD1jk4HqHvTZlW";
        const existing = await ctx.db
            .query("users")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { role: "admin" });
        } else {
            await ctx.db.insert("users", { userId, role: "admin" });
        }

        console.log(`Admin granted to ${userId}`);
        return { success: true };
    },
});

/**
 * Retroactively marks all existing recommendations added by admins as Staff Picks.
 * Run once after granting admin roles to fix pre-existing entries.
 * Run via: npx convex run seed:backfillAdminStaffPicks
 */
export const backfillAdminStaffPicks = internalMutation({
    handler: async (ctx) => {
        // Get all admin userIds
        const admins = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("role"), "admin"))
            .collect();
        const adminIds = new Set(admins.map((a) => a.userId));

        if (adminIds.size === 0) {
            console.log("No admins found.");
            return { updated: 0 };
        }

        // Fetch all recommendations and patch the ones added by admins
        const all = await ctx.db.query("recommendations").collect();
        let updated = 0;
        for (const rec of all) {
            if (adminIds.has(rec.userId) && !rec.isStaffPick) {
                await ctx.db.patch(rec._id, { isStaffPick: true });
                updated++;
            }
        }

        console.log(`Backfilled ${updated} recommendations as Staff Pick.`);
        return { updated };
    },
});

const SEED_MOVIES = [
    {
        title: "Interstellar",
        genre: "sci-fi",
        link: "https://www.imdb.com/title/tt0816692/",
        blurb: "A jaw-dropping journey through wormholes and time dilation. Nolan at his most ambitious — emotionally wrecking and visually stunning.",
        username: "HypeShelf_Bot",
        userId: "seed_bot",
        isStaffPick: true,
    },
    {
        title: "Blade Runner 2049",
        genre: "sci-fi",
        link: "https://www.imdb.com/title/tt1856101/",
        blurb: "Deakins' cinematography alone is worth the watch. A slow burn that rewards patience with one of the most beautiful films ever made.",
        username: "HypeShelf_Bot",
        userId: "seed_bot",
        isStaffPick: false,
    },
    {
        title: "Dune: Part Two",
        genre: "sci-fi",
        link: "https://www.imdb.com/title/tt15239678/",
        blurb: "Villeneuve delivers an epic on a scale rarely seen. The sandworm ride sequence alone makes it a must-watch.",
        username: "HypeShelf_Bot",
        userId: "seed_bot",
        isStaffPick: false,
    },
    {
        title: "Parasite",
        genre: "drama",
        link: "https://www.imdb.com/title/tt6751668/",
        blurb: "Bong Joon-ho's masterclass in genre-blending. You think you know where it's going — you don't.",
        username: "HypeShelf_Bot",
        userId: "seed_bot",
        isStaffPick: true,
    },
    {
        title: "Get Out",
        genre: "horror",
        link: "https://www.imdb.com/title/tt5052448/",
        blurb: "Jordan Peele's debut is one of the sharpest horror films in decades. Terrifying, funny, and devastatingly smart.",
        username: "HypeShelf_Bot",
        userId: "seed_bot",
        isStaffPick: false,
    },
    {
        title: "Hereditary",
        genre: "horror",
        link: "https://www.imdb.com/title/tt7784604/",
        blurb: "Ari Aster's debut is a slow, relentless descent into dread. The most genuinely disturbing horror film of the 2010s.",
        username: "HypeShelf_Bot",
        userId: "seed_bot",
        isStaffPick: false,
    },
    {
        title: "Everything Everywhere All At Once",
        genre: "action",
        link: "https://www.imdb.com/title/tt6710474/",
        blurb: "Chaotic, profound, and somehow deeply moving. Michelle Yeoh carries an everything-bagel-sized multiverse on her shoulders.",
        username: "HypeShelf_Bot",
        userId: "seed_bot",
        isStaffPick: true,
    },
    {
        title: "Mad Max: Fury Road",
        genre: "action",
        link: "https://www.imdb.com/title/tt1392190/",
        blurb: "Two hours of pure kinetic cinema. George Miller somehow made the greatest action movie ever at age 70.",
        username: "HypeShelf_Bot",
        userId: "seed_bot",
        isStaffPick: false,
    },
    {
        title: "The Grand Budapest Hotel",
        genre: "comedy",
        link: "https://www.imdb.com/title/tt2278388/",
        blurb: "Wes Anderson at peak Wes Anderson. A laugh-out-loud caper wrapped in a perfectly symmetrical pink box.",
        username: "HypeShelf_Bot",
        userId: "seed_bot",
        isStaffPick: false,
    },
    {
        title: "Past Lives",
        genre: "drama",
        link: "https://www.imdb.com/title/tt13238346/",
        blurb: "A quiet devastator. Celine Song's debut feature will leave you aching about the lives not lived.",
        username: "HypeShelf_Bot",
        userId: "seed_bot",
        isStaffPick: false,
    },
    {
        title: "Free Solo",
        genre: "documentary",
        link: "https://www.imdb.com/title/tt7775622/",
        blurb: "Alex Honnold free-soloing El Capitan. Watching it is physically stressful. One of the most extraordinary human achievements ever filmed.",
        username: "HypeShelf_Bot",
        userId: "seed_bot",
        isStaffPick: false,
    },
    {
        title: "Oppenheimer",
        genre: "drama",
        link: "https://www.imdb.com/title/tt15398776/",
        blurb: "Three hours that feel like ninety minutes. Cillian Murphy's best performance and Nolan's most mature film.",
        username: "HypeShelf_Bot",
        userId: "seed_bot",
        isStaffPick: false,
    },
];

export const seedMovies = internalMutation({
    handler: async (ctx) => {
        // Avoid duplicates — check if seed already ran
        const existing = await ctx.db
            .query("recommendations")
            .filter((q) => q.eq(q.field("userId"), "seed_bot"))
            .first();

        if (existing) {
            console.log("Seed already ran. Skipping.");
            return { skipped: true, count: 0 };
        }

        for (const movie of SEED_MOVIES) {
            await ctx.db.insert("recommendations", movie);
        }

        console.log(`Seeded ${SEED_MOVIES.length} movies.`);
        return { skipped: false, count: SEED_MOVIES.length };
    },
});
