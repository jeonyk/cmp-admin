<template>
  <el-dialog
    :visible="visible"
    :title="title"
    :width="width"
    :top="top"
    @close="() => fileUploading ? null : close()"
  >
    <div v-loading="loading">
      <!-- {{ programValues }} -->
      <section class="modal-body add-file">
        <article class="sw-lists">
          <div>
            <strong class="title">
              <!-- 파일 종류  -->
              {{ $t('service.INSTALL.COL.fileType') }} <b>*</b>
            </strong>
            <!-- 파일 종류를 선택해주세요 -->
            <el-select
              class="-input"
              :placeholder="$t('service.INSTALL.ALERT.037')"
              v-model="programValues.fileType"
              :popper-append-to-body="false"
              @change="changeFileType"
            >
              <el-option
                v-for="option in options"
                :key="option.field || option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
        </article>
        <!-- /. SW 라이선스, 지원 OS, OS bits, SW 명, SW Version -->

        <article class="division">
          <strong class="title">
            <!-- 파일 업로드 -->
            {{ $t('service.INSTALL.uploadFile') }}
            <b>*</b>
          </strong>
          <el-upload
            action=""
            class="cmp-upload -absolute -limit-width"
            :multiple="false"
            :show-file-list="true"
            :auto-upload="false"
            :file-list="fileList"
            :on-remove="changeFile"
            :on-change="changeFile"
          >
            <button
              class="button"
              type="is-primary"
              :disabled="fileUploading"
            >
              <!-- 파일업로드 -->
              {{ $t('service.INSTALL.upload') }}
            </button>
          </el-upload>
        </article>
        <!-- /. 파일 업로드 -->

        <div
          class="install-process"
          v-if="uploadStatus.uploaded"
        >
          <span>{{ uploadStatus.name }}</span>
          <i class="check" />
          <el-progress
            :show-text="false"
            :stroke-width="4"
            :percentage="uploadStatus.value"
          />

          <p class="processing">
            {{ uploadStatus.size | byte }} / {{ uploadStatus.max | byte }}
            <i>Uploading... <b>{{ uploadStatus.value }}%</b></i>
          </p>
        </div>
      <!-- /. 파일업로드 상태 -->
      </section>

      <div class="modal-button-area">
        <button
          v-if="!uploadStatus.uploaded"
          class="button"
          @click="close"
        >
          <!-- 취소 -->
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          v-if="!uploadStatus.uploaded"
          class="button"
          type="is-primary"
          @click="updateFile"
        >
          {{ type === 'update' ? $v('변경') : $v('추가') }}
        </button>
        <button
          v-else
          class="button"
          type="is-primary"
          :disabled="fileUploading"
          @click="close"
        >
          <!-- 확인 -->
          {{ $t('common.BTN.confirm') }}
        </button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import API from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
import { v4 as uuid4 } from 'uuid'

