// src/api/attendance.js
import api from './index'

// 取得某一天的出席清單；date 格式為 "YYYY-MM-DD"
export function fetchAttendancesByDate(date) {
  return api.get('/attendances', {
    params: { date }
  })
}

// 建立一筆出席（當日報到）
// payload: { member_id: number, with_meal: boolean, source?: string }
export function createAttendance(payload) {
    return api.post('/attendances', payload)
}

// 更新 with_meal（用餐 <-> 不用餐）
export function updateAttendanceMeal(id, with_meal) {
    return api.patch(`/attendances/${id}`, { with_meal })
}
  
// 取消出席（讓成員回到「本次活動可設定成員」欄）
export function deleteAttendance(id) {
    return api.delete(`/attendances/${id}`)
}

// 🔍 透過關鍵字快速報到：姓名 / 法名 / 手機後三碼
export function checkinByKeyword(keyword) {
    return api.post('/attendances/checkin', { keyword })
}