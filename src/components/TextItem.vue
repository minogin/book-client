<template>
  <img v-if="!editing" :src="url" class="text"/>
  <div v-else ref="inputDiv" class="text-editable" contenteditable="true" :style="style" @blur="onblur">
    {{item.text}}
  </div>
</template>

<script>
  import api from '@/services/api'
  import {mapState} from 'vuex'

  export default {
    name: "TextItem",
    props: ['item'],
    data() {
      return {
        url: '',
        editing: false,
        value: ''
      }
    },
    computed: {
      ...mapState(['album', 'sheetId', 'scale']),
      style() {
        return {
          'font-family': this.item.fontFamily,
          'font-size': this.item.fontSizePt * 25.4 / 72.0 * this.scale + 'px',
          'line-height': this.item.lineHeightPt * 25.4 / 72.0 * this.scale + 'px',
          'color': '#' + this.item.fontColor,
        }
      }
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
    mounted() {
      this.$on('activate', this.activate)
    },
    methods: {
      updateUrl() {
        console.log('text url reloaded')
        let widthPx = Math.round(this.item.widthMm * this.scale)
        this.url = api.getUniqueImageUrl(`/albums/${this.album.id}/sheets/${this.sheetId}/texts/${this.item.id}/image/${widthPx}`)
        this.item.valid = true
      },

      activate() {
        this.editing = true
        this.$nextTick(_ => {
          this.$refs.inputDiv.focus()
        })
      },

      deactivate() {
        this.value = this.$refs.inputDiv.innerText
        this.editing = false
        this.$parent.$emit('contentDeactivate')
        this.$emit('change', this.value)
      },

      onblur() {
        this.deactivate()
      }
    }
  }
</script>

<style scoped lang="less">
  @import "../assets/styles";

  .text {
    .fill;
  }

  .text-editable {
    .text;
    position: absolute;
    border: 1px dashed lightgrey;
  }
</style>
