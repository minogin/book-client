import Vuex from 'vuex'
import Vue from 'vue'
import api from '@/services/api'

Vue.use(Vuex)

const albumId = '5bebdd17bd399b0160a883fe' // TODO

export default new Vuex.Store({
  // strict: process.env.NODE_ENV !== 'production',   TODO ?

  state: {
    auth: false,
    user: null,
    album: null,
    sheetId: null,
    scale: 1,
    fonts: [],
    themes: [],
    themeId: null,
    loading: false
  },

  getters: {
    sheet(state) {
      if (!state.album)
        return null

      return state.album.sheets.find(_ => _.id == state.sheetId)
    },

    theme(state) {
      if (!state.themes)
        return null

      return state.themes.find(_ => _.id == state.themeId)
    }
  },

  actions: {
    setAuthenticated({ state }) {
      state.auth = true
    },

    async loadFonts({ state }) {
      state.fonts = await api.get(`/fonts`)
    },

    async loadThemes({ state }) {
      state.themes = await api.get(`/themes`)
      for (let theme of state.themes) {
        theme.iconUrl = api.getUniqueImageUrl(`/themes/${theme.id}/icon`)
      }
    },

    async loadAlbum({ state }) {
      const album = await api.get(`/albums/${albumId}`)
      state.album = album
      state.sheetId = album.sheets[0].id // TODO remember current sheet
    },

    selectCurrentSheet({ state }, sheetId) {
      state.sheetId = sheetId
    },

    updateCurrentSheet({ getters }, newSheet) {
      Object.assign(getters.sheet, newSheet)
      getters.sheet.valid = false
    },

    selectTheme({ state }, themeId) {
      state.themeId = themeId
    },

    setScale({ state }, scale) {
      state.scale = scale
    },

    setLoading({ state }, loading) {
      state.loading = loading
    }
  }
})


