<template>
  <div class="container" v-if="album">
    <PreviewSheet v-for="sheet in album.sheets" :key="sheet.id" :sheet="sheet"
                  :active="currentSheet.id == sheet.id" @sheetSelected="sheetSelected" />
  </div>
</template>

<script>
  import {mapActions, mapGetters, mapState} from 'vuex'
  import PreviewSheet from '@/components/PreviewSheet'
  import undoRedo from '@/services/undoRedo'

  export default {
    components: {
      PreviewSheet
    },
    created() {
      undoRedo.addMemento('preview', {
        save: _ => this.currentSheet.id,
        restore: sheetId => this.selectCurrentSheet(sheetId)
      })
    },
    computed: {
      ...mapState(['album']),
      ...mapGetters({ currentSheet: 'sheet' })
    },
    methods: {
      ...mapActions(['selectCurrentSheet']),
      sheetSelected(sheetId) {
        this.selectCurrentSheet(sheetId)
        undoRedo.save()
      }
    }
  }
</script>

<style scoped lang="less">
  @import "../assets/styles";

  .container {
    .stretch;
    .row;
    .scroll;
    .center-cross;
  }
</style>
