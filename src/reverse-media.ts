export type WikiMediaResolver = (linkTarget: string) => boolean;

export interface MediaUnit {
  start: number;
  end: number;
  text: string;
  kind: "markdown" | "wiki";
}

export interface ReverseResult {
  text: string;
  count: number;
  units: MediaUnit[];
  replacements: string[];
}

interface ParsedMedia {
  start: number;
  end: number;
  kind: MediaUnit["kind"];
}

/**
 * Finds image and video embeds that are safe to move. YAML frontmatter,
 * fenced code, inline code, HTML comments, HTML media, malformed syntax, and
 * escaped embed markers are deliberately ignored.
 */
export function findMediaUnits(
  source: string,
  isWikiMedia: WikiMediaResolver
): MediaUnit[] {
  const excluded = buildExcludedMask(source);
  const units: MediaUnit[] = [];

  for (let index = 0; index < source.length; ) {
    if (excluded[index] || source[index] !== "!" || isEscaped(source, index)) {
      index += 1;
      continue;
    }

    let media: ParsedMedia | null = null;
    if (source.startsWith("![[", index)) {
      media = parseWikiMedia(source, index, excluded, isWikiMedia);
    } else if (source.startsWith("![", index)) {
      media = parseMarkdownImage(source, index, excluded);
    }

    if (!media) {
      index += 1;
      continue;
    }

    const wrapped = expandLinkedMedia(source, media, excluded);
    units.push({
      ...wrapped,
      text: source.slice(wrapped.start, wrapped.end)
    });
    index = wrapped.end;
  }

  return units;
}

export function reverseMedia(
  source: string,
  isWikiMedia: WikiMediaResolver
): ReverseResult {
  const units = findMediaUnits(source, isWikiMedia);
  const replacements = units.map((_, index) => units[units.length - 1 - index].text);

  if (units.length < 2) {
    return { text: source, count: units.length, units, replacements };
  }

  const parts: string[] = [];
  let cursor = 0;
  units.forEach((unit, index) => {
    parts.push(source.slice(cursor, unit.start), replacements[index]);
    cursor = unit.end;
  });
  parts.push(source.slice(cursor));

  return {
    text: parts.join(""),
    count: units.length,
    units,
    replacements
  };
}

function parseWikiMedia(
  source: string,
  start: number,
  excluded: Uint8Array,
  isWikiMedia: WikiMediaResolver
): ParsedMedia | null {
  const lineEnd = findLineEnd(source, start);
  let close = -1;

  for (let index = start + 3; index < lineEnd - 1; index += 1) {
    if (
      !excluded[index] &&
      source[index] === "]" &&
      source[index + 1] === "]" &&
      !isEscaped(source, index)
    ) {
      close = index;
      break;
    }
  }

  if (close < 0) return null;

  const body = source.slice(start + 3, close);
  const aliasIndex = findUnescaped(body, "|");
  const linkWithSubpath = (aliasIndex < 0 ? body : body.slice(0, aliasIndex)).trim();
  const subpathIndex = findUnescaped(linkWithSubpath, "#");
  const linkTarget = (subpathIndex < 0
    ? linkWithSubpath
    : linkWithSubpath.slice(0, subpathIndex)
  ).trim();

  if (!linkTarget || !isWikiMedia(linkTarget)) return null;
  return { start, end: close + 2, kind: "wiki" };
}

function parseMarkdownImage(
  source: string,
  start: number,
  excluded: Uint8Array
): ParsedMedia | null {
  const labelEnd = parseBracketed(source, start + 1, excluded);
  if (labelEnd < 0) return null;

  let end = labelEnd;
  const suffixStart = labelEnd;
  if (source[suffixStart] === "(") {
    end = parseParenthesized(source, suffixStart, excluded);
    if (end < 0) return null;
  } else if (source[suffixStart] === "[") {
    end = parseBracketed(source, suffixStart, excluded);
    if (end < 0) return null;
  }

  return { start, end, kind: "markdown" };
}

/** Include an immediately wrapping Markdown link so its destination follows the media. */
function expandLinkedMedia(
  source: string,
  media: ParsedMedia,
  excluded: Uint8Array
): ParsedMedia {
  const outerStart = media.start - 1;
  if (
    outerStart < 0 ||
    source[outerStart] !== "[" ||
    isEscaped(source, outerStart) ||
    source[media.end] !== "]" ||
    excluded[outerStart] ||
    excluded[media.end]
  ) {
    return media;
  }

  const suffixStart = media.end + 1;
  let outerEnd = suffixStart;
  if (source[suffixStart] === "(") {
    outerEnd = parseParenthesized(source, suffixStart, excluded);
    if (outerEnd < 0) return media;
  } else if (source[suffixStart] === "[") {
    outerEnd = parseBracketed(source, suffixStart, excluded);
    if (outerEnd < 0) return media;
  }

  return { ...media, start: outerStart, end: outerEnd };
}

/** Returns the position immediately after the matching closing bracket. */
function parseBracketed(source: string, open: number, excluded: Uint8Array): number {
  if (source[open] !== "[" || excluded[open]) return -1;
  let depth = 1;

  for (let index = open + 1; index < source.length; index += 1) {
    if (excluded[index]) return -1;
    const char = source[index];
    if ((char === "\n" || char === "\r") && depth > 0) return -1;
    if (isEscaped(source, index)) continue;
    if (char === "[") depth += 1;
    if (char === "]") depth -= 1;
    if (depth === 0) return index + 1;
  }

  return -1;
}

