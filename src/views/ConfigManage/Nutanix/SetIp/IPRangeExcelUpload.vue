<!--
  * 파일명 : IPRangeExcelUpload.vue
  * 파일 기능 : IP대역/IP대역 속한 IP리스트 엑셀 업로드 기능 컴포넌트
  * 작성자 : 정재은
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 Update: IP 대역항목/상세 Excel 업로드 기능 추가 완료
 -->

<template>
  <section
    class="excel-upload-modal"
    v-loading="uploading"
  >
    <article class="modal-body ip-range-excel-upload-wrap">
      <div
        class="upload-section"
        v-if="type === 'ipBand'"
      >
        <el-upload
          :class="['iprange-excel-upload', { false: 'unremovable' }]"
          action=""
          accept=".xlsx, .xlsm, .xls, .xltx"
          multiple
          :limit="2"
          :auto-upload="false"
          :file-list="ipBandList"
          :on-change="rangeOnChange"
          :on-remove="rangeOnChange"
        >
          <button class="button -modal-button">
            {{ $v('대역 항목 Excel 업로드') }}
          </button>
          <small
            class="upload-tip"
            slot="tip"
            v-if="uploadInfo"
            v-html="$v('대역 항목에 관련된<br>Excel 을 업로드 해주세요.')"
          />
        </el-upload>
      </div>

      <div
        class="upload-section"
        v-if="type === 'ip'"
      >
        <div>
          <el-upload
            :class="['iprange-excel-upload', { false: 'unremovable' }]"
            action=""
            accept=".xlsx, .xlsm, .xls, .xltx"
            multiple
            :limit="2"
            :auto-upload="false"
            :file-list="ipList"
            :on-change="detailOnChange"
            :on-remove="detailOnChange"
          >
            <button class="button -modal-button">
              {{ $v('상세 IP Excel 업로드') }}
            </button>
            <small
              class="upload-tip"
              slot="tip"
              v-if="uploadInfo"
              v-html="$v('상세 IP 에 관련된<br>Excel을 업로드 해주세요.')"
            />
          </el-upload>
        </div>
      </div>
    </article>

    <div class="modal-footer modal-button-area">
      <button
        class="button -modal-button"
        type="is-anti"
        @click="$emit('before-close')"
      >
        {{ $v('취소') }}
      </button>
      <button
        class="button -modal-button"
        type="is-primary"
        @click="saveIp"
      >
        {{ $v('등록') }}
      </button>
    </div>
  </section>
</template>

<script>
import API from '@sd-fe/cmp-core'
export default {
  name: 'IPRangeExcelUpload',
  props: {
    type: {
      type: String || undefined,
      default: undefined
    }
  },
  created () {
    this.uploadInfo = true
  },
  methods: {
    /**
     * 대역 항목 Excel 업로드 설정
     */
    rangeOnChange (files, ipBandList) {
      if (files.size > (1024 * 1024 * 20)) { // 20Mb 이하 파일만 업로드 가능
        return this.$alert(this.$t('common.ALERT.PROJECT.059', { size: '20Mb' }))
      } else {
        // console.log('%c 대역 항목 - 쵀인징.. 등록, 삭제 모두 가능', 'color: #85FFED')
        this.uploadInfo = !ipBandList.length
        this.ipBandList = !ipBandList.length ? [...ipBandList] : ipBandList.slice(-1)
      }
    },
    /**
     * 대역 항목 Excel 업로드 실행
     */
    saveIpBandExcelUpload () {
      // if (!this.ipBandList.length) return this.$alert('파일을 먼저 업로드해주세요.', { callback: () => false })
      if (!this.ipBandList.length) return this.$alert(this.$t('common.ALERT.NUTA.013'), { callback: () => false })
      this.$confirm(this.$t('common.CONFIRM.NETWORK.005'))
        .then(async () => {
          try {
            this.uploading = true
            const file = new FormData()
            file.append('file', this.ipBandList[0].raw)

            const response = await API.network.uploadIPBandExcel(file)
            if (response) this.$alert(this.$t('common.ALERT.SECURITY.016'), { callback: () => this.$emit('close') })
          } catch (error) {
            const code = error.response.data.code
            const message = {
              NET5002: this.$t('common.ALERT.SECURITY.021'),
              NET7000: this.$t('common.ALERT.NETWORK.047'), // 파일 내용을 확인해주세요.
              NET7002: this.$t('common.ALERT.NETWORK.047'), // 파일 내용을 확인해주세요.
              NET0000: this.$t('common.ALERT.SECURITY.017')
            }[code]

            const msg = message || this.$t('common.ALERT.NUTA.014')
            return this.$alert(msg, { dangerouslyUseHTMLString: true })
          } finally {
            this.uploading = false
          }
        })
        .catch(() => false)
    },

    /**
     * 상세 IP Excel 업로드
     */
    detailOnChange (files, ipList) {
      if (files.size > (1024 * 1024 * 20)) { // 20Mb 이하 파일만 업로드 가능
        return this.$alert(this.$t('common.ALERT.PROJECT.059', { size: '20Mb' }))
      } else {
        // console.log('%c 상세 - 쵀인징.. 등록, 삭제 모두 가능', 'color: #CFFF85')
        this.uploadInfo = !ipList.length
        this.ipList = !ipList.length ? [...ipList] : ipList.slice(-1)
      }
    },
    /**
     * 대역 항목 Excel 업로드 실행
     */
    saveIpExcelUpload () {
      if (!this.ipList.length) return this.$alert(this.$t('common.ALERT.NUTA.013'), { callback: () => false })
      this.$confirm(this.$t('common.CONFIRM.NETWORK.005'))
        .then(async () => {
          try {
            this.uploading = true
            const file = new FormData()
            file.append('file', this.ipList[0].raw)

            const response = await API.network.uploadIPExcel(file)
            if (response) this.$alert(this.$t('common.ALERT.SECURITY.016'), { callback: () => this.$emit('close') })
          } catch (error) {
            const code = error.response.data.code
            const message = {
              NET5002: this.$t('common.ALERT.SECURITY.021'),
              NET7000: this.$t('common.ALERT.NETWORK.047'), // 파일 내용을 확인해주세요.
              NET7002: this.$t('common.ALERT.NETWORK.047'), // 파일 내용을 확인해주세요.
              NET0000: this.$t('common.ALERT.SECURITY.017')
            }[code]

            const msg = message || this.$t('common.ALERT.NUTA.014')
            return this.$alert(msg, { dangerouslyUseHTMLString: true })
          } finally {
            this.uploading = false
          }
        })
        .catch(() => false)
    },

    saveIp () {
      if (this.type === 'ipBand') this.saveIpBandExcelUpload()
      else this.saveIpExcelUpload()
    }
  },
  data () {
    return {
      ipBandList: [],
      ipList: [],
      uploadInfo: true,
      uploading: false
    }
  }
}
</script>

