import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { toVideoEmbedUrl } from "@/lib/video";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  videoUrl: string | null;
  isPublished: boolean;
  publishedAt: string;
};

type Row = Database["public"]["Tables"]["blog_posts"]["Row"];
const COLS = "id, slug, title, excerpt, body, video_url, is_published, published_at";

function map(r: Pick<Row, "id" | "slug" | "title" | "excerpt" | "body" | "video_url" | "is_published" | "published_at">): BlogPost {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    body: r.body,
    videoUrl: r.video_url,
    isPublished: r.is_published,
    publishedAt: r.published_at,
  };
}

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const listPublishedPosts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("blog_posts")
    .select(COLS)
    .eq("is_published", true)
    .order("published_at", { ascending: false });
  if (error) throw new Error("Could not load posts");
  return (data ?? []).map(map);
});

export const getPublishedPost = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await publicClient()
      .from("blog_posts")
      .select(COLS)
      .eq("is_published", true)
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error("Could not load post");
    return row ? map(row) : null;
  });

export const listAllPostsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("blog_posts")
      .select(COLS)
      .order("published_at", { ascending: false });
    if (error) throw new Error("Could not load posts");
    return (data ?? []).map(map);
  });

const postSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens")
    .max(120),
  excerpt: z.string().trim().max(400),
  body: z.string().trim().max(30000),
  videoUrl: z.string().trim().max(500).optional().nullable(),
  isPublished: z.boolean(),
});

export const savePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => postSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const video = data.videoUrl ? data.videoUrl : null;
    if (video && !toVideoEmbedUrl(video)) throw new Error("Video must be a YouTube or Vimeo link");
    if (!data.body && !video) throw new Error("Add some text, a video, or both");

    const row = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      body: data.body,
      video_url: video,
      is_published: data.isPublished,
    };
    const q = data.id
      ? context.supabase.from("blog_posts").update(row).eq("id", data.id)
      : context.supabase.from("blog_posts").insert(row);
    const { error } = await q;
    if (error) {
      if (error.code === "23505") throw new Error("That web address is already used by another post");
      throw new Error("Could not save post");
    }
    return { ok: true };
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("blog_posts").delete().eq("id", data.id);
    if (error) throw new Error("Could not delete post");
    return { ok: true };
  });
