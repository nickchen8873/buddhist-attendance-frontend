<template>
    <div class="top-actions">
      <button class="home-btn" @click="backToHome">
        <span class="home-btn__icon">←</span>
        回首頁
      </button>
    </div>

    <div class="attendance-panel">
      <!-- 上方只顯示日期 -->
      <div class="summary-row">
        <span>日期：{{ displayDate }}</span>

        <div class="search-box">
            <input
            v-model="searchKeyword"
            type="text"
            placeholder="輸入姓名 / 法名"
            @keyup.enter="handleSearchCheckin"
            />
            <button
            type="button"
            :disabled="submitting || !searchKeyword.trim()"
            @click="handleSearchCheckin"
            >
            搜尋報到
            </button>
        </div>
    </div>
    <!-- (目前沒有使用此功能) -->
    <!-- <input
      ref="scanInput"
      v-model="scanText"
      class="scan-input-hidden"
      placeholder="請掃描 QR Code 或輸入條碼"
      @keyup.enter="onScanSubmit"
    /> -->

        <!-- 🔽 QR Code 報到區塊 -->
    <!-- <div style="margin-bottom: 16px;">
      <CheckinScanner @checked-in="loadData" />
    </div> -->
  
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
              @dblclick="handleNonMemberDblClick(item, index)"
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
              :data-type="'available'"
              :data-id="item.id"
              tabindex="-1"
              @click="select('available', item.id)"
              @dblclick="handleAvailableDblClick(item.id)"
            >
              <span class="index">{{ index + 1 }}.</span>
              <span class="name">{{ item.name || item.guest_name }}</span>
              <span v-if="item.dharma_name" class="dharma">
                （{{ item.dharma_name }}）
              </span>
              <!-- <span v-if="item.group" class="group">
                · {{ item.group }}
              </span> -->
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
              :data-type="'withMeal'"
              :data-id="item.id"
              tabindex="-1"
              @click="select('withMeal', item.id)"
            >
              <span class="index">{{ index + 1 }}.</span>
              <span class="name">{{ item.name || item.guest_name }}</span>
              <span v-if="item.dharma_name" class="dharma">
                （{{ item.dharma_name }}）
              </span>
              <!-- <span v-if="item.group" class="group">
                · {{ item.group }}
              </span> -->
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
              :data-type="'withoutMeal'"
              :data-id="item.id"
              tabindex="-1"
              @click="select('withoutMeal', item.id)"
            >
              <span class="index">{{ index + 1 }}.</span>
              <span class="name">{{ item.name || item.guest_name }}</span>
              <span v-if="item.dharma_name" class="dharma">
                （{{ item.dharma_name }}）
              </span>
              <!-- <span v-if="item.group" class="group">
                · {{ item.group }}
              </span> -->
              <span class="time">{{ formatTime(item.checked_in_at) }}</span>
            </li>
            <li v-if="withoutMealList.length === 0" class="empty">
              尚無不用餐成員
            </li>
          </ul>
        </div>

        <!-- 🔹 上週同日出席名單 -->
        <!-- <div class="column last-week-column">
          <div class="column-header">
            <span>
              上週
              <span v-if="lastWeekDisplayDate">{{ lastWeekDisplayDate }}</span>
              <span v-else>同日</span>
              出席名單
            </span>
            <span>{{ lastWeekList.length }} 人</span>
          </div>

          <ul class="member-list">
            <li v-if="lastWeekLoading" class="empty">
              上週名單載入中…
            </li>
            <li v-else-if="lastWeekError" class="empty">
              {{ lastWeekError }}
            </li>
            <template v-else>
              <li
                v-for="(item, index) in lastWeekList"
                :key="item.attendance_id || item.id"
                class="member-item"
                @dblclick="handleLastWeekDblClick(item)"
              >
                <span class="index">{{ index + 1 }}.</span>
                <span class="name">{{ item.name || item.guest_name }}</span>
                <span v-if="item.dharma_name" class="dharma">
                  （{{ item.dharma_name }}）
                </span>
                <span v-if="item.group" class="group">
                  · {{ item.group }}
                </span>
              </li>
              <li v-if="lastWeekList.length === 0" class="empty">
                上週同日無出席紀錄
              </li>
            </template>
          </ul>
        </div> -->

      </div>
    </div>
  </template>
  
  <script setup>
  import CheckinScanner from '../components/CheckinScanner.vue'
  import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
  import {
    fetchAttendancesByDate,
    createAttendance,
    updateAttendanceMeal,
    deleteAttendance,
    checkinByKeyword,
    fetchLastWeekAttendances
  } from '../api/attendance'
