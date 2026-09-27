import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { VideoEmbed } from "@/components/video-embed";
import { type BlogPost, deletePost, listAllPostsAdmin, savePost } from "@/lib/blog.functions";
import { toVideoEmbedUrl } from "@/lib/video";

type Draft = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  videoUrl: string;
  isPublished: boolean;
};

const empty: Draft = { title: "", slug: "", excerpt: "", body: "", videoUrl: "", isPublished: true };

const slugify = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

export function BlogManager() {
  const qc = useQueryClient();
  const fetchPosts = useServerFn(listAllPostsAdmin);
  const save = useServerFn(savePost);
  const remove = useServerFn(deletePost);
  const posts = useQuery({ queryKey: ["admin-blog"], queryFn: () => fetchPosts(), retry: false });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  const edit = (p: BlogPost) => {
    setSlugTouched(true);
    setDraft({ ...p, videoUrl: p.videoUrl ?? "" });
  };

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-blog"] });

  const submit = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      await save({ data: { ...draft, videoUrl: draft.videoUrl || null } });
      toast.success(draft.isPublished ? "Post published" : "Draft saved");
      setDraft(null);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const del = async (p: BlogPost) => {
    if (!window.confirm(`Delete “${p.title}”? This can't be undone.`)) return;
    try {
      await remove({ data: { id: p.id } });
      toast.success("Post deleted");
      await refresh();
    } catch {
      toast.error("Could not delete");
    }
  };

  const videoInvalid = !!draft?.videoUrl && !toVideoEmbedUrl(draft.videoUrl);

  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl">Blog & vlog posts</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Write a post, add a YouTube or Vimeo video, or both. Published posts appear on the
            Writing page.
          </p>
        </div>
        {!draft && (
          <Button
            className="rounded-full"
            onClick={() => {
              setSlugTouched(false);
              setDraft({ ...empty });
            }}
          >
            New post
          </Button>
        )}
      </div>

      {draft && (
        <div className="mt-6 space-y-4 rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div>
            <Label htmlFor="bp-title">Title</Label>
            <Input
              id="bp-title"
              value={draft.title}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  title: e.target.value,
                  slug: slugTouched ? draft.slug : slugify(e.target.value),
                })
              }
            />
          </div>
          <div>
            <Label htmlFor="bp-slug">Web address</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/blog/</span>
              <Input
                id="bp-slug"
                value={draft.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setDraft({ ...draft, slug: slugify(e.target.value) });
                }}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="bp-excerpt">Short summary</Label>
            <Textarea
              id="bp-excerpt"
              rows={2}
              value={draft.excerpt}
              onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="bp-video">Video link (optional)</Label>
            <Input
              id="bp-video"
              placeholder="https://www.youtube.com/watch?v=… or https://vimeo.com/…"
              value={draft.videoUrl}
              onChange={(e) => setDraft({ ...draft, videoUrl: e.target.value })}
            />
            {videoInvalid && (
              <p className="mt-1 text-sm text-destructive">Please use a YouTube or Vimeo link.</p>
            )}
            {draft.videoUrl && !videoInvalid && (
              <div className="mt-3 max-w-md">
                <VideoEmbed url={draft.videoUrl} title="Video preview" />
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="bp-body">Text</Label>
            <Textarea
              id="bp-body"
              rows={10}
              placeholder="Leave a blank line between paragraphs."
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-3 text-sm">
            <Switch
              checked={draft.isPublished}
              onCheckedChange={(v) => setDraft({ ...draft, isPublished: v })}
            />
            {draft.isPublished ? "Published — visible on the site" : "Draft — only admins can see"}
          </label>
          <div className="flex flex-wrap gap-3">
            <Button
              className="rounded-full"
              disabled={busy || videoInvalid || !draft.title || !draft.slug}
              onClick={submit}
            >
              {busy ? "Saving…" : "Save"}
            </Button>
            <Button variant="outline" className="rounded-full" onClick={() => setDraft(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <ul className="mt-6 grid gap-3">
        {posts.isLoading && <li className="text-sm text-muted-foreground">Loading posts…</li>}
        {posts.data?.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            No posts yet. Click “New post” to write the first one.
          </li>
        )}
        {posts.data?.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display text-lg">{p.title}</p>
                <Badge variant={p.isPublished ? "default" : "secondary"}>
                  {p.isPublished ? "Published" : "Draft"}
                </Badge>
                {p.videoUrl && <Badge variant="outline">Video</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">/blog/{p.slug}</p>
            </div>
            <div className="flex gap-2">
              {p.isPublished && (
                <Button asChild size="sm" variant="ghost">
                  <Link to="/blog/$slug" params={{ slug: p.slug }}>
                    View
                  </Link>
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => edit(p)}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => del(p)}>
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
