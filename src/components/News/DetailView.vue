<template>
  <div
    v-if="data"
    v-loading="blockLoadingPage"
    class="detail-view"
  >
    <register-contents
      required
      :title="$t('common.REGCON.title')"
    >
      <span v-if="!isEditMode">
        {{ data.newsTitle }}
      </span>
      <el-input
        v-else
        v-model="editData.newsTitle"
      />
    </register-contents>
    <div
      v-if="!isCreate"
      class="half"
    >
      <register-contents :title="$t('common.REGCON.regDate')">
        {{ data.createTime | date("YYYY-MM-DD HH:mm:ss") }}
      </register-contents>
      <register-contents :title="$t('common.REGCON.upTime')">
        {{ data.updateTime | date("YYYY-MM-DD HH:mm:ss") }}
      </register-contents>
    </div>
    <register-contents
      required
      title="썸네일"
    >
      <el-upload
        v-if="isEditMode"
        :auto-upload="false"
        :show-file-list="false"
        :limit="1"
        :on-change="onChangeThumbnailUpload"
        :disabled="loadingUploadThumbnail"
        action=""
        accept="image/*"
        ref="fileUpload"
      >
        <button
          v-loading="loadingUploadThumbnail"
          class="button"
          type="is-primary"
          :disabled="loadingUploadThumbnail"
        >
          {{ $t('admin.NEWS.thumbnailUpload') }}
        </button>
      </el-upload>
      <div
        v-if="isEditMode && uploadedThumbnail"
        class="upload-thumbnail"
      >
        <img
          :src="uploadedThumbnail.fileDownloadUrl"
          :alt="uploadedThumbnail.fileOrgName || ''"
        >
      </div>
      <div
        v-else-if="!isEditMode"
        class="upload-thumbnail"
      >
        <img
          :src="data.newsThumbnailFileDownloadUrl"
          :alt="data.newsThumbnailFileDownloadUrl"
        >
      </div>
    </register-contents>
    <div class="content">
      <register-contents
        required
        :title="$t('common.REGCON.content')"
      >
        <cmp-editor
          ref="editor"
          available-image
          available-alignment
          custom-image-upload
          :set-content="data.newsContent"
          @upload-image="uploadEditorImage"
          :edit="isEditMode"
        />
      </register-contents>
    </div>
    <register-contents
      :title="$t('admin.NOTI.postState')"
      required
    >
      <span v-if="!isEditMode">
        {{ data.isView ? $t("admin.NOTI.post") : $t("admin.NOTI.unPost") }}
      </span>
      <el-radio-group
        v-else
        v-model="editData.isView"
      >
        <el-radio :label="true">
          {{ $t("admin.NOTI.post") }}
        </el-radio>
        <el-radio :label="false">
          {{ $t("admin.NOTI.unPost") }}
        </el-radio>
      </el-radio-group>
    </register-contents>
    <div class="button-wrap">
      <template v-if="isCreate">
        <button
          class="button"
          size="is-large"
          type="is-anti"
          @click="$router.go(-1)"
        >
          {{ $v('취소') }}
        </button>
        <button
          class="button"
          size="is-large"
          type="is-primary"
          @click="createNews"
        >
          {{ $v('등록 완료') }}
        </button>
      </template>
      <template v-else-if="!isCreate && !isEdit">
        <button
          class="button"
          size="is-large"
          type="is-anti"
          @click="removeNews"
        >
          {{ $v('삭제') }}
        </button>
        <button
          class="button"
          size="is-large"
          @click="$router.push({ name: 'set-news-list' })"
        >
          {{ $v('목록') }}
        </button>
        <button
          class="button"
          size="is-large"
          type="is-primary"
          @click="routeToUpdateQuery"
        >
          {{ $v('수정') }}
        </button>
      </template>
      <template v-else-if="isEdit">
        <button
          class="button"
          type="is-anti"
          size="is-large"
          @click="routeToUpdateQuery"
        >
          {{ $v('취소') }}
        </button>
        <button
          class="button"
          size="is-large"
          type="is-primary"
          @click="updateNews"
        >
          {{ $v('수정 완료') }}
        </button>
      </template>
    </div>
  </div>
</template>

<script>
import CMPEditor from '@/components/cmp-components/Editor.vue'
import API from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'

