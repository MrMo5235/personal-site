# PHANTOM X Personal Site

一个无需构建工具的静态个人主页，采用 CS / 电竞战队风格。直接打开 `index.html`，或通过任意静态服务器访问。

## 修改网站内容

所有可变内容都在 `config.js` 中，通常不需要修改 HTML。

### 新增个人资料字段

找到 `profile.fields`，添加一行即可：

```js
fields: {
  "REAL NAME / 姓名": "Your Name",
  "LOCATION / 所在地": "Your City, Country",
  "擅长地图": "Mirage / Inferno"
}
```

页面会自动生成新的资料卡片。字段值也可以使用数组：

```js
"LANGUAGES / 语言": ["中文", "English"]
```

### 添加技能、项目或联系方式

- `loadout`：技能分类和熟练度。
- `operations`：项目列表。
- `contact.links`：联系方式。
- `stats`：首屏选手状态数据。

按照现有项目的格式复制一项，再修改其中的内容即可。

### 使用个人照片

把照片放在项目目录中，例如 `avatar.webp`，然后修改：

```js
avatar: "avatar.webp"
```

留空时，页面使用姓名缩写作为战队风头像。

## 本地预览

```powershell
python -m http.server 8000
```

访问 `http://localhost:8000`。
