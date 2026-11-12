# 更新记录 · Changelog

## 1.1.0 — 2026-11-12

- 网站分流测试 v2 在首页展示 6 站点快照，`/split/` 展示全部 20 个站点。两页支持自动检测、停止和重新测试。全量页支持分类筛选、出口汇总和复制 IP。
- 本地站点图标支持首字母备用样式，DM Sans 改由本站托管，移除了 Google Fonts 外链。
- 首帧恢复已保存的主题，深色切页消除白闪。顶部使用「IP 查询」和「分流测试」胶囊标签，点击当前标签不会重载。
- HTTP 403、429、451、503 显示「被拦截」和耗时。HTTP 200 无有效 IP 显示「仅延迟」。
- 41 项测试通过。

- Split-tunnel v2 adds a six-site home snapshot and a dedicated `/split/` page with all 20 sites. Both pages auto-run and support stop and retry. The full page adds category filtering, egress summaries and IP copying.
- Site icons and DM Sans are served locally, with monogram fallbacks for icons. Google Fonts requests were removed.
- The saved theme applies on first paint, removing the white flash during dark navigation. The IP lookup and Split test pill tabs keep the active page in place.
- HTTP 403, 429, 451 and 503 show **Blocked** with elapsed time. HTTP 200 without a valid IP shows **Latency only**.
- All 41 tests passed.

## 1.0.0 — 2026-11-02

首次整理公开发布版本 / Initial source distribution.

- IP、域名及 URL 查询；IPv4 / IPv6 检测与重新检测。
- DNS 多来源回退、CNAME 跟随与部分任播识别。
- 中 / 英 / 日、明暗主题、本地历史及 JSON 导出。
- 中英项目说明、贡献指南、隐私说明、部署文档及 CI 配置。
- AI 辅助制作说明与 MIT 许可证。

IP/domain/URL lookup; refreshed IPv4/IPv6 detection; DNS fallback; CNAME following; limited anycast classification; three languages; themes; local history; JSON export; bilingual documentation; tests and CI; AI disclosure and MIT licensing.
