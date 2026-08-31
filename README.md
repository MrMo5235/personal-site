# ANT1VOLVE 5 // True Evolution Profile

CS / 电竞战队风格的个人主页。`ANT1VOLVE 5` 同时包含 Anti-Involution、Evolve 与 AN / Andy 三层含义，核心态度是：拒绝无意义的竞争，选择真正的进化。当前版本使用 OpenAI Sites 托管运行，并提供访客模式和管理员前台编辑能力。

## 功能

- 访客无需登录即可浏览公开资料、滚动照片和公开文档。
- 管理员通过右上角的身份入口登录，并直接在公开页面进入编辑模式。
- 首页可原位修改资料、技能和联系方式，动态新增或删除资料字段。
- 支持在首页编辑工具栏上传或删除图片、文档。
- Notes 提供独立阅读页，支持 Markdown、标签、草稿与发布状态。
- 笔记编辑器可直接写 Markdown，也可导入 `.md`、`.markdown` 或 `.docx` 后继续编辑。
- 网站内容保存在托管 D1 数据库，上传文件保存在托管 R2 对象存储。

管理员入口为 `/admin`，登录后会回到首页编辑模式；也可以在首页右上角直接切换。生产环境通过 `ADMIN_EMAILS` 环境变量指定允许登录的账号；该值只保存在托管环境，不提交到仓库。

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
