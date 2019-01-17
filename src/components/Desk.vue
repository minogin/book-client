<template>
  <div class="container">
    <img src="/static/img/spinner.gif" class="spinner" v-if="loading"/>
    <div class="toolbar">
      <i class="material-icons toolbar-button" @click="zoomIn" title="Увеличить">zoom_in</i>
      <i class="material-icons toolbar-button" @click="zoomOut" title="Уменьшить">zoom_out</i>
      <i class="material-icons toolbar-button" @click="undo" title="Отменить">undo</i>
      <i class="material-icons toolbar-button" @click="redo" title="Повторить">redo</i>
      <div class="separator"></div>
      <i class="material-icons toolbar-button" @click="addText" title="Добавить подпись">notes</i>
      <div class="separator" v-show="item"></div>

      <template v-if="item">
        <i class="material-icons toolbar-button" @mousedown.stop="" @click="itemUp"
           title="Поднять выше">arrow_upward</i>
        <i class="material-icons toolbar-button" @mousedown.stop="" @click="itemDown" title="Опустить ниже">arrow_downward</i>
      </template>

      <template v-if="item && item.type == 'Photo'">
        <div class="separator"></div>
        <i class="material-icons toolbar-button" @mousedown.stop="" @click="showCrop(item)"
           title="Обрезать">crop</i>
      </template>

      <template v-if="item && item.type == 'Text'">
        <div class="separator"></div>
        <span class="toolbar-item">
          <select v-model="item.fontFamily" @mousedown.stop="" @change="fontFamilyChange(item)">
            <option v-for="font in fonts">{{font.family}}</option>
          </select>
        </span>
        <span class="toolbar-item">
          <input :value="item.fontSizePt_initial" @input="fontSizeChange_debounced(item, $event.target.value)"
                 class="font-size-input"
                 @mousedown.stop="" title="Размер шрифта"/>
          Pt
        </span>
      </template>

      <!--<i class="material-icons toolbar-button" @mousedown.stop="" @click="itemUp">format_size</i>-->
    </div>
    <div ref="desk" class="desk" @wheel="onWheel($event)" :class="{ loading: loading }">
      <div v-if="sheet" id="sheet" class="sheet"
           :style="{width: sheet.widthMm * scale + 'px', height: sheet.heightMm * scale + 'px'}"
           @dragover.prevent="" @drop.prevent="drop">

        <drr
          v-for="item in items"
          :id="'item'+item.id"
          :key="item.id"
          class="drag"
          :aspectRatio="item.type == 'Photo' ? true : false"
          :x="item.xMm * scale" :y="item.yMm * scale" :w="item.widthMm * scale" :h="item.heightMm * scale"
          :angle="item.angle"
          :isActive="item.id == itemId"
          :selectable="!item.locked"
          :hasActiveContent="item.type == 'Text'"
          @activated="selectItem(item.id)"
          @deactivated="deselectItem(item.id)"
          @dragstop="itemDragStop(item, ...arguments)"
          @resizestop="itemResizeStop(item, ...arguments)"
          @rotatestop="itemRotateStop(item, ...arguments)"
        >
          <PhotoItem :item="item" v-if="item.type == 'Photo'" @change="photoChange(item)"/>
          <TextItem :item="item" :scale="scale" @change="textChange(item, ...arguments)" v-if="item.type == 'Text'"/>
          <i class="material-icons remove-button" @click="removeItem(item)" v-if="!item.locked">close</i>
        </drr>
      </div>
    </div>

    <modal name="cropModal" :clickToClose="false" :width="'90%'" :height="'90%'">
      <Crop :item="cropItem" @cropped="cropped" @cancel="hideCrop" v-if="cropItem"/>
    </modal>
  </div>
</template>

