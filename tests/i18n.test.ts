import { describe, expect, it } from "vitest";
import { getCopy } from "../src/i18n";

describe("getCopy", () => {
  it.each(["zh", "zh-CN", "zh-TW"])("uses Chinese for %s", (language) => {
    const copy = getCopy(language);
    expect(copy.menuTitle).toBe("反转图片顺序");
    expect(copy.writeFailed).toContain("失败");
    expect(copy.reversed(3)).toBe("已反转 3 张图片");
  });

  it.each(["en", "en-US", "de", ""])("falls back to English for %s", (language) => {
    const copy = getCopy(language);
    expect(copy.menuTitle).toBe("Reverse image order");
    expect(copy.writeFailed).toContain("Could not reverse");
    expect(copy.reversed(3)).toBe("Reversed 3 images.");
  });
});
