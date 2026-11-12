# 部署指南 · Deployment

## 更新现有 Cloudflare Worker

线上站点 [ip.mikies.click](https://ip.mikies.click/) 由 Cloudflare Worker `ipcha` 提供静态资源。仓库根目录的 `wrangler.jsonc` 将 `./dist` 指定为静态资源目录，其中包括 `split/`、`icons/` 和 `fonts/`。现有自定义域和路由在 Cloudflare 控制台管理。

1. 在仓库根目录运行 `npm test`。
2. 登录拥有现有 `ipcha` Worker 的 Cloudflare 账户。
3. 计划更新线上资源时，在同一目录运行以下命令：

```sh
npx wrangler@latest login
npx wrangler@latest deploy
```

部署目标是已有的 `ipcha` Worker。保留其现有域名、路由和 DNS 配置。部署后检查首页、`/split/`、图标和字体，并验证主题切换与查询。若仍看到旧资源，先强制刷新，必要时在 Cloudflare 清除相关缓存。

## 回滚

在仓库根目录查看 `ipcha` 的部署历史并按提示选择上一版：

```sh
npx wrangler@latest deployments list
npx wrangler@latest rollback
```

回滚后再次验证自定义域、首页和 `/split/`。

## English

The live site at [ip.mikies.click](https://ip.mikies.click/) serves static assets from the Cloudflare Worker named `ipcha`. The repository-root `wrangler.jsonc` points to `./dist`, including `split/`, `icons/`, and `fonts/`. Manage the existing custom domain and routes in the Cloudflare dashboard.

Run `npm test` from the repository root. To update production, sign in to the Cloudflare account that owns the existing Worker with `npx wrangler@latest login`, then run `npx wrangler@latest deploy` from the same directory. Keep the existing domain, routes and DNS configuration. Verify the home page, `/split/`, icons, fonts, theme switching and lookups. If stale assets persist after a hard refresh, purge the affected cache entries.

For rollback, run `npx wrangler@latest deployments list` and `npx wrangler@latest rollback`, then verify the custom domain and both pages again.

[Workers 静态资源 / Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) · [Wrangler 命令 / Wrangler commands](https://developers.cloudflare.com/workers/wrangler/commands/)

## 附录：其他托管方式 · Alternative hosting

Cloudflare Pages 可用于单独托管副本。上传 `dist/` 的内容并保留目录结构即可。当前线上站点的更新使用上面的 Workers 流程。 [Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
