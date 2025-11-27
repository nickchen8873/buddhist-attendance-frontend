import { defineStore } from 'pinia'
import { setApiToken } from '../api/index'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,       // 可以放 id, role 等
    username: null,   // 顯示用
    token: null       // JWT 或其他 access token
  }),
  actions: {
    setUser(user, token) {
      this.user = user
      this.username = user?.username || null
      this.token = token

      setApiToken(token)          // 設定 axios / fetch header
      localStorage.setItem('token', token) // 如果你有打算讓登入持久化
      console.log('userId= ', this.user.id)
      localStorage.setItem('userId', this.user.id ?? '')
      localStorage.setItem('username', this.username ?? '')
      localStorage.setItem('role', this.user.role ?? '')
    },
    restoreFromStorage() {
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')
      const username = localStorage.getItem('username')
      const role = localStorage.getItem('role')

      if (token) {
        this.token = token
        this.username = username || null
        setApiToken(token)
      }
    },
    logout() {
      this.user = null
      this.username = null
      this.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      localStorage.removeItem('username')
      localStorage.removeItem('role')
      setApiToken(null)
    }
  }
})
