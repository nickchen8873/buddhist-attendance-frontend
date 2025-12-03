import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import { useUserStore } from './store'

const app = createApp(App)

app.use(router)
app.use(createPinia())

// 這裡先把登入資訊從 localStorage 載回 store
const userStore = useUserStore()
userStore.restoreFromStorage()

app.mount('#app')