<script>
  import api from '@/services/api'
  import undoRedo from '@/services/undoRedo'
  import TweenMax from 'gsap'
  import dom from '@/util/dom'
  import PhotoItem from '@/components/PhotoItem'
  import TextItem from '@/components/TextItem'
  import {mapActions, mapGetters, mapState} from 'vuex'
  import Crop from "./Crop";

  const _ = require('lodash')

  const SHEET_SIZE_SHARE = 0.9
  const MIN_FONT_SIZE = 10
  const MAX_FONT_SIZE = 200
  const LINE_HEIGHT_FACTOR = 1.2

  export default {
    created() {
      this.fontSizeChange_debounced = _.debounce(this.fontSizeChange, 500)

      undoRedo.addMemento('desk', {
        save: _ => this.sheet,
        restore: async sheet => {
          await this.updateSheetAtServer(this.album.id, sheet.id, sheet)
          if (sheet.id == this.sheet.id) {
            this.updateCurrentSheet(sheet)
          }
        }
      })
    },
    mounted() {
      window.addEventListener('resize', this.fitToPage)
    },
    beforeDestroy() {
      window.removeEventListener('resize', this.fitToPage)
    },
    components: {
      Crop,
      PhotoItem,
      TextItem
    },
    data() {
      return {
        itemId: null,
        cropItem: null
      }
    },
    computed: {
      ...mapState(['album', 'sheetId', 'scale', 'fonts', 'loading']),
      ...mapGetters(['sheet']),
      item() {
        return this.getItem(this.itemId)
      },
      items() {
        return this.sheet ? this.sheet.items : []
      }
    },
    watch: {
      album() {
        undoRedo.reset()
        undoRedo.save()
        this.fitToPage()
      },
      sheetId() {
        TweenMax.from('#sheet', 0.2, { opacity: 0.5 })
      },
      fonts() {
        this.loadFontFaces()
      }
    },
    methods: {
      ...mapActions(['updateCurrentSheet', 'selectCurrentSheet', 'setScale', 'setLoading']),

      getItem(itemId) {
        return this.items.find(_ => _.id == itemId)
      },

      async loadFontFaces() {
        for (const font of this.fonts) {
          const fontUrl = api.getFileUrl(`/fonts/${font.family}`)
          const fontFace = new FontFace(font.family, `url(${fontUrl})`);
          const loadedFontFace = await fontFace.load()
          document.fonts.add(loadedFontFace);
        }
      },

      async updateSheet() {
        console.log('updateSheet')
        await this.updateSheetAtServer(this.album.id, this.sheet.id, this.sheet)
        this.sheet.valid = false
        undoRedo.save()
      },

      async updateSheetAtServer(albumId, sheetId, sheet) {
        console.log('Synced to server')
        await api.post(`/albums/${albumId}/sheets/${sheetId}/update`, sheet)
      },

      undo() {
        undoRedo.undo()
      },

      redo() {
        undoRedo.redo()
      },

      fitToPage() {
        // TODO compare proportions
        if (!this.sheet) return;

        let deskEl = this.$refs.desk
        let deskWidthPx = deskEl.getBoundingClientRect().width
        let deskHeightPx = deskEl.getBoundingClientRect().height

        if (deskWidthPx / deskHeightPx < this.sheet.widthMm / this.sheet.heightMm) {
          let sheetWidthPx = deskWidthPx * SHEET_SIZE_SHARE
          this.setScale(sheetWidthPx / this.sheet.widthMm)
        }
        else {
          let sheetHeightPx = deskHeightPx * SHEET_SIZE_SHARE
          this.setScale(sheetHeightPx / this.sheet.heightMm)
        }
      },

      selectItem(itemId) {
        if (this.getItem(itemId).locked)
          return

        this.itemId = itemId

        if (this.item.type == 'Text') {
          this.item.fontSizePt_initial = this.item.fontSizePt
        }
      },

      deselectItem(itemId) {
        if (this.itemId == itemId)
          this.itemId = null
      },

      async drop(e) {
        // TODO slow, need to show item immediately
        let type = e.dataTransfer.getData("type")
        if (type == 'AlbumPhoto') {
          let photo = JSON.parse(e.dataTransfer.getData("object"))
          const item = await api.post(`/albums/${this.album.id}/sheets/${this.sheet.id}/items/addPhoto`, {
            albumPhotoId: photo.id,
            xMm: e.offsetX / this.scale,
            yMm: e.offsetY / this.scale
          })
          this.sheet.items.push(item)
          this.sheet.valid = false
          this.selectItem(item.id)
          undoRedo.save()
        }
      },

      async addText() {
        const item = await api.post(`/albums/${this.album.id}/sheets/${this.sheet.id}/items/addText`)
        this.sheet.items.push(item)
        this.sheet.valid = false
        undoRedo.save()
        this.$nextTick(function () {
          TweenMax.from('#item' + item.id, 0.3, { y: -500, opacity: 0 })
        })
      },

      async textChange(item, text) {
        item.text = text
        await this.updateSheet()
        item.valid = false
      },

      async fontSizeChange(item, fontSizePt) {
        fontSizePt = _.toInteger(fontSizePt)
        if (fontSizePt == 0)
          return

        if (fontSizePt < MIN_FONT_SIZE)
          fontSizePt = MIN_FONT_SIZE
        if (fontSizePt > MAX_FONT_SIZE)
          fontSizePt = MAX_FONT_SIZE

        item.fontSizePt = fontSizePt
        item.lineHeightPt = fontSizePt * LINE_HEIGHT_FACTOR
        await this.updateSheet()
        item.valid = false
      },

      async fontFamilyChange(item) {
        await this.updateSheet()
        item.valid = false
      },

      photoChange(item) {
        item.valid = false
        this.sheet.valid = false
        undoRedo.save()
      },

      itemDragStop(item, rect) {
        this.updateItem(item, rect)
      },

      async itemResizeStop(item, rect) {
        await this.updateItem(item, rect)
      },

      itemRotateStop(item, rect) {
        this.updateItem(item, rect)
      },

      async updateItem(item, rect) {
        item.xMm = rect.x / this.scale
        item.yMm = rect.y / this.scale
        item.widthMm = rect.w / this.scale
        if (item.type == 'Photo')
          item.heightMm = item.imageHeightPx * item.widthMm / item.imageWidthPx
        else
          item.heightMm = rect.h / this.scale
        item.angle = rect.angle

        await this.updateSheet()
      },

      removeItem(item) {
        let id = 'item' + item.id
        dom.copyElement(id)

        this.items.splice(this.items.indexOf(item), 1)
        this.updateSheet()

        TweenMax.to('#' + id, 1, { x: -1000, y: -1000, rotation: 360 })
      },

      async itemUp() {
        const i = this.items.indexOf(this.item)
        if (i < this.items.length - 1) {
          let item = this.items[i]
          this.items.splice(i, 1)
          this.items.splice(i + 1, 0, item)
          this.updateSheet()

          TweenMax.from('#item' + this.item.id, 1, { scale: 0.8, ease: Elastic.easeOut.config(1.5, 0.5) })
        }
      },

      async itemDown() {
        const i = this.sheet.items.indexOf(this.item)
        if (i == 0) return

        if (i == 1 && this.sheet.items[0].role == 'Background') return

        let item = this.items[i]
        this.sheet.items.splice(i, 1)
        this.sheet.items.splice(i - 1, 0, item)
        this.updateSheet()

        TweenMax.from('#item' + this.item.id, 1, { scale: 1.25, ease: Elastic.easeOut.config(1.5, 0.5) })
      },

      showCrop(item) {
        this.cropItem = item
        this.$modal.show('cropModal')
      },

      hideCrop() {
        this.cropItem = null
        this.$modal.hide('cropModal')
      },

      cropped(item) {
        Object.assign(this.cropItem, item)
        this.cropItem.valid = false
        this.sheet.valid = false
        undoRedo.save()

        this.hideCrop()
      },

      onWheel(e) {
        if (e.deltaY < 0)
          this.zoomIn()
        if (e.deltaY > 0)
          this.zoomOut()
      },

      zoomIn() {
        let proxy = { scale: this.scale }
        TweenLite.to(proxy, 0.3, {
          scale: this.scale * 1.2, onUpdate: _ => {
            this.setScale(proxy.scale)
          }
        })
      },

      zoomOut() {
        let proxy = { scale: this.scale }
        TweenLite.to(proxy, 0.3, {
          scale: this.scale / 1.2, onUpdate: _ => {
            this.setScale(proxy.scale)
          }
        })
      },
    }
  }
