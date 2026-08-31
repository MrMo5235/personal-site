# PHANTOM-X Tactical Profile

CS / 电竞战队风格的个人主页。当前版本使用 OpenAI Sites 托管运行，并提供访客模式和管理员后台。

## 功能

- 访客无需登录即可浏览公开资料、滚动照片和公开文档。
- 管理员通过右上角的身份入口登录。
- 管理后台可以修改基础资料、动态新增或删除资料字段。
- 支持上传图片和文档、修改说明、调整顺序或删除文件。
- 网站内容保存在托管 D1 数据库，上传文件保存在托管 R2 对象存储。

管理员入口为 `/admin`。生产环境通过 `ADMIN_EMAILS` 环境变量指定允许登录的账号；该值只保存在托管环境，不提交到仓库。

## 本地开发

```powershell
npm install
npm run dev
```

访问 `http://localhost:3000`。本地 Sites 登录使用测试账号 `seedy@sites.test`。

## 构建

```powershell
npm run build
```

根目录原有的 `index.html`、`style.css`、`script.js` 和 `config.js` 是 GitHub Pages 的静态旧版本。新的托管版本以 `app/`、`components/`、`content/`、`db/` 和 `lib/` 中的代码为准。
