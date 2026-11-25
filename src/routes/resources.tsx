import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/content/site";
import { listResources } from "@/lib/library.functions";

const resourcesQuery = queryOptions({ queryKey: ["resources"], queryFn: () => listResources() });

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: `Books & resources | ${site.practiceName}` },
      { name: "description", content: site.resources.intro },
      { property: "og:title", content: `Books & resources | ${site.practiceName}` },
      { property: "og:description", content: site.resources.intro },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(resourcesQuery),
  component: ResourcesPage,
});

function ResourcesPage() {
  const { data } = useSuspenseQuery(resourcesQuery);
  const groups: { title: string; items: typeof data }[] = [];
  for (const r of data) {
    let g = groups.find((x) => x.title === r.groupTitle);
    if (!g) groups.push((g = { title: r.groupTitle, items: [] }));
    g.items.push(r);
  }
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 pt-14 pb-20 md:pt-20">
        <h1 className="text-4xl text-balance md:text-5xl">{site.resources.heading}</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {site.resources.intro}
        </p>
        <div className="mt-12 space-y-12">
          {groups.map((group) => (
            <section key={group.title}>
              <h2 className="font-display text-sm tracking-widest text-muted-foreground uppercase">
                {group.title}
              </h2>
              <ul className="mt-5 grid gap-4 md:grid-cols-2">
                {group.items.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-border bg-card p-6"
                  >
                    <p className="text-lg">
                      {item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                          {item.title}
                        </a>
                      ) : (
                        item.title
                      )}
                    </p>
                    <p className="mt-1 text-sm text-accent">{item.author}</p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.note}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="mt-14 max-w-2xl text-sm text-muted-foreground">{site.legal.crisisNote}</p>
      </main>
      <SiteFooter />
    </div>
  );
}
