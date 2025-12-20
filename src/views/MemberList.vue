<template>
  <div class="member-list-legacy">
    <div style="margin-top: -25px; margin-bottom: 25px;">
      <a>目前顯示狀態: </a>
      <a style="font-size: 28px;color: red;border-bottom: 3px solid #000;">{{currDisplay}}</a>
    </div>
    <div style="text-align: center;margin-bottom: 35px;">
      <a style="font-size: 28px;margin-right: 35px;">會員列表：</a>
      <button class="btn" @click="fetchMembers();currDisplay = '全體會員'">全體會員</button>
      <button class="btn" @click="fetchMembers({hasGroup: 1});currDisplay = '志工幹部'">志工幹部</button>
      <button class="btn" @click="fetchRecent3Months();currDisplay = '全體會員';currDisplay = '新進蓮友'">新進蓮友</button>
      <button class="btn" @click="fetchMembers({showHidden: 1});currDisplay = '解除隱藏'">解除隱藏</button>
      <input type="text" v-model="keyword" placeholder="輸入法名/姓名" @keyup.enter="SendKeywordToParent()" style="height: 35px;margin-left: 20px;margin-right: 10px;">
      <button class="btn" @click="SendKeywordToParent()">搜尋</button>
    </div>

    <table class="legacy-table">
      <thead>
        <tr>
          <!-- <th><input type="checkbox" v-model="selectAll" @change="toggleSelectAll" /></th> -->
          <th>條碼</th>
          <th>ID</th>
          <th>群組</th>
          <th width="120px">姓名</th>
          <th>法名</th>
          <th>生日</th>
          <th>電話</th>
          <th>手機</th>
          <th width="70px">地址</th>
          <th>加入日期</th>
          <th>最近報到</th>
          <th>次數</th>
          <th width="80px">狀態</th>
          <!-- <th>操作</th> -->
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="m in members"
          :key="m.id"
          class="clickable-row"
          :class="{ 'row-active': activeRowId === m.id }"
          @click="setActiveRow(m)"
          @dblclick="onEdit(m)"
        >
          <td><input type="checkbox" v-model="selectedIds" :value="m.id" @click.stop /></td>
          <td>{{ m.id }}</td>
          <td>{{ m.group }}</td>
          <td>{{ m.name }}</td>
          <td>{{ m.dharma_name }}</td>
          <td>{{ formatDate(m.birthday) }}</td>
          <td>{{ m.telephone }}</td>
          <td>{{ m.phone }}</td>
          <td>
            <span v-if="m.address == null || m.address.trim() == ''">{{ '無' }}</span>
            <button class="more-btn" v-else @click.stop="showAddress(m)">更多</button>
          </td>
          <td>{{ formatDate(m.created_at) }}</td>
          <td>{{ formatDate(m.last_checked_in) }}</td>
          <td>{{ m.attendance_count || '-' }}</td>
          <td>{{ statusText(m.status) }}</td>
          <!-- <td>
            <button class="action-btn" @click="onEdit(m)">編輯</button>
            <button class="action-btn" @click="onDelete(m)">刪除</button>
          </td> -->
        </tr>
        <tr v-if="!members.length">
          <td colspan="14" class="empty-row">（查無資料）</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import {getMembers} from '../api/member'

defineProps(['members', 'onAdd', 'onEdit', 'onDelete', 'fetchMembers', 'fetchRecent3Months'])

let selectAll = ref(false)
let selectedIds = ref([])
let keyword = ref('')
let emit = defineEmits(['search']);
let currDisplay = '全體會員'

const activeRowId = ref(null)

watch(selectAll, val => {
  if (val) {
    selectedIds.value = (Array.isArray(members) ? members.map(m => m.id) : [])
  } else {
    selectedIds.value = []
  }
})

// 只要 selectedIds 一變動，就自動發送給父元件
watch(selectedIds, (newVal) => {
  emit('syncSeletedId', newVal)
})

// watch(
//   () => members,
//   (list) => {
//     if (!Array.isArray(list)) return
//     if (activeRowId.value && !list.some(m => m.id === activeRowId.value)) {
//       activeRowId.value = null
//     }
//   },
//   { deep: true }
// )


function toggleSelectAll() {
  selectAll.value = !selectAll.value
}

function formatDate(date) {
  if (!date) return ''
  // 支援 YYYY-MM-DD / YYYY/MM/DD / date object
  if (typeof date === 'string' && date.length >= 10)
    return date.slice(0, 10).replace(/-/g, '/')
  if (date instanceof Date)
    return date.toISOString().slice(0, 10).replace(/-/g, '/')
  return date
}
function statusText(status) {
  switch (status) {
    case 'active': return '共修'
    case 'leave': return '自離'
    case 'hidden': return '隱藏'
    case 'deceased': return '往生'
    default: return status
  }
}
function showAddress(member) {
  alert('地址：' + (member.address))
}

// 關鍵字查詢
function SendKeywordToParent() {
  emit('search', keyword.value)
}

function setActiveRow(member) {
  activeRowId.value = member.id
}
</script>

<style scoped>
.member-list-legacy {
  background: #f8f9fb;
  border: 2px solid #fdc92d;
  border-radius: 10px;
  padding: 32px 16px 16px 16px;
  margin: 36px auto;
  max-width: 1400px;
  box-shadow: 2px 4px 18px #eee;
}
.header-bar {
  margin-bottom: 12px;
}
.btn {
  font-size: 18px;
  background: #66B3FF;
  border: 1.5px solid #5b7b72;
  padding: 8px 24px;
  border-radius: 6px;
  margin-right: 12px;
  cursor: pointer;
}
.legacy-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  font-size: 17px;
  min-width: 1200px;
  letter-spacing: 1px;
}
.legacy-table th,
.legacy-table td {
  border: 2px solid #222;
  padding: 7px 9px;
  text-align: center;
}
.legacy-table th {
  background: #e6eef6;
  font-weight: 700;
  font-size: 17px;
  letter-spacing: 1.5px;
}
.legacy-table tbody tr:nth-child(even) {
  background: #f7fafc;
}
.action-btn {
  margin: 0 2px;
  padding: 1.5px 12px;
  background: #fff8d5;
  border: 1.5px solid #bbb;
  border-radius: 3px;
  font-size: 15px;
  cursor: pointer;
}
.action-btn:hover {
  background: #ffe28a;
  border-color: #fdc92d;
}
.more-btn {
  background: #ffe28a;
  border: 1.5px solid #fdc92d;
  color: #333;
  padding: 2px 9px;
  font-size: 14px;
  border-radius: 3px;
  cursor: pointer;
}
.empty-row {
  color: #b6b6b6;
  font-size: 17px;
  text-align: center;
  background: #fafafa;
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

/* 反藍樣式 */
.clickable-row {
  cursor: pointer;
}
.legacy-table tbody tr.row-active {
  background: #cfe8ff !important;            /* 反藍底 */
  box-shadow: inset 0 0 0 2px #4a90e2;       /* 藍色內框更醒目 */
}
.legacy-table tbody tr.clickable-row:hover {
  background: #eaf4ff;                       /* hover 也給一點提示 */
}

</style>
