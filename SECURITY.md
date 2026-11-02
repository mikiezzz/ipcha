# 安全反馈 · Security

目前只维护仓库默认分支的最新代码，不承诺旧版本安全修复或响应时限。

发现安全问题时，请勿在公开 Issue 中发布令牌、个人 IP、可利用细节或用户数据。优先使用仓库的 **Security → Advisories → Report a vulnerability**（仅在维护者启用了私密漏洞报告时可用）。若未启用，请通过维护者 GitHub 主页提供的私密联系方式联系；若没有此类渠道，可在 Issue 中仅请求建立私密联系，不公开漏洞细节。

本项目没有内置密钥，也不需要把部署凭据写入前端。若凭据已暴露，应及时在相应平台撤销或轮换，不要仅删除公开文本。

## English

Only the latest default-branch code is maintained. There is no guaranteed response time or support for old releases.

Do not post credentials, personal IP addresses, user data or exploitable details in public Issues. Prefer **Security → Advisories → Report a vulnerability** when private vulnerability reporting is enabled. Otherwise use a private contact channel listed on the maintainer's GitHub profile. If none exists, open an Issue only to request a private channel, without disclosing vulnerability details.

No secrets are required in the frontend. Revoke or rotate exposed credentials at their provider; deleting the public text alone is insufficient.
