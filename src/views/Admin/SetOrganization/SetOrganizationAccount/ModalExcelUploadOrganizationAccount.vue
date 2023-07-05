<template>
  <div
    v-loading="loadingExcel"
    class="modal-excel-upload-organacc-content"
  >
    <section
      class="modal-body"
    >
      <div>
        <div class="btn-container--flex excelup-toolbar">
          <div class="button-area -left">
            <button
              class="button"
              @click="handleClickForDownloadLastedFile"
            >
              <!-- 최신 조직-계정 파일 다운로드 -->
              {{ $v('최신 조직-계정 파일 다운로드') }}
              <download-icon style="position: relative; top: 3px" />
            </button>
            <span class="btn-sub-caption">{{ $v('* 데이터가 없는 경우 엑셀 양식이 다운로드 됩니다.') }}</span>
          </div>
          <div class="button-area -right">
            <el-upload
              action=""
              accept=".csv, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              :show-file-list="false"
              :auto-upload="false"
              :multiple="false"
              :on-change="handleClickForUploadFile"
            >
              <button
                class="button"
                type="is-black"
              >
                <!-- Excel 업로드 -->
                {{ $v('Excel 파일 업로드') }}
                <upload-icon style="position: relative; top: 3px" />
              </button>
            </el-upload>

            <button
              class="button"
              type="is-primary"
              :disabled="!selectRow || isDisabledRunBtn"
              @click="handleClickForRunTask(selectRow)"
            >
              <!-- 작업 실행 -->
              {{ $t('common.BTN.TASK.exec') }}
            </button>
          </div>
        </div>

        <div class="table-area">
          <cmp-grid
            :item-source="unregistExcelData"
            :columns="unregistColumns"
            @selectedRow="(row) => {
              selectRow = row ? row._data : null
            }"
            selectable
            :init-custom-action="(grid) => excelGrid = grid"
            :sort-keeping="{binding: 'index', asc: false}"
            paging-type="list"
            :height="500"
            @total-count="cnt => totalResultCnt = cnt"
            :init-auto-select-row="selectRow"
            init-auto-select-row-key="fileIdx"
          >
            <template #fileName="props">
              <file-down-component
                v-if="props.row.fileName"
                :file-name="props.row.fileName.split('.')[0]"
                :file-format="props.row.fileName.split('.')[1]"
                @click="handleClickForDownload(props.row)"
              />
            </template>
            <template #failCount="props">
              <cmp-status-tag
                :type="'is-using'"
                v-if="props.row.fileStatus=== 'DONE'"
              >
                {{ $t('config.TRANSFER.allSuccess') }}
              </cmp-status-tag>
              <span />
              <span
                v-if="props.row.fileStatus=== 'READY'"
              >
                -
              </span>
              <cmp-status-tag
                v-if="props.row.fileStatus=== 'VALID' || props.row.fileStatus=== 'RUN'"
                :type="'is-ing'"
              >
                {{ $v('작업 실행 중') }}
                <i class="icon-status__running el-icon-loading" />
              </cmp-status-tag>

              <a
                v-if="props.row.fileStatus=== 'FAIL' || props.row.fileStatus=== 'VALID_FAIL'"
                class="link-job-history__fail"
                @click.self.prevent="handleClickForOpenModalFailResource(props.row)"
              >{{ $v('작업 실패') }}({{ $v('총') }} {{ props.row.failCount }}{{ $v('개') }} )</a>
            </template>
          </cmp-grid>
        </div>
      </div>
    </section>
    <section class="modal-footer modal-button-area">
      <button
        class="button -modal-button"
        type="is-anti"
        @click="e => {
          $emit('close')
          unregistExcelModal = false
        }"
      >
        <!-- 닫기 -->
        {{ $t('common.BTN.close') }}
      </button>
    </section>
    <el-dialog
      :visible="isOpenedModalFailResource"
      :title="$v('Excel 파일 업로드 및 검사')"
      class="modal-excel-upload-inspection"
      width="60vw"
      @close="isOpenedModalFailResource = false"
    >
      <div class="modal-excel-upload-inspection-container">
        <cmp-grid
          :item-source="inspectionErrResultGridData"
          :loading="loadingExcel"
          :columns="inspectionColumns"
        >
          <template #failMessage="props">
            <span v-if="true">{{ $t(`admin.ExcelErrORG.${props.row.code}`) }}</span>
            <span v-if="props.row.rows.length===0">{{ $v('관리자에게 문의해 주세요.') }}</span>
          </template>
          <template #rows="props">
            <a
              v-if="props.row.rows.length"
              class="link-job-history__fail"
              @click="handleClickOpenFailRowsDetail(props.row)"
            >{{ $v('작업 실패') }}({{ $v('총') }} {{ props.row.rows.length }} {{ $v('개') }})</a>
            <span v-else> - </span>
          </template>
        </cmp-grid>
      </div>
      <section class="modal-footer">
        <div class="modal-button-area">
          <button
            class="button -modal-button"
            @click="isOpenedModalFailResource = false"
            type="is-primary"
          >
            {{ $v('확인') }}
          </button>
        </div>
      </section>
    </el-dialog>
    <!-- 실패자원 행 모달팝업 -->
    <el-dialog
      :visible="isOpenedModalFailRows"
      @close="isOpenedModalFailRows=false"
      :width="'50vw'"
      :title="$v('오류 대상 행 번호')"
    >
      <div class="modal-unregiresource-container">
        <div class="number-card-list">
          {{ selectedRowErrorRows }}
          <!-- {{ props.row }} -->
        </div>
      </div>
      <section class="modal-button-area">
        <button
          class="button"
          type="is-primary"
          @click="isOpenedModalFailRows=false"
        >
          {{ $v('확인') }}
        </button>
      </section>
    </el-dialog>
    <!-- --------------------------------------- -->
  </div>
