# GitHub 发布清单 · Publication checklist

这是一份从本地工作版本整理出的干净源码目录，不含旧 Git 历史或托管账户配置。文档中的演示地址由作者提供；当前线上部署若有后续修改，应先与本目录核对。

1. 在自己的 GitHub 账户创建公开仓库，名称建议 `ipcha`。
2. 上传本目录**内部全部文件**，包括 `.github/`、`.gitignore`、`.gitattributes` 和 `LICENSE`。不要只上传 ZIP 文件或再套一层目录。文件夹名为 `dist` 的网页资源也必须保留。
3. About 描述建议：`AI-assisted IP & domain lookup · IPv4/IPv6 · 中文 / English / 日本語`。
4. Website 填写 `https://ip.mikies.click/`；Topics 建议 `ip-lookup`、`ipv6`、`dns`、`javascript`、`cloudflare-pages`、`ai-assisted`。
5. 确认 README 中英文切换、logo 与文档链接可用；在 Actions 查看测试是否通过。
6. 在仓库 Settings 按需启用 Issues 和 Private vulnerability reporting；本文件包不会自动启用账户设置。
7. 可在确认发布内容后创建 `v1.0.0` 标签及 Release，说明参考 CHANGELOG。不要把尚未发布的版本描述为已经上线。

上传源码本身不会更改现有 Cloudflare 网站，也不会自动建立持续部署。若连接 Git 自动部署，请参照 DEPLOYMENT。

## English

Create a public repository such as `ipcha` and upload this directory's contents, including dotfiles, `.github/`, `dist/` and `LICENSE`. Do not upload only an archive or wrap everything in another folder. Set the About description, website and suggested topics above. Verify README links and Actions results. Enable Issues and private vulnerability reporting as desired; files alone do not enable account settings. Optionally create a `v1.0.0` release after reviewing the contents.

This is a clean distribution without previous Git history or hosting account configuration. Compare it with any later changes to the live site before publishing. Uploading source does not modify the current Cloudflare deployment or automatically configure continuous deployment.
