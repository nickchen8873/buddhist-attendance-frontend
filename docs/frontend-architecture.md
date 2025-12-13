# 前端架構說明文件

## 專案技術棧總覽

本專案採用現代化的前端技術棧，主要包含以下技術：

### 核心框架與工具
- **Vue 3.5.13**：採用 Composition API 的現代化前端框架
- **Vue Router 4.5.1**：官方路由管理器，提供單頁應用路由功能
- **Pinia 3.0.3**：Vue 3 官方推薦的狀態管理庫，替代 Vuex
- **Vite 6.3.5**：現代化前端建構工具，提供快速的開發體驗

### HTTP 請求與網路
- **Axios 1.9.0**：基於 Promise 的 HTTP 請求庫，用於與後端 API 進行通訊

### 開發工具
- **@vitejs/plugin-vue 5.2.3**：Vite 的 Vue 插件，提供 Vue 單檔案元件支援

## 資料夾結構簡介

```
src/
├── api/              # API 呼叫層
│   ├── index.js      # Axios 基礎設定與認證處理
│   ├── member.js     # 會員相關 API 呼叫
│   └── user.js       # 使用者相關 API 呼叫
├── components/       # 可重用元件
│   └── MemberForm.vue # 會員新增/編輯表單元件
├── router/           # 路由配置
│   └── index.js      # Vue Router 路由定義與守衛
├── store/            # 狀態管理
│   └── index.js      # Pinia store 設定
├── views/            # 頁面元件
│   ├── HomeView.vue     # 首頁（整合會員列表）
│   ├── LoginView.vue    # 登入頁面
│   └── MemberList.vue   # 會員列表展示元件
├── assets/           # 靜態資源
├── App.vue           # 根元件
└── main.js           # 應用入口點
```

### 各資料夾功能說明

#### `api/` - API 呼叫層
負責所有後端 API 的呼叫封裝，提供統一的介面給元件使用：
- `index.js`：設定 Axios 基礎 URL、認證標頭、全域錯誤處理
- `member.js`：會員 CRUD 操作（新增、查詢、修改、刪除）
- `user.js`：使用者管理相關 API

#### `components/` - 可重用元件
存放可重用的 UI 元件，目前包含：
- `MemberForm.vue`：會員資料的新增與編輯表單，支援動態欄位顯示

#### `router/` - 路由配置
- `index.js`：定義所有路由規則，包含路由守衛進行登入驗證

#### `store/` - 狀態管理
使用 Pinia 進行全域狀態管理：
- `index.js`：userStore，管理使用者登入狀態、token 持久化

#### `views/` - 頁面元件
存放主要的頁面元件，對應路由中的各個頁面：
- `HomeView.vue`：首頁，整合會員列表展示與操作
- `LoginView.vue`：使用者登入頁面
- `MemberList.vue`：會員列表的表格展示元件

## 路由架構

應用程式的路由結構如下：

```
/
├── / (Login)                    # 登入頁面 - 根路徑
├── /home                        # 首頁 - 會員管理主頁面
├── /members                     # 會員列表頁面
├── /members/new                 # 新增會員頁面 (使用 MemberForm 元件)
└── /members/:id/edit            # 編輯會員頁面 (使用 MemberForm 元件)
```

### 路由功能說明

- **登入驗證**：使用路由守衛檢查登入狀態，未登入者自動導向登入頁
- **動態路由**：編輯會員時使用動態路由參數傳遞會員 ID
- **元件重用**：新增與編輯會員共用同一個 `MemberForm.vue` 元件，透過 props 區分模式

## 狀態管理與資料流

### 狀態管理架構

採用 **Pinia** 作為狀態管理解決方案，目前包含一個主要的 store：

#### userStore (`src/store/index.js`)
```javascript
state: {
  user: null,        // 使用者資訊
  username: null,    // 顯示用使用者名稱
  token: null        // JWT 認證 token
}
```

**主要功能**：
- 登入狀態管理
- Token 自動化設定到 Axios 標頭
- localStorage 持久化登入資訊
- 登出清除狀態

### 資料流向圖

```
使用者操作 → Vue 元件 → API 呼叫 → 後端處理 → 回傳資料 → 更新元件狀態
     ↓           ↓         ↓         ↓         ↓           ↓
  點擊按鈕    emit事件   axios請求   資料庫操作   JSON回應    v-model更新
```

#### 典型資料流程範例