/** Returns the position immediately after the matching closing parenthesis. */
function parseParenthesized(source: string, open: number, excluded: Uint8Array): number {
  if (source[open] !== "(" || excluded[open]) return -1;
  let depth = 1;
  let inAngleDestination = false;

  for (let index = open + 1; index < source.length; index += 1) {
    if (excluded[index]) return -1;
    const char = source[index];
    if ((char === "\n" || char === "\r") && depth > 0) return -1;
    if (isEscaped(source, index)) continue;

    if (char === "<" && depth === 1) inAngleDestination = true;
    if (char === ">" && inAngleDestination) inAngleDestination = false;
    if (inAngleDestination) continue;

    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (depth === 0) return index + 1;
  }

  return -1;
}

function buildExcludedMask(source: string): Uint8Array {
  const excluded = new Uint8Array(source.length);
  markFrontmatter(source, excluded);
  markFencedCode(source, excluded);
  markHtmlComments(source, excluded);
  markInlineCode(source, excluded);
  return excluded;
}

function markFrontmatter(source: string, excluded: Uint8Array): void {
  const bomOffset = source.charCodeAt(0) === 0xfeff ? 1 : 0;
  const firstEnd = findLineEnd(source, bomOffset);
  if (!/^---[\t ]*$/.test(source.slice(bomOffset, trimCarriageReturn(source, firstEnd)))) {
    return;
  }

  let lineStart = nextLineStart(source, firstEnd);
  while (lineStart < source.length) {
    const lineEnd = findLineEnd(source, lineStart);
    const line = source.slice(lineStart, trimCarriageReturn(source, lineEnd));
    if (/^(?:---|\.\.\.)[\t ]*$/.test(line)) {
      mark(excluded, 0, nextLineStart(source, lineEnd));
      return;
    }
    lineStart = nextLineStart(source, lineEnd);
  }

  mark(excluded, 0, source.length);
}

function markFencedCode(source: string, excluded: Uint8Array): void {
  let lineStart = 0;
  let fence: { char: "`" | "~"; length: number; start: number } | null = null;

  while (lineStart < source.length) {
    const lineEnd = findLineEnd(source, lineStart);
    const nextStart = nextLineStart(source, lineEnd);
    if (!excluded[lineStart]) {
      const line = source.slice(lineStart, trimCarriageReturn(source, lineEnd));
      const content = stripMarkdownContainers(line);

      if (!fence) {
        const opening = content.match(/^(`{3,}|~{3,})(.*)$/);
        if (opening && !(opening[1][0] === "`" && opening[2].includes("`"))) {
          fence = {
            char: opening[1][0] as "`" | "~",
            length: opening[1].length,
            start: lineStart
          };
        }
      } else {
        const closing = content.match(/^(`+|~+)[\t ]*$/);
        if (
          closing &&
          closing[1][0] === fence.char &&
          closing[1].length >= fence.length
        ) {
          mark(excluded, fence.start, nextStart);
          fence = null;
        }
      }
    }
    lineStart = nextStart;
  }

  if (fence) mark(excluded, fence.start, source.length);
}

function markHtmlComments(source: string, excluded: Uint8Array): void {
  let cursor = 0;
  while (cursor < source.length) {
    const start = source.indexOf("<!--", cursor);
    if (start < 0) return;
    const close = source.indexOf("-->", start + 4);
    const end = close < 0 ? source.length : close + 3;
    mark(excluded, start, end);
    cursor = end;
  }
}

function markInlineCode(source: string, excluded: Uint8Array): void {
  let lineStart = 0;
  while (lineStart < source.length) {
    const lineEnd = findLineEnd(source, lineStart);
    let index = lineStart;

    while (index < lineEnd) {
      if (excluded[index] || source[index] !== "`" || isEscaped(source, index)) {
        index += 1;
        continue;
      }

      const runLength = countRun(source, index, "`");
      let cursor = index + runLength;
      let close = -1;
      while (cursor < lineEnd) {
        if (!excluded[cursor] && source[cursor] === "`") {
          const candidateLength = countRun(source, cursor, "`");
          if (candidateLength === runLength) {
            close = cursor + candidateLength;
            break;
          }
          cursor += candidateLength;
        } else {
          cursor += 1;
        }
      }

      const end = close < 0 ? lineEnd : close;
      mark(excluded, index, end);
      index = end;
    }

    lineStart = nextLineStart(source, lineEnd);
  }
}

function stripMarkdownContainers(line: string): string {
  let rest = line;
  while (true) {
    const match = rest.match(/^[\t ]{0,3}>[\t ]?/);
    if (!match) break;
    rest = rest.slice(match[0].length);
  }
  return rest.replace(/^[\t ]{0,3}/, "");
}

function findUnescaped(text: string, needle: string): number {
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === needle && !isEscaped(text, index)) return index;
  }
  return -1;
}

function isEscaped(text: string, index: number): boolean {
  let slashes = 0;
  for (let cursor = index - 1; cursor >= 0 && text[cursor] === "\\"; cursor -= 1) {
    slashes += 1;
  }
  return slashes % 2 === 1;
}

function countRun(source: string, start: number, char: string): number {
  let end = start;
  while (source[end] === char) end += 1;
  return end - start;
}

function findLineEnd(source: string, start: number): number {
  const newline = source.indexOf("\n", start);
  return newline < 0 ? source.length : newline;
}

function nextLineStart(source: string, lineEnd: number): number {
  return lineEnd < source.length && source[lineEnd] === "\n" ? lineEnd + 1 : lineEnd;
}

function trimCarriageReturn(source: string, lineEnd: number): number {
  return lineEnd > 0 && source[lineEnd - 1] === "\r" ? lineEnd - 1 : lineEnd;
}

function mark(mask: Uint8Array, start: number, end: number): void {
  mask.fill(1, Math.max(0, start), Math.min(mask.length, end));
}
