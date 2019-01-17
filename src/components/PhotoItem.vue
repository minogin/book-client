<template>
  <img :src="url" class="photo" @drop.prevent="drop"/>
</template>

<script>
  import api from '@/services/api'
  import {mapState, mapActions} from 'vuex'

  export default {
    props: ['item'],

    data() {
      return {
        url: ''
      }
    },

    computed: {
      ...mapState(['album', 'sheetId', 'scale']),
    },

    watch: {
      'item.widthMm': function () {
        this.updateUrl_debounced()
      },

      scale() {
        this.updateUrl_debounced()
      },

      'item.valid': function () {
        if (!this.item.valid)
          this.updateUrl()
      },
    },

    created() {
      this.$set(this.item, 'valid', false)
      this.updateUrl_debounced = _.debounce(this.updateUrl, 500)
      this.updateUrl()
    },

    methods: {
      ...mapActions(['updateCurrentSheet', 'setLoading']),

      updateUrl() {
        console.log('photo url reloaded')
        let widthPx = Math.round(this.item.widthMm * this.scale)
        this.url = api.getUniqueImageUrl(`/albums/${this.album.id}/sheets/${this.sheetId}/photos/${this.item.id}/image/${widthPx}`)
        this.item.valid = true
      },
      async drop(e) {
        if (this.item.role != 'Regular')
          return

        let type = e.dataTransfer.getData("type")
        if (type == 'Frame') {
          e.stopPropagation()

          this.setLoading(true)
          let frame = JSON.parse(e.dataTransfer.getData("frame"))
          let theme = JSON.parse(e.dataTransfer.getData("theme"))
          let photo = await api.post(`/albums/${this.album.id}/sheets/${this.sheetId}/photos/${this.item.id}/setFrame`,
            {
              themeId: theme.id,
              frameId: frame.id
            }
          )
          Object.assign(this.item, photo)
          this.$emit('change', this.item)
          this.setLoading(false)
        }
      }
    }
  }
</script>

<style scoped lang="less">
  @import "../assets/styles";

  .photo {
    .fill;
  }
</style>
