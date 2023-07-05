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
        {{ data.referenceRoomTitle }}
      </span>
      <el-input
        v-else
        v-model="editData.referenceRoomTitle"
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
          :set-content="data.referenceRoomContent"
          @upload-image="uploadEditorImage"
          :edit="isEditMode"
        />
      </register-contents>
    </div>
    <register-contents :title="$t('common.TERMS.file')">
      <div
        v-if="isEditMode"
        class="upload"
      >
        <el-upload
          ref="fileUpload"
          show-file-list
          action=""
          multiple
          :limit="5"
          :on-change="uploadFile"
          :on-exceed="uploadExceed"
          :on-remove="removeFile"
          :auto-upload="false"
          :file-list="noneStaticEditUploadList"
        >
          <button
            type="is-primary"
            class="button"
          >
            {{ $t("common.BTN.uploadFile") }}
          </button>
          <span style="margin-left: 5px;">
            {{ $t("common.PLACEHOLDER.uploadLimitFile") }}
          </span>
        </el-upload>
      </div>
      <div
        v-else-if="noneStaticFileList"
        class="upload-list"
      >
        <div
          v-for="file in noneStaticFileList"
          :key="file.fileIdx"
          class="upload-list-item"
        >
          <a :href="file.fileDownloadUrl">
            <span class="file-icon">
              <i class="mdi mdi-file" />
            </span>
            <span class="file-name">
              {{ file.fileOrgName }}
            </span>
            <span class="file-size"> ({{ file.fileSize | byte }}) </span>
          </a>
        </div>
      </div>
    </register-contents>
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
          type="is-anti"
          size="is-large"
          @click="$router.go(-1)"
        >
          {{ $v('취소') }}
        </button>
        <button
          class="button"
          type="is-primary"
          size="is-large"
          @click="createRef"
        >
          {{ $v('등록 완료') }}
        </button>
      </template>
      <template v-else-if="!isCreate && !isEdit">
        <button
          class="button"
          size="is-large"
          type="is-anti"
          @click="removeRef"
        >
          {{ $v('삭제') }}
        </button>
        <button
          class="button"
          size="is-large"
          @click="$router.push({ name: 'set-ref-list' })"
        >
          {{ $v('목록') }}
        </button>
        <button
          v-if="!isEditMode"
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
          @click="updateRef"
        >
          {{ $v('수정 완료') }}
        </button>
      </template>
    </div>
  </div>
</template>

