# Image Order Reverser

A focused Obsidian plugin that reverses image and video embeds together in the active Markdown note. Click again to restore the original order.

- Supports Obsidian image and video wiki embeds, Markdown images, remote images, reference-style images, and linked media.
- Reverses images and videos in one shared sequence, including `.mkv`, `.mov`, `.mp4`, `.ogv`, and `.webm` videos.
- Preserves all surrounding text, whitespace, tables, callouts, media sizes, alt text, titles, and hyperlinks.
- Ignores frontmatter, code, comments, HTML, unresolved embeds, audio, PDFs, and other files.
- Works on desktop and mobile without accounts, network access, telemetry, or settings.
- Automatically uses Chinese when Obsidian's interface language is Chinese, and English otherwise.

## English usage

Use the ribbon button, choose **Reverse image and video order** from the active note's three-dot menu, or run **Reverse image and video order in the active note** from the command palette. You can assign a keyboard shortcut in Obsidian settings. Each run is one atomic editor change, so both clicking again and Obsidian's native undo restore the original order.

## 中文说明

一个极简 Obsidian 插件：一键反转当前 Markdown 文档中的全部图片和视频，它们共用同一顺序；再点一次即可恢复原顺序。

### 使用方式

- 点击左侧边栏的图片按钮；或
- 打开当前文档右上角的三个点菜单，选择“反转图片和视频顺序”；或
- 打开命令面板，运行“反转当前文档中的图片和视频顺序”；或
- 在 Obsidian 的快捷键设置中为该命令绑定快捷键。

每次操作都是一次原子编辑，因此也可以使用 Obsidian 自带的撤销功能恢复。

插件自动跟随 Obsidian 的界面语言：中文界面显示中文，其他语言显示英文。

### 支持范围

- Obsidian 图片嵌入：`![[image.png]]`、`![[image.png|300]]`
- Obsidian 视频嵌入：`![[video.mp4]]`、`![[video.mp4|640x360]]`
- 视频格式：`.mkv`、`.mov`、`.mp4`、`.ogv`、`.webm`
- Markdown 图片：`![alt](path)`、网络图片、引用式图片
- 媒体外层链接：`[![alt](image.png)](target)`，链接会跟随媒体一起移动
- 同一行、多图一行、表格、引用块和 Callout
- 源码模式、实时预览和阅读模式下的活动 Markdown 文档

插件只交换完整图片或视频嵌入语法，周围的文字、空行、缩进和结构不会移动。YAML 属性区、代码块、行内代码、HTML 注释、转义语法、HTML `<img>` 和 `<video>` 会被忽略。Obsidian 内链只有在实际解析到受支持的图片或视频文件时才参与反转；笔记、PDF、音频和失效链接不会被改动。

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
