<template>
  <div class="unregister-resource-list">
    <section
      class="modal-body"
    >
      <g-tab
        :data="tabData"
        @click="clickTab"
        :padding-top="20"
        v-loading="loading.getList || loading.download"
      >
        <template
          v-for="(data, idx) in tabData"
          v-slot:[data.field]
        >
          <div
            :key="idx"
            style="min-height: 300px;"
          >
            <div class="button-area -right">
              <button
                class="button"
                @click="fileFormDownload(data)"
              >
                <!-- Excel 파일 양식 다운로드 -->
                {{ data.name + ' - ' + $t('common.BTN.excelFileFormDownload') }}
                <download-icon style="position: relative; top: 3px" />
              </button>
              <el-upload
                style="margin: 0 10px;"
                action=""
                accept=".csv, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                :show-file-list="false"
                :auto-upload="false"
                :multiple="false"
                :on-change="confirmUpload"
              >
                <button class="button">
                  <!-- Excel 업로드 -->
                  {{ $t('common.BTN.excelUpload') }}
                  <upload-icon style="position: relative; top: 3px" />
                </button>
              </el-upload>
              <button
                class="button"
                type="is-primary"
                :disabled="!selectRow"
                @click="excuteExcelVm(selectRow)"
              >
                <!-- 작업 실행 -->
                {{ $t('common.BTN.TASK.exec') }}
              </button>
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
                :sort-keeping="{binding: 'createTime', asc: false}"
                paging-type="list"
                :height="500"
                @total-count="cnt => totalResultCnt = cnt"
                :init-auto-select-row="selectRow"
                init-auto-select-row-key="fileIdx"
              >
                <template #orgFileName="props">
                  <file-down-component
                    v-if="props.row.orgFileName"
                    :file-name="props.row.orgFileName.split('.')[0]"
                    :file-format="props.row.orgFileName.split('.')[1]"
                    @click="downloadFile(props.row)"
                  />
                </template>
                <template #runFailRowNum="props">
                  <span
                    v-if="props.row.runFailRowNum === '[]'"
                  >
                    {{ $t('config.TRANSFER.allSuccess') }}
                  </span>
                </template>
              </cmp-grid>
            </div>
          </div>
        </template>
      </g-tab>
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
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import XLSX from 'xlsx'
import UploadIcon from '@/components/Icons/UploadIcon.vue'
import DownloadIcon from '@/components/Icons/DownloadIcon.vue'
// import ResourceTitle from './ResourceTitle'
import { getUnregistersVms, getUnregistersVolumeGroups, getUnregistersVrserver, getUnregistersCsvrserver, getUnregistersgroup, getUnregistersDatabase } from './ResourceOperationGetAll'
import { mapState } from 'vuex'

