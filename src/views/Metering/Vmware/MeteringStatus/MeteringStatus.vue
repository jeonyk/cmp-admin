<!--
  * 파일명 : MeteringStatus.vue
  * 파일 기능 : 미터링 > 서버현황 확인 기능, vm의 히스토리 확인 기능
  * 작성자 : 김예담 외 3명
  * 최종 작성일 : 2021-02-22
  * License By Shinsegae I&C
  * 2021-02-22 fix: [미터링 서버현황] - 히스토리 추가된 S/W, 삭제된 S/W 표기 통일
 -->

<template>
  <div class="metering-status">
    <div class="metering-status-body">
      <dashboard-panel
        class="body-panel -left"
        :title="`${$t('common.TERMS.ownerRel')} > ${$t('common.TERMS.project')}`"
        :padding-top="0"
        v-loading="loading.tree"
        element-loading-background="rgba(0, 0, 0, 0)"
      >
        <div
          class="side-tree-area tiny-scroll"
        >
          <g-tree
            :data="projectTree"
            class="project-tree"
            :select-object.sync="selectedModel"
            :view-line="true"
            @selected="setSelectModel"
            :selectable-company="true"
            :root-parent="hasRootGroup"
            no-root-toggle
          >
            <template #title="{ node }">
              <span @click.stop="setSelectModel(node)">{{ node.groupName }}</span>
            </template>

            <template #nodeDetail="{ node }">
              <ol
                class="project-list"
                v-if="node.groupProject && node.groupProject.length && node.isOpen"
              >
                <li
                  v-for="(item, idx) in node.groupProject"
                  :class="['project-item', {'-selected': item.projectIdx &&selectedModel && selectedModel.projectIdx === item.projectIdx}]"
                  :key="idx"
                  @click.stop="setSelectModel(item)"
                >
                  <i
                    class="mdi mdi-file-document-outline"
                    size="is-small"
                    style="margin-right: 5px;"
                  />
                  <span>
                    {{ item.projectName }}
                  </span>
                </li>
              </ol>
            </template>
            <!-- 트리 프로젝트 데이터 -->
          </g-tree>
        </div>
      </dashboard-panel>
      <!-- 소유관계사 > 프로젝트 -->

      <dashboard-panel
        class="body-panel -mid"
        :title="$t('meter.serverState')"
      >
        <div
          v-loading="loading.status"
          v-if="selectedModel"
        >
          <filtering-component
            @reset-data="resetDate"
          >
            <div class="filter-form">
              <span class="filter-name">{{ $t('bill.billPeriod') }}</span>
              <div class="filter-date">
                <el-date-picker
                  v-model="startDate"
                  type="date"
                  :clearable="false"
                  placeholder="Start Date"
                />
                <span class="date-line">~</span>
                <el-date-picker
                  v-model="endDate"
                  type="date"
                  :clearable="false"
                  placeholder="End Date"
                />
              </div>
            </div>
            <div
              class="filter-form"
              style="height: 100%"
            >
              <span class="filter-name">{{ $t('common.GRID.hostName') }}</span>
              <div
                class="filter-options"
                style="height: 100%;"
              >
                <wj-flex-grid-search
                  ref="theSearch"
                  :placeholder="$t('common.GRID.hostName')"
                  id="hostSearch"
                />
              </div>
            </div>
          </filtering-component>
          <section class="table-top-wrap">
            <total-count
              class="total-count-wrap"
              :total-count="totalResultCnt"
            />
          </section>
          <section class="table-area">
            <cmp-grid
              :item-source="serverTableData"
              :columns="serverColumnData"
              ref="grid"
              selectable
              @selectedRow="setSelectedHost"
              class="metering-server-grid"
              :column-data-map="columnDataMap"
              :use-excel-download="true"
              @total-count="cnt => totalResultCnt = cnt"
              searching
              search-box-id="hostSearch"
            >
              <template #nics="props">
                <span
                  v-if="props.row.nics.length > 1"
                >{{ props.row.nics[0] }} {{ $t('common.TERMS.other') }}
                  <el-tooltip
                    placement="bottom-end"
                    popper-class="panel-title-popper"
                    effect="light"
                  >
                    <template #content>
                      <span v-html="ipHtml(props.row.nics)" />
                    </template>
                    <a class="-link">{{ props.row.nics.length - 1 }}</a>
                  </el-tooltip>
                </span>

                <span v-else-if="props.row.nics.length === 1">{{ props.row.nics[0] }}</span>
                <span v-else />
              </template>

              <template #totalMemSize="props">
                <span>{{ props.row.totalMemSize | onlyGB(0, false) }}</span>
              </template>

              <template #assignDiskSize="props">
                <span>{{ props.row.assignDiskSize | onlyGB(0, false) }}</span>
              </template>

              <template #swCount="props">
                <view-box-cnt
                  :hover-info="props.row.useSwList"
                  type="is-white"
                  action-type="hover"
                >
                  <template #hoverItem="hoverItem">
                    {{ hoverItem.item.name }}
                  </template>
                  {{ props.row.useSwList.length }}
                </view-box-cnt>
              </template>

              <template #vgSum="props">
                <span>{{ props.row.vgSum }}</span>
              </template>
            </cmp-grid>
          </section>
        </div>
        <span
          v-else
          class="empty-zone"
        >{{ $t('meter.selectAffPro') }}</span>
      </dashboard-panel>

      <dashboard-panel
        class="body-panel -right"
        :title="`${historyTitle} ${$t('meter.history')}`"
        :padding-top="0"
      >
        <history-panel
          v-if="historyData.length"
          :history-data="historyData"
          v-loading="loading.history"
        />
        <span
          class="empty"
          v-else
        >{{ $t('meter.selectHistory') }}</span>
      </dashboard-panel>
    </div>
  </div>
