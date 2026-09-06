import { Link } from "@tanstack/react-router";

import { ChevronDown } from "lucide-react";

import { AccountMenu } from "@/components/account-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { site } from "@/content/site";

const links = [
  { href: "/#about", label: "About" },
  { href: "/#services", label: "Sessions" },
  { href: "/#approach", label: "Approach" },
];

const moreLinks = [
  { to: "/faqs", label: "FAQs", note: "How sessions work" },
  { to: "/resources", label: "Books & resources", note: "A short reading list" },
  { to: "/workshops", label: "Workshops & speaking", note: "For teams and groups" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link to="/" className="font-display text-lg leading-tight tracking-tight">
          {site.shortName}
          <span className="block text-[11px] tracking-widest text-muted-foreground uppercase">
            Psychotherapy
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <MoreMenu />
        </nav>

        <div className="flex items-center gap-1">
          <div className="md:hidden">
            <MoreMenu />
          </div>
          <Button asChild size="sm" className="rounded-full px-5">
            <Link to="/book">Book</Link>
          </Button>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}

function MoreMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group inline-flex items-center gap-1 rounded-full px-2 py-1 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
        More
        <ChevronDown
          className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180"
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-64 rounded-2xl border-border bg-card p-2"
      >
        {moreLinks.map((item) => (
          <DropdownMenuItem key={item.to} asChild className="rounded-xl p-0">
            <Link to={item.to} className="block cursor-pointer px-3 py-2.5">
              <span className="block text-sm">{item.label}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{item.note}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
