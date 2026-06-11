"use client";

import Image from "next/image";
import type { ContentTopPost } from "@/lib/types";

interface TopPostsGridProps {
  posts: ContentTopPost[];
}

function formatImpressions(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatHandle(handle: string): string {
  const trimmed = handle.replace(/^@+/, "");
  return trimmed ? `@${trimmed}` : "";
}

function PostCard({
  post,
  rank,
}: {
  post: ContentTopPost;
  rank: number;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-brand/10 bg-surface-raised shadow-sm">
      <div className="relative aspect-[9/14] w-full overflow-hidden bg-black">
        <Image
          src={post.imageUrl}
          alt={`${post.brand} ${post.contentType} reel by ${post.creator}`}
          fill
          sizes="(max-width: 1280px) 20vw, 200px"
          className="object-cover"
          priority={rank <= 5}
        />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-2.5">
        <div>
          <p className="truncate text-[11px] font-semibold text-foreground">
            {post.creator}
          </p>
          <p className="truncate text-[10px] text-muted">{formatHandle(post.handle)}</p>
          <div className="mt-1 flex items-center justify-between gap-1 text-[9px]">
            <span className="text-muted">{post.market}</span>
            <span className="font-medium text-brand">{post.brand}</span>
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-x-2 gap-y-1 border-t border-brand/8 pt-2 text-[9px]">
          <div>
            <p className="text-muted">Organic</p>
            <p className="font-semibold tabular-nums text-foreground">
              {formatImpressions(post.organicImpressions)}
            </p>
          </div>
          <div>
            <p className="text-muted">Paid</p>
            <p className="font-semibold tabular-nums text-foreground">
              {formatImpressions(post.paidImpressions)}
            </p>
          </div>
          <div>
            <p className="text-muted">Eng Rate</p>
            <p className="font-semibold tabular-nums text-foreground">
              {(post.engRate * 100).toFixed(2)}%
            </p>
          </div>
          <div>
            <p className="text-muted">CTR</p>
            <p className="font-semibold tabular-nums text-foreground">
              {(post.ctr * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

export function TopPostsGrid({ posts }: TopPostsGridProps) {
  return (
    <section className="rounded-lg border border-brand/8 bg-white p-5 shadow-sm">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
        Top 10 Performing Posts
      </p>
      <p className="mb-4 text-[11px] text-muted">
        Balanced by high impressions and engagement — reel stills from top creators
      </p>

      <div className="grid grid-cols-5 gap-3">
        {posts.map((post, index) => (
          <PostCard key={post.id} post={post} rank={index + 1} />
        ))}
      </div>
    </section>
  );
}
