import axios from 'axios'

const api = axios.create({
  baseURL: 'http://192.168.0.10:3000/api',  // 後端API位置
  timeout: 10000
})

// 登入成功時可呼叫這個 function 來更新 token
export function setApiToken(token) {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  }
}


export default api;

// 登入驗證
export const login = (username, password) => {
  return api.post('/login', { username, password })
}
