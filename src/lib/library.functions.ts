import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Resource = {
  id: string;
  groupTitle: string;
  title: string;
  author: string;
  note: string;
  url: string | null;
  sortOrder: number;
};
export type Workshop = { id: string; title: string; format: string; body: string; sortOrder: number };

export const listResources = createServerFn({ method: "GET" }).handler(async (): Promise<Resource[]> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("resources")
    .select("id, group_title, title, author, note, url, sort_order")
    .order("sort_order")
    .order("created_at");
  if (error) throw new Error("Could not load resources");
  return (data ?? []).map((r) => ({
    id: r.id,
    groupTitle: r.group_title,
    title: r.title,
    author: r.author,
    note: r.note,
    url: r.url,
    sortOrder: r.sort_order,
  }));
});

export const listWorkshops = createServerFn({ method: "GET" }).handler(async (): Promise<Workshop[]> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("workshops")
    .select("id, title, format, body, sort_order")
    .order("sort_order")
    .order("created_at");
  if (error) throw new Error("Could not load workshops");
  return (data ?? []).map((w) => ({ id: w.id, title: w.title, format: w.format, body: w.body, sortOrder: w.sort_order }));
});

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

const resourceSchema = z.object({
  id: z.string().uuid().optional(),
  groupTitle: z.string().trim().min(1, "Add a group").max(120),
  title: z.string().trim().min(1, "Add a title").max(200),
  author: z.string().trim().max(200),
  note: z.string().trim().max(600),
  url: z
    .string()
    .trim()
    .max(500)
    .refine((v) => v === "" || /^https:\/\//i.test(v), "Links must start with https://"),
  sortOrder: z.number().int().min(0).max(9999),
});

export const saveResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => resourceSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const row = {
      group_title: data.groupTitle,
      title: data.title,
      author: data.author,
      note: data.note,
      url: data.url || null,
      sort_order: data.sortOrder,
    };
    const q = data.id
      ? context.supabase.from("resources").update(row).eq("id", data.id)
      : context.supabase.from("resources").insert(row);
    const { error } = await q;
    if (error) throw new Error("Could not save");
    return { ok: true };
  });

const workshopSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Add a title").max(200),
  format: z.string().trim().max(120),
  body: z.string().trim().max(1500),
  sortOrder: z.number().int().min(0).max(9999),
});

export const saveWorkshop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => workshopSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const row = { title: data.title, format: data.format, body: data.body, sort_order: data.sortOrder };
    const q = data.id
      ? context.supabase.from("workshops").update(row).eq("id", data.id)
      : context.supabase.from("workshops").insert(row);
    const { error } = await q;
    if (error) throw new Error("Could not save");
    return { ok: true };
  });

export const deleteLibraryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ kind: z.enum(["resources", "workshops"]), id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from(data.kind).delete().eq("id", data.id);
    if (error) throw new Error("Could not delete");
    return { ok: true };
  });
