<template>
  <div class="container">
    <div class="header">
      Фоны
    </div>
    <div class="backgrounds" v-if="theme">
      <div class="background" @click="clearBackground()" title="Удалить фон">
        <i class="material-icons">close</i>
      </div>
      <div v-for="background in backgrounds" class="background" @click="setBackground(background)" title="Установить фон">
        <img :src="background.url" draggable="false"/>
      </div>
    </div>
  </div>
</template>

<script>
  import api from '@/services/api'
  import {mapActions, mapGetters, mapState} from 'vuex'
  import undoRedo from '@/services/undoRedo'

  const _ = require('lodash');

  const FACTOR_TOLERANCE = 0.1

  export default {
    data() {
      return {}
    },
    computed: {
      ...mapState(['album']),
      ...mapGetters(['sheet', 'theme']),

      backgrounds() {
        let backgrounds = []
        let sheetFactor = this.sheet.widthMm / this.sheet.heightMm
        for (let background of this.theme.backgrounds) {
          for (let variant of background.variants) {
            let variantFactor = variant.widthPx / variant.heightPx
            let widthPx = 200 // TODO
            if (Math.abs(sheetFactor / variantFactor - 1) < FACTOR_TOLERANCE) {
              let bg = {
                id: background.id,
                variant: variant,
                url: api.getUniqueImageUrl(`/themes/${this.theme.id}/backgrounds/${background.id}/variants/${variant.id}/image/${widthPx}`)
              }
              backgrounds.push(bg)
            }
          }
        }
        return backgrounds
      }
    },
    methods: {
      ...mapActions(['updateCurrentSheet', 'setLoading']),

      async clearBackground() {
        let sheet = await api.post(`/albums/${this.album.id}/sheets/${this.sheet.id}/clearBackground`)
        this.updateCurrentSheet(sheet)
        undoRedo.save()
      },

      async setBackground(background) {
        this.setLoading(true)
        let sheet = await api.post(`/albums/${this.album.id}/sheets/${this.sheet.id}/setBackground`,
          {
            themeId: this.theme.id,
            backgroundId: background.id,
            variantId: background.variant.id
          }
        )
        this.updateCurrentSheet(sheet)
        undoRedo.save()
        this.setLoading(false)
      }
    }
  }
</script>

<style scoped lang="less">
  @import "../assets/styles";

  .container {
    .stretch;
    .column;

    > .header {
      .row;
      .fixed-size(3rem);
      .center-both;
      background: lightgrey;
      font-size: 1.2rem;
    }

    .backgrounds {
      .stretch;
      .row;
      .flow;
      .scroll;

      > .background {
        .column;
        margin: 1rem 0rem 0rem 1rem;
        cursor: pointer;

        i {
          font-size: 2rem;
        }

        img {
          .light-shadow;
          .max-size(5rem);
          transition: max-width 300ms, max-height 300ms;
        }

        &:hover img {
          .max-size(5.5rem);
        }
      }
    }
  }
</style>
