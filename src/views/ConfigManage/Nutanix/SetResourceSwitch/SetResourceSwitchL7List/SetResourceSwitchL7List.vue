<!--
  * 파일명 : SetResourceSwitchL7List.vue
  * 파일 기능 : 구성관리 > 자원관리 > L7 > SDN/LEGACY 리스트 확인 기능, SDN 리스트 필터링(관계사 / 조직 / 프로젝트) 기능
  * 작성자 : 이경환 외 1명
  * 최종 작성일 : 2021-01-27
  * License By Shinsegae I&C
  * 2021-01-27 fix: 그리드 데이터 로딩 UI 개선
 -->

<template>
  <div
    class="set-resource-switch-l7-list"
    v-loading="loading"
  >
    <resource-filter-component
      cloud-type="private"
      style="margin-top:20px;"
      :table-data="filteredL7Data"
      @search="(param) => getNetworkL7List(param)"
    >
      <section class="filter-form">
        <span class="filter-name">{{ $v('긴급 처리 여부') }}</span>
        <el-select
          v-model="filteredIsUrgent"
          :placeholder="$v('분류')"
          :popper-append-to-body="false"
          @change="updateMainGrid()"
        >
          <el-option
            v-for="option in isUrgentOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </section>
    </resource-filter-component>

    <section class="table-area">
      <div>
        <section class="table-top-wrap">
          <total-count
            class="total-count-wrap"
            :total-count="totalResultCntLeg"
          >
            <div class="flex-wrap">
              <el-checkbox
                v-model="filterCreateTypeRegisterChecked"
                @change="filtering()"
              >
                {{ $v('CMP 외부 생성 자원 보기') }}
              </el-checkbox>
            </div>
          </total-count>
          <div class="button-area -right">
            <button
              class="button"
              type="is-primary"
              @click="e => {
                editItem = undefined
                isOpenL7ModalStep = true
              }"
            >
              {{ $v('자원 추가') }}
            </button>
            <button
              v-if="checkedRows.length === 1"
              class="button"
              @click="e => {
                editItem = checkedRows[0]
                isOpenL7ModalStep = true
              }"
            >
              {{ $v('변경') }}
            </button>
          </div>
        </section>
        <!-- filteredL7DataZ -->
        <section class="table-area">
          <cmp-grid
            class="route-detail-grid"
            :item-source="filteredL7Data"
            :init-custom-action="init"
            :columns="l7Columns"
            @selectedRow="selectRow(...arguments, 'l7', 'csVrserverIdx')"
            selectable
            header-checkbox
            @checkedRowsData="(items) => {
              checkedRows = items
            }"
            :use-excel-download="true"
            @total-count="cnt => totalResultCntLeg = cnt"
          >
            <template #createType="{ row }">
              <created-by-cmp-tag v-if="row.createType !== 'REGISTER'" />
              <span v-else />
            </template>
            <template #isUrgent="props">
              {{ props.row.isUrgent ? $v('긴급'): $v('일반') }}
            </template>
            <template #isManualManagement="props">
              <el-checkbox
                v-model="props.row.isManualManagement"
                :disabled="true"
              />
            </template>
            <template #state="props">
              <span
                v-if="props.row.state"
                class="state-display"
                :class="{'--up':props.row.state==='UP', '--down':props.row.state ==='DOWN' }"
              >
                <div
                  class="state-icon"
                  :class="{'success': props.row.state==='UP' , 'error': props.row.state==='DOWN' }"
                /> {{ props.row.state }}</span>
            </template>
            <!-- <template #port="props">
            {{ props.row.port }}
          </template> -->
            <!-- <template #createTime="props">
            {{ props.row.createTime | dateSimple }}
          </template> -->
            <!-- <template #powerState="props">
            <cmp-status-tag
              :type="props.row.powerState === 'ON' ? 'is-complete' : 'is-fail'"
              :line-style="true"
            >
              {{ props.row.powerState }}
            </cmp-status-tag>
          </template> -->
          </cmp-grid>
        </section>
      </div>

      <el-dialog
        :title="editItem === undefined ? $t('common.MODAL.addL7') : $t('common.MODAL.changeL7')"
        :visible="isOpenL7ModalStep"
        width="1400px"
        @close="isOpenL7ModalStep = false"
        top="10vh"
      >
        <network-l7-update-form
          v-if="isOpenL7ModalStep"
          v-loading="isLoadingUpdate"
          @close="isOpenL7ModalStep = false"
          @save="handleSaveUpdate"
          :user-info="user"
          in-admin
          :height="'72vh'"
          :data="editItem"
        />
      </el-dialog>
    </section>
  </div>
