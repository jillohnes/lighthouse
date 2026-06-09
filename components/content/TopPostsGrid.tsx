"use client";

import Image from "next/image";
import { useState } from "react";
import { Camera, Music2 } from "lucide-react";
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
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-brand/10 bg-surface-raised shadow-sm">
      <div className="relative aspect-[9/14] w-full overflow-hidden bg-black">
        {imageFailed ? (
          <div
            className="absolute inset-0"
            style={{ background: post.imageGradient }}
          />
        ) : (
          <Image
            src={post.imageUrl}
            alt={`${post.brand} ${post.contentType} by ${post.creator}`}
            fill
            sizes="(max-width: 1280px) 20vw, 200px"
            className="object-cover"
            onError={() => setImageFailed(true)}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

        <span className="absolute left-2 top-2 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-bold text-white">
          #{rank}
        </span>
        <span className="absolute right-2 top-2 rounded bg-white/90 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-brand">
          {post.contentType}
        </span>

        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
          <span className="truncate text-[10px] font-semibold text-white drop-shadow">
            {post.brand}
          </span>
          {post.platform === "tiktok" ? (
            <Music2 className="h-3.5 w-3.5 shrink-0 text-white/90" />
          ) : (
            <Camera className="h-3.5 w-3.5 shrink-0 text-white/90" />
          )}
        </div>
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
        Balanced by high impressions and engagement — brand-relevant post imagery
      </p>

      <div className="grid grid-cols-5 gap-3">
        {posts.map((post, index) => (
          <PostCard key={post.id} post={post} rank={index + 1} />
        ))}
      </div>
    </section>
  );
}