export default {
  name: 'InstallProgramUpdateFile',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: undefined
    },
    width: {
      type: String,
      default: 'auto'
    },
    top: {
      type: String,
      default: '50px'
    },
    type: {
      type: String,
      default: 'add',
      validator (value) {
        return ['add', 'update'].includes(value)
      }
    },
    data: { // 현재 선택된 버전의 정보
      type: Object,
      default: () => null
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  watch: {
    visible (visible) {
      if (visible) {
        this.loading = true

        setTimeout(() => {
          this.getCode()
          if (this.type === 'update') {
            this.setFileFormat(this.data)
          }
        }, 400)
      }
    },
    fileUploading (status) {
      // 현재 파일을 업로드 중일 경우, 상태를 밖에 알려줍니다
      this.$emit('upload-status', status)
    }
  },
  methods: {
    /**
     * [어드민 관리 > 코드 관리 > 코드 정의] 에 등록된 [설치프로그램 파일] 코드에서 [파일 타입] 선택 가능
     */
    async getCode () {
      try {
        const response = await API.config.getCodeList({ codeType: 'INSTALLER_FILE' })

        // 파일종류 옵션
        this.options = response.map(({ codeIdx, codeName, codeType, codeVal, ...code }) => {
          return { label: codeName, value: codeVal, field: codeVal, codeType }
        })
      } catch (error) {
        console.error('@@ getCode : ', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * [파일 추가 / 수정] 파일을 먼저 업로드 하기 위해 validation 확인을 합니다
     */
    updateFile () {
      const validator = [
        { condition: this.programValues.fileType !== undefined, message: this.$t('service.INSTALL.ALERT.037') }, // 파일 종류를 선택해주세요.
        { condition: this.fileList.length > 0, message: this.$t('service.INSTALL.ALERT.038') } // 파일을 업로드해주세요.
      ]

      const validation = validator.every(cond => {
        if (!cond.condition) this.$alert(cond.message, '', { callback: () => false })
        return cond.condition
      })

      if (!validation) return

      // [파일 업로드] 파일 이 추가 / 변경된 경우 ? 일단 파일을 먼저 업로드해야합니다
      // [파일 종류] 만 업데이트 된경우
      if (this.fileList[0]?.raw !== undefined) return this.uploadFile({ ...this.programValues, fileList: [...this.fileList] })
      else return this.updateFileTypeOnly({ ...this.programValues })
    },
    /**
     * [파일 추가 / 수정] 파일을 먼저 업로드를 합니다
     */
    async uploadFile ({ fileList, ...values }) {
      try {
        this.fileUploading = true
        const size = fileList[0].size
        const name = fileList[0].name

        // 초기 파일 업로드 상태 설정
        this.uploadStatus = {
          uploaded: true,
          name: name,
          size: 0,
          max: size,
          value: (0 / size) * 100
        }

        const fileKey = uuid4()
        const formData = new FormData()
        formData.append('file', this.fileList[0].raw)

        const fileId = await API.sw.uploadFile(fileKey, formData, this.uploadProgressHanlder, this.user.userIdx)

        if (fileId !== undefined) {
          this.fileUploading = false

          this.uploadStatus = {
            ...this.uploadStatus,
            size: this.uploadStatus.max,
            value: 100 // 브라우저상에서 올린 정도
          }

          // 타입에 따라 활동을 달리합니다.
          const type = {
            add: () => this.versionFileUpload(fileId),
            update: () => this.versionFileUpdate({ fileType: this.programValues.fileType, oldFileId: this.data.id, newFileId: fileId })
          }

          return type[this.type]()
        }
      } catch (error) {
        console.error('@@ uploadFile : ', error)
      }
    },
    /**
     * 프론트에서 먼저 File upload 를 완료해야만 서버에 파일을 등록할 수 있습니다.
     * @param { Object } event
     */
    uploadProgressHanlder (event) {
      const process = Math.round((event.loaded / event.total) * 100)

      // 파일 업로드 상태 업데이트
      this.uploadStatus = {
        ...this.uploadStatus,
        size: event.loaded,
        value: process <= 95 ? process : 95 // 브라우저상에서 올린 정도
      }
    },

    /**
     * [파일 추가] 시 파일 종류와 업로드 한 파일을 저장합니다.
     * @param { Number } fileId 파일을 업로드하고 얻은 index
     */
    async versionFileUpload (fileId) {
      try {
        this.loading = true
        const fileType = this.programValues.fileType
        const id = this.data.id
        const response = await API.sw.versionFileUpload({ fileId, fileType, id })

        if (response === true) {
          // 파일이 성공적으로 추가되었습니다.
          this.$alert(this.$t('service.INSTALL.ALERT.027'), '', { callback: () => this.$emit('update') })
        }
      } catch (error) {
        console.error('@@ versionFileUpload : ', error)
        // 파일 업로드에 실패하였습니다
        this.$alert(this.$t('service.INSTALL.ALERT.028'), '', { callback: () => false })
      } finally {
        this.loading = false
      }
    },

    // ================================
    // ========== [파일 수정] ===========
    // ================================

    /**
     * [파일 수정] 시 [파일 타입] 만 변경한 경우는 body 에 {fileType, oldFileId} 만 사용합니다.
     * @param { Object } programValues { fileType }
     */
    async updateFileTypeOnly ({ fileType }) {
      const oldFileId = this.data.id // 기존 fileId
      this.versionFileUpdate({ fileType, oldFileId })
    },

    /**
     * [파일 수정] 시 파일 종류와 업로드한 파일을 저장합니다.
     * newFileId 가 없는 경우는 파일 종류만 변경했을 때 적용됩니다.
     * @param { Objet } params { fileType, oldFileId, newFileId } 로 구성된 파라미터
     */
    async versionFileUpdate (params) {
      try {
        this.loading = true
        console.log(params)

        const response = await API.sw.versionFileUpdate(params)
        if (response === true) {
          // 파일이 성공적으로 수정되었습니다.
          this.$alert(this.$t('service.INSTALL.ALERT.029'), '', { callback: () => this.$emit('update') })
        }
      } catch (error) {
        console.error('@@ versionFileUpdate : ', error)
        // 파일 수정에 실패하였습니다
        this.$alert(this.$t('service.INSTALL.ALERT.030'), '', { callback: () => false })
      } finally {
        this.loading = false
      }
    },

    /**
     * [파일 수정] 기존에 등록되어있던 [파일 종류]와 파일의 형식을 가공합니다.
     * @param { Object } this.data 기존에 등록된 파일의 정보
     */
    async setFileFormat ({ type, fileName, ext } = this.data) {
      // console.log(this.data, '==== 선택된 File..')
      this.fileList = await [{ name: `${fileName}.${ext}` }]
      this.programValues.fileType = await type
    },

    // ==========================
    // ========== [공용] =========
    // ==========================

    /**
     * [파일 종류] 가 변경될 때마다 저장합니다
     * @param { String } value
     */
    changeFileType (value) {
      this.programValues.fileType = value
      this.$forceUpdate()
    },

    /**
     * 파일 변경시 이벤트
     * @param    {Object} file 업로드된 파일 한개
     * @param    {Array} formData 업로드된 파일 리스트
     * @return   {void}
     */
    changeFile (file, fileList) {
      if (file.size > (1024 * 1024 * 1024 * 1)) { // 1GB 이하 파일만 업로드 가능
        return this.$alert(this.$t('common.ALERT.PROJECT.059', { size: '1GB' }), '', {
          callback: () => (this.fileList = [])
        })
      }

      this.fileList = !fileList.length ? [...fileList] : fileList.slice(-1)
    },

    /**
     * 취소 및 닫기 이벤트
     */
    close () {
      this.programValues = {}
      this.uploadStatus = {}
      this.fileList = []
      this.$emit('close')
    }

  },
  data: () => ({
    loading: false,
    fileUploading: false, // 파일 업로드중인지 확인
    uploadStatus: {
      uploaded: false,
      name: undefined,
      size: 0,
      max: 0,
      value: 0
    },
    timeout: null,
    options: [],
    programValues: {
      swLicense: undefined,
      supportOs: undefined,
      osBits: undefined,
      swName: undefined,
      swVersion: undefined
    },
    fileList: []
  })
}
</script>

<style lang="scss" scoped>
.add-file {
  margin-bottom: 25px;

  .title {
    line-height: 40px;
    font-weight: 400;

    > b { color: $main-red }
  }

  .sw-lists {
    margin-top: -20px;
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    column-gap: 15px;
    row-gap: 12px;
  }

  .install-process {
    margin-top: $gap;
    font-size: 13px;
    color: #D9D9D9;
    position: relative;

    span {
      display: block;
      margin-bottom: 5px;
    }

    .check {
      display: block;
      position: absolute;
      top: 0; right: 0;
      width: 12px; height: 12px;
      background: url('../../../../../assets/images/icon-process-check.svg') no-repeat center;
    }

    .processing {
      margin-top: 5px;
      color: $input-placeholder;
      display: flex;
      align-items: center;
      justify-content: space-between;
      i {
        font-size: 13px;
        color: $primary;
        b { font-size: 15px; }
      }
    }
  }

  .division {
    margin-top: $gap-s;
  }
}
</style>

<style lang="scss">
.add-file {
  .el-progress-bar__inner {
    background-color: $primary;
  }
  .el-progress-bar__outer {
    background-color: $main-gray;
  }
}
</style>
