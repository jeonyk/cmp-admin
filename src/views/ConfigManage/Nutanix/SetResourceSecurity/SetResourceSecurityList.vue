<!--
  * 파일명 : SetResourceSwitchSgList.vue
  * 파일 기능 : 구성관리 > 자원관리 > 보안그룹 > SDN/LEGACY 리스트 확인 기능, SDN 리스트 필터링(관계사 / 조직 / 프로젝트) 기능
  * 작성자 : 이경환 외 1명
  * 최종 작성일 : 2021-01-27
  * License By Shinsegae I&C
  * 2021-01-27 fix: 그리드 데이터 로딩 UI 개선
 -->

<template>
  <div
    class="set-resource-switch-보안그룹-list"
    v-loading="loading"
  >
    <resource-filter-component
      cloud-type="private"
      style="margin-top:20px;"
      :table-data="filteredSgData"
      @search="(param) => getNetworkSgList(param)"
    />

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
                isOpenSgModalStep = true
              }"
            >
              {{ $v('자원 추가') }}
            </button>
            <button
              class="button"
              :disabled="checkedRows.length !== 1"
              @click="e => {
                editItem = checkedRows[0]
                isOpenSgModalStep = true
              }"
            >
              {{ $t('common.BTN.change') }}
            </button>
            <button
              class="button"
              type="is-anti"
              :disabled="checkedRows.length !== 1"
              @click="applyRemove"
            >
              {{ $t('common.BTN.delete') }}
            </button>
          </div>
        </section>
        <!-- sgTableDataZ -->
        <section class="table-area">
          <cmp-grid
            class="route-detail-grid"
            :item-source="sgTableData"
            :init-custom-action="init"
            :columns="sgColumns"
            @selectedRow="selectRow(...arguments, 'SG', 'securityGroupIdx')"
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

            <template #projectName="props">
              <cmp-status-tag>{{ $v('긴급') }}</cmp-status-tag>{{ props.row.projectName }}
            </template>
            <template #state="props">
              {{ props.row.state }}
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
            <template #status>
              UP<!--TODO 디자인 필요-->
            </template>
          </cmp-grid>
        </section>
      </div>

      <el-dialog
        :title="editItem === undefined ? $t('보안그룹 추가') : $t('보안그룹 변경')"
        :visible="isOpenSgModalStep"
        width="1400px"
        @close="isOpenSgModalStep = false"
        top="10vh"
      >
        <network-sg-update-form
          v-if="isOpenSgModalStep"
          v-loading="isLoadingUpdate"
          @close="isOpenSgModalStep = false"
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
import API, { ResourceFilterComponent, NetworkSgUpdateForm } from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
// import SgUpdateEditableModal from '@/components/Modal/NetworkUpdateModal/SgUpdateModal/SgUpdateEditableModal.vue'
import BlockRouteMixins from '@/components/Utils/BlockRoute.mixins'
import CreateByCMPTag from '@/components/Tag/CreateByCMPTag'