1. **會員列表載入**：
   ```
   HomeView.vue → getMembers() → API 呼叫 → 後端回傳 → members ref 更新 → MemberList.vue 重新渲染
   ```

2. **新增會員**：
   ```
   MemberForm.vue → createMember() → API 呼叫 → 後端儲存 → 成功回應 → 路由導向 /home
   ```

3. **登入流程**：
   ```
   LoginView.vue → login() → API 驗證 → userStore.setUser() → 路由導向 /home
   ```

### 元件間資料傳遞

- **Props 傳遞**：父元件向子元件傳遞資料（如 `MemberList` 接收 `members` 陣列）
- **Events 傳遞**：子元件向父元件發送事件（如搜尋關鍵字從 `MemberList` 傳回 `HomeView`）
- **Router Params**：路由參數傳遞（如編輯時的會員 ID）
- **Pinia Store**：全域狀態共享（如登入狀態）

## 與後端 API 的串接方式

### API 基礎設定 (`src/api/index.js`)

```javascript
const api = axios.create({
  baseURL: 'http://192.168.0.10:3000/api',  // 後端 API 基礎 URL
  timeout: 10000
})
```

**認證處理**：
- JWT Token 自動加入請求標頭
- 登入成功後自動設定 token
- 登出時清除認證標頭

### API 模組化設計

每個業務模組對應一個 API 檔案：

#### member.js - 會員管理 API
- `getMembers(query)` - 取得會員列表（支援查詢參數）
- `getMember(id)` - 取得單一會員
- `createMember(data)` - 新增會員
- `updateMember(id, data)` - 更新會員
- `deleteMember(id)` - 刪除會員
- `search(id)` - 關鍵字搜尋
- `fetchMaxId()` - 取得最大 ID 用於新增

#### user.js - 使用者管理 API
- `getUsers(query)` - 取得使用者列表
- `getUser(id)` - 取得單一使用者
- `createUser(data)` - 新增使用者
- `updateUser(id, data)` - 更新使用者
- `deleteUser(id)` - 刪除使用者

### 錯誤處理機制

- **全域錯誤處理**：在 API 層統一處理錯誤
- **元件級錯誤處理**：各元件使用 try-catch 處理業務邏輯錯誤
- **使用者提示**：使用 `alert()` 顯示錯誤訊息給使用者

## 與「佛堂報到系統」需求的對應關係

本前端專案實現了佛堂報到系統的核心功能模組：

### 1. 成員管理 ✅ 已實現
- **會員列表展示** (`MemberList.vue`)：以表格形式顯示所有會員資訊
- **新增會員** (`MemberForm.vue`)：完整的會員資料表單
- **編輯會員** (`MemberForm.vue`)：支援修改現有會員資料
- **會員狀態管理**：支援在職、隱藏、離職等多種狀態
- **搜尋功能**：支援按姓名、法名、ID 等條件搜尋

### 2. 報到 / 出席紀錄 ⚠️ 部分實現
- **UI 介面**：在 `HomeView.vue` 中有「本日活動」按鈕
- **資料欄位**：會員資料包含 `attendance_count`（出席次數）和 `last_checked_in`（最近報到）
- **功能實作**：⚠️ 目前按鈕存在但功能未實現

### 3. 帳號管理 ✅ 已實現
- **登入系統** (`LoginView.vue`)：使用者名稱/密碼驗證
- **權限管理**：支援 admin、一般使用者等角色區分
- **會話管理**：登入狀態持久化，自動登出保護

### 4. 匯出 / 列印功能 ⚠️ 部分實現
- **UI 介面**：在 `HomeView.vue` 中有「檔案匯出」、「篩選列印」、「條碼列印」按鈕
- **功能實作**：⚠️ 目前按鈕存在但功能未實現

### 系統特色

- **響應式設計**：支援不同螢幕尺寸
- **資料驗證**：表單欄位驗證，防止無效資料提交
- **使用者體驗**：直觀的操作介面，清晰的視覺回饋
- **資料安全**：JWT 認證機制，敏感操作權限控制

### 待完成功能

1. **報到功能實作**：實現實際的報到記錄與統計
2. **匯出功能**：實現 Excel/CSV 匯出和 PDF 列印
3. **條碼功能**：生成與列印會員條碼
4. **進階搜尋**：更多篩選條件和排序功能
5. **資料備份**：定期備份機制

此架構提供了完整的會員管理基礎，並為後續功能擴展預留了清晰的介面和結構。
