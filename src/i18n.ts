export interface Copy {
  ribbonTitle: string;
  commandName: string;
  menuTitle: string;
  openMarkdown: string;
  noMedia: string;
  needTwoMedia: string;
  writeFailed: string;
  reversed: (count: number) => string;
}

const ENGLISH: Copy = {
  ribbonTitle: "Reverse image and video order in active note",
  commandName: "Reverse image and video order in active note",
  menuTitle: "Reverse image and video order",
  openMarkdown: "Open a Markdown note first.",
  noMedia: "No reversible images or videos found in the active note.",
  needTwoMedia: "At least two images or videos are required to reverse the order.",
  writeFailed: "Could not reverse the media. Check the developer console for details.",
  reversed: (count) => `Reversed ${count} media embeds.`
};

const CHINESE: Copy = {
  ribbonTitle: "反转当前文档中的图片和视频顺序",
  commandName: "反转当前文档中的图片和视频顺序",
  menuTitle: "反转图片和视频顺序",
  openMarkdown: "请先打开一个 Markdown 文档",
  noMedia: "当前文档中没有可反转的图片或视频",
  needTwoMedia: "图片和视频合计至少需要两个才能反转",
  writeFailed: "图片和视频顺序反转失败，请查看开发者控制台了解详情",
  reversed: (count) => `已反转 ${count} 个媒体项`
};

export function getCopy(language: string): Copy {
  return language.toLowerCase().startsWith("zh") ? CHINESE : ENGLISH;
}
