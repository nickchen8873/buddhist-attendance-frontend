<template>
  <div>
    <header>
      <!-- <div class="user-info">
        {{ userStore.user.username }} {{ userStore.user.dharma_name }}，您好！
        <button @click="handleLogout">登出</button><br>
        登入時間: {{ new Date(userStore.user.last_login).toLocaleString() }}
      </div> -->
      <div class="header-bar" style="display:flex;">
        <div style="width:max-content; align-items: center;">
          <img :src="logoUrl" alt="淨土宗宗徽" style="height:200px;width:200px;"/>
        </div>
        <div style="width:max-content; margin:auto ">
          <div style="position: relative;left: 50%;transform: translate(-50%, -100%);text-align: center; align-items: flex-start;">
            <a style="font-size: 28px;">新店念佛會志工系統</a>
          </div>
          <div style="position: relative;left: 50%;transform: translate(-50%, 0%)">
            <button class="btn" @click="onAdd">新增蓮友</button>
            <button class="btn" @click="activity">本日報到</button>
            <button class="btn" @click="openHistoryDialog">歷史報到</button>
            <!-- <button class="btn" @click="manage">帳號管理</button> -->
            <button class="btn" @click="handleLogout">系統退出</button>
          </div>
        </div>
        <div class="center-outer" style="height: max-content;">
          <div class="button-panel">
            <div><button @click="exportMembersXlsx">檔案匯出</button></div>
            <!-- <div><button>篩選列印</button></div> -->
            <div><button @click="enterQrBatchPrint">條碼列印</button></div>
          </div>
        </div>
      </div>
    </header>
    
    <!-- 以下可放首頁其他內容 -->
    <MemberList
      :members="members"
      :onAdd="onAdd"
      :onEdit="onEdit"
      :onDelete="onDelete"
      :fetchMembers="fetchMembers"
      :fetchRecent3Months="fetchRecent3Months"
      @search="handleSearch"
      @syncSeletedId="syncSeletedId"
    />

    <div v-if="showHistoryDialog" class="history-mask" @click.self="closeHistoryDialog">
      <div class="history-dialog">
        <div class="history-dialog__title">選擇歷史報到日期</div>
        <input
          type="date"
          v-model="historyDate"
          :max="todayStr"
          class="history-dialog__input"
        />
        <div class="history-dialog__btns">
          <button class="btn history-btn-cancel" @click="closeHistoryDialog">取消</button>
          <button class="btn history-btn-ok" :disabled="!historyDate" @click="goHistoryAttendance">查詢</button>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../store'
import MemberList from './MemberList.vue'
import {getMembers, deleteMember} from '../api/member'
import { ref, onMounted } from 'vue'
import ExcelJS from 'exceljs'
import logoUrl from '../assets/logo.svg'


const userStore = useUserStore()
const router = useRouter()
const members = ref([])
let selectedIds = ref([])

const showHistoryDialog = ref(false)
const historyDate = ref('')
const todayStr = (() => {
  const d = new Date()
  const pad = n => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
})()

