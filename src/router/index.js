import { createRouter, createWebHistory } from 'vue-router'
import MemberList from '../views/MemberList.vue';
import MemberForm from '../components/MemberForm.vue';

const routes = [
  {
    path: '/',
    name: 'Login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  { path: '/members', component: MemberList },
  { path: '/members/new', component: MemberForm, props: { mode: 'create' } },
  { path: '/members/:id/edit', component: MemberForm, props: route => ({ id: route.params.id, mode: 'edit' }) },
  {
    path: '/attendance/today',
    name: 'attendance-today',
    component: () => import('../views/TodayAttendance.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 確保未登入者無法進入主頁
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.name !== 'Login' && !token) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router