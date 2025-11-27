<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store'
import { login } from '../api'

const router = useRouter()
const userStore = useUserStore()

const username = ref('')
const password = ref('')

const handleLogin = async () => {
  try {
    const res = await login(username.value, password.value)
    userStore.setUser(res.data.user, res.data.token)
    password.value = '' // 登入成功後立刻清掉密碼欄位（只留在 input，不進 store）
    router.push('/home')
  } catch (err) {
    alert('登入失敗，請確認帳號密碼')
  }
}

const clearForm = () => {
  username.value = ''
  password.value = ''
}
</script>

<template>
  <div class="login-container">
    <h2>新店念佛會志工系統</h2>
    <input v-model="username" placeholder="使用者名稱" />
    <input type="password" v-model="password" placeholder="密碼" @keyup.enter="handleLogin" />
    <button @click="handleLogin">登入</button>
    <button @click="clearForm">清除</button>
  </div>
</template>

<style scoped>
.login-container {
  max-width: 400px;
  margin: auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  text-align: center;
}

input {
  width: 90%;
  padding: 8px;
  margin: 5px 0;
  border-radius: 3px;
  border: 1px solid #ccc;
}

button {
  padding: 8px 16px;
  margin: 5px;
  border-radius: 3px;
}
</style>
