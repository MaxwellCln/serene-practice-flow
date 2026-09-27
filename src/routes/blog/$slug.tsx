import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { VideoEmbed } from "@/components/video-embed";
import { site } from "@/content/site";
import { getPublishedPost } from "@/lib/blog.functions";
import { formatPostDate } from "./index";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getPublishedPost({ data: { slug: params.slug } });
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Article"} | ${site.shortName}` },
      { name: "description", content: loaderData?.excerpt ?? site.blog.intro },
      { property: "og:title", content: loaderData?.title ?? site.practiceName },
      { property: "og:description", content: loaderData?.excerpt ?? site.blog.intro },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BlogPost,
  errorComponent: () => (
    <div className="p-12 text-center text-muted-foreground">This post couldn&apos;t load right now.</div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="text-3xl">That piece isn&apos;t here</h1>
        <p className="mt-4 text-muted-foreground">
          It may have been moved or renamed. You can browse everything from the writing page.
        </p>
        <Button asChild className="mt-8 rounded-full px-6">
          <Link to="/blog">Back to writing</Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  ),
});

function BlogPost() {
  const post = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 pt-14 pb-20 md:pt-20">
        <Link
          to="/blog"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← All writing
        </Link>
        <p className="mt-8 text-xs tracking-widest text-muted-foreground uppercase">{formatPostDate(post.publishedAt)}</p>
        <h1 className="mt-3 text-4xl leading-tight text-balance md:text-5xl">{post.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {site.shortName} · {site.credentials}
        </p>
        {post.videoUrl && (
          <div className="mt-10">
            <VideoEmbed url={post.videoUrl} title={post.title} />
          </div>
        )}
        <div className="mt-10 space-y-6 text-lg leading-relaxed text-foreground/90">
          {post.body
            .split(/\n\s*\n/)
            .filter((p) => p.trim())
            .map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para.trim()}
              </p>
            ))}
        </div>
        <div className="mt-14 rounded-3xl bg-sand p-8">
          <h2 className="text-2xl">Thinking about starting?</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{site.contact.body}</p>
          <Button asChild className="mt-6 rounded-full px-6">
            <Link to="/book">Book a session</Link>
          </Button>
        </div>
        <p className="mt-12 text-sm text-muted-foreground">{site.legal.crisisNote}</p>
      </main>
      <SiteFooter />
    </div>
  );
}
