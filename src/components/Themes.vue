<template>
  <div class="container">
    <div class="header">
      Темы
    </div>
    <div class="themes">
      <div v-for="theme in themes" class="theme" :class="{'theme-active': currentTheme && currentTheme.id == theme.id}"
           @click="themeSelected(theme)">
        <img :src="theme.iconUrl" draggable="false"/>
        <span>{{theme.name}}</span>
      </div>
    </div>
  </div>
</template>

<script>
  import {mapActions, mapGetters, mapState} from 'vuex'

  const _ = require('lodash');

  export default {
    data() {
      return {}
    },
    computed: {
      ...mapState(['themes']),
      ...mapGetters({ currentTheme: 'theme', sheet: 'sheet' }),

      themesAndSheet() {
        return this.themes && this.sheet
      }
    },
    watch: {
      themesAndSheet(value) {
        if (value) {
          this.themeSelected(this.themes[0])
        }
      }
    },
    methods: {
      ...mapActions(['selectTheme']),
      themeSelected(theme) {
        this.selectTheme(theme.id)
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

    .themes {
      .stretch;
      .row;
      .flow;
      .scroll;

      .theme {
        .column;
        .center-cross;
        margin: 1rem 0rem 0rem 1rem;
        cursor: pointer;

        img {
          .size(3rem);
          transition: width 300ms, height 300ms;
        }

        &:hover img {
          .size(3.5rem)
        }
      }

      .theme-active {
        > img {
          .size(3.5rem);
        }
        > span {
        }
      }
    }
  }
</style>
