<template>
  <div class="cropContainer" :class="{ loading: loading }">
    <img src="/static/img/spinner.gif" class="spinner" v-if="loading"/>
    <div class="header">Обрезка фотографии</div>
    <div class="contentContainer">
      <div class="content" ref="contentDiv">
        <img ref="img" :src="item.url" @load="imageLoaded"/>
        <drr :x="rect.x" :y="rect.y" :w="rect.w" :h="rect.h" :isActive="true" :isRotatable="false"
             :aspectRatio="false"
             @dragstop="updated" @resizestop="updated"/>
      </div>
    </div>
    <div class="footer">
      <button class="cropButton" @click="crop()" :disabled="cropButtonDisabled">Обрезать</button>
      <button class="cancelButton" @click="cancel()">Закрыть</button>
    </div>
  </div>
</template>

<script>
  import api from '@/services/api'
  import {mapActions, mapGetters, mapState} from 'vuex'

  export default {
    props: ['item'],

    data() {
      return {
        cropButtonDisabled: false,
        widthPx: 0,
        heightPx: 0,
        rect: {
          x: 0, y: 0, w: 1, h: 1, angle: 0
        },
        loading: false
      }
    },

    computed: {
      ...mapState(['album']),
      ...mapGetters(['sheet']),
    },

    mounted() {
      let widthPx = this.$refs.contentDiv.clientWidth
      let heightPx = this.$refs.contentDiv.clientHeight
      console.log(widthPx)
      console.log(heightPx)

      let imageWidthPx
      if (this.item.widthMm / this.item.heightMm < widthPx / heightPx)
        imageWidthPx = Math.round(heightPx * this.item.widthMm / this.item.heightMm)
      else
        imageWidthPx = widthPx

      let url = api.getUniqueImageUrl(`/albums/${this.album.id}/sheets/${this.sheet.id}/photos/${this.item.id}/originalImage/${imageWidthPx}`)
      this.$set(this.item, 'url', url)
    },

    methods: {
      imageLoaded() {
        this.widthPx = this.$refs.img.offsetWidth
        this.heightPx = this.$refs.img.offsetHeight
        this.rect.x = this.widthPx / 2
        this.rect.y = this.heightPx / 2
        this.rect.w = this.widthPx
        this.rect.h = this.heightPx
      },

      updated(rect) {
        this.rect = rect
      },

      async crop() {
        this.loading = true
        this.cropButtonDisabled = true

        let rect = {
          x: this.rect.x / this.widthPx,
          y: this.rect.y / this.heightPx,
          w: this.rect.w / this.widthPx,
          h: this.rect.h / this.heightPx
        }
        let photo = await api.post(`/albums/${this.album.id}/sheets/${this.sheet.id}/photos/${this.item.id}/crop/`, rect)
        this.loading = false
        this.$emit('cropped', photo)
      },

      cancel() {
        this.$emit('cancel')
      }
    }
  }
</script>

<style scoped lang="less">
  @import "../assets/styles";

  .cropContainer {
    .fill;
    .column;
    .stretch;

    .loading {
      opacity: 0.3;
    }

    > .spinner {
      position: absolute;
      left: 50%;
      top: 50%;
      z-index: 1000;
    }

    > .header {
      .fixed-size(3rem);
      .row;
      .center-cross;
      font-size: 1.1rem;
      padding-left: 1rem;
      background-color: lightskyblue;
      z-index: 101;
    }

    > .contentContainer {
      .stretch;
      .column;
      padding: 1rem;

      > .content {
        .stretch;
        position: relative;

        > img {
        }
      }
    }

    > .footer {
      .fixed-size(3rem);
      .row;
      .center-cross;
      background-color: lightgrey;
      z-index: 101;

      > button {
        .button;
        margin-left: 1rem;
      }
    }
  }
</style>
