import {
  type App,
  Keymap,
  type MarkdownPostProcessorContext,
  MarkdownRenderChild,
  type Plugin,
  TFile,
} from "obsidian";
import { renderNoteSummary } from "./render-note";

export const NOTE_SUMMARY_LANGUAGE = "project-summary";

/**
 * Registers the `project-summary` code block processor. The block renders a
 * read-only summary from the current note's own frontmatter and re-renders
 * when that note's metadata changes.
 */
export function registerNoteSummaryProcessor(plugin: Plugin): void {
  plugin.registerMarkdownCodeBlockProcessor(NOTE_SUMMARY_LANGUAGE, (_source, el, ctx) => {
    ctx.addChild(new NoteSummaryBlock(el, ctx, plugin.app));
  });
}

class NoteSummaryBlock extends MarkdownRenderChild {
  private readonly ctx: MarkdownPostProcessorContext;
  private readonly app: App;

  constructor(containerEl: HTMLElement, ctx: MarkdownPostProcessorContext, app: App) {
    super(containerEl);
    this.ctx = ctx;
    this.app = app;
  }

  override onload(): void {
    this.render();
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        if (file.path === this.ctx.sourcePath) this.render();
      }),
    );
  }

  private render(): void {
    const file = this.app.vault.getAbstractFileByPath(this.ctx.sourcePath);
    let name = this.ctx.sourcePath;
    let values: Record<string, unknown> | undefined;

    if (file instanceof TFile) {
      name = file.basename;
      const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
      if (frontmatter) values = frontmatter as Record<string, unknown>;
    }

    renderNoteSummary(this.containerEl, {
      name,
      values,
      interactions: {
        openLink: (linkText, event) => {
          const newLeaf = Keymap.isModEvent(event);
          void this.app.workspace.openLinkText(linkText, this.ctx.sourcePath, newLeaf);
        },
      },
    });
  }
}
