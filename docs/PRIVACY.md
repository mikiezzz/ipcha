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
