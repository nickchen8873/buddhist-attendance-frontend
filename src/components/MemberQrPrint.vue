<template>
    <div class="print-page">
        <div class="member-card">
            <!-- 頂部：編號列 -->
            <div class="header-left">
                <div class="cell label">編號</div>
                <!-- 這格會橫跨後面 3 欄，讓右邊框跟「姓名」那格對齊 -->
                <div class="cell id-cell">{{ paddedId }}</div>
            </div>

            <div class="header-right">
              <div class="cell id-cell">{{ paddedId }}</div>
              <div class="cell name-cell">{{ member.name }}</div>
            </div>

            <!-- 左下：文字資訊區 -->
            <div class="body-left">
                <div class="info-grid">
                  <!-- 1. 姓名 / 法名 -->
                  <div class="cell label">姓名</div>
                  <div class="cell">{{ member.name }}</div>
                  <div class="cell label">法名</div>
                  <div class="cell">{{ member.dharma_name || '' }}</div>

                  <!-- 2. 生日 / 報到 -->
                  <!-- <div class="cell label">生日</div>
                  <div class="cell birthday-cell">年　　月　　日</div>
                  <div class="cell label">報到</div>
                  <div class="cell">
                      {{ formatDate(member.created_at) }}
                  </div> -->

                  <!-- 3. 電話 / 性別 -->
                  <!-- <div class="cell label">電話</div>
                  <div class="cell">{{ member.phone || member.telephone || '' }}</div>
                  <div class="cell label">性別</div>
                  <div class="cell">{{ genderText }}</div> -->

                  <!-- 4. 地址（跨 3 欄） -->
                  <!-- <div class="cell label address-label">地址</div>
                  <div class="cell address-cell" style="grid-column: span 3">
                      {{ member.address }}
                  </div> -->
                </div> 
            </div>

            <!-- 右下：QR Code 區 -->
            <div class="body-right">
                <div class="qr-wrapper">
                <img v-if="barcodeUrl" :src="barcodeUrl" class="qr-img" />
                <img v-if="barcodeUrl" :src="barcodeUrl" class="qr-img" />
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
  
  const member = ref({
  id: null,
  name: '',
  dharma_name: '',
  gender: '',
  phone: '',
  telephone: '',
  birthday: '',
  address: '',
  created_at: '',
  barcode: ''
})

const barcodeUrl = ref('')
  
  // 8 碼補零的編號（看你的舊系統，如果要 7 碼或 6 碼可以改這裡）
  const paddedId = computed(() => {
    if (!member.value.id) return ''
    return String(member.value.id).padStart(8, '0')
  })
  
  const genderText = computed(() => {
    if (member.value.gender === 'M') return '男'
    if (member.value.gender === 'F') return '女'
    return ''
  })
  
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
  const id = route.params.id
  if (!id) return

  const { data } = await getMember(id)
  member.value = data

  if (data.barcode) {
    barcodeUrl.value = await QRCode.toDataURL(String(data.barcode), {
      width: 260,   // 印刷用解析度高一點
      margin: 1
    })
  }
})
</script>
  
<style scoped>
.print-page {
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;   /* 整張卡＋按鈕置中 */
  font-size: 18px;       /* 🔹統一字體大小為 20px */
}

/* 整張卡片外框 */
.member-card {
  width: 210mm;             /* A4 寬度，可依需要微調 */
  /* height: 70mm;  不固定高度，讓內容撐開 */
  border: 1px solid #000;
  display: grid;
  grid-template-columns: 3fr 2fr;  /* 左：文字區，右：QR 區 */
  grid-template-rows: auto auto;   /* 上：編號列，下：內容區 */
}

/* ===== 編號列（左上） ===== */
.header-left {
  grid-column: 1;
  grid-row: 1;
  border-right: 1px solid #000;
  border-bottom: 1px solid #000;

  /* 和 info-grid 共用同一組欄寬，確保邊線對齊 */
  display: grid;
  grid-template-columns: 20mm auto 20mm auto;
}

.header-left .cell {
  padding: 3px 6px;
  border-right: 1px solid #000;
  display: flex;
  align-items: center;
  font-size: 1em;   /* 跟父層 20px 一樣 */
}
.header-left .cell:last-child {
  border-right: none;
}
.header-left .cell.label {
  justify-content: center;
  /* font-weight: bold; */
}
/* 編號數字橫跨第 2~4 欄，讓右邊框和下面「姓名」那格對齊 */
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
  padding-left: 6mm;
  font-size: 1em;   /* 20px */
}
.header-right .id-cell {
    padding: 0px 115px 0px 23px;
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

/* 左下表格：同樣 4 欄，行高固定 14mm */
.info-grid {
  display: grid;
  grid-template-columns: 20mm auto 20mm auto;
  grid-auto-rows: 14mm;
}

/* 每一格基本樣式 */
.info-grid .cell {
  border-bottom: 1px solid #000;
  border-right: 1px solid #000;
  padding: 3px 6px;
  font-size: 1em;   /* 20px */
  display: flex;
  align-items: center;
}

/* 左側標籤欄位置中 */
.info-grid .label {
  justify-content: center;
}

/* 生日那格置中 */
.birthday-cell {
  justify-content: center;
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
  padding: 8mm 5mm;
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
  font-size: 20px;    /* 🔹按鈕文字也放大 */
  border-radius: 4px;
}

/* 列印時隱藏按鈕，只保留卡片 */
@media print {
  .no-print {
    display: none;
  }
  .print-page {
    padding: 0;
    /* 若希望印出來也置中，可以改回 align-items: center; */
    align-items: flex-start;
  }
}


</style>
  