export default {
  name: 'UnregisterResourceList',
  components: { UploadIcon, DownloadIcon },
  props: {
    userData: {
      type: Object,
      default: () => {}
    },
    otherTransBasketData: { // 타 최고 관리자 계정의 이관 장바구니 내 자원들
      type: Object,
      default: () => {}
    }
  },
  async created () {
    if (this.packageType !== 'ENT') this.tabData.splice(1, 1)
    await this.getExcelList()

    if (this.interval) clearInterval(this.interval)
    this.excelFileExcInterval()
    // console.log(this.otherTransBasketData)
    this.separateNetwork(this.otherTransBasketData)
  },
  beforeDestroy () {
    clearInterval(this.interval)
  },
  computed: {
    ...mapState({
      packageType: state => state.auth.packageType
    })
  },
  methods: {
    async clickTab (item) {
      this.unregistExcelData = []
      this.activeTab = item
      this.selectRow = null
      await this.getExcelList()
    },
    /**
     * 업로드 된 미등록 자원 excel 리스트 조회
     */
    async getExcelList () {
      try {
        this.loading.getList = true
        this.isGetUnregistVmExcel = true
        let excelList = []

        const response = await API.work.getExcelList({
          userId: this.userData.userId,
          workType: this.activeTab.workType
        })
        if (response.list?.length > 0) excelList = response.list

        if (excelList.length > 0) {
          const data = excelList.map(item => { return { ...item, createTime: this.$options.filters.date(item.createTime) } })
          this.unregistExcelData = data
          console.log('unregistExcelData', this.unregistExcelData)
          this.gridRefresh(this.excelGrid)
        } else {
          this.unregistExcelData = []
        }
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.$alert(message)
        this.isGetUnregistVmExcel = false
        this.unregistExcelData = []
      } finally {
        this.isGetUnregistVmExcel = false
        this.loading.getList = false
      }
    },
    /**
    * 미등록 vms Excel 파일 업로드
    */
    async uploadExcel (file, fileList) {
      try {
        this.loading.getList = true

        // [22.05.26] 파일명 중복 되도 기능상 문제 없음.
        // const map = (arr, key) => {
        //   const data = arr.map(item => { return item[key] })
        //   return data
        // }
        // const excelFileNameList = map(this.unregistExcelData, 'orgFileName')
        // if (excelFileNameList.includes(file.name)) return this.$alert(this.$t('config.TRANSFER.sameFileName'))

        // formdata 구성
        const fileForm = new FormData()
        fileForm.append('file', file.raw)
        console.log(fileForm)

        const result = await API.work.uploadUnregistExcelFile(fileForm, {
          userId: this.userData.userId,
          workType: this.activeTab.workType
        })
        if (result) {
          await this.getExcelList()
        }
      } catch (error) {
        console.error(error)
      } finally {
        this.loading.getList = false
      }
    },
    /**
     * 업로드 직전에 발생 이벤트
     */
    confirmUpload (file, fileList) {
      if (file.size > (1024 * 1024 * 100)) { // 100Mb 이하 파일만 업로드 가능
        return this.$alert(this.$t('common.ALERT.PROJECT.059', { size: '100Mb' }))
      }

      console.log('@confirmUpload', file, fileList)
      // 해당 파일을 업로드하시겠습니까?<br>파일명 :
      this.$confirm(`${this.$t('common.CONFIRM.NETWORK.005')}<br>${this.$t('common.GRID.COMPUTE.fileName')}: ${file.name}`, { dangerouslyUseHTMLString: true })
        .then(async () => {
          await this.uploadExcel(file, fileList)
        })
        .catch(() => false)
    },

    /**
     * 미등록 vms excel 작업 실행
     */
    excuteExcelVm (row) {
      console.log('@excuteExcelVm:', row)
      try {
        if (!row) return
        // 선택한 파일의 자원에 대한<br>작업을 실행하시겠습니까?
        this.$confirm(this.$t('common.CONFIRM.COMP.004'), { dangerouslyUseHTMLString: true })
          .then(async () => {
            const fileIdx = row.fileIdx
            if (!fileIdx) return
            this.loading.getList = true

            const res = await API.work.excuteExcelVm(fileIdx)
            if (res.result) {
              this.$alert(this.$t('config.TRANSFER.jobIsDone')).then(async () => {
                await this.getExcelList()
              })
            } else {
              // 작업 실패했습니다.
              this.$alert(this.$t('common.ALERT.CONF.023'))
            }
          })
          .catch(() => false)
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.$alert(message)
        return []
      }
    },
    gridRefresh (grid) {
      if (!grid) return
      const cv = grid.collectionView
      if (!cv) return
      cv.refresh()
    },
    /**
     * 미등록 자원 Excel 파일 리스트 인터벌
     */
    excelFileExcInterval () {
      if (this.interval) clearInterval(this.interval)
      this.interval = setInterval(async () => {
        await this.getExcelList()
      }, 10000)
    },
    /**
     * Excel 파일 다운로드
     */
    downloadFile (row) {
      if (row.fileIdx === null || row.fileIdx === undefined) return

      // 선택하신 파일을 다운로드 하시겠습니까?
      this.$confirm(this.$t('common.CONFIRM.NUTA.002'))
        .then(() => window.location.assign(row.sourceUri))
        .catch(() => false)
    },
    /**
     * 타 최고 관리자 계정의 이관 장바구니 내 자원들 중 network => L4/L7 으로 분리
     */
    separateNetwork (data) {
      if (data.network?.length > 0) {
        const result = data.network.reduce((acc, res) => {
          if (!acc[res.workType.toLowerCase()]) {
            acc[res.workType.toLowerCase()] = []
          }
          acc[res.workType.toLowerCase()].push(res)
          return acc
        }, {})
        delete data.network
        this.basketData = Object.assign(data, result)
      } else {
        this.basketData = data
      }
      console.log('@separateNetwork: basketData:', this.basketData)
    },
    /**
     * 타 최고 관리자 계정의 이관 장바구니 내 자원들 제외
     */
    deleteAddedResourceFromList (list, workType, basketData = this.basketData) {
      const uniqKey = {
        compute: 'vmUuid',
        storage: 'vgUuid',
        network_l4: 'vrserverIdx',
        network_l7: 'csVrserverIdx',
        security: 'groupIdx',
        database: 'databaseUuid'
      }[workType]

      const result = basketData[workType] ? list.filter(res => {
        return basketData[workType].findIndex(data => data.resourceId === res[uniqKey]) < 0
      }) : list
      return result
    },
    /**
     * Excel 양식 다운로드
     */
    async fileFormDownload (item) {
      console.log('@fileFormDownload: item:', item)
      try {
        // 미등록 자원 조회
        let unregistList = []
        if (item.workType === 'COMPUTE') {
          unregistList = await getUnregistersVms()
        } else if (item.workType === 'STORAGE') {
          unregistList = await getUnregistersVolumeGroups()
        } else if (item.workType === 'NETWORK_L4') {
          unregistList = await getUnregistersVrserver()
        } else if (item.workType === 'NETWORK_L7') {
          unregistList = await getUnregistersCsvrserver()
        } else if (item.workType === 'SECURITY') {
          unregistList = await getUnregistersgroup()
        } else if (item.workType === 'DATABASE') {
          unregistList = await getUnregistersDatabase()
        }

        // 조회된 미등록 자원에서 타 최고 관리자 계정의 이관 장바구니 내 자원들은 제외
        const filteredUnregistList = this.deleteAddedResourceFromList(unregistList, item.workType.toLowerCase())
        console.log(`미등록 ${item.workType} 자원 리스트:`, filteredUnregistList)

        if (filteredUnregistList.length > 0) {
          // 자원별 등록해야 할 excel column 조회
          let columns = await API.work.getExcelColumns(item.workType)
          columns = columns.map(col => {
            if (col.isInput || col.reqKey === 'resourceId' || col.reqKey === 'resourceName') return col
          }).filter(col => col)
          console.log('columns:', columns)

          // excel 리스트 데이터 만들기
          const unregistExcelList = filteredUnregistList.reduce((acc, rs) => {
            const obj = {}
            columns.forEach(col => {
              obj[col.reqKey] = rs[col.bindingKey]
            })
            acc.push(obj)
            return acc
          }, [])
          console.log('unregistExcelList:', unregistExcelList)

          // excel 만들기
          const wb = XLSX.utils.book_new() // 엑셀 파일 생성
          const ws = XLSX.utils.json_to_sheet(unregistExcelList, { header: [''] }) // 시트 생성 및 데이터 삽입
          console.log(wb, ws)
          // ws['!autofilter'] = { ref: ws['!ref'] } // 값 들어간 컬럼에 대한 autoFilter 기능 추가

          const range = XLSX.utils.decode_range(ws['!ref'])

          for (let c = range.s.c; c <= range.e.c; ++c) { // column
            for (let r = range.s.r; r <= range.e.r; ++r) { // row
              const ref = XLSX.utils.encode_cell({ r: r, c: c }) // cell 넘버: 'A1', 'B1' ...)

              if (r === 0) { // 헤더
                ws.freeze_panes = c
                const columnName = columns.find(col => col.reqKey === ws[ref].v)?.displayName
                ws[ref].v = columnName || ws[ref].v.toUpperCase()
                ws[ref].s = {
                  fill: {
                    patternType: 'solid',
                    fgColor: { rgb: 'FF000000' },
                    bgColor: { rgb: '815EFF' }
                  },
                  font: { sz: 14, bold: true, color: 'dddddd' }
                }
                // console.log(ws[ref])
              }
            }
          }
          console.log('@workSheet: ', ws)
          console.log('@range: ', range)

          XLSX.utils.book_append_sheet(wb, ws, `미등록 ${item.workType} 자원 리스트`) // 엑셀 파일에 시트 추가
          XLSX.writeFile(wb, `${item.workType}_${new Date().valueOf()}.xlsx`) // 엑셀 다운로드
        } else {
          // '미등록 자원이 없습니다.'
          this.$alert(this.$t('config.TRANSFER.noUnregisteredResoures'))
        }
      } catch (error) {
        this.$alert(this.$t('common.ALERT.BASE.071'), { // 파일 다운로드에 문제가 발생했습니다.<br>관리자 문의 바랍니다.
          dangerouslyUseHTMLString: true
        })
        console.error(error)
      } finally {

      }
    }
  },
  data () {
    return {
      tabData: [
        { field: 'compute', name: 'Compute', workType: 'COMPUTE' },
        { field: 'database', name: 'Database', workType: 'DATABASE' },
        { field: 'storage', name: 'Storage', workType: 'STORAGE' },
        { field: 'networkL4', name: 'Network_L4', workType: 'NETWORK_L4' },
        { field: 'networkL7', name: 'Network_L7', workType: 'NETWORK_L7' },
        { field: 'security', name: 'Security', workType: 'SECURITY' }
      ],
      activeTab: { field: 'compute', name: 'Compute', workType: 'COMPUTE' },
      unregistExcelData: [], // grid Data
      selectRow: null, // 선택한 row
      interval: null,
      totalResultCnt: 0,
      loading: {
        getList: false, // 리스트 조회
        download: false
      },
      unregistColumns: [
        { binding: 'orgFileName', header: '파일명', align: 'left', customHtml: true, keyPath: 'common.GRID.COMPUTE.fileName' },
        { binding: 'runTotal', header: '전체(개)', width: 100, keyPath: 'common.GRID.COMPUTE.totalCnt' },
        { binding: 'runSuccess', header: '성공 자원(개)', width: 100, keyPath: 'common.GRID.COMPUTE.successCnt' },
        { binding: 'runFail', header: '실패 자원(개)', width: 100, keyPath: 'common.GRID.COMPUTE.failCnt' },
        { binding: 'runFailRowNum', header: '실패 자원(행)', keyPath: 'common.GRID.COMPUTE.failRow', customHtml: true },
        { binding: 'createTime', header: '생성일', customHtml: true, width: 170, keyPath: 'common.GRID.createDate' }
      ],
      basketData: [] // 타 최고 관리자 계정의 이관 장바구니 내 자원들 중 network => L4/L7 으로 분리 처리된 data
    }
  }
}
</script>

<style lang="scss">
  .table-area {
    #cmpGrid {
      .wj-cell > div {
        white-space: break-spaces;
      }
    }
  }
</style>
