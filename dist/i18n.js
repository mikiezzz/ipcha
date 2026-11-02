export const languages = ['zh-CN', 'en', 'ja'];
let language = 'zh-CN';
try { const saved = globalThis.localStorage?.getItem('ipcha.language'); if (languages.includes(saved)) language = saved; } catch {}
export const getLocale = () => language;
const rows = [
['任播','Anycast','エニーキャスト'],['任播（Anycast）','Anycast','エニーキャスト（Anycast）'],
['识别依据：','Evidence:','判定根拠：'],['查看公开依据 ↗','View public source ↗','公開情報を確認 ↗'],
['源站 / 原始 IP','Origin / backend IP','オリジン / 接続先内部 IP'],['公开解析无法确定','Cannot be determined from public DNS','公開 DNS からは特定できません'],
['任播服务没有必然对应的单一原始 IP。此地址由多个节点共同提供服务。','An anycast service does not necessarily have one underlying origin IP. Multiple nodes serve this address.','エニーキャストのサービスに単一の元 IP があるとは限りません。複数のノードが同じアドレスで応答します。'],
['此地址属于任播入口网段。公开 DNS 只提供对外入口，不能据此反推出后端源站 IP。','This address is in a known anycast edge range. Public DNS exposes the entry point and cannot reveal the backend origin IP from it.','既知のエニーキャスト入口のアドレス範囲です。公開 DNS が示す入口から、背後のオリジン IP を逆算することはできません。'],
['多节点部署，无单一位置','Multiple nodes; no single location','複数ノード・単一の所在地なし'],
['IPv4 有限广播地址','IPv4 limited broadcast address','IPv4 限定ブロードキャストアドレス'],['组播地址（Multicast）','Multicast address','マルチキャストアドレス'],
['公开 DNS 解析溯源','Public DNS resolution trace','公開 DNS の解決経路'],
['以上是公开 DNS 链路；末端地址不自动等于源站 IP。','This is the public DNS chain. Its final address is not automatically an origin IP.','公開 DNS の解決経路です。最後のアドレスがオリジン IP であるとは限りません。'],
['任播识别能找到源站吗？','Can anycast detection reveal the origin?','エニーキャストの判定でオリジンはわかりますか？'],
['不能保证。任播与广播不同，也不一定存在单一原始地址。本站依据 Cloudflare 官方网段和已知公共 DNS 服务地址识别部分任播地址；未命中不代表非任播。公开 CNAME 链只说明解析路径，不能证明后端源站身份。网段快照更新于 2026-11-02。','No guarantee. Anycast differs from broadcast and may have no single underlying origin. Detection covers Cloudflare official ranges and known public DNS service addresses; no match does not prove unicast. Public CNAME chains show DNS resolution, not verified backend identity. Range snapshot: 2026-11-02.','保証できません。エニーキャストはブロードキャストとは異なり、単一の元アドレスがない場合もあります。Cloudflare の公式アドレス範囲と既知の公開 DNS アドレスの一部を判定します。未検出でも非エニーキャストとは限りません。CNAME 経路は背後のサーバーの証明ではありません。範囲の更新日：2026-11-02。'],
['解析来源：','DNS resolver:','DNS 解析元：'],
['DNS 解析服务连接失败，请检查网络后重试。','Cannot reach the DNS resolvers. Check your connection and retry.','DNS 解析サービスに接続できません。ネットワークを確認して再試行してください。'],
['部分 DNS 查询未完成，暂时无法确认该域名的地址，请重试。','Some DNS queries did not complete. The domain address cannot be confirmed yet; please retry.','一部の DNS 検索が完了していません。アドレスを確認できないため再試行してください。'],
['DNS 返回域名不存在，请检查拼写。','DNS reports that this domain does not exist. Check its spelling.','DNS はドメインが存在しないと回答しました。スペルを確認してください。'],
['该域名没有可用的 IPv4 / IPv6 地址记录。','This domain has no usable IPv4 / IPv6 address records.','このドメインには利用可能な IPv4・IPv6 アドレスレコードがありません。'],
['当前网络 IP','Current network IP','現在のネットワーク IP'],
['本次连接地址','This connection’s address','今回の接続アドレス'],
['复制本次连接地址','Copy this connection’s address','今回の接続アドレスをコピー'],
['优先检测访问本网站时的连接地址','Checking the address used to connect to this website first','このサイトへの接続に使用したアドレスを優先して確認'],
['来自本次网站连接，不沿用上次结果','Observed on this website connection, without reusing the previous result','今回のサイト接続で確認したアドレスです。前回の結果は再利用しません'],
['网站同域检测不可用，已使用备用检测来源','Website connection detection is unavailable; using a backup provider','サイト側の検出を利用できないため、予備の検出元を使用しています'],
['暂无法确认','Unable to confirm','現在確認できません'],
['检测源不可达','Detector unreachable','検出先に接続できません'],
['检测服务不可达','Detection unavailable','検出サービスに接続できません'],
['无法联系检测服务，不代表你没有 IP 地址','An unreachable detector does not mean you have no IP address','検出サービスへの接続失敗は、IP アドレスがないという意味ではありません'],
['IPv4 出口地址','IPv4 exit address','IPv4 の接続元アドレス'],
['无需独享公网 IP，家庭宽带、校园网和移动网络也可检测共享出口地址。开关代理或切换网络后，请点击重新检测。浏览器通常无法读取设备内网 IP。','A dedicated public IP is not required. Home, campus and mobile networks can show their shared exit address. Click Check again after toggling a proxy or changing networks. Browsers generally cannot read your device’s private LAN address.','専用の公開 IP は不要です。家庭・学内・モバイル回線でも共有の接続元アドレスを確認できます。プロキシや回線を切り替えた後は再検出してください。通常、ブラウザーから端末の LAN 内アドレスは取得できません。'],
['为什么 IPv6 显示暂无法确认？','Why can’t IPv6 be confirmed?','IPv6 を確認できないのはなぜ？'],
['当前网络可能未开通 IPv6，也可能是检测接口无法直连。检测失败不代表没有 IP。分流代理可能使本次网站连接和其他检测来源使用不同出口；这里显示每次请求实际观测到的地址，不推断未经过该连接的真实 IP。','Your network may not support IPv6, or the detector may be unreachable directly. A failed check does not mean you have no IP. Split proxies can use different exits for this website and other detectors. Results reflect each observed request, without inferring an unseen underlying IP.','回線が IPv6 未対応か、検出先に直接接続できない可能性があります。失敗しても IP がないとは限りません。分岐プロキシではサイトと他の検出元で出口が異なる場合があります。各リクエストで観測したアドレスを表示し、観測できない元の IP は推測しません。'],
['ip查 · 看见你的网络坐标','ip查 · Your network coordinates','ip查 · あなたのネットワーク情報'],
['ip查：查看当前公网 IPv4、IPv6、主机名、ASN 和归属地。支持 IP、域名和网址查询。','ip查: Find your public IPv4, IPv6, hostname, ASN and approximate location. Look up IP addresses, domains and URLs.','ip查：公開 IPv4・IPv6、ホスト名、ASN、おおよその地域を確認。IP・ドメイン・URL の検索に対応。'],
['ip查：首页','ip查: Home','ip查：ホーム'],
['ip查 首页','ip查 home','ip查 ホーム'],
['互联网地球中间的 ip 标志','Globe logo with ip in the center','地球の中央に ip を配置したロゴ'],
['IP 查询','IP lookup','IP 検索'],['使用说明','Help','使い方'],
['选择语言','Choose language','言語を選択'],['切换深色模式','Toggle dark mode','ダークモード切替'],
['看见你的','Explore your ','あなたの'],['网络坐标','network coordinates','ネットワーク情報'],
['从一个 IP，了解连接背后的世界。','Discover the world behind a single IP address.','ひとつの IP から、つながりの先を知る。'],
['我的公网 IP','My public IP','現在の公開 IP'],['↻ 重新检测','↻ Check again','↻ 再検出'],
['检测中','Checking','確認中'],['正在检测…','Checking…','確認中…'],['已连接','Connected','接続済み'],['未检测到','Not detected','未検出'],['可重试','Try again','再試行可能'],
['复制当前 IPv4','Copy current IPv4','現在の IPv4 をコピー'],['复制当前 IPv6','Copy current IPv6','現在の IPv6 をコピー'],
['查看 IPv4 详情 ↗','IPv4 details ↗','IPv4 の詳細 ↗'],['查看 IPv6 详情 ↗','IPv6 details ↗','IPv6 の詳細 ↗'],
['互联网出口地址','Public-facing address','インターネット接続元のアドレス'],['点击地址复制 ↗','Click address to copy ↗','アドレスをクリックしてコピー ↗'],
['独立检测 IPv6 网络连接','IPv6 connectivity checked separately','IPv6 接続を個別に検出'],
['正在获取网络与归属地信息…','Getting network and location information…','ネットワークと地域情報を取得中…'],
['显示浏览器连接检测服务时的出口 IP，代理或 VPN 可能改变检测结果。','Shows the IP used by your browser to reach the detection service. A proxy or VPN may affect the result.','検出サービスに接続した際の IP を表示します。プロキシや VPN により結果が変わる場合があります。'],
['查询另一个地址','Look up an address','別のアドレスを検索'],['IPv4 / IPv6 / 域名 / URL','IPv4 / IPv6 / Domain / URL','IPv4 / IPv6 / ドメイン / URL'],
['输入 IP、域名或 HTTP(S) 网址','Enter an IP, domain or HTTP(S) URL','IP・ドメイン・HTTP(S) URL を入力'],
['输入 IP、域名或 https:// 网址','Enter an IP, domain or https:// URL','IP・ドメイン・https:// URL を入力'],
['查询','Look up','検索'],['查询中…','Looking up…','検索中…'],['试试','Try','入力例'],['IPv6 地址','IPv6 address','IPv6 アドレス'],
['查询结果','Lookup result','検索結果'],['复制结果','Copy result','結果をコピー'],['导出 JSON ↓','Export JSON ↓','JSON を保存 ↓'],
['最近查询','Recent lookups','最近の検索'],['· 仅保存在此浏览器','· Stored only in this browser','· このブラウザーにのみ保存'],['清空','Clear','消去'],
['还没有查询记录，试着探索一个地址。','No recent lookups. Try an address.','検索履歴はまだありません。アドレスを検索してみましょう。'],
['简单一点，了解更多。','Less clutter. More clarity.','シンプルに、もっとわかりやすく。'],
['一个输入框，四种查询','One field, four ways to search','ひとつの入力欄で、4 種類の検索'],
['输入 IP、域名或 HTTP(S) 网址，自动识别并解析。域名可同时查看 A 与 AAAA 记录，点击地址查看详情。','Enter an IP, domain or HTTP(S) URL for automatic detection. View A and AAAA records for domains and select an address for details.','IP・ドメイン・HTTP(S) URL を自動で識別します。ドメインの A・AAAA レコードを表示し、アドレスを選ぶと詳細を確認できます。'],
['网络信息，一目了然','Your network at a glance','ネットワーク情報をひと目で'],
['查看国家 / 地区、城市、运营网络、ASN 和时区。主机名来自 PTR 反向解析，没有记录时如实显示。','View country / region, city, network, ASN and available timezone data. Hostnames come from PTR reverse DNS; missing records are clearly indicated.','国・地域、都市、ネットワーク、ASN、取得可能なタイムゾーンを表示します。ホスト名は PTR 逆引きで取得し、レコードがない場合も明示します。'],
['轻量，也尊重隐私','Lightweight, with privacy in mind','軽量で、プライバシーにも配慮'],
['无需注册。查询历史仅存在本机浏览器，可随时清空。查询会连接第三方 IP 和 DNS 服务，不会请求 GPS 定位。','No registration needed. History stays in this browser and can be cleared anytime. Lookups contact third-party IP and DNS services; GPS access is never requested.','登録不要。履歴はこのブラウザーに保存され、いつでも消去できます。検索時は外部の IP・DNS サービスに接続します。GPS 位置情報は要求しません。'],
['归属地为什么可能与实际位置不同？','Why can the location differ from my actual location?','表示される地域が実際の場所と異なるのはなぜ？'],
['IP 数据库提供近似归属地，可能指向运营商出口或数据中心。代理、VPN、移动网络和数据库更新延迟都会影响结果。这里不提供精确定位，也不据此判断 VPN 或网络安全性。','IP databases provide approximate locations, which may point to an ISP gateway or data center. Proxies, VPNs, mobile networks and database delays can affect results. This tool does not provide precise locations or assess VPN use or network safety.','IP データベースはおおよその地域を示し、通信事業者の出口やデータセンターを指す場合があります。プロキシ、VPN、モバイル回線、更新の遅れが結果に影響します。正確な位置特定や VPN・安全性の判定は行いません。'],
['免费服务有什么限制？','What are the free service limits?','無料サービスの制限は？'],
['主数据源','Primary provider','主なデータ提供元'],
['无需密钥，按访客 IP 限制为每 10 秒 10 次、每分钟最多 60 次；备用 IP 数据由','requires no key and allows 10 requests per 10 seconds, up to 60 per minute per visitor IP. Backup IP data is provided by','はキー不要で、訪問者 IP ごとに 10 秒あたり 10 回、1 分あたり最大 60 回です。予備の IP データ提供元は'],
['提供，免费接口当前每个网站共享 1,000 次 / 天额度，可能变化或暂时不可用。当前 IP 检测使用 ipify，DNS 使用阿里公共 DNS、Cloudflare 和 Google Public DNS，自动选择可用来源。相同 IP 详情在当前会话缓存 10 分钟。请求超时或限流会明确提示，不会显示模拟数据。','with a shared allowance of 1,000 requests per day per website on its free endpoint. Limits may change and services may be unavailable. Current IP detection uses ipify; DNS uses AliDNS, Cloudflare and Google Public DNS with automatic fallback. IP details are cached for 10 minutes in this session. Timeouts and rate limits are clearly shown; no simulated results are used.','です。無料 API は現在、サイト全体で 1 日 1,000 回を共有します。制限の変更や一時的な停止があり得ます。現在の IP は ipify、DNS は AliDNS・Cloudflare・Google Public DNS から利用可能なサービスを自動選択します。同じ IP の詳細はセッション内で 10 分間キャッシュします。タイムアウトや制限は明示し、架空の結果は表示しません。'],
['为什么 IPv6 显示未检测到？','Why is IPv6 not detected?','IPv6 が未検出になるのはなぜ？'],
['当前网络可能未开通 IPv6，也可能是代理、浏览器或检测服务暂时无法连通。一次检测失败不能证明设备不支持 IPv6；你仍可查询其他 IPv6 地址。','Your network may not support IPv6, or your proxy, browser or the detection service may be temporarily unreachable. One failed check does not prove your device lacks IPv6 support. You can still look up other IPv6 addresses.','回線が IPv6 に対応していないか、プロキシ・ブラウザー・検出サービスで一時的な接続問題が発生している可能性があります。一度の失敗だけでは端末の IPv6 非対応を意味しません。他の IPv6 アドレスは引き続き検索できます。'],
['连接世界，从了解连接开始。','Understand your connection. Explore the world.','つながりを知って、世界につながる。'],['数据：','Data:','データ：'],
['国家 / 地区','Country / Region','国 / 地域'],['城市','City','都市'],['网络 / ASN','Network / ASN','ネットワーク / ASN'],['主机名','Hostname','ホスト名'],['IP 地址','IP address','IP アドレス'],['地址类型','Address type','アドレス種別'],['主机名（PTR）','Hostname (PTR)','ホスト名（PTR）'],['省 / 州','State / Region','州 / 地域'],['网络 / 组织','Network / Organization','ネットワーク / 組織'],['所属组织','Organization','所属組織'],['时区','Timezone','タイムゾーン'],['UTC 偏移','UTC offset','UTC オフセット'],['近似经纬度','Approx. coordinates','おおよその緯度・経度'],
['无 PTR 记录','No PTR record','PTR レコードなし'],['反向解析暂不可用','Reverse DNS unavailable','逆引き DNS を利用できません'],['暂不可用','Unavailable','利用不可'],
['请输入有效的 IP、域名或 HTTP(S) 网址。','Enter a valid IP, domain or HTTP(S) URL.','有効な IP・ドメイン・HTTP(S) URL を入力してください。'],
['IPv4 地址格式不正确，每段应为 0–255。','Invalid IPv4 address. Each part must be between 0 and 255.','IPv4 の形式が正しくありません。各部分を 0〜255 にしてください。'],
['地址格式不正确，请检查后重试。','Invalid address format. Check and try again.','アドレスの形式を確認して再試行してください。'],
['仅支持不含账号密码的 HTTP(S) 网址。','Only HTTP(S) URLs without usernames or passwords are supported.','ユーザー名・パスワードを含まない HTTP(S) URL のみ対応しています。'],
['请输入有效的公网域名，例如 example.com。','Enter a valid public domain, such as example.com.','example.com などの有効な公開ドメインを入力してください。'],
['免费数据服务查询额度已用完，请稍后重试。','The free data service rate limit has been reached. Try again later.','無料データサービスの制限に達しました。しばらくして再試行してください。'],
['DNS 解析服务暂时未能完成请求，请重试。','The DNS service could not complete the request. Try again.','DNS サービスで処理できませんでした。再試行してください。'],
['该地址属于保留或内网范围，没有公网归属地。','This is a reserved or private address with no public geolocation.','予約済みまたはプライベートアドレスのため、公開の地域情報はありません。'],
['数据服务暂不可用','The data service is unavailable','データサービスを利用できません'],['未获取到公网归属地','Public geolocation unavailable','公開の地域情報を取得できません'],
['连接数据服务超时，请稍后重试。','The data service timed out. Try again later.','データサービスへの接続がタイムアウトしました。後でもう一度お試しください。'],
['无法连接数据服务，请检查网络后重试。','Cannot reach the data service. Check your connection and retry.','データサービスに接続できません。ネットワークを確認してください。'],
['查询失败，请重试。','Lookup failed. Try again.','検索に失敗しました。再試行してください。'],
['已复制','Copied','コピーしました'],['浏览器未允许复制，请手动选择文字复制','Clipboard access was denied. Select the text and copy it manually.','コピーが許可されていません。テキストを選択して手動でコピーしてください。'],['查询历史已清空','Lookup history cleared','検索履歴を消去しました'],
['正在解析地址并查询网络信息…','Resolving address and looking up network information…','アドレスを解決し、ネットワーク情報を検索中…'],
['部分 DNS 记录获取失败，可重试。','Some DNS records could not be retrieved. You can retry.','一部の DNS レコードを取得できませんでした。再試行できます。'],
['未找到可用的 A / AAAA 记录，或 DNS 服务暂不可用。','No usable A / AAAA records were found, or DNS is unavailable.','有効な A・AAAA レコードがないか、DNS を利用できません。'],
['正在查询所选 IP…','Looking up the selected IP…','選択した IP を検索中…'],['查询完成。','Lookup complete.','検索が完了しました。'],
['地址类型不匹配','Address type mismatch','アドレス種別が一致しません'],
['检测服务暂不可达。可重新检测，或在下方查询指定 IP。','The detection service is unreachable. Retry or look up a specific IP below.','検出サービスに接続できません。再検出するか、下で IP を指定して検索してください。'],
];
const dictionaries = Object.fromEntries(languages.map((locale,i)=>[locale,Object.fromEntries(rows.map(row=>[row[0],row[i]]))]));
export function translate(text, locale=language) {
  const dictionary=dictionaries[locale] || dictionaries['zh-CN'];
  const value=String(text), key=value.trim();
  if (dictionary[key] != null) return value.replace(key,dictionary[key]);
  const replacements = [
    [/^数据服务暂时不可用（(\d+)），请稍后重试。$/, n=>locale==='en'?`Data service unavailable (${n}). Try again later.`:locale==='ja'?`データサービスを利用できません（${n}）。後で再試行してください。`:key],
    [/^DNS 解析 · (\d+) 个地址 · 点击切换（CDN 地址可能因地区而异）$/, n=>locale==='en'?`DNS · ${n} addresses · Select to switch (CDN results may vary by region)`:locale==='ja'?`DNS · ${n} 件のアドレス · 選択して切替（CDN の結果は地域によって異なります）`:key],
    [/^未获取到公网归属地：(.*)$/, msg=>locale==='en'?`Public geolocation unavailable: ${translate(msg,locale)}`:locale==='ja'?`公開の地域情報を取得できません：${translate(msg,locale)}`:key],
  ];
  for(const [pattern,format] of replacements){const match=key.match(pattern);if(match)return value.replace(key,format(match[1]));}
  // Status messages may combine a completed lookup with a partial-DNS warning.
  if(key.includes(' ') && key.includes('查询完成。')) return value.replace('查询完成。',dictionary['查询完成。']).replace('部分 DNS 记录获取失败，可重试。',dictionary['部分 DNS 记录获取失败，可重试。']);
  return value;
}
export function setLanguage(locale) {
  if(!languages.includes(locale))return false;
  language=locale;try{globalThis.localStorage?.setItem('ipcha.language',locale);}catch{}
  if(typeof document!=='undefined') { applyTranslations(); document.dispatchEvent(new Event('ipcha:language')); }
  return true;
}
const originals = new WeakMap();
function update(node,key,value,set) {
  const records=originals.get(node)||{};let record=records[key];
  if(!record || record.rendered!==value)record={source:value};
  record.rendered=translate(record.source);records[key]=record;originals.set(node,records);
  if(value!==record.rendered)set(record.rendered);
}
export function applyTranslations() {
  document.documentElement.lang=language;
  const walker=document.createTreeWalker(document.documentElement,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){const n=walker.currentNode;if(n.parentElement?.closest('script,style,#language')||!n.textContent.trim())continue;update(n,'text',n.textContent,v=>n.textContent=v);}
  document.querySelectorAll('[aria-label],[title],[placeholder],[alt]').forEach(node=>{for(const attr of ['aria-label','title','placeholder','alt'])if(node.hasAttribute(attr))update(node,attr,node.getAttribute(attr),v=>node.setAttribute(attr,v));});
  const select=document.getElementById('language');if(select)select.value=language;
  const description=document.querySelector('meta[name="description"]');if(description)update(description,'content',description.content,v=>description.content=v);
}
export function initializeLanguages() {
  const select=document.getElementById('language');select.onchange=()=>setLanguage(select.value);
  applyTranslations();
  const observer=new MutationObserver(()=>{observer.disconnect();applyTranslations();observe();});
  const observe=()=>observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt']});observe();
}
