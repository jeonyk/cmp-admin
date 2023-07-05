<template>
  <div
    class="nx-unregister-resource-excel-upload"
    v-loading="loading.download"
  >
    <section class="modal-body">
      <div style="min-height: 300px;">
        <div class="button-area -right">
          <button
            class="button"
            @click="getServiceForm()"
          >
            {{ serviceName[service] + ' - ' + $v('Excel 파일 양식 다운로드') }}
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
            <button
              class="button"
              type="is-primary"
            >
              {{ $v('Excel 업로드') }}
              <upload-icon style="position: relative; top: 3px" />
            </button>
          </el-upload>
          <span class="divider" />
          <button
            class="button"
            type="is-primary"
            :disabled="!selectRow"
            @click="excuteUnregisterExcelItem(selectRow)"
          >
            {{ $v('작업 실행') }}
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
            init-auto-select-row-key="idx"
          >
            <template #orgFileName="{ row }">
              <file-down-component
                v-if="row.orgFileName"
                :file-name="row.orgFileName.split('.')[0]"
                :file-format="row.orgFileName.split('.')[1]"
                @click="downloadFile(row)"
              />
            </template>

            <template #runResult="{ row }">
              <span v-if="!row.runTotal">-</span>
              <span
                v-else-if="row.runTotal === row.runSuccess"
              >
                {{ $v('성공') }}
              </span>
              <span v-else>
                <a
                  @click.prevent.self="activeFailModal(row)"
                  class="text-button"
                >
                  {{ $v('작업실패') }} ({{ $v('총') }} {{ row.runFail }} {{ $v('건') }})
                </a>
              </span>
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
        {{ $v('닫기') }}
      </button>
    </section>
    <!-- 실패자원 행 모달팝업 -->
    <el-dialog
      :visible="isOpenedModalFailResource"
      @close="isOpenedModalFailResource=false"
      width="800px"
      :title="$v('실패 자원')"
    >
      <cmp-grid
        :item-source="runFailRows"
        :columns="[
          { binding: 'failIdx', header: $v('행 번호'), width: 100 },
          { binding: 'reason', header: $v('사유') }
        ]"
      />
      <section class="modal-button-area">
        <button
          class="button"
          type="is-anti"
          @click="isOpenedModalFailResource=false"
        >
          {{ $v('닫기') }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="downloadFailResources"
        >
          {{ $v('실패 자원 Excel 다운로드') }}
        </button>
      </section>
    </el-dialog>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import { mapState, mapGetters } from 'vuex'
import XLSX from 'xlsx'
import { maxBy, uniqBy, cloneDeep } from 'lodash'
import UploadIcon from '@/components/Icons/UploadIcon.vue'
import DownloadIcon from '@/components/Icons/DownloadIcon.vue'
import { getUnregistersVms, getUnregistersVolumeGroups, getUnregistersVrserver, getUnregistersCsvrserver, getUnregistersgroup, getUnregistersDatabase, getUnregisteredFileServerList } from '../SetProject/ResourceOperation/ResourceOperationGetAll'
import {
  setDataSampleSheet,
  setProjectListSheet,
  setNetworkCategorySheet,
  setGroupNameDepthSheet,
  setManageGroupSheet,
  setInstallProgramSheet,
  setSWLicenseSheet,
  setNXImageSheet,
  setVMwareImageSheet,
  setVMwareNetowkrInfoSheet,
  setVMwareClusterSheet,
  setUsablePolicySheet
} from './UnregisterCustomExcelSheet'

export default {
  name: 'UnregisterResourceExcelUpload',
  components: { UploadIcon, DownloadIcon },
  props: {
    service: { // 자원 서비스 타입
      type: String,
      default: 'COMPUTE',
      validator (value) {
        return ['COMPUTE', 'STORAGE', 'DATABASE', 'FILE_SERVER', 'VM', 'VSAN_ISCSI', 'NETWORK_L4', 'NETWORK_L7', 'SECURITY'].includes(value)
      }
    },
    otherRegistBasketData: { // 타 최고 관리자 계정의 이관 장바구니에 있는 자원들
      type: Object,
      default: () => {}
    },
    myRegistBasketData: { // 내 이관 장바구니에 있는 자원들 (이용 가능 미등록 방화벽 정책을 필터링 시 사용)
      type: Object,
      default: () => {}
    }
  },
  watch: {
    service: {
      immediate: true,
      async handler (val) { await this.getExcelList() }
    }
  },
  // async created () {
  //   if (this.interval) clearInterval(this.interval)
  //   this.excelFileExcInterval()
  // },
  beforeDestroy () {
    clearInterval(this.interval)
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      packageType: state => state.auth.packageType,
      allProjectList: state => state.project.allProjectList
    }),
    ...mapGetters({
      cloud: 'cloud/getCloud'
    })
  },
  methods: {
    /**
     * 엑셀 작업 실패한 자원 상세 보기 모달 open 등등..;
     */
    async activeFailModal (row) {
      const excelIdx = row?.idx
      if (!excelIdx) return

      try {
        const response = await API.work_v3.getExcelSheetWithMessage(excelIdx)
        const rows = response?.sheetRows || []
        this.runFailRows = rows.map(item => ({
          failIdx: item?.rowNo,
          reason: item?.failMessage || '',

          rowData: { ...item }
        }))

        this.isOpenedModalFailResource = true
      } catch (error) {
        const message = (error.response && error.response.data) ? error.response.data.message : error.message

        this.$alert(`${('실패 자원 자세히 보기 조회에 문제가 발생했습니다.')}<br><br>* ${message}`, {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
      }
    },
    /**
     * 업로드 된 미등록 자원 excel 리스트 조회
     */
    async getExcelList () {
      try {
        this.loading.getList = true
        this.isGetUnregistVmExcel = true
        let excelList = []

        const response = await API.work_v3.getUnregisterExcelList({
          userId: this.user.userId,
          service: this.service
        })
        if (response?.length > 0) excelList = response

        if (excelList.length > 0) {
          const data = excelList.map(item => {
            return {
              ...item,
              createTime: this.$options.filters.date(item.createTime)
            }
          })
          this.unregistExcelData = data
          // console.log('unregistExcelData', this.unregistExcelData)
          this.gridRefresh(this.excelGrid)
        } else {
          this.unregistExcelData = []
        }
      } catch (error) {
        console.error(error)

        this.$alert()
        this.isGetUnregistVmExcel = false
        this.unregistExcelData = []
        if (this.interval) clearInterval(this.interval)
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

        // formdata 구성
        const fileForm = new FormData()
        fileForm.append('file', file.raw)
        console.log('fileForm: ', fileForm)

        const result = await API.work_v3.uploadUnregisterExcelList(fileForm, {
          userId: this.user.userId,
          service: this.service
        })
        if (result) {
          this.$alert(this.$v('파일 업로드가 완료되었습니다.'), () => false)
          await this.getExcelList()
        }
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message

        this.$alert(`파일 업로드에 문제가 발생했습니다.<br><br>* ${message}`, {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
      } finally {
        this.loading.getList = false
      }
    },
    /**
     * 업로드 직전에 발생 이벤트
     */
    confirmUpload (file, fileList) {
      if (file.size > (1024 * 1024 * 100)) {
        return this.$alert(this.$v('{size} 이하의 파일을 올려주세요.', { size: '100Mb' }))
      }

      console.log('@confirmUpload', file, fileList)
      this.$confirm(`${this.$v('해당 파일을 업로드하시겠습니까?')}<br>${this.$v('파일명')}: ${file.name}`, { dangerouslyUseHTMLString: true })
        .then(async () => {
          await this.uploadExcel(file, fileList)
        })
        .catch(() => false)
    },

    /**
     * 미등록 vms excel 작업 실행
     */
    excuteUnregisterExcelItem (row) {
      console.log('@excuteUnregisterExcelItem:', row)
      if (!row) return
      this.$confirm(this.$v('선택한 파일 자원에 대한<br>작업을 실행하시겠습니까?'), { dangerouslyUseHTMLString: true })
        .then(async () => {
          try {
            const fileIdx = row.idx
            if (!fileIdx) return
            this.loading.getList = true

            this.getExcelList()
            await this.excelFileExcInterval()

            const { failRes } = await API.work_v3.excuteUnregisterExcelItem(fileIdx)
            if (!failRes?.length) {
              this.$alert(this.$v('작업이 완료되었습니다.')).then(async () => {
                this.$emit('refresh')
              })
            } else {
              this.$alert(this.$v('작업 실패했습니다.'), () => false)
            }
          } catch (error) {
            console.error(error)
            const message = (error.response && error.response.data) ? error.response.data.message : error.message
            this.$alert(this.$v('작업 실행에 문제가 발생했습니다.<br><br>') + `* ${message}`, {
              dangerouslyUseHTMLString: true,
              callback: () => false
            })
            return []
          } finally {
            this.getExcelList()
            if (this.interval) clearInterval(this.interval)
          }
        })
        .catch(() => false)
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

      this.$confirm(this.$v('선택하신 파일을 다운로드 하시겠습니까?'))
        .then(() => window.location.assign(row.sourceUri))
        .catch(() => false)
    },
    /**
     * 타 최고 관리자 계정의 이관 장바구니 내 자원들 제외
     */
    deleteAddedResourceFromList (list, workType, otherBasketData = this.otherRegistBasketData) {
      const uniqKey = {
        COMPUTE: 'vmUuid',
        STORAGE: 'vgUuid',
        DATABASE: 'databaseUuid',
        FILE_SERVER: 'shareUuid',
        VM: 'vmUuid',
        VSAN_ISCSI: 'vsanObjectUuid',
        NETWORK_L4: 'vrserverIdx',
        NETWORK_L7: 'csVrserverIdx',
        SECURITY: 'groupIdx'
      }[workType]

      const result = otherBasketData[workType] ? list.filter(res => {
        return otherBasketData[workType].findIndex(data => data.resourceIdx === res[uniqKey]) < 0
      }) : list
      return result
    },
    /**
     * [Excel 파일 양식 다운로드] 버튼 클릭 시, 미등록 자원을 조회 > excel 파일을 다운로드 합니다.
     */
    async getServiceForm () {
      try {
        const workType = this.service
        // 미등록 자원 조회
        let unregistList = []
        if (workType === 'COMPUTE') {
          unregistList = await getUnregistersVms()
        } else if (workType === 'STORAGE') {
          unregistList = await getUnregistersVolumeGroups()
        } else if (workType === 'DATABASE') {
          unregistList = await getUnregistersDatabase()
        } else if (workType === 'FILE_SERVER') {
          unregistList = await getUnregisteredFileServerList()
        } else if (workType === 'VM') {
          unregistList = await API.vmware.vm.getVmwareUnregisterVmList()
          // unregistList = await API.vmware.vm.getVmwareVmList() // cell merge 테스트..
        } else if (workType === 'VSAN_ISCSI') {
          unregistList = await API.vmware.vsan.getUnregisterVsanIscsiList()
        } else if (workType === 'NETWORK_L4') {
          unregistList = await getUnregistersVrserver()
        } else if (workType === 'NETWORK_L7') {
          unregistList = await getUnregistersCsvrserver()
        } else if (workType === 'SECURITY') {
          // 보안그룹의 경우 미등록 Excel 업로드가 좀 다름
          // 미등록 방화벽 정책 중 사용 가능한 목록(임시 보안그룹에 묶이지 않은 방화벽 정책s)만 조회하여 시트에 뿌려줌
          const policyList = await getUnregistersgroup() || []
          let usablePolicyList = policyList
          if (this.myRegistBasketData?.SECURITY?.length) {
            usablePolicyList = policyList.filter(pl => {
              return this.myRegistBasketData.SECURITY?.findIndex(data => data.policyIdxs.includes(pl.policyIdx)) < 0
            })
          }
          this.usablePolicyList = usablePolicyList
          unregistList = []
        }

        // 조회된 미등록 자원에서 타 최고 관리자 계정의 이관 장바구니 내 자원들은 제외
        const filteredUnregistList = this.deleteAddedResourceFromList(unregistList, workType)
        console.log(`미등록 ${workType} 자원 리스트:`, filteredUnregistList)

        if (filteredUnregistList.length > 0 || workType === 'SECURITY') {
          await this.excelDownload(filteredUnregistList, workType)
        } else {
          this.$alert(this.$v('미등록 자원이 없습니다.'))
        }
      } catch (error) {
        this.$alert(this.$v('파일 다운로드에 문제가 발생했습니다.<br>관리자 문의 바랍니다.'), {
          dangerouslyUseHTMLString: true
        })
        console.error(error)
      } finally {

      }
    },
    /**
     * 엑셀 파일 다운로드 (선택 서비스에 해당하는 헤더 정보를 바탕으로)
     */
    async excelDownload (data = [], service = this.service, mainSheetTitle) {
      this.loading.download = true

      const isFailResource = !!mainSheetTitle // 작업 실패 파일 엑셀 다운로드인지?

      // 자원별 등록해야 할 excel column 조회
      const headerData = await API.work_v3.getUnregisterExcelColumns({
        service: service.toUpperCase()
      })
      const headers = headerData?.headerList || []
      const mergeRanges = headerData?.mergeRanges || []
      this.excelColumns = headers

      const maxHeaderRow = maxBy(headers, 'row').row

      // 작업 실패 파일 엑셀 다운로드일 때, 마지막 컬럼에 failtMessage를 추가합니다.)
      if (isFailResource) {
        const newColumnColNum = this.excelLettersToNumber(headers[headers.length - 1].col)
        const newColumnCol = this.excelNumberToLetters(newColumnColNum)
        const failMessageCol = {
          bindingKey: 'failMessage',
          reqKey: 'failMessage',
          displayName: '실패 사유',
          col: newColumnCol,
          valueType: 'String',
          required: false
        }
        headers.push(failMessageCol)

        mergeRanges.push(`${newColumnCol}1:${newColumnCol}${maxHeaderRow}`)
      }

      const columns = uniqBy(headers, 'col')

      const contentMergeRange = [] // 헤더 제외, 리스트에 cell 머지 있는 경우
      let contentAllRowNum = maxHeaderRow + 1 // 헤더 제외, 리스트에 cell 머지 있는 경우 총 row 갯수를 카운트 하기 위함

      // excel 리스트 데이터 만들기
      const unregistExcelList = []
      data.forEach((rs, idx) => {
        const obj = {}
        columns.forEach(col => {
          // VM 네트워크 여러개 들어올 때 셀 merge
          if (service === 'VM' && rs.networkAdapterList?.length > 1) {
            const n = rs.networkAdapterList.length
            if (!['unitNumber', 'cateIdx', 'name'].includes(col.bindingKey)) {
              contentMergeRange.push(`${col.col}${contentAllRowNum}:${col.col}${contentAllRowNum + n - 1}`)
            }
          }

          // 들어오는 key와 엑셀 상 바인딩 키가 다를 경우, 맞춰준다.
          if (service === 'VM' && col.bindingKey === 'vmName') obj.vmName = rs.name
          else if (['NETWORK_L4', 'NETWORK_L7'].includes(service) && col.bindingKey === 'resourceId') {
            obj.resourceId = rs?.vrserverIdx || rs?.csVrserverIdx
          } else if (col.bindingKey === 'chargeDate') {
            obj.chargeDate = rs?.chargeDate || rs.createTime
          } else obj[col.reqKey] = rs[col.bindingKey]
        })

        // VM은 네트워크 여러개 들어올 수 있음.......
        // 머지 된 row만큼 contentAllRowNum 의 갯수도 올려준다.
        if (service === 'VM') {
          if (rs?.networkAdapterList?.length) {
            rs.networkAdapterList.forEach(net => {
              const vm = cloneDeep(obj)

              vm.name = net?.name || ''
              vm.unitNumber = net?.unitNumber || ''
              vm.cateIdx = net?.cateIdx || ''

              unregistExcelList.push(vm)
            })

            contentAllRowNum += rs.networkAdapterList.length
          } else {
            obj.name = ''
            obj.unitNumber = ''
            obj.cateIdx = ''

            unregistExcelList.push(obj)
            contentAllRowNum += 1
          }
        } else {
          unregistExcelList.push(obj)
          contentAllRowNum += 1
        }
      })

      // 데이터가 없을 떄 임의로 하나 추가
      if (!unregistExcelList?.length) {
        const obj = {}
        columns.forEach(col => {
          obj[col.reqKey] = ''
        })
        unregistExcelList.push(obj)
      }

      // 헤더 row의 최댓값만큼 엑셀 ROW 추가
      for (let i = 1; i < maxHeaderRow; i++) {
        const obj = {}
        columns.forEach(col => {
          obj[col.reqKey] = ''
        })
        unregistExcelList.unshift(obj)
      }

      // console.log('unregistExcelList:', unregistExcelList)

      // excel 만들기
      const wb = XLSX.utils.book_new() // 엑셀 파일 생성
      const ws = XLSX.utils.json_to_sheet(unregistExcelList, { header: [''] }) // 시트 생성 및 데이터 삽입
      // console.log(wb, ws)
      ws['!merges'] = this.getExcelMergeData([...mergeRanges, ...contentMergeRange])
      // ws['!autofilter'] = { ref: ws['!ref'] } // 값 들어간 컬럼에 대한 autoFilter 기능 추가

      // 헤더 세팅
      headers.forEach(headerInfo => {
        const headerTitle = headerInfo.displayName || headerInfo.bindingKey.toUpperCase()
        if (ws[headerInfo.col + headerInfo.row]) {
          ws[headerInfo.col + headerInfo.row].t = 's'
          ws[headerInfo.col + headerInfo.row].v = headerTitle
        }
      })

      const range = XLSX.utils.decode_range(ws['!ref'])

      for (let c = range.s.c; c <= range.e.c; ++c) { // column
        for (let r = range.s.r; r <= range.e.r; ++r) { // row
          const ref = XLSX.utils.encode_cell({ r: r, c: c }) // cell 넘버: 'A1', 'B1' ...)

          // cell타입이 Date인 경우
          if (columns[c - 1]?.valueType === 'Date' && typeof ws[ref]?.v === 'number') {
            ws[ref].t = 'd'
            ws[ref].z = 'yyyy-mm-dd hh:mm:ss'
          }
          // console.log('ref:: ', ref)

          //     if (r === 0) { // 헤더
          //       // ws.freeze_panes = c
          //       const columnName = headers.find(col => col.reqKey === ws[ref].v)?.displayName
          //       ws[ref].v = columnName || ws[ref].v.toUpperCase()
          //     // ws[ref].s = {
          //     //   fill: {
          //     //     patternType: 'solid',
          //     //     fgColor: { rgb: 'FF000000' },
          //     //     bgColor: { rgb: '815EFF' }
          //     //   },
          //     //   font: { sz: 14, bold: true, color: 'dddddd' }
          //     // }
          //     // console.log(ws[ref])
          //     }
        }
      }

      // console.log('## workSheet: ', ws)
      // console.log('## range: ', range)

      XLSX.utils.book_append_sheet(wb, ws, mainSheetTitle || `미등록 ${service} 자원 리스트`) // 엑셀 파일에 시트 추가

      // 미등록 Compute 자원 리스트 다운로드 시, 시트를 추가합니다.
      await this.addExcelSheet(service, wb, mergeRanges)

      XLSX.writeFile(wb, `${service}_${new Date().valueOf()}.xlsx`) // 엑셀 다운로드
      // XLSX.writeFile(wb, `${service}_${new Date().valueOf()}.xlsx`, { cellDates: true, dateNF: 'dd.mm.yy hh:mm:ss' }) // 엑셀 다운로드

      this.loading.download = false
    },
    /**
     * 미등록 Excel 다운로드 시, 시트를 추가합니다.
     * [공통] 작성 방법 / 프로젝트 목록 / 네트워크 카테고리 목록
     * [COMPUTE] NX 이미지 목록 / 설치프로그램 목록 / SW 라이선스 목록 / 운영그룹
     * [STORAGE] 운영그룹
     * [DATABASE] 설치프로그램 목록 / SW 라이선스 목록 / 운영그룹
     * [VM] VMware 이미지 목록 / 설치프로그램 목록 / SW 라이선스 목록 / 운영그룹
     * [VSAN_ISCSI] vCenter + 클러스터 목록 / 운영그룹
     * [보안그룹] 사용 가능한 미등록 방화벽 정책 목록
     * @param {String} workType 서비스 타입
     * @param {Object} wb 엑셀 파일
     * @param {String} mergeHeaderData 시트 헤더 머징 정보 (VM일 때...)
     */
    async addExcelSheet (workType = this.service, wb, mergeHeaderData) {
      try {
        const privateCsp = {
          nutanix: 'NX',
          vmware: 'VMWARE'
        }[this.cloud]

        // 작성 방법 [공통]
        await setDataSampleSheet(wb, this.excelColumns, this.getExcelMergeData(mergeHeaderData))

        // 그룹 목록 [공통]
        await setGroupNameDepthSheet(wb)

        // 프로젝트 목록 [공통]
        await setProjectListSheet(wb, this.allProjectList, privateCsp)

        // 네트워크 카테고리 목록
        await setNetworkCategorySheet(wb)

        if (workType === 'COMPUTE') {
          await Promise.all([
            setNXImageSheet(wb), // OS 이미지 목록
            setInstallProgramSheet(wb), // 설치프로그램 목록
            setSWLicenseSheet(wb), // S/W 라이선스 목록
            setManageGroupSheet(wb, privateCsp, 'COMPUTE') // 운영그룹
          ])
        }

        if (workType === 'STORAGE') {
          await setManageGroupSheet(wb, privateCsp, 'STORAGE')// 운영그룹
        }

        if (workType === 'DATABASE') {
          await Promise.all([
            setInstallProgramSheet(wb), // 설치프로그램 목록
            setSWLicenseSheet(wb), // S/W 라이선스 목록
            setManageGroupSheet(wb, privateCsp, 'COMPUTE') // 운영그룹
          ])
        }

        if (workType === 'VM') {
          await Promise.all([
            setVMwareImageSheet(wb), // OS 이미지 목록
            setVMwareNetowkrInfoSheet(wb), // 네트워크 목록
            setInstallProgramSheet(wb), // 설치프로그램 목록
            setSWLicenseSheet(wb), // S/W 라이선스 목록
            setManageGroupSheet(wb, privateCsp, 'COMPUTE') // 운영그룹
          ])
        }

        if (workType === 'VSAN_ISCSI') {
          await Promise.all([
            setVMwareClusterSheet(wb),
            setManageGroupSheet(wb, privateCsp, 'COMPUTE') // 운영그룹
          ])
        }

        if (workType === 'SECURITY') {
          await setUsablePolicySheet(wb, this.usablePolicyList) // 사용 가능한 미등록 방화벽 정책 목록
        }
      } catch (error) {
        console.error('Excel 시트 추가에 문제가 발생했습니다. ', error)
      }
    },
    /**
     * Excel Merge
     * @param {Array} range cell merge range 정보 ["A1:B1", "C1:D2", ...]
     */
    getExcelMergeData (mergeRange) {
      // excel cell merge
      const merge = []
      if (mergeRange?.length) {
        for (let i = 0; i < mergeRange.length; i++) {
          const range = mergeRange[i]
          // "A1:B1", "C1:D2", ... 를 { start: [1,1], end: [2,1] }, { start: [3, 1], end: [4, 2] }, ...포맷으로 변환
          if (!range.includes(':')) continue

          const startTxt = range.split(':')[0] // A1
          const startCol = this.getStrFromTxt(startTxt) // A
          const startColNum = startCol ? this.excelLettersToNumber(startCol) : 0 // 27 (A)
          const startRowNum = this.getNumberFromTxt(startTxt) // 1

          const endTxt = range.split(':')[1] // B1
          const endCol = this.getStrFromTxt(endTxt) // B
          const endColNum = endCol ? this.excelLettersToNumber(endCol) : 0 // 28 (B)
          const endRowNum = this.getNumberFromTxt(endTxt) // 1

          merge.push({
            s: { r: startRowNum - 1, c: startColNum - 1 },
            e: { r: endRowNum - 1, c: endColNum - 1 }
          })
        }
        // console.log('@@@ merge  =====> ', merge)
        //  merge = [
        //   { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // A:1 부터 D:1까지 병합
        //   { s: { r: 1, c: 0 }, e: { r: 5, c: 0 } } // A:2부터 A:6까지 병합
        // ]
      }
      return merge
    },
    /**
     * 실패 자원 Excel 다운로드 시 발생 이벤트
     */
    async downloadFailResources () {
      const data = this.runFailRows.map(row => row.rowData)

      await this.excelDownload(data, this.service, `${this.serviceName[this.service]} Excel 업로드 실패 자원 리스트`)
    },
    // 텍스트에서 숫자만 추출
    getNumberFromTxt (txt) { return txt.replace(/[^0-9]/g, '') },
    // 텍스트에서 String만 추출
    getStrFromTxt (txt) { return txt.replace(/[^A-Z]/g, '') },

    // excel column 알파벳을 숫자로 전환 ()
    // A -> 1, Z -> 26, AA -> 27
    excelLettersToNumber (letters) {
      const chrs = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const mode = chrs.length - 1
      let number = 0

      for (let p = 0; p < letters.length; p++) {
        number = number * mode + chrs.indexOf(letters[p])
      }
      return number
    },

    // excel column 숫자를 알파벳으로 전환
    // 1 -> B, 25 -> Z, 26 -> AA
    excelNumberToLetters (num) {
      let letters = ''
      while (num >= 0) {
        letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[num % 26] + letters
        num = Math.floor(num / 26) - 1
      }
      return letters
    }
  },
  data (root) {
    return {
      runFailRows: [],
      unregistExcelData: [], // grid Data
      usablePolicyList: [], // 사용 가능한 미등록 방화벽 정책 목록
      selectRow: null, // 선택한 row
      interval: null,
      totalResultCnt: 0,
      loading: {
        getList: false, // 리스트 조회
        download: false
      },
      unregistColumns: [
        { binding: 'orgFileName', header: root.$v('파일명'), align: 'left', customHtml: true },
        { binding: 'runTotal', header: root.$v('전체(개)'), width: 100 },
        { binding: 'runSuccess', header: root.$v('성공 자원(개)'), width: 100 },
        { binding: 'runFail', header: root.$v('실패 자원(개)'), width: 100 },
        { binding: 'runResult', header: root.$v('작업 결과'), customHtml: true, width: 150 },
        { binding: 'createTime', header: root.$v('생성일'), customHtml: true, width: 150 }
      ],
      isOpenedModalFailResource: false,
      selectedFailRowNumOfGrid: '', // 해당값은 서버에서 배열을 string으로 불러오기때문에 초기 타입은 String입니다.
      serviceName: {
        COMPUTE: 'Compute',
        STORAGE: 'Storage',
        DATABASE: 'Database',
        FILE_SERVER: 'NAS (Files)',
        VM: 'Compute',
        VSAN_ISCSI: 'Storage',
        NETWORK_L4: 'Network L4',
        NETWORK_L7: 'Network L7',
        SECURITY: root.$v('보안그룹')
      },

      // 엑셀
      excelColumns: [] // 엑셀 컬럼 정보. merge되었을 경우, 가장 아래 column에 해당
    }
  }
}
</script>

<style lang="scss">
  .table-area {
   &::v-deep .cmp-grid-wrapper {
      div[wj-part="root"] {
        overflow: hidden !important;
        .wj-cell > div { white-space: nowrap !important; }
      }
    }
  }
</style>
<style lang="scss" scoped>
.text-button {
  color: $primary;
  text-decoration-line:underline;
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
</style>
