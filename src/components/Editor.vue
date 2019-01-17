<template>
  <div class="editor">
    <div class="container">
      <div class="photos">
        <Photos/>
      </div>
      <div class="desk">
        <Desk/>
      </div>
      <div class="themesContainer">
        <div class="themes">
          <Themes/>
        </div>
        <div class="backgrounds">
          <Backgrounds/>
        </div>
        <div class="frames">
          <Frames/>
        </div>
      </div>
    </div>
    <div class="preview">
      <Preview/>
    </div>
  </div>
</template>

<script>
  import Photos from '@/components/Photos'
  import Themes from '@/components/Themes'
  import Backgrounds from '@/components/Backgrounds'
  import Frames from '@/components/Frames'
  import Desk from '@/components/Desk'
  import Preview from '@/components/Preview'
  import {mapActions} from 'vuex'

  export default {
    components: {
      Desk,
      Photos,
      Themes,
      Backgrounds,
      Frames,
      Preview
    },
    async mounted() {
      await this.loadFonts()
      await this.loadThemes()
      await this.loadAlbum()
    },
    methods: {
      ...mapActions(['loadFonts', 'loadThemes', 'loadAlbum'])
    }
  }
</script>

<style scoped lang="less">
  @import "../assets/styles";

  .editor {
    .stretch;
    .column;

    > .container {
      .stretch;
      .row;

      > .photos {
        .fixed-size(11rem);
        .column;
        background: #fafafa;

        .inner-border;
        border-right: 2px solid gray;
      }

      .desk {
        .stretch;
        .column;

        background: #f0f0f0;
      }

      > .themesContainer {
        .fixed-size(14rem);
        .column;
        .inner-border;
        border-left: 2px solid gray;

        > .themes {
          .fixed-size(12rem);
          .column;
          background: #fafafa;
        }

        > .backgrounds {
          .stretch;
          .column;
          background: #fafafa;
        }

        > .frames {
          .stretch;
          .column;
          background: #fafafa;
        }
      }
    }

    > .preview {
      .fixed-size(10rem);
      .row;
      background: beige;
    }
  }
</style>