</template>
<script>
import API, { GTree, DashboardPanel } from '@sd-fe/cmp-core'
import { uniq, cloneDeep } from 'lodash'

import HistoryPanel from '@/components/HistoryPanel/HistoryPanel'
import ViewBoxCnt from '@/components/ViewBoxCnt/ViewBoxCnt'
import Dayjs from 'dayjs'
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'MeteringStatus',
  components: {
    'dashboard-panel': DashboardPanel,
    'g-tree': GTree,
    'history-panel': HistoryPanel,
    'view-box-cnt': ViewBoxCnt
  },
  computed: {
    historyTitle () {
      return this.historyData.length && this.selectedHost
        ? this.selectedHost.hostName
        : ''
    },
    ...mapState({
      rootGroup: state => state.common.rootGroup
    }),
    ...mapGetters({
      moduleType: 'cloud/getModuleType'
    }),
    hasRootGroup () {
      return this.rootGroup ? { groupName: this.rootGroup, groupUpper: 0, isRootParent: true } : undefined
    }
  },
  created () {
    this.init()
  },
  methods: {
    init () {
      this.getGroupManageTree()
    },
    async getMeteringStatus (params) {
      try {
        this.loading.status = true
        const response = await API.metering.getMeteringStatus(params)
        if (!response) return
        this.setServerTableData(response)
      } catch (error) {
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
        throw error
      } finally {
        this.loading.status = false
      }
    },
    async getGroupManageTree () {
      try {
        this.loading.tree = true
        const response = await API.iam.getGroupManageTree({ project: true, user: false, moduleType: this.moduleType })
        if (!response) return
        this.projectTree = this.setting(response)
      } catch (error) {
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
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
      const unknown = null
      const infra = null
      const data = []

      for (let i = 0; i < treeData.length; i++) {
        if (treeData[i].projectIdx != null) {
          treeData[i].idx = 'project_' + treeData[i].projectIdx
          treeData[i].isProject = true
        } else {
          treeData[i].idx = 'group_' + treeData[i].groupIdx
          treeData[i].isProject = false
        }
        if (companyCode) {
          treeData[i].companyCode = companyCode
        }
        if (treeData[i].children && treeData[i].children.length > 0) {
          this.setting(treeData[i].children, (companyCode || treeData[i].companyCode), true)
        }
        if (treeData[i].groupProject && treeData[i].groupProject.length > 0) {
          this.setting(treeData[i].groupProject, (companyCode || treeData[i].companyCode), true)
        }
        if (!isChild) {
          data.push(treeData[i])
        }
      }
      if (!isChild) {
        if (infra) {
          infra.isProject = true
          data.push(infra)
        }
        if (unknown) {
          unknown.isProject = true
          data.push(unknown)
        }
        this.projectTree = data
      }

      return data
    },
    async getVmHistoryList (vmUuid) {
      try {
        this.loading.history = true
        this.historyData = []
        if (!vmUuid) {
          this.historyData = []
          return
        }

        const response = await API.metering.getVmHistoryList({ vmUuid: vmUuid })
        if (!response) return

        this.setHistoryData(response)
      } catch (error) {
        console.error(error)
        this.historyData = []
        this.$alert(error, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
      } finally {
        this.loading.history = false
      }
    },
    /**
     * 서버 현황 테이블 가공
     */
    setServerTableData (data) {
      const mappedTotalMems = []
      const mappedTotalDisks = []

      const tableData = data.map(item => {
        item.swCount = item.useSwList?.length ? item.useSwList.length : 0

        // Storage 합계
        if (item.useVgList?.length) {
          // 모두 더하고 Byte -> GB
          item.vgSum = this.$options.filters.byteToGb(
            // chargeDate가 있는 경우와 삭제되지 않은 Storage만 포함
            item.useVgList
              .filter(vg => vg.chargeDate && !vg.deleteReqDate)
              .reduce((prev, cur) => prev + cur.diskCapacityInBytes, 0)
          )
        } else item.vgSum = 0

        if (!item.isDeleted) {
          item.nics = item.nics.filter(e => e.ipAddress).map(ip => ip.ipAddress)
          if (item.chargeDate) item.chargeDateTemp = this.$options.filters.dateSimple(item.chargeDate)
          else item.chargeDateTemp = ''

          if (item.totalMemSize !== undefined) {
            mappedTotalMems.push({
              value: item.totalMemSize,
              caption: this.$options.filters.onlyGB(item.totalMemSize, 0, false)
            })
          }
          if (item.assignDiskSize !== undefined) {
            mappedTotalDisks.push({
              value: item.assignDiskSize,
              caption: this.$options.filters.onlyGB(item.assignDiskSize, 0, false)
            })
          }

          return item
        }
      })

      this.serverTableData = tableData
      this.serverTableDataBackup = cloneDeep(this.serverTableData)

      this.columnDataMap.totalMemSize = mappedTotalMems
      this.columnDataMap.assignDiskSize = mappedTotalDisks
    },
    /**
     * projectIdx 를 바탕으로 속한 그룹 정보(조직)를 리턴합니다
     */
    getGroupInfo (treeData, projectIdx) {
      for (let i = 0; i < treeData.length; i++) {
        const filtered = treeData[i].groupProject.filter(item => item.projectIdx === projectIdx)

        if (filtered?.length) {
          return filtered[0]
        }

        if (treeData[i].children.length) {
          const res = this.getGroupInfo(treeData[i].children, projectIdx)
          if (res) { return res }
        }
      }
    },
    setHistoryData (history) {
      const historyObjList = []
      history.forEach(item => {
        const historyObj = {
          historyCreateDate: item.historyCreateDate,
          detail: []
        }
        if (item.oldTotalCores !== item.newTotalCores) {
          const vcpuObj = {
            field: 'vCPU',
            history: {
              before: item.oldTotalCores ? item.oldTotalCores + ' Core' : 0 + ' Core',
              after: item.newTotalCores + ' Core'
            }
          }
          historyObj.detail.push(vcpuObj)
        }

        if (item.oldTotalMemSize !== item.newTotalMemSize) {
          const memObj = {
            field: 'Memory',
            history: {
              before: Math.round(item.oldTotalMemSize / (1024 * 1024 * 1024)) + ' GB',
              after: Math.round(item.newTotalMemSize / (1024 * 1024 * 1024)) + ' GB'
            }
          }
          historyObj.detail.push(memObj)
        }

        if (item.oldAssignDiskSize !== item.newAssignDiskSize) {
          const diskObj = {
            field: 'Disk',
            history: {
              before: Math.round(item.oldAssignDiskSize / (1024 * 1024 * 1024)) + ' GB',
              after: Math.round(item.newAssignDiskSize / (1024 * 1024 * 1024)) + ' GB'
            }
          }
          historyObj.detail.push(diskObj)
        }

        if (item.oldSwCnt !== item.newSwCnt) {
          const swObj = {
            keyPath: 'meter.countSw',
            field: 'S/W 개수',
            history: {
              before: item.oldSwCnt + ' EA',
              after: item.newSwCnt + ' EA'
            }
          }
          historyObj.detail.push(swObj)
        }

        if (item.oldVgCnt !== item.newVgCnt) {
          const vgObj = {
            field: 'Storage 개수',
            history: {
              before: item.oldVgCnt + ' EA',
              after: item.newVgCnt + ' EA'
            }
          }
          historyObj.detail.push(vgObj)
        }

        const convertArr = (item) => {
          if (item[1] === '{') { // 니중에 이 분기는 수정해야함.
            return JSON.parse(item)
          } else {
            const sliced = item.slice(1).slice(0, -1).split(',')
            return sliced
          }
        }

        const added = item.addedSwList ? convertArr(item.addedSwList) : []
        const deleted = item.deletedSwList ? convertArr(item.deletedSwList) : []
        const addedVg = item.addedVgList ? convertArr(item.addedVgList).filter((v, i, arr) => {
          return arr.findIndex(vg => vg.vgUuid === v.vgUuid) === i
        }) : []
        const deletedVg = item.deletedVgList ? convertArr(item.deletedVgList) : []

        const swPkgList = (swList) => {
          if (!swList.length) return []
          else {
            const mapped = swList.map(item => {
              if (typeof item === 'object' && item.pkgName) return item.pkgName
              else return item
            })
            return mapped
          }
        }

        const vgList = (vg, type) => {
          if (!vg.length) return []
          return vg.map(item => {
            // 테스트용, 주석을 풀어주세요.
            // item.deleteReqDate = new Date().getTime()
            return item.deleteReqDate && type === 'added'
              ? {
                storage: true,
                name: `${item.vgName}<br /><span class="tooltip-target">(삭제 예정)</span>`,
                date: Dayjs(new Date(item.deleteReqDate)).add(9, 'hours').format('YYYY-MM-DD HH:mm:ss')
              } : item.vgName
          })
        }

        if (added[0]) {
          historyObj.detail.push({
            keyPath: 'meter.addedSw',
            type: 'added',
            field: '추가된 S/W',
            history: swPkgList(added)
          })
        }
        if (deleted[0]) {
          historyObj.detail.push({
            keyPath: 'meter.deletedSw',
            type: 'deleted',
            field: '삭제된 S/W',
            history: swPkgList(deleted)
          })
        }
        if (addedVg[0]) {
          historyObj.detail.push({
            field: '추가된 Storage',
            type: 'added',
            history: vgList(addedVg, 'added')
          })
        }
        if (deletedVg[0]) {
          historyObj.detail.push({
            field: '삭제된 Storage',
            type: 'deleted',
            history: vgList(deletedVg, 'deleted')
          })
        }
        historyObjList.push(historyObj)
      })
      this.historyData = historyObjList
    },
    treeGridInit (grid) {
      this.treeGrid = grid
    },
    /**
     * 트리에서 선택한 데이터 세팅
     */
    setSelectModel (item) {
      // console.log('::트리 선택::', item)
      this.selectedModel = item
      if (item.projectIdx) this.getMeteringStatus({ projectIdx: item.projectIdx })
      else if (item.isRootParent) this.getMeteringStatus()
      else {
        const allProject = this.allProjects(item, [])
        const all = uniq(allProject)

        // console.log(allProject, all)

        if (!all.length) {
          this.serverTableData = []
          this.serverTableDataBackup = []
        } else if (all.length === 1) this.getMeteringStatus({ projectIdx: all[0] })
        else this.getMeteringStatus({ projectIdx: all.join(',') })
      }
      // if (item.projectIdx) this.getMeteringStatus({ projectIdx: item.projectIdx }) // 선택한 아이템이 프로젝트일 경우
      // else {
      //   const allProject = this.allProjects(item, [])
      //   const all = uniq(allProject)

      //   if (!all.length) {
      //     this.serverTableData = []
      //     this.serverTableDataBackup = []
      //   } else if (all.length === 1) this.getMeteringStatus({ projectIdx: all[0] })
      //   else this.getMeteringStatus({ projectIdx: all.join(',') })
      // }

      this.filteringWithDate(this.startDate, this.endDate)
      this.$refs.theSearch.control.text = ''
    },
    /**
     * 모든 projectIdx를 리턴
     */
    allProjects (data, projects) {
      if (data.groupProject?.length) {
        data.groupProject.forEach(({ projectIdx }) => projects.push(projectIdx))
      }
      data.children.forEach(child => this.allProjects(child, projects))

      return projects
      // const projectsIdx = projects

      // if (data.groupProject?.length) {
      //   data.groupProject.forEach(item => {
      //     projectsIdx.push(item.projectIdx)
      //   })
      // } else if (data.children?.length) {
      //   data.children.forEach(item => {
      //     this.allProjects(item, projectsIdx)
      //   })
      // } else return []

      // return projectsIdx
    },
    routeTo (to) {
      this.$router.push(to)
    },
    /**
     * 그리드 row 선택
     */
    setSelectedHost (param) {
      if (param) {
        this.selectedHost = param._data

        this.getVmHistoryList(this.selectedHost.vmUuid)
      } else this.selectedHost = null
    },
    resetDate () {
      this.serverTableData = this.serverTableDataBackup
      this.startDate = ''
      this.$refs.theSearch.control.text = ''
      this.endDate = new Date()
    },
    filteringWithDate (startDate, endDate) {
      if (startDate) {
        // this.serverTableData = this.serverTableDataBackup.filter(d => d.chargeDate > startDate.getTime() && d.chargeDate < endDate.getTime())
        this.serverTableData = this.serverTableDataBackup.filter(d => d.chargeDate > startDate.getTime() && d.chargeDate < new Date(Dayjs(endDate).format('YYYY-MM-DD 23:23:59')).getTime())
      } else {
        this.serverTableData = this.serverTableDataBackup.filter(d => d.chargeDate < endDate.getTime())
      }
    },
    ipHtml (ipList) {
      if (ipList.length <= 1) return
      let ips = ''
      for (let i = 1; i < ipList.length; i++) {
        ips += ipList[i] + '<br>'
      }
      return ips
    }
  },
  watch: {
    startDate (newStartDate, oldDate) {
      if (newStartDate !== oldDate) this.filteringWithDate(newStartDate, this.endDate)
    },
    endDate (newEndDate, oldDate) {
      if (newEndDate !== oldDate) this.filteringWithDate(this.startDate, newEndDate)
    },
    selectedModel () {
      this.historyData = []
    },
    selectedHost (val) {
      if (!val) this.historyData = []
    }
  },
  data () {
    return {
      totalResultCnt: 0,
      infraCode: 'infra_test',
      commonCode: 'common',
      unknownCode: 'unknown',
      projectTree: [],
      unregisterData: [],
      ///
      nobillProjectList: [],
      currentTableData: [],
      treeLoading: false,
      selectedProject: null,
      totalCnt: undefined,
      selectedModel: undefined, // 트리에서 선택된 모델
      selectedHost: null,
      startDate: '',
      endDate: new Date(),
      serverTableDataBackup: [],
      loading: {
        tree: false,
        status: false,
        history: false
      },

      treeColumn: [
        { header: '관계사 > 프로젝트 (자원 수)', binding: 'title', width: '*', isReadOnly: true, foldable: true }
      ],

      // 필터링 정보
      filteringList: [
        {
          field: 'condition',
          label: '검색조건',
          selections: [
            { label: '전체', value: 'all' },
            { label: '조건1', value: 'condition_1' },
            { label: '조건2', value: 'condition_2' }
          ]
        }
      ],

      // 관계사 > 프로젝트 트리 정보
      treeData: [
        {
          id: 'all',
          title: '전체',
          GROUP_UPPER: 0,
          isOpen: false,
          children: []
        }
      ],

      // 테이블 정보
      serverColumnData: [
        { header: '클러스터', binding: 'clusterName', width: '*', align: 'left', keyPath: 'config.RACK.cluster' },
        { header: 'Host', binding: 'hostName', width: '*', align: 'left' },
        { header: 'IP', binding: 'nics', width: '*', customHtml: true, align: 'left' },
        { header: 'vCPU (Core)', binding: 'totalCores', width: '*', customHtml: true },
        { header: 'Memory (GB)', binding: 'totalMemSize', width: '*', customHtml: true },
        { header: 'Disk (GB)', binding: 'assignDiskSize', width: '*', customHtml: true },
        { header: '과금 시작일', binding: 'chargeDateTemp', width: '*', keyPath: 'common.GRID.billStart' },
        { header: 'Storage (GB)', binding: 'vgSum', width: '*', customHtml: true },
        { header: 'S/W', binding: 'swCount', width: '*', customHtml: true }
        // { header: 'createDate', binding: 'createDate', width: '*', customHtml: true }
      ],
      serverTableData: [],

      // 히스토리 정보
      historyData: [],
      columnDataMap: {
        totalMemSize: null,
        assignDiskSize: null
      }
    }
  }
}
</script>
<style lang="scss" scoped>
  .metering-status {
    &::v-deep{
      .metering-status-body {
        display: flex;
        > .body-panel {
          height: 780px;
          &.-left {
            width: 450px;
            flex: 0 0 450px !important;
            min-height: 70vh;
            .project-tree {
              .tree-wrapper ul.tree-node > .node-item-label .node-title .tree-label-text.-selected {
                color: $main-red;
                // font-weight: bold;
                &::before {display: none;}
              }
              .project-list {
                padding: $gap-s 0;
                > .project-item {
                  display: flex;
                  align-items: center;
                  margin-left: $gap;
                  cursor: pointer;
                  &.-selected {
                    color: $main-red;
                  }
                }

              }
            }
          }

          &.-mid {
            margin-left: 50px;
            width: 100%;
          }

          &.-right {
            flex: 0 0 210px;
            margin-left: 50px;
            > .panel-body {
              border-top: 0;
              padding: 0;
            }

            .resource-contents {
              & + .resource-contents {
                margin-top: $gap;
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
