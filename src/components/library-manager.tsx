import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteLibraryItem,
  listResources,
  listWorkshops,
  type Resource,
  type Workshop,
  saveResource,
  saveWorkshop,
} from "@/lib/library.functions";

type RDraft = Omit<Resource, "id" | "url"> & { id?: string; url: string };
type WDraft = Omit<Workshop, "id"> & { id?: string };

function useDelete(kind: "resources" | "workshops", key: string) {
  const qc = useQueryClient();
  const remove = useServerFn(deleteLibraryItem);
  return async (id: string, title: string) => {
    if (!window.confirm(`Delete “${title}”?`)) return;
    try {
      await remove({ data: { kind, id } });
      toast.success("Deleted");
      await qc.invalidateQueries({ queryKey: [key] });
    } catch {
      toast.error("Could not delete");
    }
  };
}

export function ResourcesManager() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(listResources);
  const save = useServerFn(saveResource);
  const items = useQuery({ queryKey: ["resources"], queryFn: () => fetchAll() });
  const del = useDelete("resources", "resources");
  const [draft, setDraft] = useState<RDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const groups = Array.from(new Set((items.data ?? []).map((r) => r.groupTitle)));

  const submit = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      await save({ data: draft });
      toast.success("Saved");
      setDraft(null);
      await qc.invalidateQueries({ queryKey: ["resources"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl">Books & resources</h2>
          <p className="mt-2 text-sm text-muted-foreground">Shown on the Books & resources page, grouped by heading.</p>
        </div>
        {!draft && (
          <Button
            className="rounded-full"
            onClick={() =>
              setDraft({ groupTitle: groups[0] ?? "", title: "", author: "", note: "", url: "", sortOrder: (items.data?.length ?? 0) + 1 })
            }
          >
            Add a book or resource
          </Button>
        )}
      </div>
      {draft && (
        <div className="mt-6 grid gap-4 rounded-3xl border border-border bg-card p-6 sm:grid-cols-2 sm:p-8">
          <div>
            <Label htmlFor="r-group">Group heading</Label>
            <Input id="r-group" list="r-groups" value={draft.groupTitle} onChange={(e) => setDraft({ ...draft, groupTitle: e.target.value })} />
            <datalist id="r-groups">{groups.map((g) => <option key={g} value={g} />)}</datalist>
          </div>
          <div>
            <Label htmlFor="r-title">Title</Label>
            <Input id="r-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="r-author">Author or subtitle</Label>
            <Input id="r-author" value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="r-url">Link (optional)</Label>
            <Input id="r-url" placeholder="https://…" value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="r-note">Short note</Label>
            <Textarea id="r-note" rows={2} value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="r-order">Order (lower shows first)</Label>
            <Input id="r-order" type="number" min={0} value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })} />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Button className="rounded-full" disabled={busy || !draft.title || !draft.groupTitle} onClick={submit}>{busy ? "Saving…" : "Save"}</Button>
            <Button variant="outline" className="rounded-full" onClick={() => setDraft(null)}>Cancel</Button>
          </div>
        </div>
      )}
      <ul className="mt-6 grid gap-3">
        {items.data?.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">No resources yet.</li>
        )}
        {items.data?.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
            <div className="min-w-0">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">{r.groupTitle}</p>
              <p className="font-display text-lg">{r.title}</p>
              {r.author && <p className="text-sm text-muted-foreground">{r.author}</p>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setDraft({ ...r, url: r.url ?? "" })}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => del(r.id, r.title)}>Delete</Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WorkshopsManager() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(listWorkshops);
  const save = useServerFn(saveWorkshop);
  const items = useQuery({ queryKey: ["workshops"], queryFn: () => fetchAll() });
  const del = useDelete("workshops", "workshops");
  const [draft, setDraft] = useState<WDraft | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      await save({ data: draft });
      toast.success("Saved");
      setDraft(null);
      await qc.invalidateQueries({ queryKey: ["workshops"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl">Workshops</h2>
          <p className="mt-2 text-sm text-muted-foreground">Shown on the Workshops & speaking page.</p>
        </div>
        {!draft && (
          <Button className="rounded-full" onClick={() => setDraft({ title: "", format: "", body: "", sortOrder: (items.data?.length ?? 0) + 1 })}>
            Add a workshop
          </Button>
        )}
      </div>
      {draft && (
        <div className="mt-6 grid gap-4 rounded-3xl border border-border bg-card p-6 sm:grid-cols-2 sm:p-8">
          <div>
            <Label htmlFor="w-title">Title</Label>
            <Input id="w-title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="w-format">Length, format or date</Label>
            <Input id="w-format" placeholder="90 minutes · online" value={draft.format} onChange={(e) => setDraft({ ...draft, format: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="w-body">Description</Label>
            <Textarea id="w-body" rows={3} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="w-order">Order (lower shows first)</Label>
            <Input id="w-order" type="number" min={0} value={draft.sortOrder} onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })} />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Button className="rounded-full" disabled={busy || !draft.title} onClick={submit}>{busy ? "Saving…" : "Save"}</Button>
            <Button variant="outline" className="rounded-full" onClick={() => setDraft(null)}>Cancel</Button>
          </div>
        </div>
      )}
      <ul className="mt-6 grid gap-3">
        {items.data?.length === 0 && (
          <li className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">No workshops yet.</li>
        )}
        {items.data?.map((w) => (
          <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
            <div className="min-w-0">
              <p className="font-display text-lg">{w.title}</p>
              {w.format && <p className="text-sm text-muted-foreground">{w.format}</p>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setDraft({ ...w })}>Edit</Button>
              <Button size="sm" variant="ghost" onClick={() => del(w.id, w.title)}>Delete</Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
