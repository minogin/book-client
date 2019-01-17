<template>
  <img :src="url" class="sheet" :class="{active: active}" @click="clicked()"/>
</template>

<script>
  import api from '@/services/api'
  import {mapState} from 'vuex'

  const _ = require('lodash')

  export default {
    props: ['sheet', 'active'],
    data() {
      return {
        url: ''
      }
    },
    computed: {
      ...mapState(['album']),
    },
    watch: {
      'sheet.valid': function () {
        if (!this.sheet.valid)
          this.updateUrl_debounced()
      }
    },
    created() {
      this.$set(this.sheet, 'valid', false)
      this.updateUrl_debounced = _.debounce(this.updateUrl, 500) // TODO debounced const time
      this.updateUrl()
    },
    methods: {
      updateUrl() {
        console.log('Preview reloaded')
        const widthPx = 200 // TODO
        this.url = api.getUniqueImageUrl(`/albums/${this.album.id}/sheets/${this.sheet.id}/image/${widthPx}`)
        this.sheet.valid = true
      },
      clicked() {
        this.$emit('sheetSelected', this.sheet.id)
      }
    }
  }
</script>

<style scoped lang="less">
  @import "../assets/styles";

  .sheet {
    .fixed;
    .max-size(8rem);
    margin-left: 1rem;
    .shadow;
    cursor: pointer;

    transition: max-width 300ms, max-height 300ms;

    &.active {
      border: 2px solid lightskyblue;
    }
    &:hover {
      .max-size(9rem);
    }
  }
</style>
