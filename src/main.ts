import { Plugin } from "obsidian";
import { registerNoteSummaryProcessor } from "./note-summary";
import {
  PROJECT_TIMELINE_VIEW_TYPE,
  ProjectTimelineView,
  SCALE_OPTION_KEY,
  SHOW_COMPLETED_OPTION_KEY,
} from "./view";

/**
 * Project Dashboard plugin entry point.
 *
 * Startup work is intentionally minimal: one Bases view registration and one
 * Markdown code block processor. No vault scans, network calls, or timers.
 */
export default class ProjectDashboardPlugin extends Plugin {
  override onload(): void {
    const registered = this.registerTimelineView();
    if (!registered) {
      // Bases may not be enabled yet when community plugins load (for example
      // on a fresh profile). Retry once the workspace layout is ready, which
      // is after all core plugins have been enabled.
      this.app.workspace.onLayoutReady(() => {
        if (!this.registerTimelineView()) {
          console.warn(
            "Project Dashboard: the Bases core plugin is not enabled, so the Timeline view is unavailable. The project-summary code block still works.",
          );
        }
      });
    }
    registerNoteSummaryProcessor(this);
  }

  private registerTimelineView(): boolean {
    return this.registerBasesView(PROJECT_TIMELINE_VIEW_TYPE, {
      name: "Project timeline",
      icon: "lucide-gantt-chart",
      factory: (controller, containerEl) => new ProjectTimelineView(controller, containerEl),
      options: () => [
        {
          type: "dropdown",
          key: SCALE_OPTION_KEY,
          displayName: "Scale",
          default: "automatic",
          options: {
            automatic: "Automatic",
            weeks: "Weeks",
            months: "Months",
          },
        },
        {
          type: "toggle",
          key: SHOW_COMPLETED_OPTION_KEY,
          displayName: "Show completed and cancelled",
          default: false,
        },
      ],
    });
  }
}
