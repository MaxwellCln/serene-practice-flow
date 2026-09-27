import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/content/site";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: `${site.blog.heading} | ${site.shortName}` },
      { name: "description", content: site.blog.intro },
      { property: "og:title", content: `${site.blog.heading} | ${site.practiceName}` },
      { property: "og:description", content: site.blog.intro },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 pt-14 pb-20 md:pt-20">
        <h1 className="text-4xl text-balance md:text-5xl">{site.blog.heading}</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {site.blog.intro}
        </p>
        <ul className="mt-12 space-y-6">
          {site.blog.posts.map((post) => (
            <li key={post.slug}>
              <Link
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="block rounded-2xl border border-border bg-card p-7 transition-colors hover:border-accent/60"
              >
                <p className="text-xs tracking-widest text-muted-foreground uppercase">
                  {post.date}
                </p>
                <h2 className="mt-2 text-2xl text-balance">{post.title}</h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{post.excerpt}</p>
                <span className="mt-4 inline-block text-sm text-primary">Read →</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-14 max-w-2xl text-sm text-muted-foreground">{site.legal.crisisNote}</p>
      </main>
      <SiteFooter />
    </div>
  );
}