</template>

<script>
import API from '@/components/Apis/new-api/IAM'
// import XLSX from 'xlsx'
// import FileDownComponent from '@/components/FileDownComponent/FileDownComponent'
import UploadIcon from '@/components/Icons/UploadIcon.vue'
import DownloadIcon from '@/components/Icons/DownloadIcon.vue'
// import { cloneDeep } from 'lodash'
// import CmpStatusTag from '@/components/cmp-components/CmpStatusTag.vue'

export default {
  name: 'ModalExcelUploadOrganizationAccount',
  components: { UploadIcon, DownloadIcon },
  // SECTION - props
  props: {
    // 프롭이 존재하지 않습니다.
  },
  async created () {
    await this.setGridExcelList()
    if (this.interval) clearInterval(this.interval)
    this.excelFileRunInterval()
  },
  beforeDestroy () {
    clearInterval(this.interval)
  },
  computed: {
    isDisabledRunBtn () {
      return this.unregistExcelData.some((el) => {
        return el.fileStatus === 'RUN' || el.fileStatus === 'VALID'
      })
    }
  },
  // !SECTION
  // SECTION - methods
  methods: {
    /* ------------------------------- SECTION 공통 ------------------------------- */
    /** API_HANDLER - 조회 > 엑셀 파일 리스트 */
    async getExcelList () {
      try {
        this.loadingExcel = true
        let result = await API.iam.getListOrganAccExcel()
        result = result.map((el) => ({
          ...el,
          createTime: `${el.createTime.splice(0, 3).join('.')}`
        }))
        console.log('@getEcelList:', result)
        return result
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.$alert(message)
      } finally {
        this.loadingExcel = false
      }
    },
    /** 엑셀파일을 미등록 엑셀 파일 리스트(그리드)에 세팅 */
    async setGridExcelList () {
      this.unregistExcelData = await this.getExcelList()
      this.$forceUpdate()
    },
    /** a 태그 생성 및 클릭이벤트 발생
     ** 파일을 다운로드 하기위해파일 링크 돔을 생성하고 클릭이벤트를 발생
     * @param {Blob} file
     * @param {string} fileName
     **/
    createTagForDownload (file, fileName) {
      const fileObjectUrl = window.URL.createObjectURL(file)
      const link = document.createElement('a')

      link.href = fileObjectUrl
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },
    /**
     * 미등록 Excel 파일 리스트 인터벌
     */
    excelFileRunInterval () {
      if (this.interval) clearInterval(this.interval)
      this.interval = setInterval(async () => {
        this.setGridExcelList()
      }, 10000)
    },
    /* -------------------------------- !SECTION -------------------------------- */
    /* ---------------------------- SECTION 행 번호 전체보기 --------------------------- */
    // EVENT_HANDLER 모달오픈 > 행 번호 보기
    handleClickOpenFailRowsDetail (row) {
      console.log('@handleClickOpenFailRowsDetail')
      this.selectedRowErrorRows = row.rows
      this.isOpenedModalFailRows = true
    },
    /* -------------------------------- !SECTION -------------------------------- */

    /* ------------------------- SECTION - 실행 실패 행 모달 오픈 ------------------------ */
    /** EVENT_HANDLER - 모달오픈 > 실패 행과 사유를 그리드로 보여주는 모달팝업
     * @param {object}row 그리드의 로우 오브젝트
     */
    async handleClickForOpenModalFailResource (row) {
      try {
        const response = await this.getEachOrganAccExcel(row.fileIdx)

        this.loadingExcel = true
        this.inspectionErrResultGridData = []

        if (response) {
          this.isOpenedModalFailResource = true
          this.inspectionErrResultGridData = response
        }
      } catch (error) {
        this.$alert(error.message)
      } finally {
        this.loadingExcel = false
      }
    },
    /** API_HANDLER - 조회 > 엑셀 파일 개별
     * @param {Number}index 엑셀 리스트에 fileIndex
     */
    async getEachOrganAccExcel (index) {
      try {
        console.log('@getEachOrg아nAccExcel')
        const result = await API.iam.getEachOrganAccExcel(index)
        return result.fileErrorHistories
      } catch (error) {
        throw this.$v('엑셀 파일을 조회할 수 없습니다.')
      }
    },
    /* ------------------------------ !SECTION ------------------------------ */

    /* ---------------------------- SECTION - 엑셀 업로드 ---------------------------- */
    // EVENT_HANDLER -  업로드 > 엑셀파일 파일
    async handleClickForUploadFile (file) {
      try {
        this.loadingExcel = true
        console.log('@handleClickForUploadFile')
        await this.checkUploadedExcelFileSize(file)
        await this.uploadExcel(file)
        await this.setGridExcelList()
      } catch (error) {
        this.$alert(this.$v(`${error.message}`, { size: '100Mb' }))
        return new Error(error)
      } finally {
        this.loadingExcel = false
      }
    },
    /**
    * API_HANDLER - 업로드 > 조직-계정 Excel 파일
    * @param {object}file - 엑셀 파일
    */
    async uploadExcel (file) {
      try {
        // 해당 파일을 업로드하시겠습니까?<br>파일명 :
        const test = await this.$confirm(`${this.$t('common.CONFIRM.NETWORK.005')}<br>${this.$t('common.GRID.COMPUTE.fileName')}: ${file.name}`, { dangerouslyUseHTMLString: true })
          .then(async (data) => true).catch(() => false)

        if (test) {
        // formdata 구성
          const fileForm = new FormData()
          fileForm.append('file', file.raw)

          await API.iam.uploadOrganAccExcel(fileForm)
          console.log('@uploadExcel: 성공적으로 업로드를 하였습니다.')
        }
      } catch (error) {
        console.error(error)
        return new Error('업로드를 실패하였습니다.')
      } finally {
      }
    },
    /** 파일의 사이즈를 사이즈를 체크합니다.
     ** 파일이 너무 크면 업로드 할 수 없습니다.
     * @param {object} file
     */
    async checkUploadedExcelFileSize (file) {
      try {
        console.log('file.size', file.size)
        if (file.size > (1024 * 1024 * 100)) { // 100Mb 이하 파일만 업로드 가능
          throw new Error('파일 크기가 너무 큽니다.')
        } else return true
      } catch (error) {
        throw new Error(error)
      }
    },

    /* -------------------------------- !SECTION -------------------------------- */

    /* ------------------------- SECTION - 최신 조직-계정 다운로드 ------------------------ */
    /** EVENT_HANDLER - 다운로드 > 최신 조직-계정 파일 */
    async handleClickForDownloadLastedFile () {
      try {
        this.loadingExcel = true
        console.log('@handleClickForDownloadLastedFile')
        const lastedOrganAccExcel = await this.downloadLastedOrganAccExcel()
        const fileName = '최신 조직-계정.xlsx'
        this.createTagForDownload(lastedOrganAccExcel.data, fileName)
      } catch (err) {
        return err
      } finally {
        this.loadingExcel = false
      }
    },
    /** API_HANDLER - 다운로드 > 최신 조직계정 Excel 파일 다운로드  */
    async downloadLastedOrganAccExcel () {
      try {
        const response = await API.iam.downloadLastedOrganAccExcel()
        console.log(response)
        return response
      } catch (error) {
        throw new Error(error)
      }
    },
    /* -------------------------------- !SECTION -------------------------------- */

    /* ------------------------------ SECTION 작업실행 ------------------------------ */
    /** EVENT_HANDLER - 실행 > 엑셀 파일 작업  */
    async handleClickForRunTask (row) {
      try {
        this.loadingExcel = true
        const testData = await this.getExcelList() // 작업실행 전 - 실행 중인 작업이 있는지 확인
        const values = ['RUN', 'VALID']
        const isExistRun = await this.checkTheValuesForList(testData, 'fileStatus', values)

        if (!isExistRun) { await this.runTaskOrganAccExcel(row) }
      } catch (error) {
        return false
      } finally {
        this.loadingExcel = false
      }
    },
    /** 리스트에서 valuese배열값을 하나라도 찾으면 true
     * @param {object}list
     * @param {Array}values
    */
    async checkTheValuesForList (list, key, values) {
      return list.some((i) => values.some(el => i[key] === el))
    },
    // API_HANDLER - 실행 > excel의 fileIdx로 작업 실행
    async runTaskOrganAccExcel (row) {
      console.log('@runTaskOrganAccExcel:', row)
      try {
        if (!row) return
        // 선택한 파일의 자원에 대한<br>작업을 실행하시겠습니까?
        this.$confirm(this.$t('common.CONFIRM.COMP.004'), { dangerouslyUseHTMLString: true })
          .then(async () => {
            const fileIdx = row.fileIdx
            if (!fileIdx) return

            await API.iam.runTaskOrganAccExcel(fileIdx).then(async () => {
              console.log(`${fileIdx} 작업 실행했습니다.`)
            }).catch((error) => { throw new Error(JSON.stringify(error)) })
            setTimeout(async () => { await this.setGridExcelList() }, 200)
          })
          .catch(() => false)
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.$alert(message)
        return []
      }
    },
    /* -------------------------------- !SECTION -------------------------------- */

    /* ----------------------- SECTION 조직계정 Excel 다운로드 ----------------------- */
    /** EVENT_HANDLER - 다운로드 > 조직계정 Excel 파일  */
    async handleClickForDownload (row) {
      try {
        this.loadingExcel = true
        console.log('@handleClickForDownload')
        await this.downloadEachOrganAccExcel(row)
      } catch (error) {
        return error
      } finally {
        this.loadingExcel = false
      }
    },

    /**
     * API_HANDLER - 다운로드 > 조직계정 개별 Excel 파일
     */
    async downloadEachOrganAccExcel (row) {
      try {
        if (row.fileIdx === null || row.fileIdx === undefined) return

        // 선택하신 파일을 다운로드 하시겠습니까?
        const isConfirmed = await this.$confirm(this.$t('common.CONFIRM.NUTA.002')).then(() => true)
          .catch(() => false)

        if (isConfirmed) {
          console.log('개별 파일 다운로드를 진행합니다.')
          const response = await API.iam.downloadEachOrganAccExcel(row.fileIdx)
          this.createTagForDownload(response.data, `${row.fileName}`)
        }
      } catch (error) {
        console.log(error)
        throw error
      } finally {
      }
    }
    /* -------------------------------- !SECTION -------------------------------- */
  },
  /** !SECTION */
  // SECTION - data()
  data () {
    return {
      inspectionErrResultGridData: [],
      unregistExcelData: [], // grid Data
      selectRow: null, // 선택한 row,
      selectedRowErrorRows: [],
      interval: null,
      totalResultCnt: 0,

      loadingExcel: false,
      excelSheetList: {},
      isOpenedModalFailResource: false,
      isOpenedModalFailRows: false,
      unregistColumns: [
        { binding: 'fileName', header: '파일명', align: 'left', customHtml: true, width: '*', keyPath: 'common.GRID.COMPUTE.fileName' },
        { binding: 'failCount', header: this.$v('작업 결과'), width: 300, customHtml: true },
        { binding: 'createTime', header: '생성일', customHtml: true, width: 170, keyPath: 'common.GRID.createDate' }
      ],
      inspectionColumns: [
        { binding: 'sheetType', header: this.$v('시트'), width: 200, customHtml: true },
        { binding: 'failMessage', header: this.$v('오류 내용'), width: '*', customHtml: true },
        { binding: 'rows', header: this.$v('오류 대상 행 번호'), width: 200, customHtml: true }
      ],
      basketData: [] // 타 최고 관리자 계정의 이관 장바구니 내 자원들 중 network => L4/L7 으로 분리 처리된 data
    }
  }
}
</script>

