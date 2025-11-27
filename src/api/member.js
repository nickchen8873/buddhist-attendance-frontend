import api from './index';

// 取得所有成員
export function getMembers(query = {}) {
  // query 可能長這樣: { status: 'active' }、{ group: 'A組' }...
  console.log(query)
  return api.get('/members', { params: query })
}

// 取得指定成員
export function getMember(id) {
  return api.get(`/members/${id}`); 
}

// 新增成員
export function createMember(data) {
  return api.post('/members', data);
}

// 修改成員
export function updateMember(id, data) {
  return api.put(`/members/${id}`, data);
}

// 刪除成員
export function deleteMember(id) {
  return api.delete(`/members/${id}`);
}

// 關鍵字查詢
export function search(id) {
  return api.get(`/search/${id}`); 
}

export function fetchMaxId() {
  try {
    return api.get('/members/max-id')  // 最大 +1 就是下一筆
  } catch (err) {
    console.error('無法取得最大ID', err)
    return '無法取得'
  }
}