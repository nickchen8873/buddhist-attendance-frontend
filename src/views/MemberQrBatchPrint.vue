<template>
    <div class="batch-print-page">
      <!-- 一頁最多 4 個成員 -->
      <div
        v-for="(pageMembers, pageIndex) in pagedMembers"
        :key="pageIndex"
        class="page"
      >
        <div
          v-for="m in pageMembers"
          :key="m.id"
          class="member-card"
        >
          <!-- 頂部：編號列 -->
          <div class="header-left">
            <div class="cell label">編號</div>
            <div class="cell id-cell">{{ getPaddedId(m) }}</div>
          </div>
  
          <div class="header-right">
            <div class="cell id-cell">{{ getPaddedId(m) }}</div>
            <div class="cell name-cell">{{ m.name }}</div>
          </div>
  
          <!-- 左下：文字資訊區 -->
          <div class="body-left">
            <div class="info-grid">
              <!-- 1. 姓名 / 法名 -->
              <div class="cell label">姓名</div>
              <div class="cell">{{ m.name }}</div>
              <div class="cell label">法名</div>
              <div class="cell">{{ m.dharma_name || '' }}</div>
  
              <!-- 2. 生日 / 報到 -->
              <!-- <div class="cell label">生日</div>
              <div class="cell birthday-cell">年　　月　　日</div>
              <div class="cell label">報到</div>
              <div class="cell">
                {{ formatDate(m.created_at) }}
              </div> -->
  
              <!-- 3. 電話 / 性別 -->
              <!-- <div class="cell label">電話</div>
              <div class="cell">{{ m.phone || m.telephone || '' }}</div>
              <div class="cell label">性別</div>
              <div class="cell">{{ getGenderText(m) }}</div> -->
  
              <!-- 4. 地址（跨 3 欄） -->
              <!-- <div class="cell label address-label">地址</div>
              <div class="cell address-cell" style="grid-column: span 3">
                {{ m.address }}
              </div> -->
            </div>
          </div>
  
          <!-- 右下：QR Code 區 -->
          <div class="body-right">
            <div class="qr-wrapper">
              <div class="backup-qr">
                <img v-if="m.qrUrl" :src="m.qrUrl" class="qr-img" />
              </div>
              <img v-if="m.qrUrl" :src="m.qrUrl" class="qr-img" />
            </div>
          </div>
        </div>
      </div>
  
      <!-- 列印 / 返回按鈕（只在畫面上顯示，列印時隱藏） -->
      <div class="print-actions no-print">
        <button @click="handlePrint">列印</button>
        <button @click="goBack">返回</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import QRCode from 'qrcode'
  import { getMember } from '../api/member'
  
  const route = useRoute()
  const router = useRouter()
  
  // 取回的成員資料（會多加一個 qrUrl 屬性）
  const members = ref([])
  
  // 一頁最多 4 個
  const PER_PAGE = 4
  const pagedMembers = computed(() => {
    const pages = []
    for (let i = 0; i < members.value.length; i += PER_PAGE) {
      pages.push(members.value.slice(i, i + PER_PAGE))
    }
    return pages
  })
  
  function getPaddedId(m) {
    if (!m.id) return ''
    return String(m.id).padStart(8, '0')
  }
  
  function getGenderText(m) {
    if (m.gender === 'M') return '男'
    if (m.gender === 'F') return '女'
    return ''
  }
  
  function formatDate(value) {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}/${m}/${day}`
  }
  
  function handlePrint() {
    window.print()
  }
  
  function goBack() {
    router.back()
  }
  
  onMounted(async () => {
    // 這裡假設從 query string 取得要列印的 ID：
    // 例如 /member-qr-batch?ids=2201,2202,2203,2204
    const idsParam = route.query.ids
    if (!idsParam) return
  
    const ids = String(idsParam)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  
    const loaded = []
  
    for (const id of ids) {
      try {
        const { data } = await getMember(id)
        const m = { ...data }
  
        if (m.barcode) {
          m.qrUrl = await QRCode.toDataURL(String(m.barcode), {
            width: 260, // 印刷用解析度
            margin: 1
          })
        } else {
          m.qrUrl = ''
        }
  
        loaded.push(m)
      } catch (err) {
        console.error('載入成員失敗：', id, err)
      }
    }
  
    members.value = loaded
  })
  </script>
  
  <style scoped>
  .batch-print-page {
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 20px; /* 統一字體大小 */
  }
  
  /* 一頁 */
  .page {
    width: 210mm;          /* A4 寬度 */
    margin: 0 auto 8mm;    /* 每頁之間留一點空隙 */
    page-break-after: always;
  }
  
  .page:last-child {
    page-break-after: auto;
  }
  
  /* 整張卡片外框 */
  .member-card {
    width: 100%;
    border: 1px solid #000;
    display: grid;
    grid-template-columns: 3fr 2fr;  /* 左：文字區，右：QR 區 */
    grid-template-rows: auto auto;   /* 上：編號列，下：內容區 */
    margin-bottom: 6mm;
  }
  
  .member-card:last-child {
    margin-bottom: 0;
  }
  
  /* ===== 編號列（左上） ===== */
  .header-left {
    grid-column: 1;
    grid-row: 1;
    border-right: 1px solid #000;
    border-bottom: 1px solid #000;
    display: grid;
    grid-template-columns: 20mm auto 20mm auto;
  }
  
  .header-left .cell {
    padding: 3px 6px;
    border-right: 1px solid #000;
    display: flex;
    align-items: center;
    font-size: 1em;
  }
  .header-left .cell:last-child {
    border-right: none;
  }
  .header-left .cell.label {
    justify-content: center;
  }
  .header-left .id-cell {
    grid-column: 2 / 5;
  }
  
  /* ===== 編號列（右上） ===== */
  .header-right {
    grid-column: 2;
    grid-row: 1;
    border-bottom: 1px solid #000;
    display: flex;
    align-items: center;
    /* padding-left: 6mm; */
    font-size: 1em;
  }
  .header-right .id-cell {
    padding: 0px 128px 0px 23px;
    /* border-right: 1px solid #000; */
    display: flex;
    font-size: 1em;
  }
  
  /* ===== 文字資訊區（左下） ===== */
  .body-left {
    grid-column: 1;
    grid-row: 2;
    border-right: 1px solid #000;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: 20mm auto 20mm auto;
    grid-auto-rows: 14mm;
  }
  
  .info-grid .cell {
    border-bottom: 1px solid #000;
    border-right: 1px solid #000;
    padding: 3px 6px;
    font-size: 1em;
    display: flex;
    align-items: center;
  }
  
  .info-grid .label {
    justify-content: center;
  }
  
  .birthday-cell {
    justify-content: center;
  }
  
  /* 地址那列不要再多一條底線 */
  .address-label,
  .address-cell {
    border-bottom: none;
  }
  
  /* ===== QR 區（右下） ===== */
  .body-right {
    grid-column: 2;
    grid-row: 2;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .qr-wrapper {
    display: flex;
    gap: 8mm;
    padding: 1mm 5mm;
  }
  
  .qr-img {
    width: 47mm;
    height: 47mm;
  }
  
  /* 列印按鈕區 */
  .print-actions {
    margin-top: 16px;
    text-align: center;
  }
  .print-actions button {
    margin: 0 8px;
    padding: 6px 24px;
    font-size: 20px;
    border-radius: 4px;
  }
  
  /* 列印時隱藏按鈕 */
  @media print {
    .no-print {
      display: none;
    }
    .batch-print-page {
      padding: 0;
      align-items: flex-start;
    }
  }
  </style>
  