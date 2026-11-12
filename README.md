<p align="center"><img src="dist/logo.svg" width="72" alt="ip查 logo"></p>

# ip查 · IP Lookup

轻量、简洁的 IP 与域名查询工具，支持中文、英语与日语。

**[在线体验](https://ip.mikies.click/) · [English README](README.en.md) · [部署指南](docs/DEPLOYMENT.md)**

本项目使用 AI 辅助制作，以 [MIT 许可证](LICENSE) 开源。欢迎使用、修改、分享，以及通过 Issues 指出问题和提交建议。

## 功能

- 检测当前网站连接地址，分别检测 IPv4 / IPv6，并支持重新检测。
- 支持 IPv4、IPv6、域名及 HTTP(S) 网址查询；网址只提取主机名，不访问其路径。
- 展示可用的国家 / 地区、城市、网络 / ASN、时区和 PTR 主机名信息。
- 同时解析 A / AAAA 记录，支持 CNAME 跟随与多个 DNS 服务回退。
- 基于公开网段及已知服务识别部分任播地址，展示识别依据与公开解析路径。
- 网站分流测试 v2。首页自动检测 6 个常用站点，独立分流页展示全部 20 个站点，支持筛选、出口汇总和复制 IP。
- 中文 / English / 日本語、明暗主题、复制地址、JSON 导出及本地查询历史。
- 无需注册；纯静态前端，无第三方运行时软件包依赖。

## AI 制作说明

项目由作者提出需求、检查体验并完成部署，使用 **OpenAI Codex** 辅助进行界面设计、代码编写、文档整理与自动化测试。AI 参与不代表结果始终准确，也不代表 OpenAI 对项目提供背书。

## 网站分流测试

首页的「分流快照」检测 ChatGPT、Claude、X、网易、字节跳动和高通中国。「查看全部 20 个站点」进入 `/split/`，可按类别筛选、查看出口与平均延迟，以及复制返回的 IP。

页面在可见且首屏渲染完成后的空闲时段自动启动一次。可以停止当前检测，也可以重新检测。探针请求由浏览器直接发送，各站点返回的有效 IP 才会计入出口汇总。延迟条显示 HTTP 请求耗时，不是 ICMP Ping。HTTP 403、429、451、503 显示「被拦截」和耗时。HTTP 200 响应未提供有效 IP 时显示「仅延迟」。超时和其他失败显示各自状态及已测耗时，浏览器因跨域策略或网络错误无法读取响应时显示「不可用」，耗时留空。站点的跨域策略会影响可测范围。[探针清单与隐私说明](docs/PRIVACY.md#网站分流测试--website-split-tunnel-test)

Discord 使用备用端点取得 IP 时会显示「备用端点」。Cloudflare trace 的地点随界面语言切换。网易、字节跳动和 ip.sb 有国家代码时，国家名随界面语言切换，城市名可能保留供应商语言。PChome、ip.cn、网易和字节跳动的归属地可能包含供应商原文，不保证三语。站点图标从本站加载，仅用于识别，商标归各站所有。图标缺失、加载失败或有版权问题时可用首字母图标替代。

## 本地运行

安装 Node.js 22 或更新版本，在项目根目录运行：

```sh
npm start
```

通过本机 HTTP 服务打开首页和全量分流页。项目无需安装运行时依赖。[首页](http://127.0.0.1:4173/) · [全量分流页](http://127.0.0.1:4173/split/)

运行测试：

```sh
npm test
```

测试覆盖输入验证、IPv4 / IPv6、PTR、DNS 回退及 CNAME、任播识别、语言切换、重新检测和分流探针。自动化网络测试使用模拟响应，实际可用性受浏览器和网络环境影响。

## 部署

网站资源已位于 `dist/`，无需构建。Cloudflare Pages 上传 `dist/` 内容时请保留 `split/`、`icons/`、`fonts/` 及分流模块和样式。若连接 Git 仓库，框架选 None，构建命令可用 `exit 0`，输出目录填 `dist`。部署后请验证首页和 `/split/`。[中英部署指南](docs/DEPLOYMENT.md)

这个仓库不包含账户配置、部署凭据或原托管平台的 Git 历史。

## 数据来源与隐私

浏览器直接访问第三方 IP / DNS 服务：

| 用途 | 来源 |
| --- | --- |
| 当前网站连接 | Cloudflare `/cdn-cgi/trace`，仅在支持的部署环境可用 |
| IPv4 / IPv6 检测 | [ipify](https://www.ipify.org/)、[icanhazip](https://icanhazip.com/) |
| 归属地与网络信息 | [FreeIPAPI](https://freeipapi.com/)、[ipwho.is](https://ipwhois.io/documentation) |
| DNS / PTR | [AliDNS](https://www.alidns.com/)、[Cloudflare DNS](https://developers.cloudflare.com/1.1.1.1/)、[Google Public DNS](https://developers.google.com/speed/public-dns) |
| 任播识别依据 | [Cloudflare 官方网段](https://www.cloudflare.com/ips/)及已知公共 DNS 服务地址 |

历史记录最多保存 8 条，仅存于当前浏览器，可清空；主题和语言偏好也保存在本地。IP 详情在当前页面会话缓存约 10 分钟；重新检测会清除详情缓存，并为地址检测请求禁用缓存。

本站源码不包含自建查询日志后端，不请求 GPS 定位。但托管平台及第三方服务仍会收到连接 IP、必要的查询信息，并可能依其政策记录请求。详细说明见[隐私说明](docs/PRIVACY.md)。

## 已知限制

- 家庭宽带、校园网和移动网络可以显示共享出口 IP，不要求独享公网 IP；无法通过网页保证获取内网地址或代理背后的真实地址。
- 代理或加速器分流可能使不同检测服务观察到不同出口，不能据此推断游戏进程的网络路径。
- IP 归属地为近似数据；部分字段可能缺失，失败会提示，不使用模拟结果填充。
- 任播不等于广播。未命中规则不代表单播；公开解析链无法保证找到隐藏源站。
- 任播网段是 `dist/anycast-ranges.js` 内的静态快照，日期见文件，**未配置每日 00:00 自动更新**。归属地查询使用实时接口，但上游数据库更新频率由供应商决定。
- 不提供 ICMP Ping、游戏实际延迟、Minecraft 状态协议或 SRV 服务发现。
- 第三方服务的配额、跨域策略和可达性会影响功能；公开源码不附带数据库或第三方服务授权。

## 项目结构

```text
dist/                  可直接部署的网页与模块
  app.js               查询、展示、历史及导出
  split/index.html     全量分流测试页
  split-core.js        首页和全量页共用的探针运行器
  split-probes.js      探针定义和响应解析
  split-widget.js/css  首页分流快照
  split-page.js/css    全量分流页交互和样式
  icons/               本地站点图标
  fonts/               本地 DM Sans 字体及授权
  network.js           当前连接与 IPv4 / IPv6 检测
  dns.js               DNS 查询、回退和 CNAME 跟随
  address-info.js      地址分类及任播识别
  anycast-ranges.js    公开网段快照
  i18n.js              中 / 英 / 日翻译
tests/                 Node.js 自动化测试
server.mjs             仅绑定本机的开发预览服务
docs/                  部署、隐私与发布说明
.github/               CI 与反馈模板
```

## 反馈与贡献

欢迎通过仓库 Issues 提交问题和建议。反馈时请遮盖自己的 IP、令牌与个人信息。安全问题请遵循 [SECURITY.md](SECURITY.md)，贡献前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 许可证

本项目采用 [MIT License](LICENSE)，允许使用、修改、再分发和商用，需保留版权与许可声明。第三方数据、服务与标识适用其各自条款。
