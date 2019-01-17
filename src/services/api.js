const axios = require('axios')
const uuidv4 = require('uuid/v4');

import config from '@/config/config'

const api = axios.create({
  baseURL: config.apiUrl,
  timeout: config.baseTimeout
})

api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    return Promise.reject(error);
  });

api.setAuthToken = function (token) {
  this.token = token
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

api.getFileUrl = function (url) {
  return config.apiUrl + url + "?token=" + this.token
}

api.getImageUrl = function (url) {
  return api.getFileUrl(url)
}

// TODO do we need this everywhere or in sheets only?
api.getUniqueImageUrl = function (url) {
  return api.getImageUrl(url) + "&" + uuidv4()
}

api.getBase64 = async function (url) {
  const response = await api.get(url, { responseType: 'arraybuffer' })
  return new Buffer(response, 'binary').toString('base64')
}

// This is too slow. Use getImageUrl instead (sending auth token as HTTP parameter)
api.getImageSrcAsByteArray = async function (url) {
  const data = await api.getBase64(url)
  return 'data:image/jpeg;base64,' + data
}

api.upload = async function (url, file, uploadProgress) {
  const formData = new FormData()
  formData.append("file", file, file.name)
  return await api.post(url, formData, {
    timeout: config.uploadTimeout,
    onUploadProgress: uploadProgress
  })
}

export default api
