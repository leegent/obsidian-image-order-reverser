# Image Order Reverser

A focused Obsidian plugin that reverses every image embed in the active Markdown note with one click. Click again to restore the original order.

- Supports Obsidian wiki embeds, Markdown images, remote images, reference-style images, and linked images.
- Preserves all surrounding text, whitespace, tables, callouts, image sizes, alt text, titles, and hyperlinks.
- Ignores frontmatter, code, comments, HTML, unresolved embeds, and non-image files.
- Works on desktop and mobile without accounts, network access, telemetry, or settings.

## English usage

Use the ribbon button or run **Reverse image order in the active note** from the command palette. You can assign a keyboard shortcut in Obsidian settings. Each run is one atomic editor change, so both clicking again and Obsidian's native undo restore the original order.

## 中文说明

一个极简 Obsidian 插件：一键反转当前 Markdown 文档中的全部图片，再点一次即可恢复原顺序。

### 使用方式

- 点击左侧边栏的图片按钮；或
- 打开命令面板，运行 “Reverse image order in active note”；或
- 在 Obsidian 的快捷键设置中为该命令绑定快捷键。

每次操作都是一次原子编辑，因此也可以使用 Obsidian 自带的撤销功能恢复。

### 支持范围

- Obsidian 图片嵌入：`![[image.png]]`、`![[image.png|300]]`
- Markdown 图片：`![alt](path)`、网络图片、引用式图片
- 图片外层链接：`[![alt](image.png)](target)`，链接会跟随图片一起移动
- 同一行、多图一行、表格、引用块和 Callout
- 源码模式、实时预览和阅读模式下的活动 Markdown 文档

插件只交换完整图片语法，周围的文字、空行、缩进和结构不会移动。YAML 属性区、代码块、行内代码、HTML 注释、转义语法和 HTML `<img>` 会被忽略。Obsidian 内链只有在实际解析到图片文件时才参与反转；笔记、PDF、音视频和失效链接不会被改动。

## Manual installation / 手动安装

1. 下载发布包并解压。
2. 将其中的 `main.js` 和 `manifest.json` 放到仓库目录：
   `.obsidian/plugins/image-order-reverser/`
3. 在 Obsidian 的“第三方插件”设置中启用 **Image Order Reverser**。

## Development / 本地开发

```bash
npm install
npm test
npm run build
```

构建产物为项目根目录下的 `main.js`。
