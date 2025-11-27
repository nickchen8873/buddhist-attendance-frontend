import api from './index';

// 取得所有成員
export function getUsers(query = {}) {
  // query 可能長這樣: { status: 'active' }、{ group: 'A組' }...
  console.log(query)
  return api.get('/user', { params: query })
}

// 取得指定成員
export function getUser(id) {
  return api.get(`/user/${id}`); 
}

// 新增成員
export function createUser(data) {
  return api.post('/user', data);
}

// 修改成員
export function updateUser(id, data) {
  return api.put(`/user/${id}`, data);
}

// 刪除成員
export function deleteUser(id) {
  return api.delete(`/user/${id}`);
}