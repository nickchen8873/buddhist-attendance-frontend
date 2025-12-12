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

// (目前沒有使用此功能)開相機掃 QR Code用
export function checkinWithBarcode(barcode, withMeal = true) {
    return api.post('/attendances', {
      barcode,
      with_meal: withMeal,
      source: 'qr',   // 讓後端知道是從 QR 來的
    })
}

export function fetchLastWeekList(dateStr) {
  return axios.get('/api/attendance/last-week', {
    params: { date: dateStr }  // e.g. '2025-12-09'
  });
}

// 取得「上週同日出席名單」
export function fetchLastWeekAttendances(date) {
  // date 格式：'YYYY-MM-DD'
  return api.get('/attendances/last-week', {
    params: { date },
  })
}