import { describe, expect, it } from "vitest";
import { findMediaUnits, reverseMedia } from "../src/reverse-media";

const MEDIA_NAMES = new Set([
  "A.png",
  "B.jpg",
  "C.svg",
  "folder/cover.webp",
  "无扩展名图片",
  "clip.mp4",
  "movie.mov",
  "scene.mkv",
  "demo.ogv",
  "recording.webm"
]);
const resolveWikiMedia = (target: string): boolean => MEDIA_NAMES.has(target);

describe("reverseMedia", () => {
  it("reverses images and videos in one shared sequence", () => {
    const source = [
      "![[A.png|300]]",
      "![[clip.mp4|640x360]]",
      "![C](https://example.com/C.png)"
    ].join("\n");

    expect(reverseMedia(source, resolveWikiMedia).text).toBe([
      "![C](https://example.com/C.png)",
      "![[clip.mp4|640x360]]",
      "![[A.png|300]]"
    ].join("\n"));
  });

  it("recognizes every video format supported by Obsidian", () => {
    const source = "![[scene.mkv]] ![[movie.mov]] ![[clip.mp4]] ![[demo.ogv]] ![[recording.webm]]";
    expect(findMediaUnits(source, resolveWikiMedia).map((unit) => unit.text)).toEqual([
      "![[scene.mkv]]",
      "![[movie.mov]]",
      "![[clip.mp4]]",
      "![[demo.ogv]]",
      "![[recording.webm]]"
    ]);
  });

  it("reverses mixed wiki, local Markdown, and remote Markdown images globally", () => {
    const source = [
      "before ![[A.png|300]] after",
      "![B alt](B.jpg \"B title\")",
      "![C](https://example.com/C.png)"
    ].join("\n");

    expect(reverseMedia(source, resolveWikiMedia).text).toBe([
      "before ![C](https://example.com/C.png) after",
      "![B alt](B.jpg \"B title\")",
      "![[A.png|300]]"
    ].join("\n"));
  });

  it("returns exactly to the original text after a second reversal", () => {
    const source = "A ![[A.png]] B ![[clip.mp4|640]] C ![[C.svg|100x200]]";
    const once = reverseMedia(source, resolveWikiMedia).text;
    const twice = reverseMedia(once, resolveWikiMedia).text;
    expect(twice).toBe(source);
  });

  it("leaves all text, whitespace, table syntax, and callout markers in place", () => {
    const source = [
      "> [!note] First ![[A.png]]",
      "",
      "| left | right |",
      "| --- | --- |",
      "| ![B](B.jpg) | ![[C.svg]] |"
    ].join("\n");

    expect(reverseMedia(source, resolveWikiMedia).text).toBe([
      "> [!note] First ![[C.svg]]",
      "",
      "| left | right |",
      "| --- | --- |",
      "| ![B](B.jpg) | ![[A.png]] |"
    ].join("\n"));
  });

  it("moves an image together with its outer hyperlink", () => {
    const source = [
      "[![A](A.png)](https://example.com/a)",
      "[![[B.jpg|200]]](https://example.com/b)"
    ].join("\n");

    expect(reverseMedia(source, resolveWikiMedia).text).toBe([
      "[![[B.jpg|200]]](https://example.com/b)",
      "[![A](A.png)](https://example.com/a)"
    ].join("\n"));
  });

  it("ignores YAML, fenced code, inline code, comments, escaped syntax, and HTML", () => {
    const source = [
      "---",
      "cover: '![[C.svg]]'",
      "---",
      "```md",
      "![[C.svg]]",
      "```",
      "`![code](C.png)`",
      "<!-- ![[C.svg]] -->",
      "\\![[C.svg]]",
      '<img src="C.png">',
      "![[A.png]]",
      "![B](B.jpg)"
    ].join("\n");

    const result = reverseMedia(source, resolveWikiMedia);
    expect(result.count).toBe(2);
    expect(result.text).toBe(source.replace("![[A.png]]\n![B](B.jpg)", "![B](B.jpg)\n![[A.png]]"));
  });

  it("ignores non-media and unresolved wiki embeds", () => {
    const source = "![[note]] ![[report.pdf]] ![[missing.mp4]] ![[A.png]] ![B](B.jpg)";
    const result = reverseMedia(source, resolveWikiMedia);
    expect(result.count).toBe(2);
    expect(result.text).toBe("![[note]] ![[report.pdf]] ![[missing.mp4]] ![B](B.jpg) ![[A.png]]");
  });

  it("supports resolved extensionless wiki images and strips subpaths before resolving", () => {
    const source = "![[无扩展名图片#crop|300]] ![[A.png]]";
    expect(findMediaUnits(source, resolveWikiMedia).map((unit) => unit.text)).toEqual([
      "![[无扩展名图片#crop|300]]",
      "![[A.png]]"
    ]);
  });

  it("supports reference-style Markdown images and balanced URL parentheses", () => {
    const source = "![A][ref] ![B](https://example.com/image_(2).png) ![[C.svg]]";
    expect(reverseMedia(source, resolveWikiMedia).text).toBe(
      "![[C.svg]] ![B](https://example.com/image_(2).png) ![A][ref]"
    );
  });

  it("skips suspicious content after an unclosed fence or frontmatter block", () => {
    expect(reverseMedia("```md\n![[A.png]]\n![B](B.jpg)", resolveWikiMedia).count).toBe(0);
    expect(reverseMedia("---\ncover: ![[A.png]]\n![B](B.jpg)", resolveWikiMedia).count).toBe(0);
  });

  it("does not change a note with fewer than two media embeds", () => {
    const source = "Only ![[A.png]] here";
    expect(reverseMedia(source, resolveWikiMedia)).toMatchObject({ text: source, count: 1 });
  });
});
