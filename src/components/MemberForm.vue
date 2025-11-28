<template>
  <div class="member-form-panel">
    <h2>{{ mode === 'edit' ? '編輯成員資料' : '新增成員資料' }}</h2>
    <form @submit.prevent="onSubmit">
      <div class="form-grid">
        <!-- 左欄 -->
        <div class="col">
          <div class="form-row">
            <label>查詢操作者帳號：</label>
            <input v-model="user.username" readonly style="background:#f0f0f0"/>
          </div>
          <div class="form-row">
            <label>姓名：</label>
            <input v-model="member.name" required />
          </div>
          <div class="form-row">
            <label>出生日期：</label>
            <input v-model="birthday" type="date" />
          </div>
          <div class="form-row">
            <label>到職日期：</label>
            <input v-model="created_at" type="date" readonly style="background:#f0f0f0"/>
          </div>
          <div class="form-row">
            <label>狀態：</label>
            <label><input type="radio" value="active" v-model="member.status" /> 在職</label>
            <label><input type="radio" value="hidden" v-model="member.status" /> 隱藏</label>
            <label><input type="radio" value="leave" v-model="member.status" /> 離職</label>
          </div>
          <div class="form-row">
            <label>手機號碼：</label>
            <input v-model="member.phone" />
          </div>
          <div class="form-row">
            <label>居家地址：</label>
            <input v-model="member.address" />
          </div>
          <div class="form-row">
            <label>資訊備註：</label>
            <input v-model="member.remark" />
          </div>
        </div>

        <!-- 右欄 -->
        <div class="col">
          <div class="form-row">
            <label>密碼：</label>
            <input v-model="user.password" type="password" :readonly="mode === 'create' || user.role !== 'admin'" :style="inputStyle"/>
          </div>
          <div class="form-row" v-if="mode==='create'">
            <label>ID No.：</label>
            <input :value="member.id" readonly style="background:#f0f0f0"/>
          </div>
          <div class="form-row">
            <label>法名：</label>
            <input v-model="member.dharma_name" />
          </div>
          <div class="form-row">
            <label>性別：</label>
            <select v-model="member.gender">
              <option value="F">女性</option>
              <option value="M">男性</option>
            </select>
          </div>
          <div class="form-row">
            <label>組別：</label>
            <input v-model="member.group" />
          </div>
          <div class="form-row">
            <label>群組：</label>
            <select v-model="member.role">
              <option value="member">共修蓮友</option>
              <option value="volunteer">志工幹部</option>
              <option value="teacher">輔導法師</option>
            </select>
          </div>
          <div class="form-row" v-if="mode==='edit'">
            <label>離職日期：</label>
            <input v-model="leave_date" type="date" />
          </div>
          <div class="form-row">
            <label>家用電話：</label>
            <input v-model="member.telephone" />
          </div>
          <div class="form-row" v-if="mode==='edit'">
            <label>ID No.：</label>
            <input v-model="member.id" readonly style="background:#f0f0f0"/>
          </div>
          <!-- 🔽 顯示 QR Code -->
          <div class="form-row" v-if="mode === 'edit'">
            <label>QR Code：</label>
            <div class="qr-wrapper">
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
import { ref, computed, onMounted, nextTick} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {createMember, getMember, updateMember, fetchMaxId} from '../api/member'
import {useUserStore} from '../store/index'
import { updateUser } from '../api/user'
import QRCode from 'qrcode'

const route = useRoute()
const router = useRouter()
const mode = route.name === 'edit' || route.path.includes('/edit') ? 'edit' : 'create'
// 用來顯示「預估的下一筆 ID」（只在新建立員時顯示）
// const nextId = ref(null)
const user = ref({
  id: 0,
  username: '',
  password: '',
  role: ''
})

const member = ref({
  id: 0,
  name: '',
  dharma_name: '',
  gender: 'F',
  phone: '',
  birthday: '',
  address: '',
  remark: '',
  status: 'active',
  role: 'member',
  group: '',
  leave_date: '',
  telephone: '',
  barcode: '',
  created_at: '',
  created_by: '',
  updated_by: '',
  updated_at: ''
})

const barcodeUrl = ref('')

const birthday = useDateField(member, 'birthday')
const leave_date = useDateField(member, 'leave_date')
const created_at = useDateField(member, 'created_at')

// 這三個欄位名稱陣列，未來要再加日期欄位直接 push 進去即可
const dateFields = ['birthday', 'leave_date', 'created_at']

// 產生「昨天」的 YYYY-MM-DD」字串的函數
const getYesterdayString = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)  // 2025-11-22
}

const inputStyle = computed(() => {
  return {
    backgroundColor: mode === 'create' || user.value.role !== 'admin' ? '#f0f0f0' : 'white',
  }
})

// 載入編輯資料
onMounted(async () => {
  const rawUserId = localStorage.getItem('userId');
  user.value.id = rawUserId.trim()

  const rawUsername = localStorage.getItem('username');
  user.value.username = rawUsername.trim()

  const rawRole = localStorage.getItem('role');
  user.value.role = rawRole.trim()
  
  user.value.password = '      '

  if (mode === 'create') {
    const { data } = await fetchMaxId();  // 先抓最大ID 
    member.value = {
      ...member.value,
      id: data + 1
    }
    await nextTick() // 先等畫面渲染完（確保 computed 已經註冊好）
    created_at.value = getYesterdayString() // 直接用 computed 的 setter 賦值
  }
  if (mode === 'edit' && route.params.id) {
    const { data } = await getMember(route.params.id)
    Object.assign(member.value, data)

    // ✅ 拿到 member 資料之後產生 QR code
    await generateQrFromBarcode()
  }
})

async function generateQrFromBarcode() {
  const code = member.value.barcode
  if (!code) {
    barcodeUrl.value = ''
    return
  }
  try {
    // 你想要多大可以調 width，80~160 都OK
    barcodeUrl.value = await QRCode.toDataURL(String(code), {
      width: 120,
      margin: 1
    })
  } catch (err) {
    console.error('QR code 產生失敗:', err)
    barcodeUrl.value = ''
  }
}

function useDateField(memberRef, field) {
  return computed({
    get: () => memberRef.value[field]?.split('T')[0] ?? null,
    set: (val) => {
      memberRef.value[field] = val ? `${val}T00:00:00.000Z` : null
    }
  })
}

async function onSubmit() {
  try {
    if (mode === 'edit') {
      await updateMember(member.value.id, member.value) //呼叫members後端的update API
      if(user.value.password.trim() !== ''){
        await updateUser(user.value.id,user.value) //呼叫User後端的update API
      }
      alert('修改成功！')
    } else {
      const res = await createMember(member.value) //呼叫members後端的的create API
      console.log(res.data.barcode)
      alert('新增成功！')
    }
    router.push('/home')
  } catch (err) {
    alert('儲存失敗：' + err.message)
  }
}

function onCancel() {
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
  align-items: center;
  margin-bottom: 12px;
}
.form-row label {
  width: 90px;
  text-align: right;
  margin-right: 12px;
  color: #224366;
}
.form-row input,
.form-row select {
  flex: 1;
  padding: 4px 8px;
  font-size: 15px;
  border: 1px solid #bbb;
  border-radius: 3px;
}
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
</style>
