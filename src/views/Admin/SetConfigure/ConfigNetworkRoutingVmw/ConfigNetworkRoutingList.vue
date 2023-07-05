<!--
  * 파일명 : ConfigNetworkRoutingList.vue
  * 파일 기능 : 경유지 리스트 노출 및 관리(추가, 변경, 삭제)
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2021-01-26
  * License By Shinsegae I&C
  * 2021-01-26 fix: sorting 추가 수정
 -->

<template>
  <div
    class="config-network-routing-list"
    v-loading="loading.isPolicyList || loading.isGroupTree || loading.isNetworkCate"
  >
    <section class="table-top-wrap">
      <total-count :total-count="gridTotalCnt" />

      <div class="button-area -right">
        <network-excel-form-download
          :title="$t('common.GRID.NETWORK.stopover')"
          type="POLICYROAD"
        />
        <!-- Excel 양식 다운로드 > 경유지 -->

        <network-excel-form-download
          :title="`${$t('common.GRID.NETWORK.stopover')} ${$t('admin.PREF.detail')}`"
          type="POLICYROAD_DETAIL"
        />
        <!-- Excel 양식 다운로드 > 경유지 상세 -->

        <span class="divider" />

        <button
          class="button"
          @click="e => excelUploadModal.road = true"
        >
          {{ $t('admin.PREF.roadExcepUpload') }}
        </button>
        <!-- 경유지 Excel Upload -->
        <button
          class="button"
          @click="e => excelUploadModal.roadDetail = true"
        >
          {{ $t('admin.PREF.roadDetailExcepUpload') }}
        </button>
        <!-- 경유지 상세 Excel Upload -->

        <span class="divider" />

        <button
          class="button"
          type="is-primary"
          @click="e => applyUpdateItem()"
        >
          {{ $t('common.TERMS.itemAdd') }}
        </button>
        <button
          class="button"
          :disabled="!selectedRow"
          @click="e => applyUpdateItem(selectedRow._data)"
        >
          {{ $t('common.BTN.change') }}
        </button>
        <button
          class="button"
          type="is-anti"
          @click="applyRemove"
          :disabled="!selectedRow"
        >
          {{ $t('common.BTN.delete') }}
        </button>
      </div>
    </section>

    <section class="table-area">
      <cmp-grid
        class="routing-grid"
        :item-source="tableData"
        :columns="columns"
        :init-auto-select-row="selectedRow ? selectedRow._data : null"
        init-auto-select-row-key="roadIdx"
        selectable
        @selectedRow="row => { selectedRow = row }"
        @total-count="cnt => gridTotalCnt = cnt"
      >
        <template
          v-for="column in columns"
          :slot="column.binding"
          slot-scope="props"
        >
          <div :key="column.binding">
            <span>{{ props.row[column.binding] }}</span>
          </div>
        </template>

        <template #detailRoute="props">
          <a
            class="-link"
            @click.stop="selectDetailCell(props.row)"
          >{{ $t('admin.PREF.detail') }}</a>
        </template>
        <!-- 상세 -->
      </cmp-grid>
    </section>

    <!-- 모달 -->
    <!-- 항목 생성/수정 모달 -->
    <el-dialog
      :title="modalTitle"
      :visible.sync="newItemModal"
      class="new-item-modal"
      width="600px"
      @close="newItemModal = false"
    >
      <section
        class="modal-body"
        style="border-top: 1px solid #3D435E"
      >
        <register-contents
          :title="$t('admin.PREF.stopover')"
          required
        >
          <el-input
            :placeholder="$t('admin.PREF.enterStopover')"
            v-model="updateItem.roadName"
            ref="roadNameInput"
          />
        </register-contents>
        <!-- 경유지명 -->

        <register-contents
          :title="$t('admin.PREF.originAff')"
          required
        >
          <el-select
            v-model="updateItem.srcCompanyIdx"
            :placeholder="$t('admin.PREF.selectOriginAff')"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in companyOptions"
              :key="item.field"
              :label="item.label"
              :value="item.field"
            />
          </el-select>
        </register-contents>
        <!-- 출발지 관계사 -->

        <register-contents
          :title="$t('admin.PREF.originType')"
          required
        >
          <el-select
            v-model="updateItem.srcRoadType"
            :placeholder="$t('admin.PREF.selectOriginType')"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in roadOptions"
              :key="item.field"
              :label="item.label"
              :value="item.field"
            />
          </el-select>
        </register-contents>
        <!-- 출발지 타입 -->

        <register-contents
          :title="$t('admin.PREF.destAff')"
          required
        >
          <el-select
            v-model="updateItem.dstCompanyIdx"
            :placeholder="$t('admin.PREF.selectDestAff')"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in companyOptions"
              :key="item.field"
              :label="item.label"
              :value="item.field"
            />
          </el-select>
        </register-contents>
        <!-- 목적지 관계사 -->

        <register-contents
          :title="$t('admin.PREF.destType')"
          required
        >
          <el-select
            v-model="updateItem.dstRoadType"
            :placeholder="$t('admin.PREF.selectDestType')"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in roadOptions"
              :key="item.field"
              :label="item.label"
              :value="item.field"
            />
          </el-select>
        </register-contents>
        <!-- 목적지 타입 -->

        <register-contents
          :title="$t('common.MODAL.explain')"
        >
          <el-input
            :placeholder="$t('common.PLACEHOLDER.enterDes')"
            v-model="updateItem.comment"
            type="textarea"
          />
        </register-contents>
        <!-- 설명 -->
      </section>

      <div class="modal-footer modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="cancelSave"
        >
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button -modal-button"
          @click="saveUpdateAction"
          type="is-primary"
        >
          {{ $t('common.BTN.confirm') }}
        </button>
      </div>
    </el-dialog>

    <!-- 경유지 Excel 업로드 모달 -->
    <el-dialog
      :title="$t('config.IP.uploadExcel')"
      :visible.sync="excelUploadModal.road"
      class="excel-upload-modal"
      width="500px"
      top="30vh"
      @close="() => excelUploadModal.road = false"
      :before-close="beforeExcelUploadClose"
    >
      <excel-upload
        v-if="excelUploadModal.road"
        :loading="uploadLoading.road"
        @close="excelUploadModal.road = false"
        @save="file => saveExcelUpload(file, 'road')"
      >
        <template #trigger>
          <button class="button">
            {{ $t('admin.PREF.roadExcepUpload') }}
          </button>
        </template>
      </excel-upload>
    </el-dialog>

    <!-- 경유지 정보 상세 Excel 업로드 모달 -->
    <el-dialog
      :title="$t('config.IP.uploadExcel')"
      :visible.sync="excelUploadModal.roadDetail"
      class="excel-upload-modal"
      width="500px"
      top="30vh"
      @close="() => excelUploadModal.roadDetail = false"
      :before-close="beforeExcelUploadClose"
    >
      <excel-upload
        v-if="excelUploadModal.roadDetail"
        :loading="uploadLoading.roadDetail"
        @close="excelUploadModal.roadDetail = false"
        @save="file => saveExcelUpload(file, 'roadDetail')"
      >
        <template #trigger>
          <button class="button">
            {{ $t('admin.PREF.roadDetailExcepUpload') }}
          </button>
        </template>
      </excel-upload>
    </el-dialog>
  </div>
