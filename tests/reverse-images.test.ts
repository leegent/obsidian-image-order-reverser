import { describe, expect, it } from "vitest";
import { findImageUnits, reverseImages } from "../src/reverse-images";

const IMAGE_NAMES = new Set([
  "A.png",
  "B.jpg",
  "C.svg",
  "folder/cover.webp",
  "无扩展名图片"
]);
const resolveWikiImage = (target: string): boolean => IMAGE_NAMES.has(target);

describe("reverseImages", () => {
  it("reverses mixed wiki, local Markdown, and remote Markdown images globally", () => {
    const source = [
      "before ![[A.png|300]] after",
      "![B alt](B.jpg \"B title\")",
      "![C](https://example.com/C.png)"
    ].join("\n");

    expect(reverseImages(source, resolveWikiImage).text).toBe([
      "before ![C](https://example.com/C.png) after",
      "![B alt](B.jpg \"B title\")",
      "![[A.png|300]]"
    ].join("\n"));
  });

  it("returns exactly to the original text after a second reversal", () => {
    const source = "A ![[A.png]] B ![B](B.jpg) C ![[C.svg|100x200]]";
    const once = reverseImages(source, resolveWikiImage).text;
    const twice = reverseImages(once, resolveWikiImage).text;
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

    expect(reverseImages(source, resolveWikiImage).text).toBe([
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

    expect(reverseImages(source, resolveWikiImage).text).toBe([
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

    const result = reverseImages(source, resolveWikiImage);
    expect(result.count).toBe(2);
    expect(result.text).toBe(source.replace("![[A.png]]\n![B](B.jpg)", "![B](B.jpg)\n![[A.png]]"));
  });

  it("ignores non-image and unresolved wiki embeds", () => {
    const source = "![[note]] ![[missing.png]] ![[A.png]] ![B](B.jpg)";
    const result = reverseImages(source, resolveWikiImage);
    expect(result.count).toBe(2);
    expect(result.text).toBe("![[note]] ![[missing.png]] ![B](B.jpg) ![[A.png]]");
  });

  it("supports resolved extensionless wiki images and strips subpaths before resolving", () => {
    const source = "![[无扩展名图片#crop|300]] ![[A.png]]";
    expect(findImageUnits(source, resolveWikiImage).map((unit) => unit.text)).toEqual([
      "![[无扩展名图片#crop|300]]",
      "![[A.png]]"
    ]);
  });

  it("supports reference-style Markdown images and balanced URL parentheses", () => {
    const source = "![A][ref] ![B](https://example.com/image_(2).png) ![[C.svg]]";
    expect(reverseImages(source, resolveWikiImage).text).toBe(
      "![[C.svg]] ![B](https://example.com/image_(2).png) ![A][ref]"
    );
  });

  it("skips suspicious content after an unclosed fence or frontmatter block", () => {
    expect(reverseImages("```md\n![[A.png]]\n![B](B.jpg)", resolveWikiImage).count).toBe(0);
    expect(reverseImages("---\ncover: ![[A.png]]\n![B](B.jpg)", resolveWikiImage).count).toBe(0);
  });

  it("does not change a note with fewer than two images", () => {
    const source = "Only ![[A.png]] here";
    expect(reverseImages(source, resolveWikiImage)).toMatchObject({ text: source, count: 1 });
  });
});

