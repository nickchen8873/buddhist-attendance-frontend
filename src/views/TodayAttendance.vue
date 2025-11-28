<template>
    <div class="attendance-panel">
      <h2>本日活動出席</h2>
  
      <!-- 上方只顯示日期 -->
      <div class="summary-row">
        <span>日期：{{ displayDate }}</span>
      </div>
  
      <div v-if="loading" class="hint">載入中...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
  
      <div v-else class="columns">
        <!-- 非成員設定（暫時用靜態欄位） -->
        <div class="column narrow">
          <div class="column-header center">
            <span>非成員設定</span>
          </div>
          <ul class="member-list">
            <li
              v-for="(item, index) in nonMemberSlots"
              :key="index"
              class="member-item"
            >
              <span class="name">{{ item }}</span>
            </li>
            <li v-if="nonMemberSlots.length === 0" class="empty">
              尚未設定非成員欄位
            </li>
          </ul>
        </div>
  
        <!-- 本次活動可設定成員（尚未報到） -->
        <div class="column">
          <div class="column-header">
            <span>本次活動可設定成員</span>
            <span>{{ availableMembersSorted.length }} 人</span>
          </div>
          <ul class="member-list">
            <li
              v-for="(item, index) in availableMembersSorted"
              :key="item.id"
              class="member-item"
              :class="{ selected: isSelected('available', item.id) }"
              @click="select('available', item.id)"
              @dblclick="handleAvailableDblClick(item.id)"
            >
              <span class="index">{{ index + 1 }}.</span>
              <span class="name">{{ item.name }}</span>
              <span v-if="item.dharma_name" class="dharma">
                （{{ item.dharma_name }}）
              </span>
              <span v-if="item.group" class="group">
                · {{ item.group }}
              </span>
              <span class="status-tag" v-if="item.status !== 'active'">
                {{ statusText(item.status) }}
              </span>
            </li>
            <li v-if="availableMembersSorted.length === 0" class="empty">
              今日所有成員都已報到
            </li>
          </ul>
        </div>
  
        <!-- 控制欄：可設定成員 ⇄ 用餐成員 -->
        <div class="control-column">
          <button
            class="ctrl-btn"
            :disabled="!canMoveAvailableToWithMeal || submitting"
            @click="moveAvailableToWithMeal"
          >
            ▶
          </button>
          <button
            class="ctrl-btn"
            :disabled="!canMoveWithMealToAvailable || submitting"
            @click="moveWithMealToAvailable"
          >
            ◀
          </button>
        </div>
  
        <!-- 用餐成員 -->
        <div class="column">
          <div class="column-header">
            <span>用餐成員</span>
            <span>{{ withMealList.length }} 人</span>
          </div>
          <ul class="member-list">
            <li
              v-for="(item, index) in withMealList"
              :key="item.id"
              class="member-item"
              :class="{ selected: isSelected('withMeal', item.id) }"
              @click="select('withMeal', item.id)"
            >
              <span class="index">{{ index + 1 }}.</span>
              <span class="name">{{ item.name }}</span>
              <span v-if="item.dharma_name" class="dharma">
                （{{ item.dharma_name }}）
              </span>
              <span v-if="item.group" class="group">
                · {{ item.group }}
              </span>
              <span class="time">{{ formatTime(item.checked_in_at) }}</span>
            </li>
            <li v-if="withMealList.length === 0" class="empty">
              尚無用餐成員
            </li>
          </ul>
        </div>
  
        <!-- 控制欄：用餐成員 ⇄ 不用餐成員 -->
        <div class="control-column">
          <button
            class="ctrl-btn"
            :disabled="!canMoveWithMealToWithoutMeal || submitting"
            @click="moveWithMealToWithoutMeal"
          >
            ▶
          </button>
          <button
            class="ctrl-btn"
            :disabled="!canMoveWithoutMealToWithMeal || submitting"
            @click="moveWithoutMealToWithMeal"
          >
            ◀
          </button>
        </div>
  
        <!-- 不用餐成員 -->
        <div class="column">
          <div class="column-header">
            <span>不用餐成員</span>
            <span>{{ withoutMealList.length }} 人</span>
          </div>
          <ul class="member-list">
            <li
              v-for="(item, index) in withoutMealList"
              :key="item.id"
              class="member-item"
              :class="{ selected: isSelected('withoutMeal', item.id) }"
              @click="select('withoutMeal', item.id)"
            >
              <span class="index">{{ index + 1 }}.</span>
              <span class="name">{{ item.name }}</span>
              <span v-if="item.dharma_name" class="dharma">
                （{{ item.dharma_name }}）
              </span>
              <span v-if="item.group" class="group">
                · {{ item.group }}
              </span>
              <span class="time">{{ formatTime(item.checked_in_at) }}</span>
            </li>
            <li v-if="withoutMealList.length === 0" class="empty">
              尚無不用餐成員
            </li>
          </ul>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed } from 'vue'
  import {
    fetchAttendancesByDate,
    createAttendance,
    updateAttendanceMeal,
    deleteAttendance
  } from '../api/attendance'
