<template>
  <div class="member-form-panel">
    <h2>{{ mode === 'edit' ? '編輯成員資料' : '新增成員資料' }}</h2>
    <form @submit.prevent="onSubmit">
      <div class="form-grid">
        <!-- 左欄 -->
        <div class="col">
          <div class="form-row">
            <label class="label-operator">
              登入帳號：
              <!-- <span>查詢操作者帳號</span> -->
            </label>
            <div class="field">
              <input v-model="user.username" readonly style="background:#f0f0f0"/>
            </div>
          </div>

          <div class="form-row">
            <label>姓名：</label>
            <div class="field">
              <input v-model="member.name" />
              <div class="error-text" v-if="errors.name">{{ errors.name }}</div>
            </div>
          </div>

          <div class="form-row">
            <label>出生日期：</label>
            <div class="field">
              <input v-model="birthday" type="date" />
              <div class="error-text" v-if="errors.birthday">{{ errors.birthday }}</div>
            </div>
          </div>

          <div class="form-row">
            <label>到職日期：</label>
            <div class="field">
              <input v-model="created_at" type="date" readonly style="background:#f0f0f0"/>
              <div class="error-text" v-if="errors.created_at">{{ errors.created_at }}</div>
            </div>
          </div>

          <div class="form-row status-row">
            <label>狀態：</label>
            <div class="field">
              <label><input type="radio" value="active" v-model="member.status" /> 在職</label>
              <label><input type="radio" value="hidden" v-model="member.status" /> 隱藏</label>
              <label><input type="radio" value="leave" v-model="member.status" /> 離職</label>
            </div>
          </div>

          <div class="form-row">
            <label>手機號碼：</label>
            <div class="field">
              <input v-model="member.phone" />
              <div class="error-text" v-if="errors.phone">{{ errors.phone }}</div>
            </div>
          </div>

          <div class="form-row">
            <label>居家地址：</label>
            <div class="field">
              <input v-model="member.address" />
            </div>
          </div>

          <div class="form-row">
            <label>資訊備註：</label>
            <div class="field">
              <input v-model="member.remark" />
            </div>
          </div>
        </div>

        <!-- 右欄 -->
        <div class="col">
          <div class="form-row">
            <label>密碼：</label>
            <div class="field">
              <input
                v-model="user.password"
                type="password"
                :readonly="mode === 'create' || user.role !== 'admin'"
                :style="inputStyle"
              />
            </div>
          </div>

          <div class="form-row" v-if="mode==='create'">
            <label>ID No.：</label>
            <div class="field">
              <input :value="member.id" readonly style="background:#f0f0f0"/>
            </div>
          </div>

          <div class="form-row">
            <label>法名：</label>
            <div class="field">
              <input v-model="member.dharma_name" />
            </div>
          </div>

          <div class="form-row">
            <label>性別：</label>
            <div class="field">
              <select v-model="member.gender">
                <option value="F">女性</option>
                <option value="M">男性</option>
              </select>
              <div class="error-text" v-if="errors.gender">{{ errors.gender }}</div>
            </div>
          </div>

          <div class="form-row">
            <label>組別：</label>
            <div class="field">
              <input v-model="member.group" />
            </div>
          </div>

          <div class="form-row">
            <label>群組：</label>
            <div class="field">
              <select v-model="member.role">
                <option value="member">共修蓮友</option>
                <option value="volunteer">志工幹部</option>
                <option value="teacher">輔導法師</option>
              </select>
              <div class="error-text" v-if="errors.role">{{ errors.role }}</div>
            </div>
          </div>

          <div class="form-row" v-if="mode==='edit'">
            <label>離職日期：</label>
            <div class="field">
              <input v-model="leave_date" type="date" />
              <div class="error-text" v-if="errors.leave_date">{{ errors.leave_date }}</div>
            </div>
          </div>

          <div class="form-row">
            <label>家用電話：</label>
            <div class="field">
              <input v-model="member.telephone" />
              <div class="error-text" v-if="errors.telephone">{{ errors.telephone }}</div>
            </div>
          </div>

          <div class="form-row" v-if="mode==='edit'">
            <label>ID No.：</label>
            <div class="field">
              <input v-model="member.id" readonly style="background:#f0f0f0"/>
            </div>
          </div>

          <!-- QR Code -->
          <div class="form-row" v-if="mode === 'edit'">
            <label>QR Code：</label>
            <div class="field qr-wrapper">
              <template v-if="barcodeUrl">
                <img :src="barcodeUrl" alt="Member QR Code" class="qr-image" />
                <div class="qr-text">條碼：{{ member.barcode }}</div>
              </template>
              <div v-else class="qr-placeholder">
                尚未產生條碼
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit">{{ mode === 'edit' ? '儲存修改' : '新增' }}</button>
        <button type="button" @click="onCancel">取消</button>
      </div>
    </form>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createMember, getMember, updateMember, fetchMaxId } from '../api/member'
