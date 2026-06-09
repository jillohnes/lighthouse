"use client";

import { useCallback, useRef } from "react";

export function reorderItems<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function useReorder<T>(items: T[], onReorder: (next: T[]) => void) {
  const dragIndex = useRef<number | null>(null);

  const getItemProps = useCallback(
    (index: number) => ({
      draggable: true,
      onDragStart: (event: React.DragEvent) => {
        dragIndex.current = index;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
      },
      onDragEnd: () => {
        dragIndex.current = null;
      },
      onDragOver: (event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      },
      onDrop: (event: React.DragEvent) => {
        event.preventDefault();
        const raw = event.dataTransfer.getData("text/plain");
        const from = raw !== "" ? Number(raw) : dragIndex.current;
        if (from === null || Number.isNaN(from) || from === index) return;
        onReorder(reorderItems(items, from, index));
        dragIndex.current = null;
      },
    }),
    [items, onReorder],
  );

  return { getItemProps };
}

export function useIdReorder<T extends string>(ids: T[], onReorder: (next: T[]) => void) {
  const getHandleProps = useCallback(
    (id: T) => ({
      draggable: true,
      onDragStart: (event: React.DragEvent) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("application/x-lighthouse-id", id);
        event.dataTransfer.setData("text/plain", id);
      },
    }),
    [],
  );

  const getDropZoneProps = useCallback(
    (id: T) => ({
      onDragOverCapture: (event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      },
      onDropCapture: (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const fromId =
          event.dataTransfer.getData("application/x-lighthouse-id") ||
          event.dataTransfer.getData("text/plain");
        if (!fromId || fromId === id) return;
        const from = ids.indexOf(fromId as T);
        const to = ids.indexOf(id);
        if (from < 0 || to < 0) return;
        onReorder(reorderItems(ids, from, to));
      },
    }),
    [ids, onReorder],
  );

  return { getHandleProps, getDropZoneProps };
}
