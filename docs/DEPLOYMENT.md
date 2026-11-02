# 部署指南 · Deployment

## Cloudflare Pages：手动上传

1. 进入自己的 Cloudflare 账户，创建一个 Pages 项目并选择直接上传资源。
2. 上传 `dist/` 文件夹，或将其**内部文件**压缩成 ZIP 后上传。压缩包根目录必须直接包含 `index.html`，不要再包一层 `dist/`。
3. 完成部署，用生成的 `pages.dev` 测试网址验证功能，再按需绑定自己的域名。

不要上传整个仓库作为网页资源；测试、文档和开发预览服务不需要部署。浏览器上传可用 ZIP，Wrangler CLI 使用文件夹。

## 新建 Git 集成项目

连接自己的 GitHub 仓库，生产分支选择实际默认分支，框架预设 None，构建命令 `exit 0`，构建输出目录 `dist`，项目根目录为仓库根目录。本项目没有构建依赖或必需的环境变量。

直接上传项目不能直接切换为 Git 集成；若已手动上传，想使用 Git 自动部署，需要另建 Git 集成项目并安排域名切换。不要覆盖其他项目或未经核对修改 DNS。

官方参考：[直接上传](https://developers.cloudflare.com/pages/get-started/direct-upload/) · [Git 集成](https://developers.cloudflare.com/pages/get-started/git-integration/) · [自定义域名](https://developers.cloudflare.com/pages/configuration/custom-domains/)。平台配额与服务政策以官方当前说明为准。

## 验收

- 检查样式和 logo，切换中 / 英 / 日及明暗主题，检查手机宽度。
- 检查当前连接、IPv4 / IPv6 和重新检测；不要把检测失败误当作没有该协议。
- 查询公开示例 `8.8.8.8`、`2606:4700:4700::1111`、`cloudflare.com` 和 `https://example.com/path`；DNS 地址和归属地可随时间变化。
- 检查无效输入、失败提示、复制、JSON 导出、历史保存及清空。
- 开关代理后重新检测，注意不同来源可能使用不同出口。

任播规则没有自动更新任务。若维护规则，请核对官方来源，更新日期，并运行测试。不要在前端放置私有 API 密钥。普通静态托管也可使用，但同站点 `/cdn-cgi/trace` 可能不可用，届时依赖外部检测服务。默认根路径资源不适合直接部署到带仓库子路径的 GitHub Pages。

## English

For manual Cloudflare Pages deployment, create a Direct Upload project and upload the `dist/` directory or a ZIP of its **contents**. `index.html` must be at the archive root. Do not deploy the entire repository. The dashboard accepts ZIP files; Wrangler uses a folder. Validate the generated `pages.dev` URL before adding a domain.

For a new Git-integrated Pages project, connect the GitHub repository, select the actual default branch, choose framework None, use build command `exit 0`, output directory `dist` and the repository root as project root. No build dependencies or required environment variables exist. Direct Upload projects cannot be converted to Git integration; create a separate Git-integrated project if needed and plan the domain migration.

Check all languages, themes, mobile layout, current connection detection, IPv4 / IPv6, rechecking, public example lookups, invalid input, error states, copying, JSON export and local history. DNS and geolocation results can change. Proxy split routing may produce different egress addresses.

There is no automatic range-update schedule. Verify official sources and rerun tests when changing ranges. Never place private API keys in frontend code. Other static hosts can serve the site, but may lack `/cdn-cgi/trace`, requiring external detection fallbacks. Root-relative assets need adjustment for GitHub Pages repository subpaths. See the official documentation links above.
