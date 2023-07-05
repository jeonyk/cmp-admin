<template>
  <div
    class="uploaded-documents-wrapper"
    v-if="show && (planFiles.length || reportFiles.length)"
  >
    <button
      class="button -pdf-download"
      type="is-icon"
      style="display: none"
    >
      <pdf-download
        ref="pdfDownload"
        capture-el=".approval-apply-document"
        :file-name="reportName"
        file-background-color="#fff"
      />
    </button>
    <h2 class="task-common-title">
      <span>{{ $v('첨부파일') }}</span>
    </h2>

    <register-contents
      v-if="planFiles.length"
      class="border-top"
      :title="$v('사전협의 첨부파일')"
    >
      <file-down-component
        v-for="(doc, idx) in planFiles"
        :key="idx"
        :file-name="doc.title"
        @click="download(doc)"
      />
      <!-- :url="data.fileUrl" -->
    </register-contents>

    <register-contents
      v-if="reportFiles.length"
      :title="$v('할 일 첨부파일')"
    >
      <file-down-component
        v-for="(doc, idx) in reportFiles"
        :key="idx"
        :file-name="doc.title"
        @click="download(doc)"
      />
    </register-contents>
    <div style="position:absolute; width:100%; left:200%;">
      <h1>
        {{ reportName }}
      </h1>
      <article
        class="document-preview approval-apply-document"
        style="padding: 50px; background: #fff; color: #000; border-radius: 4px"
      />
    </div>
  </div>
</template>

<script>
import API, { FileDownComponent } from '@sd-fe/cmp-core'
import Dayjs from 'dayjs'
export default {
  name: 'UploadedDocuments',
  components: { FileDownComponent },
  props: {
    data: {
      type: Array,
      default: () => []
    },
    isTestMode: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    show () {
      return ['done-detail', 'done-aws-detail'].includes(this.$route.name) // [한일] 일때만 보여주기
    }
  },
  watch: {
    data () {
      this.setUplodedFiles(this.data)
    }
  },
  created () {
    this.setUplodedFiles(this.data)
  },
  methods: {
    async downloadFile (downloadFile) {
      await this.getReaOnlyDocument(downloadFile)
      this.previewHandler()
    },
    async getReaOnlyDocument (downloadFile) {
      const { title, jsonData, lastModifiedAt } = downloadFile
      try {
        this.reportName = title + '_' + Dayjs(lastModifiedAt).format('YYYY-MM-DD')
        document.querySelector('.document-preview').innerHTML = jsonData
      } catch (error) {
        console.error('@@ DocumentWorkDetail > getReaOnlyDocument', error)
      }
    },
    async previewHandler () {
      this.$refs.pdfDownload.confirmForSavingPDF()
    },
    setUplodedFiles (data = this.data) {
      // console.log(this.data)
      if (!data.length) return

      const planFiles = []
      const reportFiles = []

      for (const {
        planDocument, // 사전협의 보고서
        reportDocument, // 할일 보고서
        planApproval, // 사전협의 결재
        reportApproval // 사전협의 결재
      } of data) {
        const format1 = this.setDocumentFormat({ approval: planApproval, document: planDocument })
        planFiles.push(format1)

        const format2 = this.setDocumentFormat({ approval: reportApproval, document: reportDocument })
        reportFiles.push(format2)
      }

      // console.log(planFiles.flat(2), reportFiles.flat(2))
      this.planFiles = planFiles.flat(2)
      this.reportFiles = reportFiles.flat(2)
    },
    /**
     * 형식 설정
     * @param {Object|null} approval 결재 ON 일때 Object,   결재 OFF 일때 null (attatchFiles 는 선택이므로 배열에 없을수 있음)
     * @param {Object|null} document 보고서 ON 일때 Object,  결재 OFF 일때, 보고서 OFF 일때 null
     *
     * ** 결재랑 보고서는 별개이며, 의존 관계가 아님
     * - 결재 ON + 보고서 ON :: approval = {...}, document = {...}
     * - 결재 ON + 보고서 OFF :: approval = {...}, document = null
     * - 결재 OFF + 보고서 OFF :: approval = null, document = null
     */
    setDocumentFormat ({ approval, document }) {
      let files = []

      if (approval) {
        const { approvalNo, approvalType, attachFiles } = approval
        // console.log(approval, document)

        // 결재 ON + 보고서 OFF 인 경우 => 첨부파일만 있는경우
        const attatches = attachFiles?.map(file => ({ type: 'FILE', approvalType, approvalNo, ...file })) // 추가 파일인 경우
        files = [...attatches]
      }

      if (document) {
        // 결재 ON + 보고서 ON 인 경우 => 첨부파일 + 결재 보고서 있는 경우
        const docs = document ? [{ ...document, type: 'DOCUMENT', fileName: document.title }] : null
        files.push(docs)
      }

      return files
    },

    /**
     * 다운로드 분기처리
     */
    async download ({ type, ...file }) {
      if (type === 'FILE') {
        this.getDocument(file)
      } else {
        this.downloadFile(file) // type === 'DOCUMENT '
      }
      // 🟨🟨🟨🟨🟨🟨 여기를 수정하시면 될것 같아요 🟨🟨🟨🟨🟨🟨
      // if (type === 'FILE') return this.$emit('click', file)
      // else this.getDocument(file)
    },

    /**
     * 결재 첨부파일 다운로드
     * @param file
     */
    async getReveiwFile ({ fileName, approvalNo }) {
      try {
        const params = { fileName, approvalNo }
        const response = await API.work_v3.downloadAttachedFile(params)

        const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }))
        const link = document.createElement('a')

        link.href = url
        link.setAttribute('download', fileName)
        document.body.appendChild(link)
        link.click()
      } catch (error) {
        console.error('@@ UploadedDocuments > download', error)
        this.$alert('다운로드 실패')
      }
    },

    /**
     * 결재 보고서 다운로드
     */
    getDocument (file) {
      console.log(file)
    }
  },
  data: () => ({
    fileList: [],
    reportName: '나는  노굴맨',
    planFiles: [],
    reportFiles: []
  })
}
</script>

<style lang="scss" scoped>
.uploaded-documents-wrapper {
  margin-top: 50px;
}

.border-top {
  margin-top: $gap;
  border-top: 2px solid $dark-slate;
}

  .file {
    position: relative;
    line-height: 32px;
    display: inline-block;
    max-width: 250px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid $main-red;
    width: inherit;

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .el-icon-document {
      height: 32px;
      width: 15px;
      display: inline-block;
      margin-right: 3px;
      &::before {
        content: '';
        position: absolute;
        top: 10px; left: 0;
        width: 13px; height: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: url('../../assets/images/icon-clip.png') no-repeat;
        background-size: contain;
      }
    }
  }
</style>