</template>
<script>
import { cloneDeep } from 'lodash'
import { mapState } from 'vuex'
import API from '@sd-fe/cmp-core'

import ExcelUpload from '@/components/ExcelUpload/ExcelUpload'
import NetworkExcelFormDownload from '@/components/ExcelDownload/NetworkExcelFormDownload'

export default {
  name: 'ConfigNetworkRoutingList',
  components: {
    'excel-upload': ExcelUpload,
    'network-excel-form-download': NetworkExcelFormDownload
  },
  watch: {
    originTableData (newVal) {
      this.tableData = cloneDeep(newVal)
    }
  },
  computed: {
    ...mapState({
      userInfo: state => state.auth.user
    }),
    modalTitle () {
      if (this.updateItem.roadIdx === undefined) return this.$t('admin.PREF.changeItem')
      else return this.$t('common.TERMS.itemAdd')
    }
  },
  mounted () {
    this.init()
  },
  methods: {
    async init () {
      await this.getGroupList()
      this.getPolicyRoads()
      this.getIpCategories()
    },
    /**
     * 관계사 목록 조회
     */
    async getGroupList () {
      try {
        this.loading.isGroupTree = true
        const response = await API.iam.getGroupList({ groupUpper: 0 })
        if (!response) return

        // 관계사만 담아줌..
        const result = response.map(item => {
          return {
            label: item.groupName,
            field: item.groupIdx
          }
        })

        this.companyOptions = result
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.companyOptions = []
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
        this.loading.isGroupTree = false
        throw error
      } finally {
        this.loading.isGroupTree = false
      }
    },
    /**
     * API 영역
     */
    async getPolicyRoads () {
      try {
        this.loading.isPolicyList = true
        const response = await API.network.getPolicyRoads()
        if (!response) return

        for (let i = 0; i < response.length; i++) {
          response[i].srcCompanyLabel = this.getCompanyName(response[i].srcCompanyIdx)
          response[i].dstCompanyLabel = this.getCompanyName(response[i].dstCompanyIdx)
          response[i].detailRoute = 'detail'
        }
        this.originTableData = [...response]
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.projectTreeData = []
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })

        this.loading.isPolicyList = false
        throw error
      } finally {
        this.loading.isPolicyList = false
      }
    },
    /**
     * 경유지 생성
     */
    async createPolicyRoad (policyRoad) {
      try {
        const result = await API.network.createPolicyRoad(policyRoad)

        if (result && !result.errorCode) {
          this.$alert(this.$t('common.ALERT.BASE.032')) // 등록 성공하였습니다.
          this.newItemModal = false
        } else if (result.errorCode === 'NET5002') {
          this.$alert(this.$t('common.ALERT.SECURITY.050')) // 동일한 경유지명이 존재합니다.
          this.$nextTick(function () { this.$refs.roadNameInput.focus() })
        } else if (result.errorCode === 'NET4004') {
          this.$alert('이미 존재하는 경유지입니다.') // 이미 존재하는 경유지입니다.
        } else {
          this.$alert(this.$t('common.ALERT.PROJECT.015')) // 생성 실패
          // this.$alert(this.$t('common.ALERT.BASE.032')) // 등록 성공하였습니다.
          this.newItemModal = false
        }
      } catch (error) {
        this.$alert(error, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm')
        })
      } finally {
        await this.getPolicyRoads()
      }
    },
    /**
     * 경유지 수정
     */
    async updatePolicyRoad (roadIdx, policyRoad) {
      try {
        const result = await API.network.updatePolicyRoad(roadIdx, policyRoad)

        if (result && !result.errorCode) {
          this.$alert(this.$t('common.ALERT.BASE.043')) // 수정되었습니다.
          this.newItemModal = false
        } else if (result.errorCode === 'NET5002') {
          this.$alert(this.$t('common.ALERT.SECURITY.050')) // 동일한 경유지명이 존재합니다.
          this.$nextTick(function () { this.$refs.roadNameInput.focus() })
        } else if (result.errorCode === 'NET4004') {
          this.$alert('이미 존재하는 경유지입니다.') // 이미 존재하는 경유지입니다.
        } else {
          this.$alert(this.$t('common.ALERT.PROJECT.044')) // 실패했습니다. 현재 성공/실패에 대한 결괏값이 없어서 임시로 생성 완료로 처리했습니다.
          // this.$alert(this.$t('common.ALERT.BASE.043')) // 수정되었습니다.
          this.newItemModal = false
        }
      } catch (error) {
        this.$alert(error, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm')
        })
      } finally {
        await this.getPolicyRoads()
      }
    },
    async deletePolicyRoad (roadIdx) {
      try {
        const payload = {
          userId: this.userInfo.userId,
          roadIdx: roadIdx
        }
        const result = await API.network.deletePolicyRoad(payload)
        if (!result) return this.$alert(this.$t('common.ALERT.BASE.015'), { dangerouslyUseHTMLString: true }) // 삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        else {
          this.$alert(this.$t('common.ALERT.BASE.017')) // 삭제되었습니다.
          this.selectedRow = null
        }
      } catch (error) {
        this.$alert(error, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm')
        })
      } finally {
        await this.getPolicyRoads()
      }
    },

    /**
     * 네트워크 카테고리
     */
    async getIpCategories () {
      try {
        this.loading.isNetworkCate = true
        const resCtgData = await API.network.getNetworkCategory()
        if (!resCtgData) return
        const options = []
        for (let i = 0; i < resCtgData.length; i++) {
          if (resCtgData[i].cateKey.includes('-') && resCtgData[i].cateKey.split('-').length === 3) {
            options.push({
              label: resCtgData[i].codeName,
              field: resCtgData[i].codeName
            })
          }
        }
        this.roadOptions = [...options]
      } catch (error) {
        this.loading.isNetworkCate = false
        console.error(error)
      } finally {
        this.loading.isNetworkCate = false
      }
    },
    /**
     * companyIdx로 companyName 반환합니다.
     * @param {Number} idx companyIdx
     */
    getCompanyName (value) {
      const company = this.companyOptions.find(p => p.field === value)
      if (company !== undefined) {
        return company.label
      }
    },
    /**
     * '상세' 클릭시, 상세 페이지로 넘어가는 메서드
     */
    selectDetailCell (rowData) {
      const routingData = rowData
      if (routingData.roadIdx === undefined) return
      this.$router.push({
        name: 'network-routing-detail',
        params: routingData
      })
    },
    /**
     * 템플릿 편집 -> 편집 전 데이터를 this.initData에 담아주고,
     * 업데이트 아이템을 세팅해줍니다. (생성/수정 구분을 위함)
     */
    applyUpdateItem (item) {
      this.updateItem = this.setUpdateItem(item)
      this.newItemModal = true
    },
    /**
     * 업데이트 아이템 세팅
     * @return {Object} [변경]을 누르면 체크된 친구가 updateItem, [항목 추가]를 누르면 새로운 데이터 세팅
     */
    setUpdateItem (data) {
      if (data) {
        const copiedData = cloneDeep(data)
        this.updateItem = copiedData
        return this.updateItem
      } else {
        const newTemp = {
          roadName: '',
          srcCompanyIdx: '',
          srcRoadType: '',
          dstCompanyIdx: '',
          dstRoadType: '',
          comment: ''
        }
        return newTemp
      }
    },

    /**
     * [삭제] 버튼을 눌렀을 때, 선택한 row 삭제합니다.
     */
    applyRemove () {
      this.$confirm(this.$t('common.CONFIRM.BASE.032'), '삭제', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        await this.deletePolicyRoad(this.selectedRow._data.roadIdx)
      }).catch(() => false)
    },
    /**
     * 항목 생성/수정 모달에서 [확인]을 눌렀을 때 해당 로우 저장
     */
    saveUpdateAction () {
      if (this.validUpdateRoad()) return

      this.$confirm(this.$t('common.CONFIRM.BASE.001'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.saveUpdateRoad(this.updateItem)
      }).catch(() => {
        this.saveUpdateRoad()
        return false
      })
    },
    /**
     * 항목 생성/수정 모달에서 [취소] 버튼을 눌렀을 때 발생하는 이벤트
     */
    cancelSave () {
      this.saveUpdateRoad(null)
      this.newItemModal = false
    },
    /**
     * 변경 모달 -> [확인]/[취소] -> 저장
     * @param {Object} updateItem emit으로 전달 받은 업데이트 된 템플릿 아이템, 없을 때 (저장 안하고 취소 눌렀을 때) 편집 전 상태로 돌려줍니다.
     */
    saveUpdateRoad (updateRow) {
      if (!updateRow) return
      updateRow.userId = this.userInfo.userId
      const { index, checked, ...rest } = updateRow

      if (rest.roadIdx === undefined) this.createPolicyRoad(rest) // 아이템 생성
      else this.updatePolicyRoad(rest.roadIdx, rest) // 아이템 변경
    },
    /**
     * 경유지 생성/수정 모달 validation
     * @return true: 필수값이 모두 채워져 있어서 생성 가능.
     */
    validUpdateRoad () {
      const validItems = ['roadName', 'srcCompanyIdx', 'srcRoadType', 'dstCompanyIdx', 'dstRoadType']

      const validMessage = {
        roadName: 'common.ALERT.SECURITY.002', // 경유지명을 확인해주세요.
        srcCompanyIdx: 'common.ALERT.SECURITY.012', // 출발지 관계사를 선택해주세요.
        srcRoadType: 'common.ALERT.SECURITY.015', // 출발지 타입을 선택해주세요.
        dstCompanyIdx: 'common.ALERT.PROJECT.012', // 목적지 관계사를 선택해주세요.
        dstRoadType: 'common.ALERT.SECURITY.009' // 목적지 타입을 선택해주세요.
      }

      const pass = validItems.some(cate => {
        if (typeof this.updateItem[cate] === 'string'
          ? !this.updateItem[cate]?.trim()
          : !this.updateItem[cate]
        ) {
          this.$alert(this.$t(validMessage[cate]))
          return !this.updateItem[cate].trim()
        }
      })

      return pass
    },
    /**
     * 엑셀 업로드 모달 닫기 전 이벤트
     */
    beforeExcelUploadClose () {
      this.$confirm(this.$t('common.CONFIRM.BASE.003'), {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(() => {
        this.excelUploadModal.road = false
        this.excelUploadModal.roadDetail = false
      })
        .catch(() => false)
    },
    /**
     * 경유지/상세 엑셀 업로드
     * @param {file} file 업로드 할 파일
     * @field {string} 어떤 업로드 인지? 'road' || 'roadDetail'
     */
    async saveExcelUpload (file, field) {
      try {
        this.uploadLoading[field] = true
        let response
        if (field === 'road') response = await API.network.uploadRoadExcel(file)
        else response = await API.network.uploadRoadDetailExcel(file)

        if (response && !response.errorCode) {
          this.$alert(this.$t('common.ALERT.SECURITY.016'), { callback: () => this.$emit('close') }) // 파일 업로드가 완료되었습니다.
          this.excelUploadModal[field] = false
          if (field === 'road') this.init() // 경유지 일 때만 화면 refresh (경유지 상세 x)
        } else if (response.errorCode) {
          const message = {
            NET5002: field === 'road' ? this.$t('common.ALERT.NETWORK.042') : this.$t('common.ALERT.NETWORK.043'), // 해당하는 방화벽 VDOM이 이미 존재합니다. 다시 시도해주세요.
            NET7000: this.$t('common.ALERT.NETWORK.047'), // 파일 내용을 확인해주세요.
            NET7002: this.$t('common.ALERT.NETWORK.047'), // 파일 내용을 확인해주세요.
            NET0000: this.$t('common.ALERT.SECURITY.017')
          }[response.errorCode]

          const msg = message || this.$t('common.ALERT.NUTA.014')
          return this.$alert(msg, { dangerouslyUseHTMLString: true })
        } else this.$alert(this.$t('common.ALERT.NUTA.014'), { dangerouslyUseHTMLString: true }) // 파일 업로드 중에 문제가 발생하였습니다.<br>다시 시도해주세요.
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.NUTA.014'), { dangerouslyUseHTMLString: true }) // 파일 업로드 중에 문제가 발생하였습니다.<br>다시 시도해주세요.
      } finally {
        this.uploadLoading[field] = false
      }
    }
  },
  data () {
    return {
      loading: {
        isPolicyList: false,
        isGroupTree: false,
        isNetworkCate: false
      },
      gridTotalCnt: 0, // 경유지 그리드 갯수
      selectedRow: null, // 경유지 선택 row
      newItemModal: false,
      excelUploadModal: {
        road: false,
        roadDetail: false
      },
      uploadLoading: { // 경유지, 경유지 상세 excel 업로드 로딩
        road: false,
        roadDetail: false
      },
      originTableData: [], // 경유지 그리드 데이터
      tableData: [], // originTableData 복사본
      updateItem: {
        roadIdx: '',
        roadName: '',
        srcCompanyIdx: '',
        srcRoadType: '',
        dstCompanyIdx: '',
        dstRoadType: '',
        comment: ''
      },
      // 관계사 정보
      companyOptions: [],
      // 타입 정보
      roadOptions: [],

      // 테이블 정보
      columns: [
        { header: '경유지명', binding: 'roadName', width: '*', align: 'left', keyPath: 'admin.PREF.stopover' },
        { header: '출발지 관계사', binding: 'srcCompanyLabel', width: 200, customHtml: true, align: 'left', keyPath: 'admin.PREF.originAff' },
        { header: '출발지 타입', binding: 'srcRoadType', width: 150, keyPath: 'admin.PREF.originType' },
        { header: '목적지 관계사', binding: 'dstCompanyLabel', width: 200, customHtml: true, align: 'left', keyPath: 'admin.PREF.destAff' },
        { header: '목적지 타입', binding: 'dstRoadType', width: 150, keyPath: 'admin.PREF.destType' },
        { header: '설명', binding: 'comment', width: '*', align: 'left', keyPath: 'admin.PREF.explain' },
        { header: '상세', binding: 'detailRoute', width: 150, customHtml: true, sorting: false, keyPath: 'admin.PREF.detail' }
      ]
    }
  }
}
</script>
