import {
  BasesView,
  type HoverParent,
  type HoverPopover,
  Keymap,
  type QueryController,
} from "obsidian";
import { entryToRawRow } from "./adapter";
import { type CalendarDate, todayLocal } from "./dates";
import { buildDashboard } from "./model";
import { renderDashboard } from "./render";
import { buildScale, coerceScaleOption, rangeForItems } from "./scale";
import { selectHighlights } from "./select";

export const PROJECT_TIMELINE_VIEW_TYPE = "project-timeline";
export const SCALE_OPTION_KEY = "scale";
export const SHOW_COMPLETED_OPTION_KEY = "showCompleted";

/**
 * Read-only Bases view that renders the project timeline.
 *
 * The view reads `note.*` values from the Bases result set, normalizes them
 * through the plugin's own schema, and renders plain DOM. It never writes to
 * the vault and never performs network or timer work.
 */
export class ProjectTimelineView extends BasesView implements HoverParent {
  hoverPopover: HoverPopover | null = null;
  readonly type = PROJECT_TIMELINE_VIEW_TYPE;
  private readonly hostEl: HTMLElement;

  constructor(controller: QueryController, parentEl: HTMLElement) {
    super(controller);
    this.hostEl = parentEl.createDiv({ cls: "project-dashboard-host" });
  }

  override onDataUpdated(): void {
    const rows = this.data.data.map((entry) => entryToRawRow(entry));
    const showCompleted = this.config.get(SHOW_COMPLETED_OPTION_KEY) === true;
    const today = todayLocal();

    const model = buildDashboard(rows, {
      showCompleted,
      resolveLink: (linkText, sourcePath) => {
        const dest = this.app.metadataCache.getFirstLinkpathDest(linkText, sourcePath);
        return dest ? dest.path : null;
      },
    });

    const highlights = selectHighlights(model, today);

    const extraDates: CalendarDate[] = [];
    for (const item of model.timeline) {
      for (const milestone of item.project.milestones) {
        if (milestone.target !== null) extraDates.push(milestone.target);
      }
    }

    const range = rangeForItems(model.timeline, extraDates, today);
    const scale = range
      ? buildScale(range, coerceScaleOption(this.config.get(SCALE_OPTION_KEY)), today)
      : null;

    renderDashboard({
      container: this.hostEl,
      model,
      scale,
      highlights,
      showCompleted,
      today,
      interactions: {
        openNote: (path, event) => this.openNote(path, event),
        hoverNote: (linktext, event, targetEl) => this.showHover(linktext, event, targetEl),
      },
    });
  }

  private openNote(path: string, event: MouseEvent): void {
    const newLeaf = Keymap.isModEvent(event);
    void this.app.workspace.openLinkText(path, "", newLeaf);
  }

  private showHover(linktext: string, event: MouseEvent, targetEl: HTMLElement): void {
    this.app.workspace.trigger("hover-link", {
      event,
      source: PROJECT_TIMELINE_VIEW_TYPE,
      hoverParent: this,
      targetEl,
      linktext,
    });
  }
}
