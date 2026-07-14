# 🚀 部署指南 - GitHub Pages

## ✅ 已完成的操作

1. ✅ 修改 `vite.config.ts` - 添加 GitHub Pages base 路径配置
2. ✅ 创建 `.github/workflows/deploy.yml` - GitHub Actions 自动部署配置
3. ✅ 本地构建测试通过 - `npm run build-only` 成功
4. ✅ 代码已推送到 GitHub: https://github.com/WHaoxM/cpa-agent-demo

## 📝 下一步操作

### 1. 启用 GitHub Pages

打开以下链接并操作：
👉 https://github.com/WHaoxM/cpa-agent-demo/settings/pages

**操作步骤：**
1. 在 Settings → Pages 页面
2. **Source** 选择 "GitHub Actions"（不是 "Deploy from a branch"）
3. 保存后会自动使用我们配置的 `deploy.yml` 工作流

### 2. 等待部署完成

GitHub Actions 会自动构建和部署，通常需要 1-3 分钟。

查看部署状态：
👉 https://github.com/WHaoxM/cpa-agent-demo/actions

### 3. 访问 Demo

部署成功后，访问：
🌐 **https://whaoxm.github.io/cpa-agent-demo/**

## 🔧 后续更新

之后每次推送到 `main` 分支时，GitHub Actions 会自动重新部署：
```bash
cd vue-kecheng
git add .
git commit -m "your message"
git push
```

## 📦 本地预览构建结果

如果想本地预览构建后的效果：
```bash
cd vue-kecheng
npm run build-only
npm run preview
```

## ⚠️ 注意事项

- GitHub Pages 静态演示主要使用 mock 数据；本地开发可通过 `VITE_API_BASE_URL` 连接后端
- 登录账号密码均为：123456
- 如果页面刷新后出现 404，这是正常的（SPA 路由），直接访问首页即可
- GitHub Pages 是静态托管；未配置公网后端时，本地后端 API 调用不可用，页面会保留 mock/降级展示
