<template>
  <div class="container">
    <div class="toolbar">
      <button class="add-button" @click="addPhoto()">Загрузить фото</button>
    </div>
    <div ref="albumPhotosDiv" class="album-photos">
      <transition-group name="list" tag="div">
        <div :key="albumPhoto.id" v-for="albumPhoto in albumPhotos" class="album-photo">
          <img :src="albumPhoto.src" draggable="true" @dragstart="dragstart(albumPhoto, $event)"
               class="album-photo-image"/>
          <i class="material-icons remove-button" @click="removePhoto(albumPhoto)">close</i>
        </div>
      </transition-group>
    </div>
    <modal name="addPhotoModal" :clickToClose="false">
      <div class="addPhotoContainer">
        <div class="header">Загрузка фотографий</div>
        <div class="content">
          <input type="file" multiple="true" class="file-input" @change="filesChange($event.target.files)"/>
          <div class="hint">Перетащите фото в эту область или нажмите, чтобы выбрать фото</div>

          <template v-for="(uploadingPhoto, i) in uploadingPhotos">
            <div class="progressBarContainer" v-show="uploadingPhoto.status == 'uploading'">
              <div class="progressBar" :style="{ height: uploadingPhoto.progress + '%' }" ref="progressBarDivs"></div>
            </div>
            <div class="failure" v-show="uploadingPhoto.status == 'failure'"></div>
            <img class="uploadedPhoto" :src="uploadingPhoto.src" v-show="uploadingPhoto.status == 'uploaded'"/>
          </template>
        </div>
        <div class="footer">
          <button class="closeButton" @click="hideModal()">Закрыть</button>
        </div>
      </div>
    </modal>
  </div>
</template>

<script>
  import api from '@/services/api'
  import {mapState} from 'vuex'

  const _ = require('lodash');

  export default {
    data() {
      return {
        uploadingPhotos: [],
      }
    },
    computed: {
      ...mapState(['album']),
      albumPhotos() {
        return this.album ? this.album.albumPhotos : []
      }
    },
    watch: {
      album() {
        for (const albumPhoto of this.album.albumPhotos) {
          this.updateAlbumPhotoSrc(albumPhoto)
        }
      }
    },
    methods: {
      dragstart(albumPhoto, e) {
        e.dataTransfer.setData('type', 'AlbumPhoto')
        e.dataTransfer.setData('object', JSON.stringify(albumPhoto))
      },

      addPhoto() {
        this.uploadingPhotos = []
        this.$modal.show('addPhotoModal')
      },

      async removePhoto(photo) {
        await api.post(`/albums/${this.album.id}/albumPhotos/${photo.id}/delete`)
        this.albumPhotos.splice(this.albumPhotos.indexOf(photo), 1)
      },

      hideModal() {
        this.$modal.hide('addPhotoModal')
      },

      filesChange(files) {
        const app = this
        Array.from(files).forEach(file => {
          const uploadingPhoto = {
            id: null,
            name: file.name,
            progress: 0,
            status: 'uploading',
          }
          const i = this.uploadingPhotos.push(uploadingPhoto) - 1
          api
            .upload(`/albums/${this.album.id}/albumPhotos/upload`, file, e => {
              uploadingPhoto.progress = e.loaded * 100 / e.total
            })
            .then(
              result => {
                const albumPhoto = result

                this.updateAlbumPhotoSrc(albumPhoto)
                this.album.albumPhotos.push(albumPhoto)

                const width = this.$refs.progressBarDivs[i].clientWidth
                uploadingPhoto.src = api.getImageUrl(`/albums/${this.album.id}/albumPhotos/${albumPhoto.id}/image/${width}`)
                uploadingPhoto.status = 'uploaded'
              },
              error => {
                uploadingPhoto.status = 'failure'
              }
            )
        })
      },

      updateAlbumPhotoSrc(albumPhoto) {
        const width = this.$refs.albumPhotosDiv.clientWidth  // TODO non-reactive!
        this.$set(albumPhoto, 'src', api.getImageUrl(`/albums/${this.album.id}/albumPhotos/${albumPhoto.id}/image/${width}`))
      }
    }
  }
</script>

<style scoped lang="less">
  @import "../assets/styles";

  .container {
    .stretch;
    .column;

    > .toolbar {
      .row;
      .fixed-size(3rem);
      .center-both;
      background: lightgrey;

      > .add-button {
        .stretch;
        margin-left: 1rem;
        margin-right: 1rem;
        .button;
      }
    }
    .album-photos {
      .stretch;
      .column;

      > div {
        .stretch;
        .column;
        .scroll;
        .center-cross;

        > .album-photo {
          .fixed;
          margin-top: 1rem;
          position: relative;

          &:hover .album-photo-image {
            .max-size(9rem);
          }

          > .album-photo-image {
            .fixed;
            .row;
            .max-size(8rem);
            .shadow;
            cursor: grab;

            transition: max-width 300ms, max-height 300ms;
          }

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
            cursor: pointer;
            display: none;
          }

          > .remove-button:hover {
            color: lightskyblue;
          }

          &:hover .remove-button {
            display: block;
          }
        }
      }
    }
  }

  .list-leave-to {
    transition: all 0.5s;
    transform: translateX(-100px);
    opacity: 0;
  }

  .list-move {
    transition: all 0.5s;
  }

  .list-leave-active {
    position: absolute !important;
  }

  .addPhotoContainer {
    .fill;
    .column;
    .stretch;

    > .header {
      .fixed-size(3rem);
      .row;
      .center-cross;
      font-size: 1.1rem;
      padding-left: 1rem;
      background-color: lightskyblue;
      z-index: 101;
    }

    > .content {
      .stretch;

      .row;
      flex-wrap: wrap;
      align-items: flex-start;

      padding-right: 1rem;
      padding-bottom: 1rem;
      .scroll;

      > .file-input {
        position: absolute;
        .fill;
        left: 0;
        top: 0;
        opacity: 0;
        cursor: pointer;
        background-color: blue;
        z-index: 100;
      }

      > .hint {
        position: absolute;
        left: 2rem;
        top: 5rem;
      }

      > .uploadingPhoto {
        z-index: 200;
        margin-left: 1rem;
        margin-top: 1rem;
        border: 1px solid grey;
      }

      > .progressBarContainer {
        .uploadingPhoto;
        width: 3rem;
        height: 4rem;
        background-color: lightgrey;

        > .progressBar {
          background-color: green;
        }
      }

      > .failure {
        .uploadingPhoto;
        width: 3rem;
        height: 4rem;
        background-color: red;
      }

      > .uploadedPhoto {
        .fixed;
        .uploadingPhoto;

        .max-size(4rem);
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
