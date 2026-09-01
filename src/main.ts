import { getLanguage, MarkdownView, Notice, Plugin, TFile } from "obsidian";
import { getCopy } from "./i18n";
import { reverseMedia } from "./reverse-media";

const MEDIA_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
  "avif",
  "mkv",
  "mov",
  "mp4",
  "ogv",
  "webm"
]);

export default class ImageOrderReverserPlugin extends Plugin {
  async onload(): Promise<void> {
    const copy = getCopy(getLanguage());

    this.addRibbonIcon("images", copy.ribbonTitle, () => {
      void this.reverseActiveNote();
    });

    this.addCommand({
      id: "reverse-images-in-active-note",
      name: copy.commandName,
      callback: () => {
        void this.reverseActiveNote();
      }
    });

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file, source, leaf) => {
        if (
          source !== "more-options" ||
          !(file instanceof TFile) ||
          file.extension !== "md"
        ) {
          return;
        }

        menu.addItem((item) => {
          item
            .setTitle(copy.menuTitle)
            .setIcon("images")
            .setSection("action")
            .onClick(() => {
              const view = leaf?.view;
              if (view instanceof MarkdownView && view.file?.path === file.path) {
                void this.reverseActiveNote(view);
              } else {
                void this.reverseActiveNote();
              }
            });
        });
      })
    );
  }

  private async reverseActiveNote(existingView?: MarkdownView): Promise<void> {
    const copy = getCopy(getLanguage());
    const view = existingView ?? this.findActiveMarkdownView();
    const sourceFile = view?.file;
    if (!view || !sourceFile) {
      new Notice(copy.openMarkdown);
      return;
    }

    const reverse = (source: string) =>
      reverseMedia(source, (linkTarget) =>
        this.isResolvedWikiMedia(linkTarget, sourceFile)
      );

    try {
      if (view.getMode() === "preview") {
        let mediaCount = 0;
        await this.app.vault.process(sourceFile, (source) => {
          const result = reverse(source);
          mediaCount = result.count;
          return result.count >= 2 ? result.text : source;
        });

        if (mediaCount < 2) {
          new Notice(mediaCount === 0 ? copy.noMedia : copy.needTwoMedia);
          return;
        }

        new Notice(copy.reversed(mediaCount));
        return;
      }

      const source = view.editor.getValue();
      const result = reverse(source);
      if (result.count < 2) {
        new Notice(result.count === 0 ? copy.noMedia : copy.needTwoMedia);
        return;
      }

      view.editor.transaction({
        changes: result.units.map((unit, index) => ({
          from: view.editor.offsetToPos(unit.start),
          to: view.editor.offsetToPos(unit.end),
          text: result.replacements[index]
        }))
      });

      new Notice(copy.reversed(result.count));
    } catch (error) {
      console.error("Image Order Reverser failed to update the note media", error);
      new Notice(copy.writeFailed);
    }
  }

  private findActiveMarkdownView(): MarkdownView | null {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    const activeFile = this.app.workspace.getActiveFile();
    if (
      activeView?.file &&
      (!activeFile || activeView.file.path === activeFile.path)
    ) {
      return activeView;
    }

    if (!activeFile || activeFile.extension !== "md") return null;

    let matchingView: MarkdownView | null = null;
    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      if (
        !matchingView &&
        view instanceof MarkdownView &&
        view.file?.path === activeFile.path
      ) {
        matchingView = view;
      }
    });
    return matchingView;
  }

  private isResolvedWikiMedia(linkTarget: string, sourceFile: TFile): boolean {
    const destination = this.app.metadataCache.getFirstLinkpathDest(
      linkTarget,
      sourceFile.path
    );
    return destination instanceof TFile && MEDIA_EXTENSIONS.has(destination.extension.toLowerCase());
  }
}