import { updateUser } from '../api/user'
import { useUserStore } from '../store'
import QRCode from 'qrcode'

const route = useRoute()
const router = useRouter()
const mode = route.name === 'edit' || route.path.includes('/edit') ? 'edit' : 'create'

const userStore = useUserStore()

const user = ref({
  id: computed(() => userStore.userId),
  username: computed(() => userStore.username),
  password: '      ',
  role: computed(() => userStore.role)
})

const member = ref({
  id: 0,
  name: '',
  dharma_name: '',
  gender: 'F',
  phone: '',
  birthday: null,
  address: '',
  remark: '',
  status: 'active',
  role: 'member',
  group: '',
  leave_date: null,
  telephone: '',
  barcode: '',
  created_at: null,
  created_by: '',
  updated_by: '',
  updated_at: null
})

const barcodeUrl = ref('')

// 驗證錯誤訊息
const errors = ref({
  name: '',
  gender: '',
  role: '',
  created_at: '',
  phone: '',
  telephone: '',
  birthday: '',
  leave_date: ''
})

const birthday = useDateField(member, 'birthday')
const leave_date = useDateField(member, 'leave_date')
const created_at = useDateField(member, 'created_at')

const inputStyle = computed(() => {
  return {
    backgroundColor: mode === 'create' || user.value.role !== 'admin' ? '#f0f0f0' : 'white'
  }
})

// 產生「昨天」的 YYYY-MM-DD」字串
const getYesterdayString = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

// 載入編輯資料
onMounted(async () => {
  // const rawUserId = localStorage.getItem('userId') || ''
  // const rawUsername = localStorage.getItem('username') || ''
  // const rawRole = localStorage.getItem('role') || ''

  // user.value.id = rawUserId.trim()
  // user.value.username = rawUsername.trim()
  // user.value.role = rawRole.trim()
  // user.value.password = '      '

  if (mode === 'create') {
    const { data } = await fetchMaxId()
    member.value = {
      ...member.value,
      id: data + 1
    }
    await nextTick()
    created_at.value = getYesterdayString()
  }

  if (mode === 'edit' && route.params.id) {
    const { data } = await getMember(route.params.id)
    Object.assign(member.value, data)
    await generateQrFromBarcode()
  }
})

async function generateQrFromBarcode () {
  const code = member.value.barcode
  if (!code) {
    barcodeUrl.value = ''
    return
  }
  try {
    barcodeUrl.value = await QRCode.toDataURL(String(code), {
      width: 120,
      margin: 1
    })
  } catch (err) {
    console.error('QR code 產生失敗:', err)
    barcodeUrl.value = ''
  }
}

function useDateField (memberRef, field) {
  return computed({
    get: () => memberRef.value[field]?.split('T')[0] ?? null,
    set: (val) => {
      memberRef.value[field] = val ? `${val}T00:00:00.000Z` : null
    }
  })
}

