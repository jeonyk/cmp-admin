<!--
  * 파일명 : ExcelUpload.vue
  * 파일 기능 : IP리스트 엑셀 업로드 기능 컴포넌트
  * 작성자 : 김예담
  * 최종 작성일 : 2021-08-09
  * License By Shinsegae I&C
 -->

<template>
  <section
    class="cmp-excel-upload"
    v-loading="uploading || loading"
  >
    <article class="excel-upload-wrap">
      <div class="upload-section">
        <el-upload
          :class="['excel-upload', { false: 'unremovable' }]"
          action=""
          :accept="accept"
          multiple
          :limit="limit"
          :auto-upload="false"
          :file-list="fileList"
          :on-change="rangeOnChange"
          :on-remove="rangeOnChange"
        >
          <slot name="trigger">
            <button class="button">
              upload
            </button>
          </slot>
          <small
            v-if="!fileList.length"
            class="upload-tip"
            slot="tip"
          >
            <!-- Excel 파일을 업로드 해주세요. -->
            {{ $t('common.PLACEHOLDER.uploadExcel') }}
          </small>
        </el-upload>
      </div>
    </article>

    <div class="modal-footer modal-button-area">
      <button
        class="button -modal-button"
        type="is-anti"
        @click="cancelUpload"
      >
        <!-- 취소 -->
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button -modal-button"
        type="is-primary"
        @click="saveFile"
      >
        <!-- 등록 -->
        {{ $t('common.BTN.enroll') }}
      </button>
    </div>
  </section>
</template>

<script>
export default {
  name: 'ExcelUpload',
  props: {
    accept: {
      type: String,
      default: '.xlsx, .xlsm, .xls, .xltx'
    },
    limit: {
      type: Number,
      default: 2
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    /**
     * 대역 항목 Excel 업로드 설정
     */
    rangeOnChange (files, fileList) {
      if (files.size > (1024 * 1024 * 20)) { // 20Mb 이하 파일만 업로드 가능
        return this.$alert(this.$t('common.ALERT.PROJECT.059', { size: '20Mb' }))
      } else {
        this.fileList = !fileList.length ? [...fileList] : fileList.slice(-1)
      }
    },
    /**
     * [등록] 시, 발생 이벤트
     */
    saveFile () {
      if (!this.fileList.length) return this.$alert(this.$t('common.ALERT.NUTA.015'), { callback: () => false }) // 파일을 선택해주세요.
      this.$confirm(this.$t('common.CONFIRM.NETWORK.005')) // 해당 파일을 업로드하시겠습니까?
        .then(async () => {
          try {
            this.uploading = true
            const file = new FormData()
            file.append('file', this.fileList[0].raw)

            this.$emit('save', file)
          } catch (error) {
            const msg = this.$t('common.ALERT.NUTA.014') // 파일 업로드 중에 문제가 발생하였습니다.<br>다시 시도해주세요.
            return this.$alert(msg, { dangerouslyUseHTMLString: true })
          } finally {
            this.uploading = false
          }
        })
        .catch(() => false)
    },
    /**
     * [취소] 시, 발생 이벤트
     */
    cancelUpload () {
      this.$confirm(this.$t('common.CONFIRM.BASE.003'), { // 등록하지 않고 취소하시겠습니까?<br>업로드된 파일은 저장되지 않습니다.
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(() => this.$emit('close'))
        .catch(() => false)
    }
  },
  data () {
    return {
      fileList: [],
      uploading: false
    }
  }
}
</script>

<style lang="scss">
.cmp-excel-upload {
  .excel-upload-wrap {
    display: flex;
    align-items: center;
    flex-flow: column;
    justify-content: center;
    height: 120px;
    border-top: 1px solid $border-color;
    border-bottom: 1px solid $border-color;
    padding: 20px;
    button {
      margin: 6px 0;
      height: 40px;
      line-height: 36px;
    }

    .upload-section {
      position: relative;
      width: 100%;
      .excel-upload {
        display: flex;
        align-items: center;
        .el-upload-list {
          margin-left: 10px;
          width: 180px;
          height: 30px;
          &__item {
            margin-top: 0;
            display: flex;
            align-items: center;
          }
          &__item-name {
            margin-right: 15px !important;
            padding-left: 18px !important;
            font-weight: normal;
            .el-icon-document {
              position: absolute;
              top: 0; left: 0;
              height: 32px;
              display: flex;
              align-items: center;
              &::before {
                content: '';
                display: block;
                width: 13px; height: 13px;
                background-size: contain;
              }
            }
            &:hover { color: $white; }
          }
          .el-icon-close {
            right: -10px;
            &::before {
              font-size: 15px;
            }
          }
        }
      }

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
        color: $input-stroke-active;
        line-height: 1.2;
      }

    }
  }
}
</style>

// <style lang="scss">
//   .iprange-excel-upload {
//     display: flex;
//     align-items: center;
//     .el-upload {
//       margin-right: $gap-s;
//       display: flex;
//       align-items: center;
//       > button {
//         width: 200px;
//       }
//     }
//     .el-upload-list {
//       width: 180px;
//       height: 30px;
//       .el-upload-list__item {
//         margin: 0;
//         border-radius: 0;
//         border-bottom: 1px solid $main-red;
//         line-height: 30px;
//         position: relative;
//         .el-icon-close {
//           line-height: 25px;
//           right: 0;
//           &::before {
//             font-size: 13px;
//             display: block;
//             width: 13px;
//           }
//         }
//         .el-upload-list__item-name {
//           margin-right: 15px;
//           padding-left: 18px;
//           font-weight: normal;
//           .el-icon-document {
//             position: absolute;
//             top: 0; left: 0;
//             height: 32px;
//             // width: 15px;
//             display: flex;
//             align-items: center;
//             &::before {
//               content: '';
//               display: block;
//               width: 13px; height: 13px;
//               // background: url('../assets/images/upload-link.png') no-repeat;
//               background-size: contain;
//             }
//           }
//           &:hover { color: $white; }
//         }

//         &.is-ready { border: none;}
//         &.is-success:focus:not(:hover) {
//           .el-icon-close-tip { display: none !important; }
//         }
//         .el-upload-list__item-status-label {display: none}
//         .el-progress-bar {
//           .el-progress-bar__inner { background: $main-red; }
//         }
//         .el-progress__text {
//           font-size: 10px !important;
//           top: -9px
//         }
//         .el-icon-close-tip { display: none !important; }
//       }
//       // &.el-upload-list--text {
//       //   border: 1px solid chartreuse;
//       // }
//     }
//     &.unremovable {
//       .el-upload-list {
//         .el-upload-list__item {
//           .el-icon-close {
//             display: none;
//           }
//         }
//       }
//     }
//   }
// </style>
