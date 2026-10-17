import { isClosedStatus } from "./schema";
import { type CalendarDate, compareDates, dayIndex, formatShort } from "./dates";
import type { DashboardModel, MilestoneRecord, ProjectRecord } from "./model";

export interface Highlight {
  label: string;
  title: string | null;
  detail: string | null;
  extra: number;
}

export interface Highlights {
  finishFirst: Highlight;
  hardDeadline: Highlight;
  nextMilestone: Highlight;
}

function priorityScore(project: ProjectRecord): number {
  if (project.priority === "high") return 3;
  if (project.priority === "medium") return 2;
  if (project.priority === "low") return 1;
  return 0;
}

function byTargetThenName(
  aTarget: CalendarDate | null,
  bTarget: CalendarDate | null,
  aName: string,
  bName: string,
): number {
  if (aTarget && bTarget) {
    const delta = compareDates(aTarget, bTarget);
    if (delta !== 0) return delta;
  } else if (aTarget) {
    return -1;
  } else if (bTarget) {
    return 1;
  }
  return aName.localeCompare(bName);
}

function isOpen(status: ProjectRecord["status"] | MilestoneRecord["status"]): boolean {
  return !isClosedStatus(status);
}

export function selectHighlights(model: DashboardModel, today: CalendarDate): Highlights {
  const openProjects = model.projects.filter((project) => isOpen(project.status));

  const finishFirstCandidates = openProjects
    .filter((project) => project.attention === "finish-first")
    .sort((a, b) => {
      const priorityDelta = priorityScore(b) - priorityScore(a);
      if (priorityDelta !== 0) return priorityDelta;
      return byTargetThenName(a.target, b.target, a.name, b.name);
    });

  const todayIndex = dayIndex(today);
  const hardDeadlineCandidates = openProjects
    .filter(
      (project) =>
        project.hardDeadline && project.target !== null && dayIndex(project.target) >= todayIndex,
    )
    .sort((a, b) => byTargetThenName(a.target, b.target, a.name, b.name));

  const nextMilestoneCandidates = model.milestones
    .filter(
      (milestone) =>
        isOpen(milestone.status) &&
        milestone.target !== null &&
        dayIndex(milestone.target) >= todayIndex,
    )
    .sort((a, b) => byTargetThenName(a.target, b.target, a.name, b.name));

  const firstFinishFirst = finishFirstCandidates[0] ?? null;
  const firstHardDeadline = hardDeadlineCandidates[0] ?? null;
  const firstMilestone = nextMilestoneCandidates[0] ?? null;

  return {
    finishFirst: {
      label: "Finish first",
      title: firstFinishFirst?.name ?? null,
      detail: firstFinishFirst?.target ? formatShort(firstFinishFirst.target) : null,
      extra: Math.max(0, finishFirstCandidates.length - 1),
    },
    hardDeadline: {
      label: "Hard deadline",
      title: firstHardDeadline?.name ?? null,
      detail: firstHardDeadline?.target ? formatShort(firstHardDeadline.target) : null,
      extra: Math.max(0, hardDeadlineCandidates.length - 1),
    },
    nextMilestone: {
      label: "Next milestone",
      title: firstMilestone?.name ?? null,
      detail: firstMilestone?.target ? formatShort(firstMilestone.target) : null,
      extra: Math.max(0, nextMilestoneCandidates.length - 1),
    },
  };
}