import {getMembers} from '../api/member'
  
  const attendances = ref([])
  const members = ref([])
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref('')
  
  // 今天日期字串（YYYY-MM-DD）
  const today = new Date()
  const dateString = today.toISOString().slice(0, 10)
  const displayDate = computed(() => dateString)
  
  // 非成員設定：暫時用靜態資料，你之後可以改從 DB 撈
  const nonMemberSlots = ref([
    '法師 1',
    '法師 2',
    '法師 3',
    '蓮友 A',
    '蓮友 B',
    '香燈',
    '看課'
  ])
  
  // 已出席者：用餐 / 不用餐
  const withMealList = computed(() =>
    attendances.value.filter(a => Boolean(a.with_meal))
  )
  const withoutMealList = computed(() =>
    attendances.value.filter(a => !Boolean(a.with_meal))
  )
  
  // 判斷 member 是否在今天已報到（用 last_checked_in 日期）
  function isCheckedInToday(member) {
    if (!member.last_checked_in) return false
    const lastDate = String(member.last_checked_in).split('T')[0]
    return lastDate === dateString
  }
  
  // 可設定成員：今日尚未報到的 active 成員
  const availableMembers = computed(() =>
    members.value.filter(m => m.status === 'active' && !isCheckedInToday(m))
  )
  
  const availableMembersSorted = computed(() => {
    return [...availableMembers.value].sort((a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hant')
    )
  })
  
  // ---- 選取狀態 ----
  const selected = ref({ type: null, id: null }) // type: 'available' | 'withMeal' | 'withoutMeal'
  
  function select(type, id) {
    selected.value = { type, id }
  }
  
  function isSelected(type, id) {
    return selected.value.type === type && selected.value.id === id
  }
  
  // ---- 控制按鈕是否可用 ----
  const canMoveAvailableToWithMeal = computed(
    () => selected.value.type === 'available'
  )
  const canMoveWithMealToAvailable = computed(
    () => selected.value.type === 'withMeal'
  )
  const canMoveWithMealToWithoutMeal = computed(
    () => selected.value.type === 'withMeal'
  )
  const canMoveWithoutMealToWithMeal = computed(
    () => selected.value.type === 'withoutMeal'
  )
  
  function formatTime(dt) {
    if (!dt) return ''
    const d = new Date(dt)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const ss = String(d.getSeconds()).padStart(2, '0')
    return `${hh}:${mm}:${ss}`
  }
  
  function statusText(status) {
    if (status === 'leave') return '離職'
    if (status === 'hidden') return '隱藏'
    return status || ''
  }
  
  async function loadData() {
    loading.value = true
    error.value = ''
    try {
      const [attRes, memRes] = await Promise.all([
        fetchAttendancesByDate(dateString),
        getMembers()
      ])
      attendances.value = attRes.data || []
      members.value = memRes.data || []
    } catch (e) {
      console.error(e)
      error.value =
        e?.response?.data?.message || e?.message || '資料載入失敗'
    } finally {
      loading.value = false
    }
  }
  
  // ---- 按鈕動作 ----
  
  // 本次活動可設定成員  ▶  用餐成員
  async function moveAvailableToWithMeal() {
    if (!canMoveAvailableToWithMeal.value || submitting.value) return
    const member = availableMembersSorted.value.find(
      m => m.id === selected.value.id
    )
    if (!member) return
  
    submitting.value = true
    try {
      await createAttendance({
        member_id: member.id,
        with_meal: true,
        source: 'manual'
      })
      await loadData()
      selected.value = { type: null, id: null }
    } catch (e) {
      console.error(e)
      alert(
        '報到失敗：' +
          (e?.response?.data?.message || e?.message || '未知錯誤')
      )
    } finally {
      submitting.value = false
    }
  }

  function handleAvailableDblClick(memberId) {
    // 先把這個人設為選取中
    select('available', memberId)
    // 再呼叫既有的「移到用餐成員」流程
    moveAvailableToWithMeal()
  }
  
  // 用餐成員  ◀  本次活動可設定成員（取消出席）
  async function moveWithMealToAvailable() {
    if (!canMoveWithMealToAvailable.value || submitting.value) return
    const att = withMealList.value.find(a => a.id === selected.value.id)
    if (!att) return
  
    submitting.value = true
    try {
      await deleteAttendance(att.id)
      await loadData()
      selected.value = { type: null, id: null }
    } catch (e) {
      console.error(e)
      alert(
        '取消出席失敗：' +
          (e?.response?.data?.message || e?.message || '未知錯誤')
      )
    } finally {
      submitting.value = false
    }
  }
  
  // 用餐成員  ▶  不用餐成員（with_meal: true -> false）
  async function moveWithMealToWithoutMeal() {
    if (!canMoveWithMealToWithoutMeal.value || submitting.value) return
    const att = withMealList.value.find(a => a.id === selected.value.id)
    if (!att) return
  
    submitting.value = true
    try {
      await updateAttendanceMeal(att.id, false)
      await loadData()
      selected.value = { type: null, id: null }
    } catch (e) {
      console.error(e)
      alert(
        '切換為不用餐失敗：' +
          (e?.response?.data?.message || e?.message || '未知錯誤')
      )
    } finally {
      submitting.value = false
    }
  }
  
  // 不用餐成員  ◀  用餐成員（with_meal: false -> true）
  async function moveWithoutMealToWithMeal() {
    if (!canMoveWithoutMealToWithMeal.value || submitting.value) return
    const att = withoutMealList.value.find(a => a.id === selected.value.id)
    if (!att) return
  
    submitting.value = true
    try {
      await updateAttendanceMeal(att.id, true)
      await loadData()
      selected.value = { type: null, id: null }
    } catch (e) {
      console.error(e)
      alert(
        '切換為用餐失敗：' +
          (e?.response?.data?.message || e?.message || '未知錯誤')
      )
    } finally {
      submitting.value = false
    }
  }
  
  onMounted(loadData)
  </script>
  
  <style scoped>
  .attendance-panel {
    max-width: 1300px;
    margin: 32px auto;
    padding: 24px;
    background: #f7fafb;
    border-radius: 8px;
    border: 1px solid #bbb;
    box-shadow: 2px 2px 12px #eee;
  }
  
  .summary-row {
    display: flex;
    justify-content: flex-start;
    gap: 8px;
    margin-bottom: 16px;
    font-size: 15px;
    color: #224366;
  }
  
  .hint {
    margin-top: 8px;
    color: #555;
  }
  
  .error {
    margin-top: 8px;
    color: #b00020;
  }
  
  .columns {
    display: flex;
    gap: 8px;
  }
  
  /* 一般欄位 */
  .column {
    flex: 1;
    min-width: 0;
    background: #ffffff;
    border: 1px solid #ddd;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
  }
  
  .column.narrow {
    flex: 0 0 160px;
  }
  
  /* 控制欄（左右箭頭） */
  .control-column {
    flex: 0 0 48px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .ctrl-btn {
    width: 32px;
    height: 32px;
    margin: 4px 0;
    border-radius: 50%;
    border: 1px solid #999;
    background: #fff;
    cursor: pointer;
    font-size: 16px;
  }
  
  .ctrl-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }
  
  .column-header {
    display: flex;
    justify-content: space-between;
    padding: 8px 10px;
    background: #e3eef5;
    border-bottom: 1px solid #ddd;
    font-size: 14px;
    font-weight: 600;
  }
  
  .column-header.center {
    justify-content: center;
  }
  
  .member-list {
    list-style: none;
    margin: 0;
    padding: 8px 0;
    max-height: 420px;
    overflow-y: auto;
  }
  
  .member-item {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    font-size: 14px;
    border-bottom: 1px solid #f0f0f0;
    gap: 4px;
    cursor: pointer;
  }
  
  .member-item:last-child {
    border-bottom: none;
  }
  
  /* 被選取時的高亮 */
  .member-item.selected {
    background: #ffe9b5;
  }
  
  .index {
    width: 26px;
    text-align: right;
    margin-right: 4px;
    color: #666;
  }
  
  .name {
    font-weight: 600;
    margin-right: 2px;
  }
  
  .dharma {
    margin-right: 4px;
    color: #555;
  }
  
  .group {
    margin-left: 4px;
    color: #777;
    font-size: 13px;
  }
  
  .time {
    margin-left: auto;
    font-size: 12px;
    color: #999;
  }
  
  .status-tag {
    margin-left: 6px;
    font-size: 12px;
    color: #b06500;
  }
  
  .empty {
    padding: 12px;
    text-align: center;
    color: #888;
    font-size: 14px;
  }
  </style>
  