<style lang="scss" scoped>
.modal-excel-upload-organacc-content {
  .modal-body {
    height: 570px;
    .btn-container--flex.excelup-toolbar {
      display: flex;
      .button-area {
        &.-left {
          .btn-sub-caption {
            font-size: 12px;
            display: flex;
            align-items: flex-end;
            margin-left: 10px;
            color: $gray
          }
        }
        &.-right {
            margin-left: auto;
           & > * {
           margin-right: 10px;
           }
        }
      }
    }
  }
  .modal-excel-upload-inspection {
    .modal-excel-upload-inspection-container {
      .modal-excel-upload-inspection-tool {
        display: flex;
        justify-content: flex-end;
        .excel-upload-inspection-btn {
          display: flex;
          margin-left: 20px;
        }
        margin-bottom: 20px;
      }

    }
  }
  .link-job-history__fail {
    color: $main-red;
    text-decoration-line: underline;
  }
  .modal-unregiresource-container {

  .number-card-list {
    display: flex;
    background-color: #070a20;
    border-radius: 8px;
    padding: 12px;
    min-height: 200px;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-content: flex-start;
    max-height: 60vh;
    overflow-y: scroll;
  }
}
}
</style>
<style lang="scss">
  .table-area {
    #cmpGrid {
      .wj-cell > div {
        white-space: break-spaces;
      }
    }
  }
</style>
