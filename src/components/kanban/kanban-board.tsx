"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { STATUS_LABELS, STATUS_ORDER } from "@/lib/constants";
import { updateApplicationStatus } from "@/lib/firebase/applications";
import type { Application, ApplicationStatus } from "@/types";

import { KanbanCardOverlay } from "./kanban-card";
import { KanbanColumn } from "./kanban-column";

interface KanbanBoardProps {
  applications: Application[];
  needsAttentionAfterDays?: number;
}

export function KanbanBoard({
  applications,
  needsAttentionAfterDays = 14,
}: KanbanBoardProps) {
  const [overrides, setOverrides] = useState<Record<string, ApplicationStatus>>(
    {},
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const effective = useMemo(
    () =>
      applications.map((application) => {
        const override = overrides[application.id];
        return override && override !== application.status
          ? { ...application, status: override }
          : application;
      }),
    [applications, overrides],
  );

  const columns = useMemo(() => {
    const grouped = new Map<ApplicationStatus, Application[]>();
    STATUS_ORDER.forEach((status) => grouped.set(status, []));
    effective.forEach((application) => {
      grouped.get(application.status)?.push(application);
    });
    return grouped;
  }, [effective]);

  const activeApplication = activeId
    ? (effective.find((application) => application.id === activeId) ?? null)
    : null;

  const applyStatusChange = useCallback(
    async (application: Application, status: ApplicationStatus) => {
      if (application.status === status) return;

      setOverrides((previous) => ({ ...previous, [application.id]: status }));

      try {
        await updateApplicationStatus(application.id, status);
        toast.success(`Status geändert: ${STATUS_LABELS[status]}`, {
          description: application.unternehmen || undefined,
        });
      } catch (cause) {
        setOverrides((previous) => {
          const next = { ...previous };
          delete next[application.id];
          return next;
        });
        toast.error("Status konnte nicht geändert werden.", {
          description:
            cause instanceof Error ? cause.message : "Unbekannter Fehler.",
        });
      }
    },
    [],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const target = (over.data.current?.status ?? over.id) as ApplicationStatus;
      if (!STATUS_ORDER.includes(target)) return;

      const application = effective.find((item) => item.id === String(active.id));
      if (!application) return;

      void applyStatusChange(application, target);
    },
    [applyStatusChange, effective],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="-mx-4 flex w-full min-w-0 max-w-full snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-4 pb-4 sm:snap-none md:mx-0 md:px-0">
        {STATUS_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            applications={columns.get(status) ?? []}
            needsAttentionAfterDays={needsAttentionAfterDays}
            onStatusChange={applyStatusChange}
          />
        ))}
      </div>

      <DragOverlay>
        {activeApplication ? (
          <KanbanCardOverlay
            application={activeApplication}
            needsAttentionAfterDays={needsAttentionAfterDays}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