<script>
import API, { CMPEditor } from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'
import axios from 'axios'

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
    },
    refUploadURL () {
      return `${process.env.VUE_APP_ZUUL_URL}/api/cmp/v1/config/referenceRoom/file/upload`
    },
    noneStaticFileList () {
      if (this.data && this.data.fileList) {
        return this.data.fileList.filter(file => file.type === 'NONE_STATIC')
      } else {
        return []
      }
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
    async validateRef (req) {
      const rawTextContent = document.querySelector('.ProseMirror').textContent.trim()
      if (!req.referenceRoomTitle) {
        return this.$alert(this.$t('common.ALERT.BASE.054'), { // 제목을 입력해주세요.
          callback: () => false
        })
      }
      if (!req.referenceRoomContent || !rawTextContent) {
        return this.$alert(this.$t('common.ALERT.BASE.027'), { // 내용을 입력해주세요.
          callback: () => false
        })
      }
      return true
    },
    removeFile (file, fileList) {
      if (this.isCreate) {
        const inDataFile = this.customFileList.findIndex(
          innerFile =>
            innerFile.fileOrgName === file.name &&
            parseInt(innerFile.fileSize) === file.size
        )
        if (inDataFile !== -1) {
          this.customFileList.splice(inDataFile, 1)
        }
      } else if (this.isEdit) {
        if (file.isRaw === false) {
          // API 에서 가져온거
          this.editUploadList = this.editUploadList.filter(
            f => f.fileIdx !== file.fileIdx
          )
        } else {
          // 수정중에 업로드한 거
          this.customFileList = this.customFileList.filter(
            f =>
              parseInt(f.fileSize) !== file.size && f.fileOrgName !== file.name
          )
        }
      }
    },
    uploadExceed (fileList) {
      if (fileList.length >= 5) {
        return this.$alert(this.$t('common.ALERT.IND.009'))
      }
    },
    uploadFile (file, fileList) {
      if (fileList.length > 5) {
        return this.$alert(this.$t('common.ALERT.IND.009'))
      }

      if (file.size >= 100000000) { // 100 MB
        const removeIndex = fileList.findIndex(f => f.uid === file.uid)
        if (!removeIndex !== -1) {
          this.$refs.fileUpload.uploadFiles.splice(removeIndex, 1)
        }
        return this.$alert(this.$t('common.ALERT.IND.010'))
      }

      const formData = new FormData()

      formData.append('fileList', file.raw)

      file.status = 'uploading'

      axios
        .post(this.refUploadURL, formData, {
          onUploadProgress: progressEvent => {
            file.percentage =
              (progressEvent.loaded * 100) / progressEvent.total
          }
        })
        .then(result => {
          file.status = 'success'
          this.customFileList.push(result.data[0])
        })
        .catch(({ response }) => {
          file.status = 'fail'

          switch (response.data.code) {
            case 'CFG6003':
              return this.$alert(this.$t('common.ALERT.IND.010'))
            default:
              return this.$alert(this.$t('common.ALERT.IND.011'))
          }
        })
    },
    removeRef () {
      return this.$confirm(this.$t('common.CONFIRM.BASE.008'))
        .then(async () => {
          try {
            await API.config.removeRef(this.$route.params.id)
            this.$alert(this.$t('common.ALERT.BASE.013'), {
              callback: () => this.$router.push({ name: 'set-ref-list' })
            })
          } catch (error) {
            console.log(error)
            this.$alert(this.$t('common.ALERT.BASE.016'))
          }
        })
        .catch(() => false)
    },
    cloneData () {
      if (!this.isCreate) {
        this.editData = cloneDeep(this.detail.data)
        if (this.editData.fileList && this.editData.fileList.length) {
          this.editUploadList = [
            ...this.editData.fileList.map(file => ({
              ...file,
              name: file.fileOrgName,
              isRaw: false
            }))
          ]
          this.noneStaticEditUploadList = [
            ...this.editUploadList.filter(file => file.type === 'NONE_STATIC')
          ]
        }
      }
      if (this.isEdit) {
        this.$store.commit('common/ADD_PARAMETERS', {
          label: this.$t('common.BTN.modify')
        })
      }
    },
    async createRef () {
      const editorJSON = this.$refs.editor.json

      const reqObj = {
        fileList: [...this.customFileList],
        fileIdxList: [...this.customFileList.map(file => file.fileIdx)],
        referenceRoomContent: editorJSON ? JSON.stringify(editorJSON) : null,
        referenceRoomTitle: this.editData.referenceRoomTitle,
        isView: this.editData.isView,
        skip: 0
      }

      const isValidated = await this.validateRef(reqObj)
      if (!isValidated) return

      const isUploadingAll = this.$refs.fileUpload.uploadFiles.every(
        file => file.status === 'success'
      )

      if (!isUploadingAll) {
        return this.$alert(this.$t('common.ALERT.IND.012'))
      }

      this.blockLoadingPage = true

      try {
        await API.config.createRef(reqObj)
        this.$alert(this.$t('common.ALERT.BASE.040'), {
          callback: () => this.$router.push({ name: 'set-ref-list' })
        })
      } catch (error) {
        console.log(error)
      } finally {
        this.blockLoadingPage = false
      }
    },
    async updateRef () {
      const editorJSON = this.$refs.editor.json

      if (!editorJSON) {
        return this.$alert(this.$t('common.ALERT.BASE.027'))
      }

      const isUploadingAll = this.$refs.fileUpload.uploadFiles.every(
        file => file.status === 'success'
      )

      if (!isUploadingAll) {
        return this.$alert(this.$t('common.ALERT.IND.012'))
      }

      // 첨부파일 합침
      const uploadFiles = [].concat(this.editUploadList, this.customFileList)

      const reqObj = {
        referenceRoomTitle: this.editData.referenceRoomTitle,
        isView: this.editData.isView,
        referenceRoomContent: editorJSON ? JSON.stringify(editorJSON) : null,
        referenceRoomIdx: this.editData.referenceRoomIdx,
        fileList: [...uploadFiles],
        fileIdxList: uploadFiles.map(file => file.fileIdx)
      }

      const isValidated = await this.validateRef(reqObj)
      if (!isValidated) return

      this.blockLoadingPage = true

      try {
        const { data } = await API.config.updateRef(reqObj)
        if (!data) {
          throw new Error()
        }
        this.$alert(this.$t('common.ALERT.BASE.043'), {
          callback: () =>
            this.$router.push({
              name: 'set-ref-list'
            // params: { id: this.editData.referenceRoomIdx }
            })
        })
      } catch (error) {
        console.log(error)
        this.$alert(this.$t('common.ALERT.BASE.021'))
      } finally {
        this.blockLoadingPage = false
      }
    },
    async uploadEditorImage (file, fileList, editor) {
      const formData = new FormData()

      formData.append('fileList', file.raw)

      try {
        const { data } = await API.config.uploadRefStaticFile(formData)
        const url = data[0].fileDownloadUrl
        editor.commands.image({ src: url })
        this.customFileList.push(data[0])
      } catch (error) {
        console.log(error)
      }
    },
    routeToUpdateQuery () {
      if (this.isCreate || this.isEdit) {
        this.$router.replace({
          name: 'set-ref-detail',
          params: { ...this.data }
        })
      } else {
        this.$router.replace({
          name: 'set-ref-detail',
          query: { edit: true }
        })
        this.cloneData()
      }
    }
  },
  data: () => ({
    noneStaticEditUploadList: [],
    customFileList: [],
    editData: {
      referenceRoomContent: '',
      referenceRoomTitle: '',
      isView: false
    },
    editUploadList: [],
    blockLoadingPage: false
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
}
</style>
