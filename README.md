# 饮料酒水库存管理系统

适合餐馆 3 人或多人共同使用。

## 功能
- Email / 密码登录
- 酒水新增与编辑
- 入库
- 出库
- 盘点调整
- 低库存提示
- 搜索与分类筛选
- 操作记录
- 显示操作人
- Supabase Realtime 多人实时同步
- 可部署 GitHub Pages

## 1. Supabase
1. 新建 Supabase Project。
2. 打开 SQL Editor。
3. 把 `supabase.sql` 整段贴进去并 Run。
4. Authentication > Users 建立 3 个用户。
5. Project Settings > API 找到：
   - Project URL
   - anon / public key

## 2. 修改 config.js
把：
- PASTE_YOUR_SUPABASE_URL_HERE
- PASTE_YOUR_SUPABASE_ANON_KEY_HERE

换成你的 Supabase 项目资料。

注意：不要使用 service_role key。

## 3. GitHub
把这些文件上传到一个 Repository：
- index.html
- app.js
- config.js
- supabase.sql
- README.md

## 4. GitHub Pages
Repository > Settings > Pages
- Source: Deploy from a branch
- Branch: main
- Folder: /(root)
- Save

之后 GitHub 会给你一个网址，3个人都用这个网址登录即可。
