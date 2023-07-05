<!--
  * 파일명 : SetIpDetail.vue
  * 파일 기능 : 구성관리 > IP대역 상세 정보 + 속한 IP 리스트 (IP 변경/삭제 기능, IP 검색 기능)
  * 작성자 : 이경환 외 2명
  * 최종 작성일 : 2021-02-03
  * License By Shinsegae I&C
  * 2021-02-03 fix: IP 상세 페이지 항목 변경 및 추가
 -->

<template>
  <dashboard-panel
    class="set-ip-detail body-panel -right"
    :title="parameterObj? parameterObj.vlanName: '상세'"
    :padding-top="0"
    v-loading="isIpDetail"
  >
    <template #headerPrefix>
      <button
        class="button -prev-button"
        type="is-icon"
        style="margin-right: 10px;"
        @click="routeTo({
          name: 'set-ip-list',
          query: { category: $route.query.category, ipCategoryIdx: ipCategoryIdx }
        })"
      >
        <i
          class="mdi mdi-chevron-left"
          size="is-large"
        />
      </button>
    </template>
    <section class="prev-data-info">
      <register-contents
        :title="$t(item.keyPath) || item.label"
        v-for="(item, idx) in detailInfo"
        :key="idx"
      >
        <span v-if="item.field === 'companyIdx'">{{ getRelation(item.value) }}</span>
        <span v-else>{{ item.value }}</span>
      </register-contents>
    </section>

    <section
      class="table-top-wrap"
      v-if="detailTableData.length"
    >
      <total-count
        class="total-count-wrap"
        :total-count="totalResultCnt"
      />

      <div class="button-area">
        <search-component
          v-model="filterKeyword"
          @input="filtering"
          :placeholder="$t('common.PLACEHOLDER.search')"
          :clearable="false"
        />
        <span class="divider" />
        <button
          class="button"
          :disabled="!selectedRow"
          type="is-primary"
          @click="e => applyUpdateIp(selectedRow)"
          :style="{ width: $i18n.locale === 'ko' ? '120px' : '150px' }"
        >
          {{ $t('common.BTN.CONF.setIp') }}
        </button>
        <button
          class="button"
          type="is-anti"
          @click="applyRemove"
          :disabled="!selectedRow"
          :style="{ width: $i18n.locale === 'ko' ? '100px' : '120px' }"
        >
          {{ $t('common.BTN.delete') }}
        </button>

        <!-- <button
          class="button"
          type="is-primary"
          @click="e => applyUpdateIp()"
        >
          항목 추가
        </button> -->
      </div>
    </section>
    <section
      class="table-area"
      v-if="detailTableData.length"
    >
      <cmp-grid
        :columns="detailColumns"
        :item-source="tableData"
        :init-custom-action="initGrid"
        selectable
        @selectedRow="selectRow"
        grid-id="theDetailGrid"
        :column-data-map="columnDataMap"
        :use-excel-download="true"
        @total-count="cnt => totalResultCnt = cnt"
        :init-auto-select-row="selectedRow"
        init-auto-select-row-key="ipIdx"
      >
        <template #assignDate="props">
          <span>{{ props.row.assignDate | date }}</span>
        </template>
        <template #updateTime="props">
          <span>{{ props.row.updateTime | date }}</span>
        </template>
        <!-- 마지막 동기 시간 -->
      </cmp-grid>
    </section>

    <!-- 항목 생성/수정 모달 -->
    <el-dialog
      :title="modalTitle"
      :visible.sync="newItemModal"
      class="new-item-modal"
      width="40%"
      @close="newItemModal = false"
    >
      <section
        class="modal-body"
        style="border-top: 1px solid #3D435E"
      >
        <register-contents
          title="IP"
          required
        >
          <el-input
            :placeholder="$t('common.ALERT.SECURITY.027')"
            v-model="updateItem.ip"
            disabled
          />
        </register-contents>
        <!-- IP -->

        <register-contents
          :title="$t('common.GRID.hostName')"
        >
          <el-input
            :placeholder="$t('config.IP.enter', { name: $t('common.GRID.hostName') })"
            v-model="updateItem.hostName"
          />
        </register-contents>
        <!-- 호스트명 -->

        <register-contents
          :title="$t('common.GRID.busiName')"
        >
          <el-input
            :placeholder="$t('config.IP.enter', { name: $t('common.GRID.busiName') })"
            v-model="updateItem.itsmName"
          />
        </register-contents>
        <!-- 업무명 -->

        <register-contents
          :title="$t('config.IP.systemManager')"
        >
          <el-input
            :placeholder="$t('config.IP.enter', { name: $t('config.IP.systemManager') })"
            v-model="updateItem.sysManager"
          />
        </register-contents>
        <!-- 시스템 담당자 -->

        <register-contents
          :title="$t('config.IP.request')"
        >
          <span>
            {{ updateItem.applyUserName }}
          </span>
          <button
            class="button"
            type="is-black"
            @click="isOpenApplySelection = true"
          >
            {{ $v('IP 신청자 선택') }}
          </button>
          <el-dialog
            :visible="isOpenApplySelection"
            append-to-body
            :title=" $v('IP 신청자')"
            width="780px"
            @close="isOpenApplySelection = false"
          >
            <transition name="fade">
              <select-from-tree
                v-if="isOpenApplySelection"
                class="selction-tree"
                @close="isOpenApplySelection = false"
                :data="applyUser"
                :trigger-btn="$refs"
                :is-one-manager="true"
                :use-header="false"
                @task-managers="(param) => {
                  applyUser = param
                }"
                :group-tree-data="groupTreeData"
                :loading="loading.isGroupTree"
                :user-group-idx="user.userGroup"
              />
            </transition>
          </el-dialog>
        </register-contents>
        <!-- IP 신청자 -->

        <register-contents
          :title="$t('config.IP.assign')"
        >
          <span>
            {{ updateItem.assignUserName }}
          </span>
          <button
            class="button"
            type="is-black"
            @click="isOpenAssignSelection = true"
          >
            {{ $v('IP 할당자 선택') }}
          </button>
          <el-dialog
            :visible="isOpenAssignSelection"
            append-to-body
            width="780px"
            :title=" $v('IP 할당자 선택')"
            @close="isOpenAssignSelection = false"
          >
            <transition name="fade">
              <select-from-tree
                v-if="isOpenAssignSelection"
                class="selction-tree"
                @close="isOpenAssignSelection = false"
                :data="assignUser"
                :is-one-manager="true"
                :trigger-btn="$refs"
                :use-header="false"
                @task-managers="(param) => {
                  assignUser = param
                }"
                :group-tree-data="groupTreeData"
                :loading="loading.isGroupTree"
                :user-group-idx="user.userGroup"
              />
            </transition>
          </el-dialog>
        </register-contents>
        <!-- IP 할당자 -->

        <!-- <register-contents
          title="VM 명"
        >
          <el-input
            placeholder="VM 명을 입력하세요."
            v-model="updateItem.vmName"
          />
        </register-contents> -->
        <!-- VM 명 -->

        <!-- <register-contents
          title="VM ID"
        >
          <el-input
            placeholder="VM ID을 입력하세요."
            v-model="updateItem.vmUuid"
          />
        </register-contents> -->
        <!-- VM ID -->

        <register-contents
          title="MAC"
        >
          <el-input
            :placeholder="$t('config.IP.enter', { name: 'MAC' })"
            v-model="updateItem.mac"
          />
        </register-contents>
        <!-- MAC -->

        <register-contents
          :title="$t('common.PLACEHOLDER.remark')"
        >
          <el-input
            :placeholder="$t('config.IP.enter', { name: $t('common.PLACEHOLDER.remark') })"
            v-model="updateItem.comments"
          />
        </register-contents>
        <!-- 비고 -->
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
          @click="applyUpdate"
          type="is-primary"
        >
          {{ $t('common.BTN.confirm') }}
        </button>
      </div>
    </el-dialog>
  </dashboard-panel>
