import { MarkdownView, Notice, Plugin, TFile } from "obsidian";
import { reverseImages } from "./reverse-images";

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
  "avif"
]);

export default class ImageOrderReverserPlugin extends Plugin {
  async onload(): Promise<void> {
    this.addRibbonIcon("images", "Reverse image order in active note", () => {
      this.reverseActiveNote();
    });

    this.addCommand({
      id: "reverse-images-in-active-note",
      name: "Reverse image order in active note",
      checkCallback: (checking) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view?.file) return false;
        if (!checking) this.reverseActiveNote(view);
        return true;
      }
    });
  }

  private reverseActiveNote(existingView?: MarkdownView): void {
    const view = existingView ?? this.app.workspace.getActiveViewOfType(MarkdownView);
    const sourceFile = view?.file;
    if (!view || !sourceFile) {
      new Notice("请先打开一个 Markdown 文档");
      return;
    }

    const source = view.editor.getValue();
    const result = reverseImages(source, (linkTarget) =>
      this.isResolvedWikiImage(linkTarget, sourceFile)
    );

    if (result.count < 2) {
      new Notice(result.count === 0 ? "当前文档中没有可反转的图片" : "至少需要两张图片才能反转");
      return;
    }

    view.editor.transaction({
      changes: result.units.map((unit, index) => ({
        from: view.editor.offsetToPos(unit.start),
        to: view.editor.offsetToPos(unit.end),
        text: result.replacements[index]
      }))
    });

    new Notice(`已反转 ${result.count} 张图片`);
  }

  private isResolvedWikiImage(linkTarget: string, sourceFile: TFile): boolean {
    const destination = this.app.metadataCache.getFirstLinkpathDest(
      linkTarget,
      sourceFile.path
    );
    return destination instanceof TFile && IMAGE_EXTENSIONS.has(destination.extension.toLowerCase());
  }
}
