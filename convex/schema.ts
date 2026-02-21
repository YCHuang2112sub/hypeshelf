import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    recommendations: defineTable({
        title: v.string(),
        genre: v.string(),
        link: v.string(),
        blurb: v.string(),
        userId: v.string(),
        username: v.string(),
        isStaffPick: v.boolean(),
    })
        .index("by_userId", ["userId"])
        .index("by_isStaffPick", ["isStaffPick"]),

    users: defineTable({
        userId: v.string(),
        role: v.union(v.literal("admin"), v.literal("user")),
    }).index("by_userId", ["userId"]),
});