</template>
<script>
import { mapState } from 'vuex'
import API, { DashboardPanel, SelectFromTree } from '@sd-fe/cmp-core'
import GridUtils from '@/components/Utils/GridUtils'
import { cloneDeep } from 'lodash'
// import AppTaskManager from '@/components/Modal/ApprovalMemberModal/AppTaskManager.vue'

export default {
  name: 'SetIpDetail',
  components: {
    'dashboard-panel': DashboardPanel,
    SelectFromTree
  },
  watch: {
    detailTableData (newVal) {
      // this.setData(newVal)
    },
    newItemModal (newVal) {
      if (newVal) this.setModalTitle()
    },
    applyUser: {
      deep: true,
      handler (newVal) {
        if (!newVal[0].userName) return
        this.updateItem.applyUser = newVal[0].userId
        console.log(newVal[0].userName, /\(.*\)/.test(newVal[0].userName) ? '' : this.maskString(newVal[0].userId))
        this.updateItem.applyUserName = (newVal[0].userName) + (/\(.*\)/.test(newVal[0].userName) ? '' : '(' + this.maskString(newVal[0].userId + ')'))
      }
    },
    assignUser: {
      deep: true,
      handler (newVal) {
        if (!newVal[0].userName) return
        this.updateItem.assignUser = newVal[0].userId
        this.updateItem.assignUserName = (newVal[0].userName) + (/\(.*\)/.test(newVal[0].userName) ? '' : '(' + this.maskString(newVal[0].userId + ')'))
      }
    }
  },

  userGroupIdx () {
    let groupIdx
    if (this.isAdmin) groupIdx = this.$store.state.auth?.user?.userGroup
    else groupIdx = this.$store.state.common?.userInfo?.userResDto?.userGroup
    return groupIdx
  },
  async created () {
    this.ipCategoryIdx = this.$route.query.ipCategoryIdx
    // const param = { ...this.$route.params }
    this.ipBandIdx = this.$route.params.ipBandIdx

    if (this.ipCategoryIdx !== undefined && this.ipCategoryIdx !== null) await this.getIpBands(this.ipCategoryIdx)

    if (this.parameterObj) {
      this.detailInfo = this.detailInfo.map(info => {
        for (const [key, value] of Object.entries(this.parameterObj)) {
          if (key === info.field) {
            // const obj = `{${key} : ${value}}`
            info.value = value
            // Object.defineProperty(info, {
            //   key: { value: value }
            // })
            // this.paramKeyArr.push(obj)
          }
        }

        console.log('eeeeeee')
        if (info.field === 'prefix') {
          info.value = this.extractPrefixFromCidr(this.parameterObj.ipRange)
        }
        return info
      })
    }
  },
  mounted () {
    this.init()
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  methods: {
    // 프리픽스를 반환합니다.
    extractPrefixFromCidr (cidr) {
      const subnetMaskArr = cidr.split('/')
      const subnetBits = subnetMaskArr[1]
      return subnetBits
    },
    maskString (str) {
      if (str.length < 2) {
        return str
      }
      const firstTwoChars = str.substring(0, 2)
      const maskedChars = firstTwoChars.replace(/./g, '*')
      return maskedChars + str.substring(2)
    },
    /**
     * 관계사-그룹 트리 데이터 조회
     */
    async getManageTree () {
      try {
        this.loading.isGroupTree = true
        const response = await API.iam.getGroupManageTree()
        if (!response) return
        this.groupTreeData = [...response]
      } catch (error) {
        this.groupTreeData = []
        this.loading.isGroupTree = false
        console.error(error)
        return this.$alert('그룹 트리 조회에 문제가 발생했습니다.', () => false)
      } finally {
        this.loading.isGroupTree = false
      }
    },

    init () {
      this.getGroupList({ groupUpper: 0 })
      // this.relationCompOptions = this.$route.params.relationCompOptions
      this.getIps(this.ipBandIdx)
      this.getManageTree()
    },
    async getIpBands (ipCategoryIdx) {
      try {
        if (ipCategoryIdx === undefined) return
        const response = await API.network.getIpBands(ipCategoryIdx)
        // this.findIpItem(response)
        this.parameterObj = this.findIpItem(response)

        this.$store.commit('common/ADD_PARAMETERS', {
          label: this.parameterObj?.ipRange ? this.parameterObj?.ipRange : this.$t('common.BTN.detail'),
          path: ''
        })

        // this.detailInfo.forEach(info => {
        //   for (const [key, value] of Object.entries(this.parameterObj)) {
        //     if (key === info.field) {
        //     // const obj = `{${key} : ${value}}`
        //       info.value = value
        //     // Object.defineProperty(info, {
        //     //   key: { value: value }
        //     // })
        //     // this.paramKeyArr.push(obj)
        //     }
        //   }
        // })
      } catch (error) {
      } finally {
      }
    },
    /**
     * ip목록 순회하며 해당 디테일에 해당하는 아이템을 찾아서 리턴합니다.
     */
    findIpItem (ips) {
      const filteredData = ips.filter(ip => Number(ip.ipBandIdx) === Number(this.ipBandIdx))
      // console.log(filteredData, this.ipBandIdx)
      if (filteredData.length) return filteredData[0]
    },
    async getIps (ipBandIdx) {
      try {
        this.isIpDetail = true
        this.ipBandIdx = this.$route.params.ipBandIdx
        const response = await API.network.getIps(ipBandIdx)

        this.detailTableData = response

        this.columnDataMap.assignDate = GridUtils.setColumnDataMap('assignDate', this.detailTableData, 'date')
        this.columnDataMap.updateTime = GridUtils.setColumnDataMap('updateTime', this.detailTableData, 'date')

        this.filtering()

        // console.log('&&&', this.detailTableData)
      } catch (error) {
      } finally {
        this.isIpDetail = false
      }
    },
    async getGroupList (param) {
      const response = await API.iam.getGroupList(param)
      if (!response) return

      // 관계사만 담아줌..
      const result = response.map(item => {
        return {
          label: item.groupName,
          field: item.groupIdx
        }
      })
      this.relationCompOptions = result
    },
    async createIp (ip) {
      try {
        await API.network.createIp(ip)
        this.$alert(this.$t('common.ALERT.BASE.040'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm')
        })
        this.selectedRow = null
      } catch (error) {
      } finally {
        await this.getIps(this.ipBandIdx)
      }
    },
    async updateIp (ipIdx, ip) {
      try {
        await API.network.updateIp(ipIdx, ip)
        this.$alert(this.$t('common.ALERT.BASE.035'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm')
        })
        this.selectedRow = null
      } catch (error) {
      } finally {
        await this.getIps(this.ipBandIdx)
      }
    },
    async deleteIp (ipIdx) {
      try {
        await API.network.deleteIp(ipIdx)
        this.$alert(this.$t('common.ALERT.BASE.039'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm')
        })
        this.selectedRow = null
      } catch (error) {
      } finally {
        await this.getIps(this.ipBandIdx)
      }
    },
    initGrid (grid) {
      this.grid = grid
    },
    getRelation (value) {
      const relation = this.relationCompOptions.find(p => p.field === Number(value))
      if (relation !== undefined) {
        return relation.label
      }
      return value
    },
    setData (data) {
      this.tableData = JSON.parse(JSON.stringify(data))
      this.tableData = this.tableData.map(row => {
        return {
          ...row,
          crud: ''
        }
      })
    },
    routeTo (to) {
      this.$router.push(to)
    },
    setModalTitle () {
      if (this.updateItem.crud === 'update') {
        this.modalTitle = this.$t('common.TERMS.itemChange')
      } else {
        this.modalTitle = this.$t('common.TERMS.itemAdd')
      }
    },
    gridRefresh (grid) {
      const cv = grid.collectionView
      cv.refresh()
    },
    selectRow (rowData) {
      this.selectedRow = rowData?._data ? rowData._data : null
    },
    /**
     * '상세' 텍스트 클릭 시, 상세 페이지로 이동합니다.
     */
    selectDetail (rowData) {
      const routingData = rowData
      if (routingData.crud === 'create') return

      this.routeTo({
        name: 'set-ip-detail',
        params: routingData
      })
    },
    /**
     * 템플릿 편집 -> 편집 전 데이터를 this.initData에 담아주고,
     * 업데이트 아이템을 세팅해줍니다. (생성/수정 구분을 위함)
     */
    applyUpdateIp (item) {
      this.updateItem = this.setUpdateItem(item)

      const { applyUser, applyUserName, assignUser, assignUserName } = this.updateItem
      this.applyUser = [{ userId: applyUser, userName: applyUserName }]
      this.assignUser = [{ userId: assignUser, userName: assignUserName }]
      if (item) this.initData = cloneDeep(item)
      this.newItemModal = true
    },
    /**
     * 업데이트 아이템 세팅
     * @return {Object} [변경]을 누르면 체크된 친구가 updateItem, [항목 추가]를 누르면 새로운 데이터 세팅
     */
    setUpdateItem (data) {
      if (data) {
        this.updateItem = cloneDeep(data)
        this.updateItem.crud = 'update'
        return this.updateItem
      } else {
        const newTemp = {
          crud: 'create',
          ipBandIdx: this.ipBandIdx,
          ip: '',
          hostName: '',
          vmName: '',
          vmUuid: '',
          mac: ''
        }
        return newTemp
      }
    },
    /**
     * [삭제] 버튼을 눌렀을 때, 선택한 row 삭제 여부를 리턴합니다.
     * @return {Boolean} 삭제 성공 여부
     */
    applyRemove () {
      this.$confirm(this.$t('common.CONFIRM.BASE.032'), '삭제', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.removeItems(this.selectedRow)
      }).catch(() => false)
    },
    /**
     * 선택된 로우들을 삭제합니다.
     */
    removeItems (removeObj) {
      const removeIdx = removeObj.ipIdx
      // console.log(removeIdx)
      this.deleteIp(removeIdx)
    },
    /**
     * 항목 생성/수정 모달에서 [확인]을 눌렀을 때 해당 로우 저장
     */
    applyUpdate () {
      this.$confirm(this.$t('common.CONFIRM.BASE.001'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.saveUpdatedIp(this.updateItem)
      }).catch(() => {
        return false
      })
    },
    /**
     * 항목 생성/수정 모달에서 [취소] 버튼을 눌렀을 때 발생하는 이벤트
     */
    cancelSave () {
      this.saveUpdatedIp(null)
      this.newItemModal = false
    },
    /**
     * 변경 모달 -> [확인]/[취소] -> 저장
     * @param {Object} updateItem emit으로 전달 받은 업데이트 된 템플릿 아이템, 없을 때 (저장 안하고 취소 눌렀을 때) 편집 전 상태로 돌려줍니다.
     */
    saveUpdatedIp (updateRow) {
      if (!updateRow) { // [취소] 눌렀을 때
        if (this.updateItem.crud === 'create') return
        // this.tableData[this.selectedRow.index] = JSON.parse(JSON.stringify(this.initData))
      } else {
        if (updateRow.crud === 'create') { // 아이템 생성일 때
          this.createIp(updateRow)
        } else { // 아이템 변경일 때
          this.updateIp(updateRow.ipIdx, updateRow)
        }
      }
      // this.gridSetInit()
      this.newItemModal = false
    },
    gridSetInit () {
      this.selectedRow = null
      this.$forceUpdate()
      this.gridRefresh(this.grid)
    },
    /**
     * 그리드 상단 필터 리셋
     * */
    resetFilter () {
      this.filterKeyword = ''
      this.filtering()
    },
    filtering (val = this.filterKeyword) {
      if (!val) {
        this.tableData = this.detailTableData
      } else {
        this.tableData = this.detailTableData.filter(item => {
          const {
            ip,
            hostName,
            itsmName,
            sysManager,
            applyUser,
            assignDate,
            assignUser,
            mac,
            comments
          } = item

          const rowStr = ip + hostName + itsmName + sysManager + applyUser + assignDate + assignUser + mac + comments
          if (rowStr.toLowerCase().includes(this.filterKeyword.toLowerCase())) return item
        })
      }
    }
  },
  data () {
    return {
      isOpenApplySelection: false,
      isOpenAssignSelection: false,
      totalResultCnt: 0,
      relationCompOptions: [],
      isIpDetail: false,
      selectedRow: null,
      modalTitle: '',
      newItemModal: false,
      tableData: [],
      initData: null,
      ipBandIdx: '',
      ipCategoryIdx: '',
      parameterObj: null,
      paramKeyArr: [],
      detailInfo: [
        { field: 'vlanId', label: 'VLAN ID' },
        { field: 'vlanName', label: 'VLAN 명', keyPath: 'common.GRID.NETWORK.vlanName' },
        { field: 'companyIdx', label: '관계사', keyPath: 'common.TERMS.rel' },
        // { field: 'serviceRangeType', label: '범위' },
        // { field: 'netType', label: '망 구분' },
        { field: 'ipRange', label: '대역', keyPath: 'config.IP.band' },
        { field: 'serviceType', label: '서비스 유형', keyPath: 'common.GRID.serviceType' },
        { field: 'serviceDiv', label: '서비스 구분' },
        { field: 'gatewayIpAddress', label: this.$v('게이트웨이') },
        { field: 'dnsIpAddress', label: 'DNS' },
        { field: 'prefix', label: 'Prefix' },
        { field: 'netmask', label: 'Netmask' },
        { field: 'comment', label: '설명', keyPath: 'common.GRID.explain' }
      ],
      detailColumns: [
        { header: 'IP', binding: 'ip', width: '0.9*' },
        { header: '호스트명', binding: 'hostName', width: '0.9*', keyPath: 'common.GRID.hostName' },
        { header: '업무명', binding: 'itsmName', width: '*', keyPath: 'common.GRID.busiName' },
        { header: '시스템 담당자', binding: 'sysManager', width: '*', keyPath: 'config.IP.systemManager' },
        { header: 'IP 신청자', binding: 'applyUserName', width: '*', keyPath: 'config.IP.request' },
        { header: 'IP 할당 일자', binding: 'assignDate', width: '*', customHtml: true, keyPath: 'config.IP.assignDate' },
        { header: 'IP 할당자', binding: 'assignUserName', width: '*', keyPath: 'config.IP.assign' },
        { header: 'MAC', binding: 'mac', width: '*' },
        { header: '동기 시간', binding: 'updateTime', width: '*', customHtml: true, keyPath: 'config.IP.syncDate' },
        { header: '비고', binding: 'comments', width: '*', keyPath: 'common.PLACEHOLDER.remark' }
      ],
      detailTableData: [],
      groupTreeData: [],
      loading: {
        isGroupTree: false
      },
      applyUser: [{ userId: '', userName: '' }],
      assignUser: [{ userId: '', userName: '' }],
      // 테이블 수정 정보
      updateItem: {
        ipIdx: '',
        ipBandIdx: '',
        ip: '',
        hostName: '',
        // vmName: '',
        // vmUuid: '',
        mac: '',
        itsmName: '', // 업무명
        comments: '', // 비고
        sysManager: '', // 시스템 담당자
        applyUser: '', // IP 신청자
        applyUserName: '',
        assignUser: '', // IP 할당자
        assignUserName: ''
      },
      columnDataMap: {
        updateTime: null
      },
      filterKeyword: ''
    }
  }
}
</script>
<style lang="scss">
  .set-ip-detail.dashboard-panel {
    .panel-body {
      padding-top: 0;
    }
    .prev-data-info {
      margin-bottom: $gap-m;
      border-top: 1px solid $border-color;
    }
  }

</style>
<style lang="scss" scoped>

//transition 효과
.fade-enter-active,
.fade-leave-active {
  transition: opacity;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
  transition-delay: 1s;
}
</style>
