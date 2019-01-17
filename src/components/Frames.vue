<template>
  <div class="container">
    <div class="header">
      Рамки
    </div>
    <div class="frames" v-if="theme">
      <div v-for="frame in theme.frames" class="frame">
        <img :src="frame.url" draggable="true" @dragstart="dragstart(frame, $event)" title="Перетащите рамку на фото" />
      </div>
    </div>
  </div>
</template>

<script>
  import api from '@/services/api'
  import {mapActions, mapGetters, mapState} from 'vuex'
  import undoRedo from '@/services/undoRedo'

  const _ = require('lodash');

  export default {
    data() {
      return {}
    },
    computed: {
      ...mapState(['album']),
      ...mapGetters(['sheet', 'theme']),
    },
    watch: {
      theme() {
        let widthPx = 100
        for (let frame of this.theme.frames) {
          this.$set(frame, 'url', api.getUniqueImageUrl(`/themes/${this.theme.id}/frames/${frame.id}/image/${widthPx}`))
        }
      }
    },
    methods: {
      ...mapActions(['updateCurrentSheet']),

      dragstart(frame, e) {
        e.dataTransfer.setData('type', 'Frame')
        e.dataTransfer.setData('frame', JSON.stringify(frame))
        e.dataTransfer.setData('theme', JSON.stringify(this.theme))
      },
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

    .frames {
      .stretch;
      .row;
      .center-cross;
      .flow;
      .scroll;

      > .frame {
        .column;
        margin: 1rem 0rem 0rem 1rem;

        img {
          .light-shadow;
          .max-size(5rem);
          cursor: grab;
          transition: max-width 300ms, max-height 300ms;
        }

        &:hover img {
          .max-size(5.5rem);
        }
      }
    }
  }
</style>
