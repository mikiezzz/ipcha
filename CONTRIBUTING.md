# 贡献指南 · Contributing

欢迎反馈错误、提出建议和提交 Pull Request。可以使用中文或英语。

## 报告问题

先搜索现有 Issues。请提供复现步骤、预期与实际结果、浏览器版本，以及经过脱敏的截图。尽量使用公开示例地址复现；不要上传自己的 IP、身份信息、令牌或完整网络日志。

功能建议请描述要解决的问题、使用场景和期望行为。不保证每个请求都能实现，也不承诺响应时限。安全问题请阅读 [SECURITY.md](SECURITY.md)。

## 修改代码

1. Fork 仓库并创建分支，一次修改聚焦一个问题。
2. 使用 Node.js 22 或更新版本，运行 `npm start` 进行预览。
3. 运行 `npm test`，为有意义的逻辑变更增加或更新测试。
4. 修改用户可见文案时，检查中文、英语和日语；检查明暗主题与窄屏布局。
5. 在 PR 中说明问题、修改后的行为及验证方式，不提交账户配置和凭据。

可以使用 AI 辅助，但请自行理解并检查提交内容，说明 AI 的重要参与，不提交未经验证的功能或伪造的测试结果。贡献按本项目 MIT 许可证提交；第三方代码应保留其许可与来源。

## English

Bug reports, ideas and pull requests are welcome in Chinese or English. Search existing Issues first. Include reproduction steps, expected and actual behavior, browser version and redacted screenshots. Prefer public example addresses; never post personal IPs, credentials or raw network logs.

For code changes, use a focused branch, preview with `npm start` and run `npm test` on Node.js 22+. Add meaningful regression coverage for logic changes. Check all three languages, both themes and narrow screens when changing the UI. Explain behavior and validation in the PR.

AI assistance is welcome when contributors understand and review the result. Disclose substantial AI involvement and do not invent test results. Contributions are submitted under this project's MIT License; preserve third-party notices. Feature requests and response times are not guaranteed.