import {getMembers} from '../api/member'
import { useRouter } from 'vue-router'
  
  const attendances = ref([])
  const members = ref([])
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref('')

  // 上週同日出席名單
  const lastWeekList = ref([])
  const lastWeekTargetDate = ref('')   // 後端回傳的 targetDate (YYYY-MM-DD)
  const lastWeekLoading = ref(false)
  const lastWeekError = ref('')

  // 🔍 搜尋用關鍵字
  const searchKeyword = ref('')
  
  // 今天日期字串（YYYY-MM-DD）
  const today = new Date()
  const dateString = today.toISOString().slice(0, 10)
  const displayDate = computed(() => dateString)
  
  // 非成員設定：暫時用靜態資料，你之後可以改從 DB 撈
  const nonMemberSlotsMaster = [
  '法師 1','法師 2','法師 3','法師 4',
  '蓮友 1','蓮友 2','蓮友 3','蓮友 4',
  '家屬 1','家屬 2','家屬 3','家屬 4',
  '看護 1','看護 2','看護 3','看護 4'
  ]

  const nonMemberSlots = ref([...nonMemberSlotsMaster])

  // (目前沒有使用此功能)
  // const scanInput = ref(null)
  // (目前沒有使用此功能)
  // const scanText = ref('')

  const synth = window.speechSynthesis || null
  
  const router = useRouter()

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
  
  // ✅ 批次高亮（這次報到成功的多筆）
  const batchSelected = ref({
    withMeal: [],
    withoutMeal: [],
    available: []
  })

  function clearBatchSelected() {
    batchSelected.value = { withMeal: [], withoutMeal: [], available: [] }
  }

  function select(type, id) {
    clearBatchSelected()
    selected.value = { type, id }
  }
  
  function isSelected(type, id) {
    const single = selected.value.type === type && selected.value.id === id
    const batch = (batchSelected.value[type] || []).includes(id)
    return single || batch
  }

  // ✅ scroll + focus 到指定列
  function focusAttendanceRow(type, id) {
    const el = document.querySelector(`[data-type="${type}"][data-id="${id}"]`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (typeof el.focus === 'function') el.focus({ preventScroll: true })
  }

  function getAnonLabel(att) {
  // 只針對匿名報到（guest）
  if (!att) return ''
  if (att.member_id != null) return ''      // 記名的不要算名額
  if (att.source !== 'guest') return ''     // 只有 guest 才占名額
  return String(att.guest_name || '').trim()
}


function restoreNonMemberSlot(label) {
  if (!label) return
  if (nonMemberSlots.value.includes(label)) return

  const masterIdx = nonMemberSlotsMaster.indexOf(label)

  // 不在 master（例如你未來允許自訂）→ 直接加到尾端
  if (masterIdx === -1) {
    nonMemberSlots.value.push(label)
    return
  }

  // 插回「原本的排序位置」
  let insertAt = nonMemberSlots.value.length
  for (let i = 0; i < nonMemberSlots.value.length; i++) {
    const cur = nonMemberSlots.value[i]
    const curIdx = nonMemberSlotsMaster.indexOf(cur)
    if (curIdx !== -1 && curIdx > masterIdx) {
      insertAt = i
      break
    }
  }
  nonMemberSlots.value.splice(insertAt, 0, label)
}

function rebuildNonMemberSlotsFromAttendances() {
  const used = new Set()

  for (const a of attendances.value || []) {
    const label = getAnonLabel(a)
    if (!label) continue

    // 只把「剛好是名額表中的名稱」視為被占用名額
    if (nonMemberSlotsMaster.includes(label)) {
      used.add(label)
    }
  }

  nonMemberSlots.value = nonMemberSlotsMaster.filter(x => !used.has(x))
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
  
  const lastWeekDisplayDate = computed(() => {
    if (!lastWeekTargetDate.value) return ''
    // '2025-12-02' -> '2025/12/02'
    return lastWeekTargetDate.value.replace(/-/g, '/')
  })

  
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
    clearBatchSelected()
    try {
      const [attRes, memRes] = await Promise.all([
        fetchAttendancesByDate(dateString),
        getMembers()
      ])
      attendances.value = attRes.data || []
      members.value = memRes.data || []

      // ✅ 讓非成員名額永遠和今日匿名出席同步（刷新也不會回來）
      rebuildNonMemberSlotsFromAttendances()
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

  // (目前沒有使用此功能)
  // function globalKeydownHandler(e) {
  //   if (!scanInput.value) return

  //   const active = document.activeElement
  //   const tag = active?.tagName
  //   const isTextInput =
  //     tag === 'INPUT' ||
  //     tag === 'TEXTAREA' ||
  //     active?.isContentEditable

  //   // 如果現在沒有在任何「可以打字的欄位」上，就幫忙把焦點拉回掃碼框
  //   if (!isTextInput && active !== scanInput.value) {
  //     scanInput.value.focus()
  //   }
  // } 

  function speak(text) {
    if (!synth) return

    // 建立要念的內容
    const utter = new SpeechSynthesisUtterance(text)

    // 優先找中文語音
    const voices = synth.getVoices()
    const zhVoice =
      voices.find(v => v.lang && v.lang.toLowerCase().startsWith('zh')) ||
      voices[0]

    if (zhVoice) {
      utter.voice = zhVoice
    }

    utter.rate = 1      // 語速
    utter.pitch = 1     // 音高

    // 先把前一次還沒講完的清掉，避免重疊
    synth.cancel()
    synth.speak(utter)
  }

  function backToHome() {
    router.push('/home')
  }
  
  // 用餐成員  ◀  本次活動可設定成員（取消出席）
  async function moveWithMealToAvailable() {
  if (!canMoveWithMealToAvailable.value || submitting.value) return
  const att = withMealList.value.find(a => a.id === selected.value.id)
  if (!att) return

  const anonLabel = getAnonLabel(att) // ✅ 先記起來（若是匿名就會有值）

  submitting.value = true
  try {
    await deleteAttendance(att.id)

    // ✅ 若是匿名名額，立刻塞回去（不等 loadData 也會立刻看到）
    if (anonLabel && nonMemberSlotsMaster.includes(anonLabel)) {
      restoreNonMemberSlot(anonLabel)
    }

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
  
  // ---- 搜尋框：按 Enter 或按鈕 -> POST /api/checkin ----
  async function handleSearchCheckin() {
  const kw = searchKeyword.value.trim()
  if (!kw || submitting.value) return

  submitting.value = true
  try {
    const res = await checkinByKeyword(kw)

    // ✅ 後端可能回 attendance(單筆) 或 attendances(多筆)
    const newAtts =
      res?.data?.attendances ||
      (res?.data?.attendance ? [res.data.attendance] : [])

    // 清空輸入框
    searchKeyword.value = ''

    // 重新載入資料
    await loadData()
    await nextTick()
    
    // ✅ 把這次成功報到的成員全都設為選取(高亮)
    const withIds = []
    const withoutIds = []

    for (const a of newAtts) {
      if (!a?.id) continue
      if (Boolean(a.with_meal)) withIds.push(a.id)
      else withoutIds.push(a.id)
    }

    batchSelected.value.withMeal = withIds
    batchSelected.value.withoutMeal = withoutIds

    // ✅ focus 到「最新一筆」（通常就是最後一筆）
    const focusAtt = newAtts[newAtts.length - 1]
    if (focusAtt?.id) {
      const type = focusAtt.with_meal ? 'withMeal' : 'withoutMeal'
      // 單筆選取仍要設，避免箭頭操作沒有 target
      selected.value = { type, id: focusAtt.id }
      await nextTick()
      focusAttendanceRow(type, focusAtt.id)
    }
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


async function loadLastWeekList() {
    lastWeekLoading.value = true
    lastWeekError.value = ''
    try {
      const res = await fetchLastWeekAttendances(dateString)
      const payload = res.data || {}
      lastWeekList.value = payload.data || []
      lastWeekTargetDate.value = payload.targetDate || ''
    } catch (e) {
      console.error(e)
      lastWeekError.value =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        '上週同日出席名單載入失敗'
      lastWeekList.value = []
      lastWeekTargetDate.value = ''
    } finally {
      lastWeekLoading.value = false
    }
  }

  // 從「上週同日出席名單」雙擊帶入今天報到
  async function handleLastWeekDblClick(item) {
    if (submitting.value) return

    // 從上週資料取出 member_id（若後端同時給 member.id 也順便兼容）
    const memberId = item.member_id || item.id
    if (!memberId) return

    // 若今天已經有這個人的出席紀錄，就不再重複新增
    const alreadyCheckedIn = attendances.value.some(
      a => String(a.member_id) === String(memberId)
    )
    if (alreadyCheckedIn) {
      alert('此成員今日已在出席名單中。')
      return
    }

    submitting.value = true
    try {
      // 沿用上週的用餐狀態，若沒有就預設 true
      const withMeal = typeof item.with_meal === 'boolean'
        ? item.with_meal
        : true

      await createAttendance({
        member_id: memberId,
        with_meal: withMeal,
        source: 'last_week',  // 可讓你之後在後端區分來源
      })

      // 重新載入今日資料（用餐 / 不用餐 / 可設定成員）
      await loadData()
    } catch (e) {
      console.error(e)
      alert(
        '從上週名單帶入失敗：' +
          (e?.response?.data?.message || e?.message || '未知錯誤')
      )
    } finally {
      submitting.value = false
    }
  }


  // (目前沒有使用此功能)
//   async function onScanSubmit() {
//     const code = scanText.value.trim()
//     if (!code) return

//     try {
//       const res = await checkinWithBarcode(code, true) // 第二個參數是預設 with_meal，可自行調整
//       const { duplicated, message } = res.data

//       if (duplicated) {
//         // 🔊 重複報到：講「重複報到」
//         speak('重複報到')
//         // 你也可以同時顯示訊息
//         console.log(message || '今日已完成報到')
//       } else {
//         // 🔊 第一次報到成功：講「報到成功」
//         speak('報到成功')
//         console.log(message || '報到成功')
//       }

//       // 如果你有今日清單，可以這時候刷新：
//       // await loadData()
//     } catch (err) {
//       console.error('checkin error:', err)
//       speak('報到失敗')
//       alert(
//         err?.response?.data?.message ||
//         err?.response?.data?.error ||
//         err.message ||
//         '報到失敗'
//       )
//     } finally {
//       scanText.value = ''
//       scanInput.value?.focus()
//     }
//   }
// }

    onMounted(() => {
      loadData()
      loadLastWeekList()
      // (目前沒有使用此功能) 一進頁面，先讓掃描框拿到焦點
      // scanInput.value?.focus()

      // 🔍 只要有按鍵事件，而且不是在其他輸入框上打字，就把焦點拉回掃碼框
      // window.addEventListener('keydown', globalKeydownHandler, true)
    })

    onBeforeUnmount(() => {
      // window.removeEventListener('keydown', globalKeydownHandler, true)
    })

      // 非成員設定：雙擊建立匿名出席
  async function handleNonMemberDblClick(label, index) {
    if (submitting.value) return

    // 如果你希望「同一格只記錄一次」，可以先檢查今天是否已經有同名 guest
    const alreadyExists = attendances.value.some(
      a => !a.member_id && a.guest_name === label && a.with_meal
    )
    if (alreadyExists) {
      alert(`${label} 今日已在用餐名單中`)
      return
    }

    submitting.value = true
    try {
      await createAttendance({
        with_meal: true,
        source: 'guest',
        guest_name: label,
        guest_type: '非成員', // 或根據 label 去對應 '法師', '家屬', '看護'...
      })

      await loadData()   // 重新撈今日出席，右邊用餐欄位就會多出這一筆
    } catch (e) {
      console.error(e)
      alert(
        '匿名報到失敗：' +
          (e?.response?.data?.message || e?.message || '未知錯誤')
      )
    } finally {
      submitting.value = false
    }
  }

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
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 20px;
  color: #224366;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 6px;
}

.search-box input {
  width: 260px;
  padding: 4px 8px;
  border: 1px solid #bbb;
  border-radius: 4px;
  font-size: 18px;
}

.search-box button {
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid #888;
  background: #ffffff;
  cursor: pointer;
  font-size: 18px;
}

.search-box button:disabled {
  opacity: 0.6;
  cursor: default;
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
    font-size: 18px;
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
    font-size: 20px;
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

  .member-item:focus {
    outline: 2px solid rgba(34, 67, 102, 0.35);
    outline-offset: -2px;
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

  .scan-input-hidden {
    position: absolute;
    left: -9999px;    /* 移出螢幕外 */
    width: 1px;
    height: 1px;
    opacity: 0;
    border: 0;
    padding: 0;
  }

  .last-week-column {
    flex: 0 0 230px;  /* 視覺上比較像示意圖，可自行調整或乾脆拿掉這行 */
  }

  .top-actions{
  max-width: 1300px;   /* 跟 .attendance-panel 一樣寬 */
  margin: 18px 0px 0;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
.home-btn{
  display: inline-flex;
  align-items: center;
  gap: 8px;

  background: #224366;
  color: #fff;
  border: 1px solid #18324d;
  border-radius: 10px;

  padding: 10px 16px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 1px;

  box-shadow: 0 6px 16px rgba(34, 67, 102, 0.25);
  cursor: pointer;
  user-select: none;

  transition: transform 120ms ease, box-shadow 120ms ease, filter 120ms ease;
}
.home-btn:hover{
  filter: brightness(1.08);
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(34, 67, 102, 0.28);
}
.home-btn:active{
  transform: translateY(0px);
  box-shadow: 0 6px 16px rgba(34, 67, 102, 0.22);
}
.home-btn:focus-visible{
  outline: 3px solid rgba(34, 67, 102, 0.25);
  outline-offset: 2px;
}
.home-btn__icon{
  font-size: 18px;
  line-height: 1;
}

  </style>
  