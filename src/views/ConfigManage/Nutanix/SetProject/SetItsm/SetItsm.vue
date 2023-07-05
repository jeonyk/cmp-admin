<template>
  <div class="container">
    <!-- <button
      @click="openExternalModal = true"
      class="button"
      type="is-primary"
    >
      ITSM {{ $v('외부연동') }}
    </button> -->
    <nav class="metering-status-body">
      <div>
        <h2 class="title">
          {{ $v("검색 카테고리") }}
        </h2>
        <dashboard-panel
          class="body-panel -left"
          :padding-top="0"
          v-loading="loading.tree"
          element-loading-background="rgba(0, 0, 0, 0)"
          style="background: #0a0c20"
        >
          <section class="options-container">
            <div class="os-row row">
              <label class="label">{{ $v("검색") }}</label>
              <el-select
                v-model="searchType"
                style="width: 120px"
                @change="
                  () => {
                    searchKeyword = '';
                  }
                "
              >
                <el-option
                  v-for="x in searchOptions"
                  :key="x.changeValue"
                  :label="x.label"
                  :value="x.value"
                />
              </el-select>
              <el-input
                v-model="searchKeyword"
                style="width: 180px"
                placeholder="검색어를 입력해주세요"
                suffix-icon="el-icon-search"
                @change="onSearch"
              />
            </div>

            <div
              v-if="isExternalLinked"
              class="row"
            >
              <label class="label">{{ $v("동기화") }}</label>
              <div style="padding-left: 5px">
                <el-checkbox-group
                  v-model="checkList"
                  style="display: flex"
                  @change="onSearch"
                >
                  <el-checkbox :label="4">
                    {{ $v("정상") }}
                  </el-checkbox>
                  <el-checkbox :label="3">
                    {{ $v("전송 실패") }}
                  </el-checkbox>
                  <el-checkbox :label="2">
                    {{ $v("정보 불일치") }}
                  </el-checkbox>
                  <el-checkbox :label="1">
                    {{ $v('동기화 실패') }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </div>

            <div class="row">
              <label class="label">{{ $v("폐기 포함") }}</label>
              <div>
                <el-switch
                  v-model="isDeleteIncluded"
                  @change="onSearch"
                />
              </div>
            </div>
          </section>

          <div class="side-tree-area tiny-scroll">
            <g-tree
              :data="projectTree"
              class="project-tree"
              :view-line="true"
              :selectable-company="true"
              :unique-key="searchType"
              :init-open="isTreeOpen"
            >
              <template #title="{ node }">
                <span
                  class="vm-node"
                  :class="getStatusClass(node.status)"
                  style="padding: 5px 0px"
                  @click="clickNode(node)"
                >{{ node.groupName }}</span>
                <sapn
                  v-if="node.isVm && node.status === 3"
                  class="node-detail"
                >
                  <triangle-warning-icon />
                  {{ $v("전송 실패") }}
                </sapn>
                <span
                  v-if="node.isVm && node.status === 2"
                  class="node-detail"
                >
                  <triangle-warning-icon />
                  {{ $v("정보 불일치") }}
                </span>
              </template>
            </g-tree>
          </div>
        </dashboard-panel>
      </div>
    </nav>
    <main
      v-if="isVmSelected"
      class="main"
      style="padding: 0px 50px; width: 1130px"
    >
      <template>
        <section>
          <header
            style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 15px;
            "
          >
            <div style="display: flex; align-items: center">
              <h2>{{ $v("자원 정보") }}</h2>
            </div>
            <div v-if="isExternalLinked">
              <button
                @click="viewExternalModal(selectedVm)"
                class="button"
                type="is-primary"
              >
                ITSM {{ $v("외부연동") }}
              </button>
            </div>
          </header>
          <vertical-table
            v-if="selectedVmInfo && Object.keys(selectedVmInfo).length > 0"
            class="resource-info-table"
            type="horizontal"
            :data="selectedVmInfo"
            :columns="resourceColumns"
          >
            <template #installProgram="{ row }">
              <div>{{ getInstallPrograms(row.installProgram) }}</div>
            </template>
          </vertical-table>
          <div
            v-else
            class="empty-data"
          >
            {{ $v("데이터가 없습니다.") }}
          </div>
        </section>
      </template>
      <template>
        <section style="margin-top: 50px">
          <h2 style="margin-bottom: 15px">
            {{ $v("티켓 정보") }}
          </h2>
          <cmp-grid
            :item-source="ticketTables"
            :columns="ticketColumns"
            selectable
            @selectedRow="selectTicket"
          >
            <template #orderType="{ row }">
              <div>{{ orderTypeKor[row.orderType] }}</div>
            </template>
            <template #requestedDate="{ row }">
              <div>{{ row.requestedDate | date("YYYY-MM-DD") }}</div>
            </template>
            <template #originalDocument="{ row }">
              <div
                class="document"
                @click="
                  ($event) => {
                    clickTicket(row, $event);
                  }
                "
              >
                <approved-detail-origin
                  class="origin-document"
                  :data="row.clientApprovalDetailRsp"
                  :button="row.originalDocument"
                  style="text-align: left"
                />
              </div>
            </template>
            <template #plan="{ row }">
              <div
                class="document"
                @click="
                  ($event) => {
                    openDocument(row.plan, 'PREVIEW', $event, row);
                  }
                "
              >
                {{ getApprovalNo(row.plan, "PREVIEW") }}
              </div>
            </template>
            <template #aaReport="{ row }">
              <div
                class="document"
                @click="
                  ($event) => {
                    openDocument(row.aaReport, 'PREVIEW_URGENT', $event);
                  }
                "
              >
                {{ getApprovalNo(row.aaReport, "PREVIEW_URGENT") }}
              </div>
            </template>
            <template #report="{ row }">
              <div
                class="document"
                @click="
                  ($event) => {
                    openDocument(row.report, 'TODO', $event);
                  }
                "
              >
                {{ getApprovalNo(row.report, "TODO") }}
              </div>
            </template>

            <template #orderRsp="{ row }">
              <div
                @click="
                  ($event) => {
                    routeToDonePage(row, $event);
                  }
                "
                class="document"
              >
                {{ getOrderNo(row.orderRsp, true) }}
              </div>
            </template>
            <template #orderCreatedTime="{ row }">
              <div>{{ row.orderCreatedTime | date("YYYY-MM-DD") }}</div>
            </template>
          </cmp-grid>
        </section>
      </template>
      <template>
        <section
          v-if="orderInfo && Object.keys(orderInfo).length && orderInfo.title"
          style="margin-top: 50px"
        >
          <header
            style="display: flex; align-items: center; margin-bottom: 15px"
          >
            <h2>{{ $v("주문 정보") }}</h2>
          </header>
          <vertical-table
            type="horizontal"
            :data="orderInfo"
            :columns="orderInfoColumns"
          />
        </section>
      </template>
      <template>
        <dashboard-panel
          v-if="memos && memos.length"
          class="order-list"
          :title="$v('관리자 메모')"
          foldable
          foldable-type="ICON"
          style="margin-top: 50px"
        >
          <div style="max-height: 500px; overflow-y: auto">
            <task-memo
              is-system-mode
              :data="memos"
            />
          </div>
        </dashboard-panel>
      </template>
      <template>
        <dashboard-panel
          class="order-list"
          :title="$v('이벤트')"
          foldable
          foldable-type="ICON"
          style="margin-top: 50px"
        >
          <total-count :total-count="eventTables.length" />
          <cmp-grid
            :item-source="eventTables"
            :columns="eventColumns"
            selectable
            @selectedRow="selectTicket"
          >
            <template #userId="{ row }">
              <div>{{ row.userId | maskingName }}</div>
            </template>
            <template #resourceMethod="{ row }">
              <div>
                {{ resourceMethodKor[row.resourceMethod] }}
              </div>
            </template>

            <template #result="{ row }">
              <div>{{ row.result ? $v("성공") : $v("실패") }}</div>
            </template>

            <template #createdTime="{ row }">
              <div>{{ row.createdTime | date }}</div>
            </template>
          </cmp-grid>
        </dashboard-panel>
        <!-- </section> -->
      </template>
    </main>
    <div
      v-else
      class="empty-data"
      style="
        flex: 1;
        vertical-align: text-top;
        display: flex;
        align-items: top;
        align-items: flex-start;
      "
    >
      <h2 style="margin-top: 50px; margin-right: 350px">
        {{ $v("VM을 선택해주세요.") }}
      </h2>
    </div>
    <el-dialog
      @close="
        () => {
          isModalLoading = true;
          isModalOpen = false;
        }
      "
      :visible="isModalOpen"
      width="1400px"
      title="결재 상세"
    >
      <div
        v-loading="isModalLoading"
        style="height: 500px; overflow-y: auto"
      >
        <approved-detail-template
          v-if="!isModalLoading"
          :data="selectedDocument"
          :order-list="[...selectedDocument.workByItem]"
          :approvers="selectedDocument.approverRsps"
        />
      </div>
    </el-dialog>
    <el-dialog
      :visible="openExternalModal"
      width="1000px"
      @close="openExternalModal = false"
      :title="$v('ITSM 외부 데이터')"
    >
      <article>
        <header
          style="
            display: flex;
            justify-content: space-between;
            padding-bottom: 10px;
          "
        >
          <h2 />
          <p>{{ selectedExternal.lastSyncTime | date }}</p>
        </header>
        <div style="max-height: 600px; overflow-y: auto">
          <vertical-table
            :data="selectedExternal.data"
            :columns="selectedExternal.columns"
          >
            <template
              v-for="column in selectedExternal.columns"
              :slot="column.binding"
              slot-scope="props"
            >
              <div
                class="external-row"
                :key="column.binding"
              >
                <div>
                  {{ getValueByProp(props.row[column.binding], "before") }}
                </div>
                <div :class="getClass(props.row[column.binding])">
                  {{ getValueByProp(props.row[column.binding], "after") }}
                </div>
              </div>
            </template>
          </vertical-table>
        </div>
        <footer
          style="
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 30px;
          "
        >
          <button
            class="button"
            @click="openExternalModal = false"
          >
            {{ $v("취소") }}
          </button>
          <button
            :disabled="disableByVmStatus(selectedVm) || isSyncing"
            class="button"
            type="is-primary"
            @click="syncExternalData"
          >
            {{ $v("CMP 외부 ITSM") }}
          </button>
        </footer>
      </article>
    </el-dialog>
  </div>
</template>
<script>
import API, { GTree, DashboardPanel, VerticalTable } from '@sd-fe/cmp-core'
import TaskMemo from '@/views/Task/Nutanix/TaskMemo/TaskMemo.vue'
import ApprovedDetailTemplate from '@/views/Task/Nutanix/TaskApproved/ApprovedDetail/ApprovedDetailTemplate.vue'
import ApprovedDetailOrigin from '@/views/Task/Nutanix/TaskApproved/ApprovedDetail/ApprovedDetailOrigin.vue'
import { mapState } from 'vuex'
import { cloneDeep } from 'lodash'
import TriangleWarningIcon from '@/components/Icons/TriangleWarningIcon.vue'
export default {
  name: 'MeteringStatus',
  components: {
    'dashboard-panel': DashboardPanel,
    'g-tree': GTree,
    VerticalTable,
    TaskMemo,
    'approved-detail-template': ApprovedDetailTemplate,
    'approved-detail-origin': ApprovedDetailOrigin,
    TriangleWarningIcon
  },
  provide () {
    return {
      $field_V3: () => 'DONE',
      $orderType: () => 'NEW'
    }
  },
  computed: {
    ...mapState({
      csp: (state) => state.cloud.cloud.toUpperCase()
    }),
    selectedCsp () {
      return (
        {
          NUTANIX: 'NX'
        }[this.csp] ?? this.csp
      )
    },
    selectedVmInfo () {
      const hasData = Object.keys(this.selectedVm)?.length > 0
      if (hasData) {
        return {
          resourceName: this.selectedVm?.vmName,
          manageGroupName: this.selectedVm?.manageGroupName,
          networkCategory: '마포-SDN-내부',
          hostname: this.selectedVm?.hostname,
          taskName: 'deba 차세대 웹서버 #1',
          vcpu: String(this.selectedVm?.vcpu),
          memory: String(this.selectedVm?.memory),
          rootDiskSize: String(this.selectedVm?.rootDiskSize),
          localDisk: '-',
          osImage: this.selectedVm?.osName,
          ip: '-',
          installProgram: this.selectedVm?.installProgramList
        }
      } else {
        return null
      }
    },
    eventTables () {
      return this.selectedVmItsm?.taskEventHistoryRsps || []
    },
    ticketTables () {
      return this.selectedVmItsm?.ticketTables?.map((x) => {
        return {
          ...x,
          originalDocument: x?.clientApprovalDetailRsp?.approvalNo,
          orderType: x?.orderType,
          requester: x?.clientApprovalDetailRsp?.approvee?.name,
          requestedDate: x?.clientApprovalDetailRsp?.createTime,
          previewUrgentRequest: '-',
          todoRquest: x,
          doneRquest: x
        }
      })
    },
    selectedTicket () {
      return this.selectedVmItsm?.ticketTables?.find(
        (table) =>
          table.clientApprovalDetailRsp.approvalNo === this.selectedTicketNo
      )?.clientApprovalDetailRsp?.order
    },
    orderInfo () {
      return {
        ...this.selectedTicket,
        company: this.selectedTicket?.clientApprovalRsp?.approveeCompany?.name,
        group: this.selectedTicket?.clientApprovalRsp?.approveeGroup?.name,
        title: this.selectedTicket?.clientApprovalRsp?.title,
        orderer: this.selectedTicket?.orderer?.name
      }
    },
    memos () {
      return this.selectedVmItsm?.ticketTables?.find(
        (table) =>
          table.clientApprovalDetailRsp.approvalNo === this.selectedTicketNo
      )?.memoRsps
    }
  },
  async created () {
    await this.checkIfConnected() // ITSM 내부/외부 설정 확인
    if (this.isExternalLinked) {
      await this.getInsightList() // 외부인 경우 ITSM_INSIGHT_LIST 적용
    }
    this.init()
  },
  methods: {
    async syncExternalData (vm) {
      try {
        this.isSyncing = true
        const uuid = vm.vmUuid
        const data = await API.work_v3.syncItsmInsightById(uuid)
        this.isSyncing = false
        console.log(data)
      } catch (error) {
        this.isSyncing = false
        return this.$alert('에러가 발생했습니다. <br> 관리자에게 문의하세요.')
      }
    },
    disableByVmStatus (vm) {
      if (vm.status === 3) return false // 전송 실패인 경우(failMessage) 에만 동기화 버튼을 활성화 시켜준다
      return true
    },
    getStatusClass (status) {
      return this.status[status]
    },
    setVmStatusByInsight (vmUuid) {
      if (!this.isExternalLinked) return 4
      const has = this.itemList?.find((itsm) => itsm.resource === vmUuid)
      if (!has) {
        return 1
      } else {
        if (has.failMessage) return 3
        if (!this.compareObjects(has.cmpVmJson, has.insightJson)) return 2
        return 4
      }
    },
    isSyncMatched (vmUuid) {
      // 동기화 된 정보가 불일치하는 경우 ->
      if (!this.isExternalLinked) return true
      const hasItem = this.itemList?.find(
        (itsm) => itsm.resourceUuid === vmUuid
      )
      if (hasItem) {
        const isSame = false
        return isSame
      }
      return true // insights 데이터가 없으면 true로 기본 UI 표시
    },
    isSynced (vmUuid) {
      if (!this.isExternalLinked) return true
      const hasExternalItem = this.itsmList?.find(
        (itsm) => itsm.resourceUuid === vmUuid
      )
      if (hasExternalItem) return true
      return false
    },
    viewExternalModal (selectedVm) {
      this.openExternalModal = true
      const vmUuid = selectedVm?.vmUuid
      this.getExternalItsm(vmUuid)
    },
    async checkIfConnected () {
      try {
        const response = await API.work_v3.getConfigItsm()
        if (typeof response === 'string') {
          this.isExternalLinked = false
          return
        }
        this.isExternalLinked = true
      } catch (error) {
        this.isExternalLinked = false
      }
    },
    async getInsightList () {
      // 연결 된 경우
      const data = await API.work_v3.getItsmInsightList({
        csp: this.csp
      })
      const test = {
        resourceUuid: 'a61ff964-e151-40bb-82ce-f973086ccbe0',
        insightName: null,
        insightId: 9999,
        cmpVmJson: {
          1282: 'jdh-vm-plz',
          1283: '10.101.68.25',
          1304: 'SINCAS-8422',
          1305: 'SINCAS-8422',
          1306: '서버(가상화)',
          1307: 'LEGACY',
          1311: '1',
          1312: '1',
          1313: '-2',
          1314: 'LINUX',
          1315: 'CentOS 7.9',
          1336: 'AHA',
          1366: 'SINCAS-6282',
          1243: '샘플 시스템명'
        },
        // insightJson: null,
        insightJson: {
          1282: 'jdh-vm-plz-test',
          1283: '10.101.68.25',
          1304: 'SINCAS-8422',
          1305: 'SINCAS-8422',
          1306: '서버(가상화)-test',
          1307: 'LEGACY',
          1311: '1',
          1312: '1',
          1313: '-2',
          1314: 'LINUX-test',
          1315: 'CentOS 7.9',
          1336: 'AHA',
          1366: 'SINCAS-6282'
        },
        failMessage: null,
        lastSyncTime: '2023-06-01T04:09:00.000+00:00',
        createdTime: '2023-06-01T04:09:00.000+00:00',
        keyLabels: [
          {
            insightKey: 1366,
            label: 'CMDB 구분'
          },
          {
            insightKey: 1243,
            label: '시스템명'
          },
          {
            insightKey: 1282,
            label: '호스트명'
          },
          {
            insightKey: 1283,
            label: 'IP'
          },
          {
            insightKey: 1582,
            label: 'VIP'
          },
          {
            insightKey: 1302,
            label: '상태'
          },
          {
            insightKey: 1304,
            label: '자산구분'
          },
          {
            insightKey: 1305,
            label: '담당고객사'
          },
          {
            insightKey: 1306,
            label: '장비구분'
          },
          {
            insightKey: 1307,
            label: '센터구분'
          },
          {
            insightKey: 1982,
            label: '관리파트'
          },
          {
            insightKey: 1311,
            label: 'Core개수'
          },
          {
            insightKey: 1312,
            label: '메모리'
          },
          {
            insightKey: 1313,
            label: '디스크'
          },
          {
            insightKey: 1314,
            label: 'OS구분'
          },
          {
            insightKey: 1315,
            label: 'OS버전1'
          },
          {
            insightKey: 1602,
            label: 'DB구분'
          },
          {
            insightKey: 1334,
            label: 'DB버전1'
          },
          {
            insightKey: 1335,
            label: 'DB버전2'
          },
          {
            insightKey: 1336,
            label: '가상화방법'
          },
          {
            insightKey: 1340,
            label: '서버클러스터종류'
          },
          {
            insightKey: 1341,
            label: '유지보수업체'
          },
          {
            insightKey: 1586,
            label: '비고'
          }
        ]
      }
      console.log('#test', test)
      this.itsmList = data
      //  존재하는 경우 VM uuiD -> inslightUUid
    },
    getClass (valueObj) {
      if (valueObj?.isWarning) return 'is-different'
      return ''
    },
    getValueByProp (valueObj, propName) {
      console.log('#getValueByProp()')
      console.log(valueObj)
      return valueObj?.[propName] || '-'
    },
    getExternalItsm (vmUuid) {
      const targetId = vmUuid
      const hasExternalItem = this.itsmList.find(
        (itsm) => itsm.resourceUuid === targetId
      )
      if (hasExternalItem) {
        this.selectedExternal.columns = this.setColumnsByKeyProp(
          hasExternalItem.keyLabels
        )
        this.selectedExternal.data = this.setExternalData(hasExternalItem)
        this.selectedExternal.isEqual = this.compareObjects(
          hasExternalItem.cmpVmJson,
          hasExternalItem.insightJson
        )
        this.selectedExternal.lastSyncTime = hasExternalItem.lastSyncTime
      }
    },
    compareObjects (object1, object2) {
      return JSON.stringify(object1) === JSON.stringify(object2)
    },
    setColumnsByKeyProp (keyLabels) {
      const result = []
      for (const x of keyLabels) {
        console.log('X', x)
        result.push({
          binding: String(x.insightKey),
          header: x.label,
          customHtml: true
        })
      }
      return result
    },
    setExternalData (selectedObj) {
      const result = {}

      for (const prop in selectedObj.cmpVmJson) {
        const cmpPropValue = selectedObj.cmpVmJson[prop] || '-'
        const insigntPropValue = selectedObj.insightJson[prop] || '-'

        result[prop] = {
          before: cmpPropValue,
          after: insigntPropValue,
          isWarning: this.checkWarningValidation(
            cmpPropValue,
            insigntPropValue
          )
        }
      }
      return result
    },
    checkWarningValidation (before, after) {
      if (
        before &&
        before !== '-' &&
        after &&
        after !== '-' &&
        before !== after
      ) { return true }
      return false
    },
    compareValue (before, after) {
      return before === after
    },
    getInstallPrograms (list) {
      const result = list?.map((x) => x.softwareName).join(', ')
      if (result && result.length) return result
      return '-'
    },
    filterByChildren (x) {
      return x.children && x.children.length > 0
    },
    filterByDelete (x) {
      return this.isDeleteIncluded ? true : !x.isDeleted
    },
    onSearch () {
      this.isTreeOpen = true // 검색 사용한 경우 무조건 펼침
      this.loading.tree = true
      const selectedTree = this.clonedList
        .map((company) => ({
          ...company,
          children: company.children
            .map((project) => ({
              ...project,
              isOpen: true,
              children: project.children
                .filter(this.filterBySearch)
                .filter(this.filterByCheckboxStatus)
            }))
            .filter(this.filterByChildren)
        }))
        .filter(this.filterByChildren)

      this.updateProjectTree(selectedTree)
    },
    filterByCheckboxStatus (vm) {
      if (!this.isExternalLinked) return true
      if (this.checkList.length === 0) return true // 선택 안 된 경우 다 노출
      return this.checkList.includes(vm.status)
    },
    filterBySearch (vm) {
      const searchType = this.searchType
      const searchKeyword = this.searchKeyword.toLowerCase()
      const vmSearchType = vm[searchType]

      if (Array.isArray(vmSearchType)) {
        return (
          vmSearchType.some((item) =>
            item.toLowerCase().includes(searchKeyword)
          ) && this.filterByDelete(vm)
        )
      } else {
        return (
          vmSearchType &&
          vmSearchType.toLowerCase().includes(searchKeyword) &&
          this.filterByDelete(vm)
        )
      }
    },
    updateProjectTree (selectedTree) {
      setTimeout(() => {
        this.projectTree = selectedTree
        this.loading.tree = false
      }, 500)
    },
    async setManageGroupName (vm) {
      // VM의 운영그룹 데이터 맵핑
      const { data } = await API.billing.getOperationGroup({
        moduleType: this.selectedCsp,
        operatingGroupIdx: vm.manageGroupIdx
      })
      if (data.length) {
        vm.manageGroupName = data[0].operatingGroupName
      } else {
        vm.manageGroupName = ''
      }
    },
    routeToDonePage (row, e) {
      e.preventDefault()
      const orderNo = this.getOrderNo(row.orderRsp)
      if (orderNo === '-') return
      const params = {
        name: 'done-detail',
        params: {
          id: orderNo
        }
      }

      return this.$router.push(params)
    },
    openDocument (data, type, e, row) {
      e.preventDefault()
      if (this.getApprovalNo(data) === '-') return
      this.selectedDocument = data
      this.isModalOpen = true
      setTimeout(() => {
        this.isModalLoading = false
      }, 500)
    },
    clickTicket (row, e) {
      e.preventDefault()
      const ticket = row?.dataItem?.clientApprovalDetailRsp?.approvalNo
      this.selectedTicketNo = ticket
    },
    getOrderNo (data, flag) {
      const key = Object.keys(data.itemRoleGroup)[0]
      const roles = data?.itemRoleGroup?.[key]
      const foundDoneState = roles.some((x) => x.orderItemStatus === 'DONE')
      if (foundDoneState && data.orderNo) {
        if (flag) return this.$v('보기')
        return data.orderNo
      }
      return '-'
    },
    getApprovalNo (data, type) {
      // data = 사전협의
      const approvalNo = data?.approvalNo || '-'
      return approvalNo
    },
    selectTicket (row) {
      const ticket = row?.dataItem?.clientApprovalDetailRsp?.approvalNo

      this.selectedTicketNo = ticket
    },
    resetMainData () {
      this.selectedVmInfo = null
      this.selectedVmItsm = null
    },
    async clickNode (node) {
      await this.resetMainData()

      const isVm = node.isVm
      console.log('#clickNode', isVm, node)
      await this.setManageGroupName(node)
      if (isVm) {
        // 선택된 node 가 VM인 경우에 ITSM API 호출
        this.isVmSelected = true
        setTimeout(async () => {
          const res = await API.work_v3.getItsmByVm({
            resourceIdx: node.userVmIdx,
            csp: this.csp
          })

          this.selectedVm = node
          this.selectedVmItsm = res
        }, 0)
      } else {
        this.isVmSelected = false
      }
    },
    setTreeSelectDefault (nodes) {
      nodes.forEach((node) => {
        node.selected = false
        if (node.children?.length) this.setTreeSelectDefault(node.children)
      })
    },
    init () {
      this.getGroupManageTree()
    },
    async getGroupManageTree () {
      try {
        this.loading.tree = true
        const response = await API.iam.getGroupManageTree({
          project: true,
          user: false
        })
        if (!response) return

        this.projectTree = this.setting(response)

        this.projectTree = this.projectTree.map(async (x) => {
          let allProjects = await API.iam.getProject({
            companyIdx: x.groupIdx
          })
          allProjects = allProjects.filter(
            (x) => x.moduleType === this.selectedCsp
          )
          const fetchProjects =
            this.selectedCsp === 'VMWARE'
              ? API.vmware.vm.getVmwareVmList
              : API.compute.getVms
          return {
            ...x,
            children: await Promise.all(
              allProjects.map(async (x) => {
                const data = await fetchProjects({ projectIdx: x.projectIdx })
                return {
                  groupName: x.projectName,
                  children: data.map((vm) => {
                    const ips = vm.nicIps?.map((nic) => nic.nicIp) || []
                    const vmName = vm.vmName || vm.name
                    return {
                      ...vm,
                      vmName,
                      groupName: vmName,
                      isVm: true,
                      ips: ips,
                      status: this.setVmStatusByInsight(), // insight 정보 기준으로 vm의 상태를 설정
                      isSynced: this.isSynced(vm.vmUuid), // 동기화 여부
                      isSyncMatched: this.isSyncMatched(vm.vmUuid)
                      // isDeleted: Math.random() > 0.5
                    }
                  })
                }
              })
            )
          }
        })
        console.log('#  ', this.projectTree)
        this.projectTree = await Promise.all(this.projectTree)
        this.projectTree = this.projectTree
          .map((company) => {
            // x.children 프로젝트들
            return {
              ...company,
              children: company.children
                .map((project) => {
                  return {
                    ...project,
                    children: project.children.filter(this.filterByDelete)
                  }
                })
                .filter(this.filterByChildren)
            }
          })
          .filter(this.filterByChildren) // 관계사 제거

        this.clonedList = cloneDeep(this.projectTree)
      } catch (error) {
        const message =
          error.response && error.response.data
            ? error.response.data.message
            : error.message
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
        throw error
      } finally {
        this.loading.tree = false
      }
    },
    setting (treeData, companyCode, isChild) {
      const data = []

      for (let i = 0; i < treeData.length; i++) {
        if (treeData[i].children && treeData[i].children.length > 0) {
          this.setting(
            treeData[i].children,
            companyCode || treeData[i].companyCode,
            true
          )
        }
        if (!isChild) {
          data.push(treeData[i])
        }
      }

      return data
    }

  },
  data () {
    return {
      status: {
        1: 'is-not-synced', // 동기화 X
        2: 'is-not-matched', // 동기화 O, 정보 불일치
        3: 'is-failed', // 동기화 O, failMessage 존재
        4: 'is-success' // default
      },
      selectedExternal: {
        columns: [],
        data: {},
        isEqual: false, // cmp 데이터와 외부 데이터 일치 시 사용
        lastSyncTime: ''
      },
      openExternalModal: false,
      isTreeOpen: false,
      clonedList: [],
      selectedOrderInfo: {},
      searchedItem: {},
      searchKeyword: '',
      searchType: 'vmName',
      searchOptions: [
        // { label: this.$v('업무명'), value: 'taskName' },
        { label: this.$v('자원명'), value: 'vmName' },
        { label: 'IP', value: 'ips' },
        { label: this.$v('OS 이미지명'), value: 'osName' }
      ],
      // selectedVmInfo: null,
      isVmSelected: false,
      resourceMethodKor: {
        CLONE: this.$v('복제'),
        POWER_ON: this.$v('POWER ON'),
        POWER_OFF: this.$v('POWER OFF'),
        DELETE_DATE: this.$v('삭제'),
        NEW: this.$v('신규'),
        CHANGE: this.$v('변경'),
        RUN: 'RUN'
      },
      isExternalLinked: false,
      orderTypeKor: {
        NEW: this.$v('신규'),
        CHANGE: this.$v('변경'),
        DELETE: this.$v('삭제'),
        URGENT: this.$v('긴급')
      },
      isModalLoading: true,
      selectedDocument: {},
      isModalOpen: false,
      checkList: [],
      eventColumns: [
        {
          binding: 'userName',
          header: this.$v('이름')
        },
        {
          binding: 'userId',
          header: this.$v('아이디'),
          customHtml: true
        },
        {
          binding: 'ip',
          header: 'IP'
        },
        {
          binding: 'resourceMethod',
          header: this.$v('요청 행위'),
          customHtml: true
        },
        {
          binding: 'result',
          header: this.$v('요청결과'),
          customHtml: true
        },
        {
          binding: 'createdTime',
          header: this.$v('시간정보'),
          customHtml: true
        }
      ],
      orderInfoColumns: [
        {
          binding: 'company',
          header: this.$v('관계사'),
          customHtml: true
        },
        {
          binding: 'title',
          header: this.$v('주문요청제목')
        },
        {
          binding: 'group',
          header: this.$v('조직')
        },
        {
          binding: 'createTime',
          header: this.$v('주문일')
        },
        {
          binding: 'projectName',
          header: this.$v('프로젝트명')
        },
        {
          binding: 'orderer',
          header: this.$v('주문자')
        },
        {
          binding: 'orderType',
          header: this.$v('구분')
        },
        {
          binding: 'expectDate',
          header: this.$v('처리일자')
        }
      ],
      selectedTicketNo: '',
      selectedVm: {},
      selectedVmItsm: {},
      resourceColumns: [
        {
          binding: 'resourceName',
          header: this.$v('자원명')
        },
        {
          binding: 'manageGroupName',
          header: this.$v('운영그룹')
        },
        {
          binding: 'networkCategory',
          header: this.$v('네트워크 카테고리')
        },
        {
          binding: 'hostname',
          header: this.$v('호스트 명')
        },
        {
          binding: 'taskName',
          header: this.$v('업무명')
        },
        {
          binding: 'vcpu',
          header: this.$v('VCPU')
        },
        {
          binding: 'memory',
          header: this.$v('Memory')
        },
        {
          binding: 'rootDiskSize',
          header: this.$v('RootDiskSize')
        },
        {
          binding: 'localDisk',
          header: this.$v('Local Disk')
        },
        {
          binding: 'osImage',
          header: this.$v('OS 이미지')
        },
        {
          binding: 'ip',
          header: this.$v('IP')
        },
        {
          binding: 'installProgram',
          header: this.$v('설치 프로그램'),
          customHtml: true
        }
      ],
      ticketColumns: [
        {
          binding: 'orderType',
          header: this.$v('분류'),
          width: 70,
          customHtml: true
        },
        {
          binding: 'originalDocument',
          header: this.$v('원본 문서'),
          width: 180,
          customHtml: true
        },
        { binding: 'requester', header: this.$v('주문자') },
        {
          binding: 'requestedDate',
          header: this.$v('주문일'),
          customHtml: true
        },
        {
          binding: 'plan',
          header: this.$v('사전협의 결재(일반)/기안자'),
          customHtml: true
        },
        {
          binding: 'aaReport',
          header: this.$v('사전협의 결재(긴급)/기안자'),
          customHtml: true
        },
        {
          binding: 'report',
          header: this.$v('할 일 결재/기안자'),
          customHtml: true
        },
        { binding: 'orderRsp', header: this.$v('한 일'), customHtml: true },
        {
          binding: 'orderCreatedTime',
          header: this.$v('완료일'),
          customHtml: true
        }
      ],
      testSelectedItsm: {},
      isDeleteIncluded: true,
      radioType: 'ALL',
      projectTree: [],
      loading: {
        tree: false,
        status: false,
        history: false
      }
    }
  }
}
</script>
<style lang="scss" scoped>
// 1: 'is-not-synced', // 동기화 X
// 2: 'is-not-matched', // 동기화 O, 정보 불일치
// 3: 'is-failed', // 동기화 O, failMessage 존재
// 4: 'is-success' // default
.container {
  .node-detail {
    display: flex;
    align-items: center;
    margin-left: 5px;
  }
  &::v-deep {
    .tree-label-text {
      display: flex;
      .is-not-synced {
        color: #fa5657;
      }
    }
  }
}

.tree-label-text {
  &::v-deep {
  }
  .-selected {
    .is-not-synced {
      color: inherit;
    }
  }
  // .is-not-synced {}
  // .is-not-matched {}
  // .is-failed {}
  // .is-success {}
}

.container {
  &::v-deep {
    .dashboard-panel {
      &.order-list {
        height: auto;
        .panel-title {
          font-size: 18px !important;
          font-weight: 700 !important;
        }
        .panel-body {
          border-top: none !important;
          padding: 0px !important;
        }
      }
    }
  }
}
.external-row {
  display: flex;
  div {
    flex-basis: 50%;
  }
}

.is-different {
  color: #fa5657;
}

.test {
  padding: 0px;
  box-sizing: border-box;
  position: fixed;
  top: 100px;
  left: 100px;
  z-index: 10;
  background: #0a0c20;
}

.origin-document {
  &::v-deep {
    .approval-view {
      font-size: 13px;
      color: #1977d2;
      border: none;
      background: transparent;
      padding: 0px;
    }
  }
}
.document {
  color: #1977d2;
}
.container {
  &::v-deep {
    .resource-info-table {
      // 자원 정보 스타일 조정
      .register-contents {
        &:first-child {
          width: 100%;
        }
        &:nth-of-type(2) {
          border-top: none !important;
        }
      }
    }
  }
}
.title {
  font-size: 16px;
  margin-bottom: 15px;
}
.options-container {
  padding: 0px 20px;
  &::v-deep {
    .el-input__icon {
      color: #fff !important;
    }
    .el-input__inner {
      border: none;
      border-bottom: 1px solid #3d435e;
    }
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 0px;
    &:first-child {
      padding-bottom: 30px;
      border-bottom: 1px solid #1f1e32;
    }
    &:nth-of-type(4) {
      border-bottom: 1px solid #1f1e32;
      margin-bottom: 30px;
    }
  }

  .label {
    font-weight: 700;
    color: #fff;
    font-size: 13px;
  }
  .last-date {
    color: #3e57c9;
    font-size: 12px;
  }
}

.container {
  display: flex;

  .main {
    flex: 1;
  }
  &::v-deep {
    .metering-status-body {
      display: flex;
      > .body-panel {
        height: 780px;
        &.-left {
          width: 450px;
          flex: 0 0 380px !important;
          min-height: 70vh;
          .project-tree {
            .tree-wrapper
              ul.tree-node
              > .node-item-label
              .node-title
              .tree-label-text.-selected {
              color: #7681ff;
              &::before {
                display: none;
              }
            }
            .project-list {
              padding: $gap-s 0;
              > .project-item {
                display: flex;
                align-items: center;
                margin-left: $gap;
                cursor: pointer;
                &.-selected {
                  color: #7681ff;
                }
              }
            }
          }
        }
      }
    }
  }
  .projet-tree {
    .wj-header {
      display: none;
    }
  }

  .empty {
    color: $disable;
    font-size: 12px;
  }
}
</style>