</script>

<style scoped lang="less">
  @import "../assets/styles";

  .container {
    .fill;
    .column;

    > .spinner {
      position: absolute;
      left: 50%;
      top: 50%;
    }

    > .toolbar {
      .row;
      .fixed-size(3rem);
      .center-cross;
      background: lightgrey;

      > .toolbar-item {
        margin: 0.5rem;
      }

      > .toolbar-button {
        .toolbar-item;
        .column;
        .fixed-size(2rem);
        .center-both;
        font-size: 2.6rem;
        cursor: pointer;

        &:hover {
          color: lightskyblue;
        }
      }

      > .separator {
        border: 1px solid gray;
        height: 70%;
      }

      input, select {
        font-size: 1rem;
      }

      .font-size-input {
        width: 2rem;
        text-align: right;
      }
    }

    > .desk {
      .fill;
      .column;
      .scroll;

      .loading {
        opacity: 0.3;
      }

      > .sheet {
        .fixed;
        .centered;

        .shadow;
        .inner-border;
        border: 1px solid lightgrey;
        background: white;
        position: relative;

        > .drag {
          /*> .item {
            .fill;
          }*/

          > .remove-button {
            position: absolute;
            top: 0px;
            right: 0px;
            width: 1.2rem;
            height: 1.2rem;
            box-sizing: border-box;
            font-size: 1.2rem;
            text-align: center;
            background: #ffffff;
            display: none;
          }

          &:hover .remove-button {
            display: block;
          }
        }
      }
    }
  }
</style>
