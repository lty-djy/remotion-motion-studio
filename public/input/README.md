# 固定资源库

这个目录是 AI 自动编排的唯一静态资源根目录，对应浏览器 URL `/input/`。

```text
public/input/
├─ icons/                 SVG 图标
├─ materials/
│  ├─ screenshots/         截图与静态图片
│  └─ recordings/          录屏与补充视频
├─ sfx/                   短音效
├─ resource-manifest.json 人工维护的资源语义清单
└─ resource-index.json    根据真实文件生成的技术索引
```

规则：

- Visual Script 只保存 `library + resourceId`，不保存绝对路径。
- 新增资源后先登记 `resource-manifest.json`，再运行 `npm.cmd run sync:resources`。
- 不要手改 `resource-index.json`。
- 索引对每个文件记录 SHA-256，能发现文件被替换或损坏。
- 删除资源时，同时删除 manifest 中的条目并重新生成索引。