export default {
  name: 'SetResourceSwitchSgList',
  mixins: [BlockRouteMixins],
  components: {
    // 'Sg-update-editable-modal': SgUpdateEditableModal,
    ResourceFilterComponent,
    'network-sg-update-form': NetworkSgUpdateForm,
    'created-by-cmp-tag': CreateByCMPTag
  },
  computed: {
    ...mapState({ user: state => state.auth.user })
  },
  mounted () {
    this.getNetworkSgList()
    this.getCodes()
  },
  methods: {
    handleCreateSg () {
      this.getNetworkSgList()
      this.isOpenSgModal = false
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
    setSgPayload (isNew, saveData) {
      const {
        beforePrice,
        isUrgent,
        price,
        tagInfo,
        ...rest
      } = saveData

      const service = 'SECURITY'

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
        const isNew = !saveData?.securityGroupIdx
        const payload = await this.setSgPayload(isNew, saveData)
        if (isNew) {
          result = await this.createNetworkSg(payload)
        } else {
          result = await this.updateNetworkSg(payload)
        }
        if (result) {
          this.isOpenSgModalStep = false
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
   * API_HANDLER (POST)네트워크 Sg 생성 API
   */
    async createNetworkSg (payload) {
      try {
        this.loading = true
        await API.work_v3.createNetworkSg(payload) // 일반 네트워크 Sg 생성
        this.$alert('Network Sg 실행 작업이 요청되었습니다.')
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
   * API_HANDLER (POST)네트워크 Sg 생성 API
   */
    async updateNetworkSg (payload) {
      try {
        this.loading = true
        await API.work_v3.updateNetworkSg(payload) // 일반 네트워크 Sg 생성
        this.$alert('Network Sg 실행 작업이 요청되었습니다.')
        return true
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('자원 변경을 실패하였습니다.<br/> 관리자에게 문의해주세요.'), { dangerouslyUseHTMLString: true }) // 생성에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        throw error
      } finally {
        this.loading = false
      }
    },
    async getNetworkSgList (param) {
      try {
        this.loading = true
        this.checkedRows = []
        const response = await API.network.getPolicyGroups(param)
        if (!response) {
          this.SgTableData = []
          return
        }

        response.sort((a, b) => {
          if (a?.createTime < b?.createTime) return 1
          else if (a?.createTime > b?.createTime) return -1
          else return 0
        })

        this.sgTableData = await this.setData(response)

        this.filtering()
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.sgTableData = []
        this.$alert(message || this.$v('{name} 조회에 문제가 발생했습니다. 관리자에게 문의해주세요.', { name: '보안그룹' }), '알림', {
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
        sw.name = sw.securityGroupName
        sw.idx = sw.securityGroupIdx
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
     * @parapm {String} field 'sg'인지ㅡ 'sg'인지 ..
     * @param {Number} 각 아이템의 고유 Idx 값
     */
    selectRow (row, field, idx) {
      // console.log('row : ', row)
      this.routeTo({
        name: 'set-resource-security-detail',
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
        this.isOpenSgModal = false
      })
    },
    /**
     * 체크 -> [삭제] 클릭 시
     */
    applyRemove () {
      if (!this.checkedRows?.length) return

      this.$confirm(this.$t('common.CONFIRM.BASE.032'), '삭제', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        console.log(this.checkedRows[0])

        this.deleteNetworkSg(this.checkedRows[0])
      }).catch(() => false)
    },

    gridSetInit () {
      this.gridRefresh(this.grid)

      this.sgTableData = this.sgTableData.map(item => {
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
    async deleteNetworkSg (row) {
      console.log('🚀 ~ file: SetResourceSwitchSgList.vue:407 ~ deleteNetworkSg ~ row:', row)
      const {
        groupIdx,
        groupName,
        projectIdx,
        securityGroupIdx
      } = row

      const requestData = {
        isUrgent: false,
        reqUserId: this.user.userId,
        securityGroupIdx
      }

      const payload = {
        beforePrice: row?.beforePrice || 0,
        groupIdx,
        groupName,
        isUrgent: false,
        price: row?.price || 0,
        projectIdx,
        requestData,
        service: 'SECURITY',
        userId: this.user.userId,
        userName: this.user.userName
      }
      const res = await API.work_v3.deleteNetworkSg(payload)

      if (res) {
        this.$alert(this.$t('common.ALERT.NETWORK.023'))
        this.getNetworkSgList()
      } else this.$alert(this.$t('common.ALERT.BASE.038'))
    },
    /**
     * CMP 외부 생성 자원 보기 필터링 이벤트
     */
    filtering () {
      if (!this.filterCreateTypeRegisterChecked) this.filteredSgData = this.sgTableData
      else {
        this.filteredSgData = this.sgTableData.filter(item => {
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
      totalResultCntSdn: 0,
      totalResultCntLeg: 0,
      loading: false,
      isLoadingUpdate: false,
      projectIdx: null,
      dropdownData: {},
      checkedSdn: [],
      checkedRows: [],
      selectedItem: null,
      filteredSgData: [],
      sgTableData: [],
      sgColumns: [
        { binding: 'createType', header: ' ', width: 80, customHtml: true, filtable: false },
        { header: this.$v('보안그룹명'), binding: 'securityGroupName', align: 'left', width: 200 },
        { header: this.$v('시작일'), binding: 'startTime', width: 150 },
        { header: this.$v('만료일'), binding: 'endTime', customHtml: true },
        { header: this.$v('요청자'), binding: 'requestUserIdx' },
        { header: this.$v('요청일'), binding: '...' } // 요청일
      ],
      filterCreateTypeRegisterChecked: false, // 필터링 > CMP 외부 생성 자원 보기 (미등록 -> 등록)

      // LEGACY 모달 관련
      tableData: [],
      beforeData: null,
      isOpenSgModal: false,
      isOpenSgModalStep: false,
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
</style>
