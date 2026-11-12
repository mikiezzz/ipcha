# 隐私说明 · Privacy

本文描述本仓库源码的行为；具体部署环境的托管日志、代理和后续改动可能不同。

- 历史记录最多 8 条，保存在浏览器 localStorage 中，可在界面清空。语言和主题偏好也在本地保存。
- 查询的 IP 及域名会发送给第三方归属地或 DNS 服务，服务商同时会看到该请求的连接地址。输入 URL 时程序提取主机名；原始输入可能保留在本地历史中，不要输入含私人信息的网址。
- 当前连接检测可能访问同站点 Cloudflare trace、ipify 和 icanhazip；DNS 使用 AliDNS、Cloudflare 和 Google；归属地使用 FreeIPAPI 和 ipwho.is。服务地址见源码与 README。
- 源码不包含 GPS 请求、自建账户系统、分析追踪脚本或查询日志后端。这不等于第三方服务或托管平台不记录请求。
- JSON 导出及截图可能包含 IP 和位置概况，分享前请脱敏。
- 查询失败或 IPv6 不可达不能证明没有 IP、没有 IPv6 或网络不安全。

## English

This document describes the distributed source. Hosting logs, proxies and later modifications may differ.

Up to eight queries, theme and language preferences are stored in browser localStorage. History can be cleared in the UI. Queried IPs and hostnames are sent to external geolocation or DNS providers, which also observe the connection IP. URL lookup extracts the hostname, but the original input may remain in local history; avoid sensitive URLs.

Connection detection may use Cloudflare trace, ipify and icanhazip. DNS uses AliDNS, Cloudflare and Google; geolocation uses FreeIPAPI and ipwho.is. See the source and README for endpoints.

The source contains no GPS requests, custom accounts, analytics tracking scripts or query-log backend. Providers and hosts may still log requests. Redact exported JSON and screenshots before sharing. Detection failure does not prove an address is absent or a network is unsafe.

## 网站分流测试 · Website split-tunnel test

首页「分流快照」和 `/split/` 在页面可见且首屏渲染完成后的空闲时段各自动启动一次检测。后台打开的页面会等到可见再启动。首页只检测 ChatGPT、Claude、X、网易、字节跳动和高通中国。全量页检测 20 个站点。两页均可停止或重新检测。

The home-page **Split snapshot** and `/split/` each start one run when visible and idle after the initial render. A page opened in the background waits until it becomes visible. The snapshot checks ChatGPT, Claude, X, NetEase, ByteDance and Qualcomm China. The full page checks all 20 sites. Both pages offer stop and restart controls.

浏览器会直接联系下列探针，每个站点可看到该次请求的出口 IP。停止会取消尚未完成的检测。服务商仍可能记录已经收到的请求。测试结果保存在页面内存，刷新后清除。站点图标由本站提供。

The browser contacts these probes directly. Each site can see the egress IP used for its request. Stopping cancels unfinished checks. Providers may log requests they have already received. Results stay in page memory and clear on reload. The site serves its icons locally.

字体文件由本站自托管，浏览器不会请求 Google Fonts。

The site serves font files locally. Browsers do not contact Google Fonts.

HTTP 403、429、451、503 显示「被拦截」和耗时。HTTP 200 响应未提供有效 IP 时显示「仅延迟」。超时和其他失败保留已测耗时。跨域或网络错误导致浏览器无法读取响应时，耗时留空。

HTTP 403, 429, 451 and 503 are marked **Blocked** with elapsed time. HTTP 200 responses without a valid IP are marked **Latency only**. Timeouts and other failures retain measured elapsed time. Browser-blocked or network failures without a readable response have no latency value.

| 页面 / Page | 首页探针域名 / Home-page probe hostnames |
| --- | --- |
| 首页 / Home | `chatgpt.com`, `claude.ai`, `x.com`, `necaptcha.nosdn.127.net`, `perfops.byte-test.com`, `www.qualcomm.cn` |

全量页使用下表中的探针。Discord 主端点失败时才请求备用端点，两页都可能补查归属地。

The full page uses the probes below. The Discord fallback is contacted only if the primary probe fails. Both pages can request optional geolocation.

| 方式 / Method | 域名 / Hostnames |
| --- | --- |
| Cloudflare trace | `chatgpt.com`, `claude.ai`, `x.com`, `grok.com`, `discord.com`, `openai.com`, `sora.com`, `www.perplexity.ai`, `medium.com`, `coinbase.com`, `www.okx.com`, `notion.so`, `gitlab.com`, `cdnjs.cloudflare.com`, `www.qualcomm.cn` |
| Discord 备用 / fallback | `gateway.discord.gg` |
| CDN 响应头 / Response headers | `necaptcha.nosdn.127.net`, `perfops.byte-test.com` |
| JSONP | `whois.pconline.com.cn` |
| IP 服务 / IP services | `my.ip.cn`, `api.ip.sb` |
| 可选归属地 / Optional geolocation | `free.freeipapi.com` |

网易或字节跳动返回有效出口 IP 且页面没有该 IP 的新鲜归属地缓存时，浏览器会向 FreeIPAPI 补查。同一次检测中相同 IP 只查一次，成功的归属地结果在页面内存缓存 10 分钟。PChome 的 JSONP 脚本在隔离的 iframe 内运行，其脚本请求遵循浏览器的跨站 Cookie 策略。

When NetEase or ByteDance returns a valid egress IP without a fresh cached location, the browser queries FreeIPAPI once per distinct address in that run. Successful location results are cached in page memory for ten minutes. PChome's JSONP script runs in an isolated iframe. Its script request follows the browser's cross-site cookie policy.

网易、字节跳动和 ip.sb 提供国家代码时，国家名在浏览器内按界面语言显示。城市名以及 PChome、ip.cn 提供的归属地可能保留供应商原文。

NetEase, ByteDance and ip.sb country names are localized in the browser when a country code is available. City names and locations from PChome and ip.cn may retain the provider's language.
