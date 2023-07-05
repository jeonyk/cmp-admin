<template>
  <div class="UploadNetworkCertification">
    <el-radio-group v-model="isUploadBtn">
      <el-radio :label="true">
        <div class="use-content-container">
          {{ this.$v('인증서 업로드') }}
        </div>
      </el-radio>

      <el-radio :label="false">
        {{ this.$v('인증서 목록 선택') }}
      </el-radio>
    </el-radio-group>
    <div class="fileup-btn-container">
      <el-upload
        v-if="isUploadBtn"
        type="button"
        ref="upload"
        action=""
        class="certi-edit-from__btn--file-upload"
        :multiple="true"
        :auto-upload="false"
        :accept="'.pem,.der,.cer,.key,.crt'"
        :file-list="certifFile"
        :show-file-list="false"
        :before-upload="handleBeforeUpload"
        :on-change="(file,fileList)=>
          handleChangeFileList(file,fileList,'certifFile')"
      >
        <button
          class="button file-upload-btn"
          type="is-black"
        >
          {{ $v('파일 선택') }}
        </button>
      </el-upload>
      <button
        class="button list-open"
        v-else
        @click="handleOpenCertif"
        type="is-black"
      >
        {{ $v('인증서 목록 선택') }}
      </button>
    </div>
    <div
      v-if="certifGridData.length"
      class="filelist-container"
    >
      <section class="grid-title">
        {{ $v('첨부된 인증서') }}
      </section>
      <cmp-grid
        class="certif-grid network-certif-grid-table"
        :use-column-filter="false"
        :columns="certifGrid"
        :item-source="certifGridData"
      >
        <template #f="props">
          <trash-icon
            @click="handleClickToDelCert(props)"
            is-button
          />
        </template>
      </cmp-grid>
    </div>
    <el-dialog
      :title="$v('인증서 목록')"
      :visible="isOpenCertif"
      @close="handelCloseCertif"
    >
      <modal-certification-list
        @close="handelCloseCertif"
        @confirm="handelConfirmCertif"
      />
    </el-dialog>
  </div>
</template>

<script>
import ModalCertificationList from './ModalCertificationList.vue'
import forge from 'node-forge'
import TrashIcon from '@/components/Icons/TrashIcon.vue'
export default {
  components: { ModalCertificationList, TrashIcon },
  watch: {
    certifFile: {
      deep: true,
      handler (val) {
        const fileDataUpload = {
          isCreated: this.isUploadBtn,
          fileList: this.certifFile,
          fileData: [...this.certifGridData]
        }

        this.$emit('upload', fileDataUpload)
      }
    }
  },
  methods: {
    handleBeforeUpload (file) {
      console.log(file)
      return false
    },
    /** EVENT_HANDLER (삭제) 인증서 첨부 삭제 */
    handleClickToDelCert (props) {
      const selectedRowName = props.row.fileName
      const foundIdx = this.certifGridData.findIndex((el) => el.fileName === selectedRowName)
      const foundFileIdx = this.certifFile.findIndex((el) => el.name === selectedRowName)
      this.certifGridData.splice(foundIdx, 1)
      this.certifFile.splice(foundFileIdx, 1)
    },
    handelConfirmCertif (row) {
      console.log('handelConfirmCertif')
      if (row) {
        this.certifGridData = [{ ...row }]
      } else { this.certifFile = [] }
      this.isOpenCertif = false
    },
    handelCloseCertif () {
      this.isOpenCertif = false
    },
    handleChangeFileList (file, fileList, gridDataKey) {
      // this.$refs.upload.clearFiles()

      const ext = this.getFileExtension(file.name)
      // bindName = fileList

      if (ext === 'key') {
        const certifData = {
          a: file.name,
          file: file.name
        }
        this[gridDataKey].push(file)
        this.certifGridData.push(certifData)

        return true
      }

      const reader = new FileReader()
      reader.readAsText(file.raw)
      reader.onload = () => {
        const cert = reader.result
        if (this.extractCertifDetails(cert, ext) === null) {
          this.$alert(this.$v('잘못 된 인증서 파일입니다.'))
        } else {
          const certDetails = this.extractCertifDetails(cert, ext)
          const certifData = {
            a: certDetails.subject.commonName,
            b: certDetails.issuer.organizationalUnitName,
            c: certDetails.validity.notBefore,
            d: certDetails.validity.notAfter,
            e: certDetails.subject.organizationName,
            fileName: file.name
          }
          this[gridDataKey].push(file)
          this.certifGridData.push(certifData)
          this.$emit('upload', { isCreated: this.isUploadBtn, fileList: this.certifFile, fileData: this.certifGridData })
        }
      }
    },
    getFileExtension (filename) {
      return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
    },
    clearFileList () {
      this.$refs.upload.clearFiles()
      this.certifFile = []
    },
    // PEM 파일 추출
    extractCertifDetails (certFile, ext) {
      let certObj = null
      if (ext === 'pem' || ext === 'crt') {
        certObj = forge.pki.certificateFromPem(certFile)
      } else if (ext === 'der' || ext === 'cer') {
        certObj = forge.pki.certificateFromAsn1(forge.asn1.fromDer(certFile))
      }
      if (!certObj?.subject) return null
      // if (certObj?.subject === null) return null
      const subject = certObj.subject.attributes.reduce((acc, attr) => {
        acc[attr.name] = attr.value
        return acc
      }, {})
      const issuer = certObj.issuer.attributes.reduce((acc, attr) => {
        acc[attr.name] = attr.value
        return acc
      }, {})
      const validity = {
        notBefore: certObj.validity.notBefore.toLocaleDateString(),
        notAfter: certObj.validity.notAfter.toLocaleDateString()
      }
      return { subject, issuer, validity }
    },
    // handleChangeFileList (file, fileList, bindName) {
    //   // bindName = fileList
    //   this[bindName] = fileList
    //   console.log(bindName)
    // },
    handleOpenCertif () {
      this.isOpenCertif = true
    }
  },
  data () {
    return {
      isUploadBtn: false,
      certifFile: [],
      certifGridData: [],
      isOpenCertif: false,
      certifGrid: [
        { binding: 'a', header: this.$v('인증서 명') },
        { binding: 'b', header: this.$v('도메인') },
        { binding: 'c', header: this.$v('시작일') },
        { binding: 'd', header: this.$v('만료일') },
        { binding: 'e', header: this.$v('발행기관') },
        { binding: 'f', header: this.$v('삭제'), customHtml: true }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
 .certi-edit-from__btn--file-upload {
  display: inline-block;
  .file-upload-btn {
    margin-top: 10px;
    margin-bottom: 20px;
    width: 100px;
    padding: 0px;
  }
 }

 .use-content-container {
  margin-right: 20px;
 }
 .no-file-text {
  display: inline-block;
  color: $gray;
  margin-top: 10px;
 }
 .fileup-btn-container {
    margin-top: 10px;
 }
 .filelist-container {
  width: 650px;
 }
  .list-open {
    margin-top: 10px;
    margin-bottom: 20px;
  }

  .grid-title {
    margin-bottom: 10px;
    font-size: 14px;
  }
  .network-certif-grid-table{
  &::v-deep .wj-row:hover {
    svg * {
      fill: $danger;

    }
    [width="5"] {
        fill: none;
        stroke: $danger;
    }
  }
}
</style>
