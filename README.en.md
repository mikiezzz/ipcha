<p align="center"><img src="dist/logo.svg" width="72" alt="ip查 logo"></p>

# ip查 · IP Lookup

A lightweight IP and domain lookup tool with Chinese, English and Japanese interfaces.

**[Live demo](https://ip.mikies.click/) · [中文说明](README.md) · [Deployment](docs/DEPLOYMENT.md)**

Built with AI assistance and open source under the [MIT License](LICENSE). Use, modify and share it, and report problems or suggestions through Issues.

## Features

- Detect the current connection address and IPv4 / IPv6 separately; recheck after network changes.
- Look up IPv4, IPv6, domains and HTTP(S) URLs. URLs are reduced to their hostnames; their paths are not fetched.
- Display available country / region, city, network / ASN, time zone and PTR hostname information.
- Resolve A / AAAA records with CNAME following and multiple DNS providers.
- Identify some known anycast addresses from public ranges and service addresses, with evidence and public DNS traces.
- Chinese / English / Japanese, light / dark themes, address copying, JSON export and browser-local query history.
- Static frontend, no registration and no third-party runtime packages.
- Website split-tunnel test v2 runs six probes on the home page. The dedicated page shows all 20 sites with category filters, egress summaries and IP copying.

## AI disclosure

The author defined the requirements, reviewed the experience and deployed the website. **OpenAI Codex** assisted with interface design, implementation, documentation and automated tests. AI involvement does not guarantee accuracy or imply endorsement by OpenAI.

## Website split-tunnel test

The home page's **Split snapshot** checks ChatGPT, Claude, X, NetEase, ByteDance and Qualcomm China. **View all 20 sites** opens `/split/`, where you can filter results by category, see egress and average latency summaries, and copy returned IP addresses.

Each page starts one run when it is visible and the browser is idle after the initial render. You can stop the run or test again. The browser sends requests directly to each probe and counts only valid returned IP addresses. Latency bars measure HTTP request time, not ICMP ping. HTTP 403, 429, 451 and 503 are marked **Blocked** with elapsed time. HTTP 200 responses without a valid IP are marked **Latency only**. Timeouts and other failures retain their status and elapsed time. Browser-blocked or network failures without a readable response show **Unavailable** with no latency. [Probe list and privacy details](docs/PRIVACY.md#网站分流测试--website-split-tunnel-test)

When Discord's fallback endpoint returns an IP, the row shows **Fallback endpoint**. Cloudflare trace locations follow the selected language. For NetEase, ByteDance and ip.sb, country names follow the selected language when a country code is available. City names may retain the provider's language. PChome, ip.cn, NetEase and ByteDance locations can therefore contain untranslated provider text. The site serves icons locally for identification. Trademarks belong to their respective owners. A monogram can replace an unavailable icon, an icon that fails to load, or one with copyright concerns.

## Run locally

Install Node.js 22 or newer and run from the repository root:

```sh
npm start
```

Use the local HTTP server to open either page. The project has no runtime packages to install. [Home](http://127.0.0.1:4173/) · [Full split test](http://127.0.0.1:4173/split/)

```sh
npm test
```

Tests cover input validation, IPv4 / IPv6, PTR, DNS fallback and CNAME handling, anycast classification, translation, refreshed detection and split probes. Automated network tests use simulated responses. Live availability depends on the browser and network.

## Deploy

The live site at [ip.mikies.click](https://ip.mikies.click/) is served by the Cloudflare Worker `ipcha` using static assets. The repository-root `wrangler.jsonc` points to `./dist`, including `split/`, `icons/`, and `fonts/`. To update it, run `npx wrangler@latest login` and `npx wrangler@latest deploy` from the repository root. Keep the existing domain and DNS configuration. Hard-refresh after deployment or purge the affected cache entries if stale assets persist. For rollback, use `npx wrangler@latest deployments list` and `npx wrangler@latest rollback`. See the [bilingual deployment guide](docs/DEPLOYMENT.md).

This distribution excludes account configuration, deployment credentials and the original hosting repository history.

## Data and privacy

The browser connects directly to these external services:

| Purpose | Source |
| --- | --- |
| Website connection IP | Cloudflare `/cdn-cgi/trace`, where supported |
| IPv4 / IPv6 detection | [ipify](https://www.ipify.org/), [icanhazip](https://icanhazip.com/) |
| Geolocation and network | [FreeIPAPI](https://freeipapi.com/), [ipwho.is](https://ipwhois.io/documentation) |
| DNS and PTR | [AliDNS](https://www.alidns.com/), [Cloudflare DNS](https://developers.cloudflare.com/1.1.1.1/), [Google Public DNS](https://developers.google.com/speed/public-dns) |
| Anycast evidence | [Cloudflare IP ranges](https://www.cloudflare.com/ips/) and known public DNS service addresses |

Up to eight recent queries, theme and language preferences are stored in the current browser. History can be cleared. IP details are cached in page memory for approximately ten minutes. Rechecking clears the detail cache and uses uncached address-detection requests.

This source contains no custom query-log backend and does not request GPS location. Hosting and external providers receive connection addresses and required query information and may log requests under their own policies. See [Privacy](docs/PRIVACY.md).

## Limitations

- Shared egress addresses work without a dedicated public IP. A webpage cannot guarantee discovery of LAN addresses or an address hidden behind a proxy.
- Split routing may expose different egress IPs to different services. Results do not establish the route used by a game process.
- Geolocation is approximate and fields can be missing. Failures are reported rather than replaced with sample data.
- Anycast is different from broadcast. An unmatched address is not proven unicast. Public DNS traces cannot guarantee discovery of a hidden origin.
- `dist/anycast-ranges.js` is a dated static snapshot. **No daily midnight update task is configured.** Geolocation is queried through live APIs; upstream database refresh schedules belong to the providers.
- No ICMP Ping, actual game latency, Minecraft status protocol or SRV discovery is implemented.
- External quotas, CORS policies and reachability affect availability. Publishing the code does not distribute an IP database or grant rights to external services.

## Structure

```text
dist/                  Deployable HTML, CSS, logo and JavaScript modules
  app.js               Lookup UI, history and export
  split/index.html     Full split-test page
  split-core.js        Shared probe runner
  split-probes.js      Probe definitions and response parsing
  split-widget.js/css  Home-page split snapshot
  split-page.js/css    Full split-test controls and styles
  icons/               Locally served site icons
  fonts/               Self-hosted DM Sans and its license
  network.js           Connection and IPv4 / IPv6 detection
  dns.js               DNS fallback and CNAME following
  address-info.js      Address classification
  anycast-ranges.js    Public range snapshot
  i18n.js              Chinese, English and Japanese translations
tests/                 Node.js tests
server.mjs             Loopback-only development server
docs/                  Deployment, privacy and publication notes
.github/               CI and feedback templates
```

## Feedback and contributions

Report bugs and suggestions through repository Issues. Redact personal IP addresses, tokens and private information. Read [CONTRIBUTING.md](CONTRIBUTING.md) before contributing and [SECURITY.md](SECURITY.md) for security reports.

## License

[MIT License](LICENSE). Use, modification, redistribution and commercial use are permitted, subject to retaining the copyright and license notice. Third-party data, services and marks remain subject to their respective terms.
