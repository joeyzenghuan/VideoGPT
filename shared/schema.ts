import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const videoAnalyses = pgTable("video_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  youtubeUrl: text("youtube_url").notNull(),
  videoId: text("video_id").notNull(),
  title: text("title").notNull(),
  channel: text("channel").notNull(),
  duration: integer("duration").notNull(), // in seconds
  publishDate: text("publish_date").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  subtitles: jsonb("subtitles").$type<SubtitleSegment[]>().notNull(),
  summarySegments: jsonb("summary_segments").$type<SummarySegment[]>().notNull(),
  status: text("status").notNull().default("processing"), // processing, completed, failed
  // Video caching fields
  localVideoPath: text("local_video_path"), // Path to cached video file
  videoFileSize: integer("video_file_size"), // Size in bytes
  videoCacheStatus: text("video_cache_status").default("not_cached"), // not_cached, caching, cached, failed
  lastAccessedAt: timestamp("last_accessed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const SubtitleSegmentSchema = z.object({
  start: z.number(),
  end: z.number(),
  text: z.string(),
});

export const SummarySegmentSchema = z.object({
  id: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  title: z.string(),
  aiSummary: z.string(),
  screenshotUrl: z.string(),
  subtitles: z.array(SubtitleSegmentSchema),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertVideoAnalysisSchema = createInsertSchema(videoAnalyses).omit({
  id: true,
  createdAt: true,
});

export const startAnalysisSchema = z.object({
  youtubeUrl: z.string().url(),
  forceRegenerate: z.boolean().optional().default(false),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type VideoAnalysis = typeof videoAnalyses.$inferSelect;
export type InsertVideoAnalysis = z.infer<typeof insertVideoAnalysisSchema>;
export type SubtitleSegment = z.infer<typeof SubtitleSegmentSchema>;
export type SummarySegment = z.infer<typeof SummarySegmentSchema>;
export type StartAnalysisRequest = z.infer<typeof startAnalysisSchema>;