function openHistoryDialog() {
  historyDate.value = todayStr
  showHistoryDialog.value = true
}
function closeHistoryDialog() {
  showHistoryDialog.value = false
}
function goHistoryAttendance() {
  if (!historyDate.value) return
  router.push({ name: 'attendance-history', params: { date: historyDate.value } })
  showHistoryDialog.value = false
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

//撈資料的 function
const fetchMembers = async (query = {}) => {
  try {
    const res = await getMembers(query)
    members.value = res.data   // 這裡把API回傳的陣列指定給members
  } catch (err) {
    alert('取得成員名單失敗')
    console.log(err)
  }
}

const fetchRecent3Months = async () => {
  try {
    const today = new Date();
    const tomorrow = new Date();
    const d3m = new Date();

    tomorrow.setDate(today.getDate() + 1)
    d3m.setMonth(today.getMonth() - 3);
    const pad = n => n.toString().padStart(2, '0');
    const toDateStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const res = await getMembers({ joinDateStart: toDateStr(d3m), joinDateEnd: toDateStr(tomorrow) })
    members.value = res.data   // 這裡把API回傳的陣列指定給members
  } catch (err) {
    alert('取得成員名單失敗')
    console.log(err)
  }
}

//關鍵字查詢
const handleSearch = async (payload = '') => {
  try {
    const res = await getMembers({keyword: payload})
    members.value = res.data   // 這裡把API回傳的陣列指定給members
  } catch (err) {
    alert('查詢出現錯誤')
    console.log(err)
  }
}

//更新選中MemberList元件裡選中的Member
const syncSeletedId = async (payload = '') => {
  selectedIds.value = [...new Set(payload)]
}

onMounted(async () => {
  fetchMembers()
})

async function refresh() {
  const res = await getMembers()
  members.value = res.data
}

function onAdd() {
  router.push('/members/new')
}
function onEdit(member) {
  router.push(`/members/${member.id}/edit`)
}
function onDelete(member) {
  // 這裡呼叫你的刪除API
  if (confirm('確定要刪除嗎？')) {
    deleteMember(member.id).then(refresh(null))
  }
}
function activity(){
  router.push('/attendance/today')
}

function enterQrBatchPrint(){
  const idsParam = selectedIds.value.join(',')
  router.push({ name: 'member-qr-batch', query: { ids: idsParam } })
}

function formatDate(date) {
  if (!date) return ''
  if (typeof date === 'string' && date.length >= 10) return date.slice(0, 10).replace(/-/g, '/')
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${day}`
}

function statusText(status) {
  switch (status) {
    case 'active': return '共修'
    case 'leave': return '自離'
    case 'hidden': return '隱藏'
    case 'deceased': return '往生'
    default: return status || ''
  }
}

async function exportMembersXlsx() {
  // 1) 依畫面 current members 匯出（不含條碼）
  const rows = (members.value || []).map(m => ({
    id: m.id ?? '',
    group: m.group ?? '',
    name: m.name ?? '',
    dharma_name: m.dharma_name ?? '',
    birthday: formatDate(m.birthday),
    telephone: m.telephone ?? '',
    phone: m.phone ?? '',
    address: m.address ?? '',
    created_at: formatDate(m.created_at),
    last_checked_in: formatDate(m.last_checked_in),
    attendance_count: (m.attendance_count ?? '') === null ? '' : (m.attendance_count ?? ''),
    status: statusText(m.status),
  }))

  // 2) 建立工作簿
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('MySheet')

  // 3) 欄位（欄寬參考你附檔；多的「狀態」給一個合理寬度）
  ws.columns = [
    { header: 'ID', key: 'id', width: 10.5 },
    { header: '群組', key: 'group', width: 14.78 },
    { header: '姓名', key: 'name', width: 10.12 },
    { header: '法名', key: 'dharma_name', width: 11.29 },
    { header: '生日', key: 'birthday', width: 16 },
    { header: '電話', key: 'telephone', width: 14 },
    { header: '手機', key: 'phone', width: 14 },
    { header: '地址', key: 'address', width: 46.25 },
    { header: '加入日期', key: 'created_at', width: 16 },
    { header: '最近報到', key: 'last_checked_in', width: 16 },
    { header: '次數', key: 'attendance_count', width: 9.5 },
    { header: '狀態', key: 'status', width: 10.12 },
  ]

  // 4) 樣式（對齊附檔風格）
  const thinBorder = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  }

  const headerStyle = {
    font: { name: '標楷體', size: 12, bold: true, color: { argb: 'FFFFFFFF' } },
    alignment: { vertical: 'top', horizontal: 'center', wrapText: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB7DEE8' } }, // #B7DEE8
    border: thinBorder,
  }

  const bodyStyle = {
    font: { name: '標楷體', size: 12, bold: false },
    alignment: { vertical: 'top', horizontal: 'center', wrapText: true },
    border: thinBorder,
  }

  // 5) 加資料
  ws.addRows(rows)

  // 6) 套表頭樣式 + 列高（附檔 row height 約 20）
  const headerRow = ws.getRow(1)
  headerRow.height = 20
  headerRow.eachCell(cell => Object.assign(cell, { style: headerStyle }))

  // 7) 套內容樣式 + 列高
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r)
    row.height = 20
    row.eachCell(cell => {
      cell.style = bodyStyle
    })
  }

  // 8) 下載
  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const a = document.createElement('a')
  const url = URL.createObjectURL(blob)
  a.href = url
  const today = new Date().toISOString().slice(0, 10)
  a.download = `會員列表_${today}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

</script>


<style scoped>
.user-info {
  text-align: right;
  padding: 10px;
}
button {
  margin-left: 10px;
}
.btn {
  font-size: 18px;
  background: #d0e6d8;
  border: 1.5px solid #5b7b72;
  padding: 8px 24px;
  border-radius: 6px;
  margin-right: 12px;
  cursor: pointer;
}
.center-outer {
  display: flex;
  justify-content: center; /* 水平置中 */
  align-items: center;     /* 垂直置中 */
  height: 100vh;           /* 撐滿整個視窗高度 */
}
.button-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  border-radius: 5px;
  padding: 10px;
  width: 120px;
}
.button-panel > div {
  margin: 8px 0;
}
.button-panel button {
  width: 110%;
  border-radius: 2px;
  padding: 8px 0;
  font-size: 18px;
  background-color: #fdc92d;
  cursor: pointer;
}
.history-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.history-dialog {
  background: #fff;
  border-radius: 10px;
  padding: 28px 32px;
  min-width: 320px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
}
.history-dialog__title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
  text-align: center;
}
.history-dialog__input {
  width: 100%;
  height: 40px;
  font-size: 18px;
  padding: 4px 8px;
  box-sizing: border-box;
  margin-bottom: 18px;
}
.history-dialog__btns {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.history-dialog__btns .btn {
  margin-right: 0;
}
.history-btn-cancel {
  background: #eee;
  border-color: #aaa;
}
.history-btn-ok {
  background: #fdc92d;
  border-color: #b88a00;
}
.history-btn-ok:disabled {
  background: #f0e0a0;
  cursor: not-allowed;
}
</style>
