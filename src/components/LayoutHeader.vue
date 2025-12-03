<template>
    <header class="app-header">
      <div class="app-title">佛堂報到系統</div>
  
      <div class="user-info" v-if="username">
        <span>帳號：</span>
        <span class="user-name">{{ username }}</span>
        <span class="user-role">（{{ roleLabel }}）</span>
        <button class="logout-btn" @click="onLogout">登出</button>
      </div>
    </header>
  </template>
  
  <script setup>
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useUserStore } from '../store'
  
  const router = useRouter()
  const userStore = useUserStore()
  
  const username = computed(() => userStore.username)
  const role = computed(() => userStore.role)
  const roleLabel = computed(() => {
    if (role.value === 'admin') return '管理員'
    if (role.value === 'staff') return '工作人員'
    return '一般使用者'
  })
  
  const onLogout = () => {
    userStore.logout()
    router.push('/login')
  }
  </script>
  
  <style scoped>
  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: #224366;
    color: #fff;
    font-size: 14px;
  }
  .app-title {
    font-size: 18px;
    font-weight: 600;
  }
  .user-info {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .user-name {
    font-weight: 600;
  }
  .logout-btn {
    margin-left: 8px;
    padding: 2px 10px;
    font-size: 13px;
    border-radius: 4px;
    border: 1px solid #fff;
    background: transparent;
    color: white;
    cursor: pointer;
  }
  .logout-btn:hover {
    background: rgba(255,255,255,0.15);
  }
  </style>
  