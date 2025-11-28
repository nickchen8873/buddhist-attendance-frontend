import api from './index';

// 取得所有成員
export function getUsers(query = {}) {
  // query 可能長這樣: { status: 'active' }、{ group: 'A組' }...
  return api.get('/users', { params: query })
}

// 取得指定成員
export function getUser(id) {
  return api.get(`/users/${id}`); 
}

// 新增成員
export function createUser(data) {
  return api.post('/users', data);
}

// 修改成員
export function updateUser(id, data) {
  return api.put(`/users/${id}`, data);
}

// 刪除成員
export function deleteUser(id) {
  return api.delete(`/users/${id}`);
}