export default {
  components: { 'cmp-editor': CMPEditor },
  inject: ['detail'],
  computed: {
    data () {
      return this.detail.data
    },
    isCreate () {
      return !!this.$route.query.create
    },
    isEdit () {
      return !!this.$route.query.edit
    },
    isEditMode () {
      return this.isCreate || this.isEdit
    }
  },
  created () {
    if (this.isEdit && !this.isCreate) {
      this.cloneData()
    }
    if (this.isEdit) {
      this.$store.commit('common/ADD_PARAMETERS', {
        label: this.$t('common.BTN.modify')
      })
    } else if (this.isCreate) {
      this.$store.commit('common/ADD_PARAMETERS', {
        label: this.$t('common.BTN.create')
      })
    }
  },
  methods: {
    async onChangeThumbnailUpload (file, fileList) {
      const formData = new FormData()

      if (file.size >= 10000000) { // 10MB
        return this.$alert('10MB 이내 썸네일만 업로드가 가능합니다.')
      }

      formData.append('fileList', file.raw)

      try {
        this.loadingUploadThumbnail = true

        const { data } = await API.config.uploadNewsStatic(formData)
        this.editData.newsThumbnailFileDownloadUrl = data[0].fileDownloadUrl
        this.editData.newsThumbnailFileIdx = data[0].fileIdx
        this.uploadedThumbnail = { ...data[0], thumbnail: true }
        this.$refs.fileUpload.clearFiles()
        this.customFileList = this.customFileList.filter(file => !file.thumbnail)
        this.customFileList.push(this.uploadedThumbnail)
      } catch (error) {
        console.log(error)
      } finally {
        this.loadingUploadThumbnail = false
      }
    },
    async createNews () {
      const editorJSON = this.$refs.editor.json
      const editorHTML = this.$refs.editor.html
      const rawTextContent = document.querySelector('.ProseMirror').textContent.trim()

      // validate
      if (!this.editData.newsTitle) {
        return this.$alert(this.$t('common.ALERT.BASE.054'))
      }

      if (this.editData.newsTitle.length > 100) {
        return this.$alert(this.$t('common.ALERT.NEWS.005'))
      }

      if (
        !this.editData.newsThumbnailFileDownloadUrl ||
        !this.editData.newsThumbnailFileIdx
      ) {
        return this.$alert(this.$t('common.ALERT.NEWS.002'))
      }

      if (!editorJSON || !editorHTML || !rawTextContent) {
        return this.$alert(this.$t('common.ALERT.BASE.027'))
      }

      const reqObj = {
        fileIdxList: [...this.customFileList.map(file => file.fileIdx)],
        fileList: [...this.customFileList],
        isView: this.editData.isView,
        newsContent: JSON.stringify(editorJSON),
        newsThumbnailFileDownloadUrl: this.editData
          .newsThumbnailFileDownloadUrl,
        newsThumbnailFileIdx: this.editData.newsThumbnailFileIdx,
        newsTitle: this.editData.newsTitle
      }

      try {
        this.blockLoadingPage = true

        await API.config.createNews(reqObj)
        this.$alert(this.$t('common.ALERT.NEWS.003'), {
          callback: () => this.$router.push({ name: 'set-news-list' })
        })
      } catch (error) {
        console.log(error)
        this.$alert(this.$t('common.ALERT.NEWS.004'))
      } finally {
        this.blockLoadingPage = false
      }
    },
    async updateNews () {
      // 수정 상태일 때 가져온 이미지 데이터와 에디터의 HTML을 비교
      // 이미지 필터를 돌아서 현재 에디터 이미지 src에 포함되어 있는 것만
      // 수정시 Payload에 담음
      const editorJSON = this.$refs.editor.json
      const editorHTML = this.$refs.editor.html

      // validate
      if (!this.editData.newsTitle) {
        return this.$alert(this.$t('common.ALERT.BASE.054'))
      }

      if (this.editData.newsTitle.length > 100) {
        return this.$alert(this.$t('common.ALERT.NEW.005'))
      }

      if (
        !this.editData.newsThumbnailFileDownloadUrl ||
        !this.editData.newsThumbnailFileIdx
      ) {
        return this.$alert(this.$t('common.ALERT.NEW.002'))
      }

      if (!editorJSON || !editorHTML) {
        return this.$alert(this.$t('common.ALERT.BASE.027'))
      }

      const domParser = new DOMParser()
      const _document = domParser.parseFromString(editorHTML, 'text/html')
      const images = [..._document.querySelectorAll('img')]
      const srcs = images.map(image => (image.getAttribute('src')))

      // 썸네일 추가
      srcs.push(this.editData.newsThumbnailFileDownloadUrl)

      const uploadList =
        this.editUploadList
          .map(upload => upload.fileDownloadUrl)
          .filter(src => srcs.includes(src))
          .concat(this.customFileList.map(file => file.fileDownloadUrl))

      // API에서 받아온 데이터와 UI에서 모은 이미지 데이터 검증
      // API에서 받아온 데이터가 없으면 (제거된 경우)
      // UI에서 제거된 이미지를 찾아서 삭제한 후 fileList에 담아주기

      // API에서 받아온 거랑 UI에서 올린 이미지 합침
      const allImages =
        [...this.customFileList, ...this.editUploadList]
          .filter(Boolean)
          .filter(file => uploadList.includes(file.fileDownloadUrl))

      const reqObj = {
        fileIdxList: allImages.map(image => image.fileIdx),
        fileList: [...allImages],
        isView: this.editData.isView,
        newsContent: JSON.stringify(editorJSON),
        newsTitle: this.editData.newsTitle,
        newsThumbnailFileDownloadUrl: this.editData.newsThumbnailFileDownloadUrl,
        newsThumbnailFileIdx: this.editData.newsThumbnailFileIdx,
        newsIdx: this.editData.newsIdx
      }

      try {
        this.blockLoadingPage = true

        await API.config.updateNews(reqObj)
        this.$alert('뉴스를 수정하였습니다.', {
          callback: () => this.$router.push({ name: 'set-news-list' })
        })
      } catch (error) {
        console.log(error)
        this.$alert('뉴스 수정을 실패했습니다.')
      } finally {
        this.blockLoadingPage = false
      }
    },
    removeNews () {
      return this.$confirm(this.$t('common.CONFIRM.BASE.008'))
        .then(async () => {
          try {
            this.blockLoadingPage = true
            await API.config.removeNews(this.$route.params.id)
            this.$alert(this.$t('common.ALERT.BASE.013'), {
              callback: () => this.$router.push({ name: 'set-news-list' })
            })
          } catch (error) {
            console.log(error)
            this.$alert(this.$t('common.ALERT.BASE.016'))
          } finally {
            this.blockLoadingPage = false
          }
        })
        .catch(() => false)
    },
    cloneData () {
      if (!this.isCreate) {
        this.editData = cloneDeep(this.detail.data)
        this.uploadedThumbnail = {
          fileDownloadUrl: this.editData.newsThumbnailFileDownloadUrl
        }
        if (this.editData.fileList && this.editData.fileList.length) {
          this.editUploadList = [...this.editData.fileList]
        }
      }
      if (this.isEdit) {
        this.$store.commit('common/ADD_PARAMETERS', {
          label: this.$t('common.BTN.modify')
        })
      }
    },
    async uploadEditorImage (file, fileList, editor) {
      const formData = new FormData()

      formData.append('fileList', file.raw)

      try {
        const { data } = await API.config.uploadNewsStatic(formData)
        const url = data[0].fileDownloadUrl
        editor.commands.image({ src: url })
        this.customFileList.push(data[0])
      } catch (error) {
        console.log(error)
        this.$alert('이미지 업로드 실패')
      }
    },
    routeToUpdateQuery () {
      if (this.isCreate || this.isEdit) {
        this.$router.replace({
          name: 'set-news-detail',
          params: { ...this.data }
        })
      } else {
        this.$router.replace({
          name: 'set-news-detail',
          query: { edit: true }
        })
        this.cloneData()
      }
    }
  },
  data: () => ({
    loadingUploadThumbnail: false,
    customFileList: [],
    editData: {
      newsThumbnailFileDownloadUrl: '',
      newsThumbnailFileIdx: '',
      newsContent: '',
      newsTitle: '',
      isView: false
    },
    editUploadList: [],
    blockLoadingPage: false,
    uploadedThumbnail: null,
    thumbMouseover: false
  })
}
</script>

<style lang="scss" scoped>
.detail-view {
  border-top: 1px solid $purple-gray;

  .half {
    display: flex;

    & > * {
      width: 50%;
    }
  }

  .content {
    .register-contents {
      min-height: auto;
      margin-bottom: 1px;
    }
  }

  .button-wrap {
    margin: $gap-m;
    text-align: center;

    > button {
      margin: 5px;
    }
  }

  .upload-list {
    &-item {
      & > a {
        display: inline-flex;
        align-items: center;
        color: $white;
        text-decoration: none;

        &:hover {
          & span.file-name,
          & span.file-size {
            text-decoration: underline;
          }
        }
      }

      & span {
        margin-right: 5px;
      }
    }
  }

  .upload-thumbnail {
    padding: $gap-s 0;

    > img {
      width: 500px;
      height: auto;
    }
  }
}
</style>
