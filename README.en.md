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

## AI disclosure

The author defined the requirements, reviewed the experience and deployed the website. **OpenAI Codex** assisted with interface design, implementation, documentation and automated tests. AI involvement does not guarantee accuracy or imply endorsement by OpenAI.

## Run locally

Install Node.js 22 or newer and run from the repository root:

```sh
npm start
```

Open <http://127.0.0.1:4173>. No `npm install` is needed. Serve the site over HTTP; opening `dist/index.html` directly will not correctly load modules and root-relative assets.

```sh
npm test
```

Tests cover input validation, IPv4 / IPv6, PTR, DNS fallback and CNAME handling, anycast classification, translation and refreshed detection. Network responses are mocked; passing tests do not establish worldwide availability of external services.

## Deploy

`dist/` contains deployable assets with no build step. Upload its contents to Cloudflare Pages. For a new Git-integrated Pages project, choose framework None, use `exit 0` as the build command and `dist` as the output directory. See the [bilingual deployment guide](docs/DEPLOYMENT.md).

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