<style lang="scss" scoped>
.excel-upload-modal {
  .ip-range-excel-upload-wrap {
    &.modal-body {
      height: 120px;
      border-top: 1px solid $border-color;
      border-bottom: 1px solid $border-color;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-flow: column;
      button {
        margin: 6px 0;
        height: 40px;
        line-height: 36px;
      }
    }

    display: flex;
    align-items: center;

    .upload-section {
      position: relative;

      .upload-tip {
        box-sizing: border-box;
        position: absolute;
        right: 0; top: 0;
        width: calc(100% - 200px);
        height: 52px;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: 12px;
        color: $input-placeholder;
        line-height: 1.2;
      }

    }
  }
}
</style>

<style lang="scss">
  .iprange-excel-upload {
    display: flex;
    align-items: center;
    .el-upload {
      margin-right: $gap-s;
      display: flex;
      align-items: center;
      > button {
        width: 200px;
      }
    }
    .el-upload-list {
      width: 180px;
      height: 30px;
      .el-upload-list__item {
        margin: 0;
        border-radius: 0;
        border-bottom: 1px solid $main-red;
        line-height: 30px;
        position: relative;
        .el-icon-close {
          line-height: 25px;
          right: 0;
          &::before {
            font-size: 13px;
            display: block;
            width: 13px;
          }
        }
        .el-upload-list__item-name {
          margin-right: 15px;
          padding-left: 18px;
          font-weight: normal;
          .el-icon-document {
            position: absolute;
            top: 0; left: 0;
            height: 32px;
            // width: 15px;
            display: flex;
            align-items: center;
            &::before {
              content: '';
              display: block;
              width: 13px; height: 13px;
              // background: url('../assets/images/upload-link.png') no-repeat;
              background-size: contain;
            }
          }
          &:hover { color: $white; }
        }

        &.is-ready { border: none;}
        &.is-success:focus:not(:hover) {
          .el-icon-close-tip { display: none !important; }
        }
        .el-upload-list__item-status-label {display: none}
        .el-progress-bar {
          .el-progress-bar__inner { background: $main-red; }
        }
        .el-progress__text {
          font-size: 10px !important;
          top: -9px
        }
        .el-icon-close-tip { display: none !important; }
      }
      // &.el-upload-list--text {
      //   border: 1px solid chartreuse;
      // }
    }
    &.unremovable {
      .el-upload-list {
        .el-upload-list__item {
          .el-icon-close {
            display: none;
          }
        }
      }
    }
  }
</style>