</template>

<script>
import API, { ResourceFilterComponent, NetworkL7UpdateForm } from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
// import L7UpdateEditableModal from '@/components/Modal/NetworkUpdateModal/L7UpdateModal/L7UpdateEditableModal.vue'
import BlockRouteMixins from '@/components/Utils/BlockRoute.mixins'
import CreateByCMPTag from '@/components/Tag/CreateByCMPTag'

export default {
  name: 'SetResourceSwitchL7List',
  mixins: [BlockRouteMixins],
  components: {
    // 'l7-update-editable-modal': L7UpdateEditableModal,
    ResourceFilterComponent,
    'network-l7-update-form': NetworkL7UpdateForm,
    'created-by-cmp-tag': CreateByCMPTag
  },
  computed: {
    ...mapState({ user: state => state.auth.user })
  },
  mounted () {
    this.getNetworkL7List()
    this.getCodes()
  },
  methods: {
    handleCreateL7 () {
      this.getNetworkL7List()
      this.isOpenL7Modal = false
    },
    init (grid) {
      this.grid = grid
    },
    gridRefresh (grid) {
      const cv = grid.collectionView
      cv.refresh()
    },
    routeTo (to) {
      this.$router.push(to)
    },
    setL7Payload (isNew, saveData) {
      const {
        beforePrice,
        isUrgent,
        price,
        tagInfo,
        ...rest
      } = saveData

      const service = 'NETWORK_L7'

      const payload = {
        beforePrice,
        groupIdx: saveData.groupIdx,
        groupName: saveData.groupName,
        isUrgent: !!isUrgent, // 긴급 여부(긴급 = true, 일반 = false)
        price,
        projectIdx: saveData.projectIdx,
        requestData: {
          ...rest,
          ...(isNew && {
            tagInfo: tagInfo || []
          })
        },
        service,
        userId: this.user.userId,
        userName: this.user.userName
      }
      return payload
    },
    /**
     * VM 생성/수정 시, '저장'
     */
    async handleSaveUpdate (saveData) {
      try {
        this.isLoadingUpdate = true
        let result = null
        const isNew = !saveData?.csVrserverIdx
        const payload = await this.setL7Payload(isNew, saveData)
        if (isNew) {
          result = await this.createNetworkL7(payload)
        } else {
          result = await this.updateNetworkL7(payload)
        }
        if (result) {
          this.isOpenL7ModalStep = false
          this.checkedRows = []
          this.init()
        }
      } catch (err) {
        console.log(err)
      } finally {
        this.isLoadingUpdate = false
      }
    },

    /**
   * API_HANDLER (POST)네트워크 L7 생성 API
   */
    async createNetworkL7 (payload) {
      try {
        this.loading = true
        await API.work_v3.createNetworkL7(payload) // 일반 네트워크 L7 생성
        this.$alert('Network L7 실행 작업이 요청되었습니다.')
        return true
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.LOGGING.004'), { dangerouslyUseHTMLString: true }) // 생성에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        throw error
      } finally {
        this.loading = false
      }
    },
    /**
   * API_HANDLER (POST)네트워크 L7 생성 API
   */
    async updateNetworkL7 (payload) {
      try {
        this.loading = true
        await API.work_v3.updateNetworkL7(payload) // 일반 네트워크 L7 생성
        this.$alert('Network L7 실행 작업이 요청되었습니다.')
        return true
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('자원 변경을 실패하였습니다.<br/> 관리자에게 문의해주세요.'), { dangerouslyUseHTMLString: true }) // 생성에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        throw error
      } finally {
        this.loading = false
      }
    },
    async getNetworkL7List (param) {
      try {
        this.loading = true
        this.checkedRows = []
        const response = await API.network.getCsvrserver(param)
        if (!response) {
          this.l7TableData = []
          return
        }

        response.sort((a, b) => {
          if (a?.createTime < b?.createTime) return 1
          else if (a?.createTime > b?.createTime) return -1
          else return 0
        })

        this.l7TableData = await this.setData(response)

        this.filtering()
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.l7TableData = []
        this.$alert(message || this.$v('{name} 조회에 문제가 발생했습니다. 관리자에게 문의해주세요.', { name: 'L7' }), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          dangerouslyUseHTMLString: true
        })
        this.loading = false
        throw error
      } finally {
        this.loading = false
      }
    },
    async setData (resData) {
      // const settedData = []

      const data = await API.iam.getProject({ projectIdx: this.projectIdx })
      const groupInfo = data[0]
      const settedData = resData.map(sw => {
        sw.name = sw.csVrserverName
        sw.idx = sw.csVrserverIdx
        sw.port = String(sw.port)
        if (this.projectIdx === undefined) {
          // try {
          sw.companyIdx = undefined
          sw.groupIdx = undefined
        } else { // '미등록'일 경우
          sw.companyIdx = groupInfo.companyIdx
          sw.groupIdx = groupInfo.groupIdx
        }
        return sw
      })

      return settedData
    },

    /**
     * 스위치 그리드에서 로우 선택시, 발생 이벤트
     * @param {RowGroup} row 선택 위즈모 로우 객체
     * @parapm {String} field 'L7'인지ㅡ 'L7'인지 ..
     * @param {Number} 각 아이템의 고유 Idx 값
     */
    selectRow (row, field, idx) {
      // console.log('row : ', row)
      this.routeTo({
        name: 'set-resource-switch-detail-l7',
        params: {
          field: field,
          idx: row.dataItem[idx],
          data: row.dataItem
        }
      })
    },
    /**
     * 변경 모달 -> [확인]/[취소] -> 저장
     * @param {Object} updateItem emit으로 전달 받은 업데이트 된 템플릿 아이템, 없을 때 (저장 안하고 취소 눌렀을 때) 편집 전 상태로 돌려줍니다.
     */
    saveUpdatedItem (updateRow) {
      if (!updateRow) { // [취소] 눌렀을 때
        if (this.updateItem.crud === 'create') return
        this.tableData[this.selectedRow.index] = JSON.parse(JSON.stringify(this.beforeData))
      } else {
        if (updateRow.crud === 'create') { // 아이템 생성일 때
          this.tableData.length ? this.tableData.unshift(updateRow) : this.tableData.push(updateRow)
        } else { // 아이템 변경일 때
          console.log(updateRow)
          const rowIdx = this.tableData.map((item, idx) => {
            if (item.alarmId === this.selectedRow._data.alarmId) return idx
          })
          this.tableData[rowIdx] = updateRow
        }
      }

      this.$nextTick(() => {
        this.gridSetInit()
        this.isOpenL7Modal = false
      })
    },

    gridSetInit () {
      this.gridRefresh(this.grid)

      this.l7TableData = this.l7TableData.map(item => {
        return {
          ...item,
          checked: false
        }
      })
      this.selectedRow = null
    },
    /** API_HANDLER (GET) 코드 조회 */
    async getCodes () {
      const response = await API.network.getNetworkCategory()
      const seperationsTemp = []
      if (response !== undefined) {
        // console.log('response : ', response)
        response.map(c => {
          if (c.codeName === 'LEG_INT' || c.codeName === 'LEG_DMZ') {
            const temp = {}
            temp.value = c.codeName
            temp.name = c.codeValue
            temp.ipCateIdx = c.ipCategoryIdx
            seperationsTemp.push(temp)
          }
        })
      }

      const protocolTemp = await this.getCodeList({ codeType: 'SWITCH_PROTOCOL' })
      const methodTemp = await this.getCodeList({ codeType: 'SWITCH_ALGORITHM' })
      this.dropdownData = {
        methodsTypes: methodTemp,
        protocolTypes: protocolTemp,
        seperations: seperationsTemp
      }
    },
    /**
     * Code 데이터 조회
     */
    async getCodeList (params) {
      try {
        const response = await API.config.getCodeList(params)

        if (response) {
          return response.map(code => {
            return {
              name: code.codeName,
              value: code.codeVal
            }
          })
        }
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.alert(message, () => false)
      } finally {
      }
    },
    /**
     * CMP 외부 생성 자원 보기 필터링 이벤트
     */
    filtering () {
      if (!this.filterCreateTypeRegisterChecked) this.filteredL7Data = this.l7TableData
      else {
        this.filteredL7Data = this.l7TableData.filter(item => {
          let result = false
          // CMP 외부 생성 자원 보기 (미등록 -> 등록)
          if (this.filterCreateTypeRegisterChecked) result = item?.createType === 'REGISTER'

          return result
        })
      }
    }
  },
  data () {
    return {
      filteredIsUrgent: '',
      totalResultCntSdn: 0,
      totalResultCntLeg: 0,
      loading: false,
      isLoadingUpdate: false,
      projectIdx: null,
      dropdownData: {},
      checkedSdn: [],
      checkedRows: [],
      selectedItem: null,
      isUrgentOptions: [
        { value: '', label: '전체' },
        { value: false, label: '일반' },
        { value: true, label: '긴급' }
      ],
      filteredL7Data: [],
      l7TableData: [],
      l7Columns: [
        { binding: 'createType', header: ' ', width: 80, customHtml: true, filtable: false },
        { header: this.$v('프로젝트 명'), binding: 'projectName' },
        { header: this.$v('긴급 처리 여부'), binding: 'isUrgent', align: 'left', width: 80, customHtml: true },
        { header: '로드 밸런스명', binding: 'csVrserverName', align: 'left', width: 200, keyPath: 'common.GRID.NETWORK.lbName' },
        { header: '가상IP', binding: 'ip', width: 150, keyPath: 'common.MODAL.virtualIp' },
        { header: this.$v('스위치 장비명'), binding: 'netName', width: 150 },
        { header: this.$v('수기관리여부'), binding: 'isManualManagement', width: 80, customHtml: true },
        { header: '포트', binding: 'port', customHtml: true, keyPath: 'common.GRID.NETWORK.port' },
        { header: '프로토콜', binding: 'protocolType', keyPath: 'common.MODAL.protocol' },
        { header: '방식', binding: 'method', keyPath: 'common.GRID.NETWORK.system' },
        { header: '설명', binding: 'comment', align: 'left', keyPath: 'common.GRID.explain' },
        { header: this.$v('상태'), binding: 'state', width: 80, customHtml: true }
        // { header: '삭제 예정일', binding: 'deleteDate', width: '*' }
      ],
      filterCreateTypeRegisterChecked: false, // 필터링 > CMP 외부 생성 자원 보기 (미등록 -> 등록)

      // LEGACY 모달 관련
      tableData: [],
      beforeData: null,
      isOpenL7Modal: false,
      isOpenL7ModalStep: false,
      modalTitle: '',
      editItem: undefined
    }
  }
}
</script>
<style lang="scss" scoped>
.total-count-wrap {
  .flex-wrap { margin-left: 30px; }
}
  .total-count-wrap {
  .flex-wrap { margin-left: 30px; }
}
.state-display {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-weight: 400;
  &.--up {
    color: $success
  }
  &.--down {
    color: $danger
  }
}
</style>