// 表單驗證
function validateForm () {
  const e = {
    name: '',
    gender: '',
    role: '',
    created_at: '',
    phone: '',
    telephone: '',
    birthday: '',
    leave_date: ''
  }

  // 必填：姓名
  if (!member.value.name || !member.value.name.trim()) {
    e.name = '「姓名」為必填欄位'
  }

  // 必填：性別
  if (!member.value.gender) {
    e.gender = '「性別」為必選欄位'
  }

  // 必填：群組(role)
  if (!member.value.role) {
    e.role = '「群組」為必選欄位'
  }

  // 必填：到職日期
  if (!created_at.value) {
    e.created_at = '「到職日期」為必填欄位'
  }

  // 手機號碼：若有填，需為 09 開頭 + 10 碼數字
  const phone = (member.value.phone || '').trim()
  if (phone && !/^09\d{8}$/.test(phone)) {
    e.phone = '手機號碼格式應為 09 開頭的 10 碼數字'
  }

  // 家用電話：若有填，只允許數字與 -，6~15 碼
  const tel = (member.value.telephone || '').trim()
  if (tel && !/^[0-9\-]{6,15}$/.test(tel)) {
    e.telephone = '家用電話格式不正確（僅允許數字與「-」，長度 6~15 碼）'
  }

  // 日期相關檢查
  const todayStr = new Date().toISOString().slice(0, 10)

  if (birthday.value && birthday.value > todayStr) {
    e.birthday = '出生日期不可晚於今天'
  }

  if (mode === 'edit' && leave_date.value) {
    if (created_at.value && leave_date.value < created_at.value) {
      e.leave_date = '離職日期不可早於到職日期'
    } else if (leave_date.value > todayStr) {
      e.leave_date = '離職日期不可晚於今天'
    }
  }

  errors.value = e

  const msgs = Object.values(e).filter(Boolean)
  if (msgs.length > 0) {
    alert('請先修正以下欄位：\n\n' + msgs.join('\n'))
    return false
  }
  return true
}

async function onSubmit () {
  try {
    // 先做前端驗證
    if (!validateForm()) return

    if (mode === 'edit') {
      await updateMember(member.value.id, member.value)
      if (user.value.password.trim() !== '') {
        await updateUser(user.value.id, user.value)
      }
      alert('修改成功！')
    } else {
      const res = await createMember(member.value)
      console.log(res.data.barcode)
      alert('新增成功！')
    }
    router.push('/home')
  } catch (err) {
    alert('儲存失敗：' + err.message)
  }
}

function onCancel () {
  router.back()
}
</script>

<style scoped>
.member-form-panel {
  max-width: 1000px;
  background: #f7fafb;
  border: 1px solid #bbb;
  border-radius: 8px;
  margin: 32px auto;
  padding: 32px;
  box-shadow: 2px 2px 12px #eee;
}
.form-grid {
  display: flex;
  gap: 24px;
}
.col {
  flex: 1;
  min-width: 300px;
}
.form-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}
.form-row label {
  width: 90px;
  text-align: right;
  margin-right: 12px;
  color: #224366;
  padding-top: 4px;
}
.field {
  flex: 1;
}
.form-row input,
.form-row select {
  width: 100%;
  padding: 4px 8px;
  font-size: 15px;
  border: 1px solid #bbb;
  border-radius: 3px;
  box-sizing: border-box;
}
.error-text {
  margin-top: 4px;
  font-size: 12px;
  color: #d32f2f;
}

/* QR Code 區域 */
.qr-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.qr-image {
  width: 96px;
  height: 96px;
  border: 1px solid #ccc;
  background: #fff;
}
.qr-text {
  font-size: 12px;
  color: #555;
}
.qr-placeholder {
  font-size: 12px;
  color: #999;
}

.form-actions {
  margin-top: 28px;
  text-align: center;
}
.form-actions button {
  margin: 0 8px;
  padding: 6px 24px;
  font-size: 16px;
  border-radius: 4px;
}

/* 狀態那一行：維持左邊欄位標題靠右，radio 選項橫向排列 */
.status-row {
  align-items: center;
}

.status-row > label {
  /* 使用 .form-row label 的預設樣式：width:90px; text-align:right; */
}

.status-row .field {
  display: flex;
  align-items: center;
  gap: 16px; /* 在職 / 隱藏 / 離職 之間的間距 */
}

.status-row .field label {
  width: auto;
  margin-right: 0;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.status-row .field input[type="radio"] {
  margin-right: 4px;
}

/* 查詢操作者帳號 專用 label */
/* .label-operator {
  position: relative;
  overflow: visible;      
  white-space: nowrap;    
} */

/* 把「查詢操作者帳號」這串字整體往左移一點 */
/* .label-operator span {
  display: inline-block;
  margin-left: -32px;     
} */

/* 在 label 的最右側畫出冒號，位置跟其他欄位對齊 */
/* .label-operator::after {
  content: '：';
  position: absolute;
  right: 0;               
  top: 4px;               
} */


</style>
