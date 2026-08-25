export interface Copy {
  ribbonTitle: string;
  commandName: string;
  menuTitle: string;
  openMarkdown: string;
  noImages: string;
  needTwoImages: string;
  writeFailed: string;
  reversed: (count: number) => string;
}

const ENGLISH: Copy = {
  ribbonTitle: "Reverse image order in active note",
  commandName: "Reverse image order in active note",
  menuTitle: "Reverse image order",
  openMarkdown: "Open a Markdown note first.",
  noImages: "No reversible images found in the active note.",
  needTwoImages: "At least two images are required to reverse the order.",
  writeFailed: "Could not reverse the images. Check the developer console for details.",
  reversed: (count) => `Reversed ${count} images.`
};

const CHINESE: Copy = {
  ribbonTitle: "反转当前文档中的图片顺序",
  commandName: "反转当前文档中的图片顺序",
  menuTitle: "反转图片顺序",
  openMarkdown: "请先打开一个 Markdown 文档",
  noImages: "当前文档中没有可反转的图片",
  needTwoImages: "至少需要两张图片才能反转",
  writeFailed: "图片顺序反转失败，请查看开发者控制台了解详情",
  reversed: (count) => `已反转 ${count} 张图片`
};

export function getCopy(language: string): Copy {
  return language.toLowerCase().startsWith("zh") ? CHINESE : ENGLISH;
}
