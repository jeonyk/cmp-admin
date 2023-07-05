<!--
  * 파일명 : TaskSourceModalFileServer.vue
  * 파일 기능 : [클러스터/노드]를 설정할 수 있는 모달입니다.
  *           클러스터 데이터를 외부에서 받아 관련 노드/이미지/네트워크 정보를 선택할 수 있도록 하단에 그려줍니다.
  *           클러스터/노드/이미지/네트워크 정보를 모두 선택해야만 저장이 가능합니다.
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 클러스터/File Server 선택 - 그리드 sorting 및 프로그레스바 수정
 -->

<template>
  <el-dialog
    :title="$v('자원할당설정')"
    :visible.sync="active"
    width="90%"
    class="set-cluster-node-modal"
    top="5vh"
    @close="close"
    :before-close="() => $emit('close')"
  >
    <div class="contents-wrapper">
      <section v-loading="loading">
        <article class="node-contents -cluster">
          <h5 class="modal-sub-title sub-title">
            {{ $v('클러스터 선택') }}
          </h5>
          <div class="table-area">
            <cmp-grid
              :item-source="clusterGridData"
              :columns="columns.clusterColumns"
              :header-merge="columns.clusterHeaderMergeColumns"
              :selectable="!readOnly"
              @selectedRow="$event => selectedCluster = $event"
              :init-custom-action="initClusterGrid"
              :init-auto-select-row="checkSelectedRow(this.selectedCluster, 'cluster')"
              init-auto-select-row-key="clusterUuid"
              @loaded-rows="onLoadedRows"
            >
              <template #highVal="props">
                <div style="padding: 0;">
                  <cmp-status-tag
                    v-if="props.row.type"
                    :contents="props.row.type"
                  />
                </div>
              </template>
              <!-- /. 고사양 -->

              <template #virtualPercent="props">
                <span>{{ props.row.virtualPercent }} %</span>
              </template>
              <!-- 가상화율 -->

              <template #vcpuUsagePercent="props">
                <progress-bar
                  class="size-progress-bar"
                  :value="props.row.hypervisorCpuUsagePpm"
                  :total="100"
                />
              </template>
              <!-- vCPU 사용량 -->

              <template #assignPercentvcpuCnt="props">
                <div class="progressbar-wrap">
                  <progress-bar
                    class="size-progress-bar"
                    :value="props.row.assign.vcpuCnt.size"
                    :total="props.row.assign.vcpuCnt.all"
                    :notice-percent="props.row.assign.vcpuCnt.standard1"
                    :alert-percent="props.row.assign.vcpuCnt.standard2"
                  />
                  <el-tooltip
                    v-if="props.row.assignPercentText.vcpuCnt.length > 8"
                    :content="props.row.assignPercentText.vcpuCnt"
                    placement="top"
                    effect="light"
                  >
                    <span class="progress-desc ellipsis-wrap">
                      {{ props.row.assignPercentText.vcpuCnt }}
                    </span>
                  </el-tooltip>
                  <p
                    class="progress-desc"
                    v-else
                  >
                    {{ props.row.assignPercentText.vcpuCnt }}
                  </p>
                </div>
              </template>
              <!-- 할당량.가상화율 임계치 -->

              <template #assignPercentmemory="props">
                <div class="progressbar-wrap">
                  <progress-bar
                    class="size-progress-bar"
                    :value="props.row.assign.memory.size"
                    :total="props.row.assign.memory.all"
                    :notice-percent="props.row.assign.memory.standard1"
                    :alert-percent="props.row.assign.memory.standard2"
                  />
                  <el-tooltip
                    v-if="props.row.assignPercentText.memory.length > 10"
                    :content="props.row.assignPercentText.memory"
                    placement="top"
                    effect="light"
                  >
                    <span class="progress-desc ellipsis-wrap">
                      {{ props.row.assignPercentText.memory }}
                    </span>
                  </el-tooltip>
                  <p
                    class="progress-desc"
                    v-else
                  >
                    {{ props.row.assignPercentText.memory }}
                  </p>
                </div>
              </template>
              <!-- 할당량.Memory 임계치-->

              <template #assignPercentdisk="props">
                <div class="progressbar-wrap">
                  <progress-bar
                    class="size-progress-bar"
                    :value="props.row.assign.disk.size"
                    :total="props.row.assign.disk.all"
                    :notice-percent="props.row.assign.disk.standard1"
                    :alert-percent="props.row.assign.disk.standard2"
                  />
                  <el-tooltip
                    v-if="props.row.assignPercentText.disk.length > 10"
                    :content="props.row.assignPercentText.disk"
                    placement="top"
                    effect="light"
                  >
                    <span class="progress-desc ellipsis-wrap">
                      {{ props.row.assignPercentText.disk }}
                    </span>
                  </el-tooltip>
                  <p
                    class="progress-desc"
                    v-else
                  >
                    {{ props.row.assignPercentText.disk }}
                  </p>
                </div>
              </template>
            <!-- 할당량.Disk 임계치-->
            </cmp-grid>
          </div>
        </article>
        <!-- /. 클러스터 선택 -->

        <article
          class="node-contents -node"
          v-if="showRelatedData"
        >
          <h5 class="modal-sub-title sub-title">
            {{ $v('File Server 선택') }}
          </h5>
          <div class="table-area">
            <cmp-grid
              :item-source="fsModalTableData"
              :columns="columns.shareColumns"
              :selectable="!readOnly"
              @selectedRow="$event => selectedFileServer = $event"
              :init-custom-action="initFileServerGrid"
              :init-auto-select-row="checkSelectedRow(this.selectedFileServer, 'fileServer')"
              init-auto-select-row-key="fileServerUuid"
              :empty-text="$v('선택할 수 있는 파일서버가 없습니다.')"
            >
              <template #networkList="props">
                <span v-if="props.row.networkList">{{ props.row.networkList[0].cateKey }}</span>
              </template>
              <!-- /. 네트워크 카테고리 -->

              <template #companyList="{ row }">
                <el-tooltip
                  :disabled="row.companyNameList.length === 1"
                  effect="light"
                >
                  <span>{{ row.companyNameList[0] }}</span>
                  <div slot="content">
                    <div
                      v-for="company in row.companyNameList"
                      :key="company"
                    >
                      {{ company }}
                    </div>
                  </div>
                </el-tooltip>
              </template>

              <template #fsFreeSpaceByte="props">
                <span>{{ props.row.fsFreeSpaceByte | onlyGB }}</span>
              </template>
              <!-- /. 총할당량 -->
            </cmp-grid>
          </div>
        </article>
        <!-- /. File Server 선택 -->

        <article class="node-contents -node">
          <h5 class="modal-sub-title sub-title">
            {{ $v(`프로토콜 타입 설정 (${cloneData ? cloneData.protocolType : undefined})`) }}
          </h5>
          <div class="table-area">
            <cmp-grid
              :item-source="protocolTypes"
              :columns="columns.protocolColumns"
              :use-column-filter="false"
            >
              <template
                v-for="column in columns.protocolColumns"
                :slot="column.binding"
                slot-scope="props"
              >
                <div :key="column.binding">
                  <div v-if="column.input">
                    <el-input
                      v-if="props.row[column.binding].edit"
                      v-model="props.row[column.binding].data"
                      @keydown.native.enter="saveCustomValue(props.row[column.binding])"
                      @blur="saveCustomValue(props.row[column.binding])"
                    />

                    <button
                      v-if="!props.row[column.binding].edit && !props.row[column.binding].data"
                      class="button"
                      @click="e => {
                        props.row[column.binding].edit = true;
                        clickEvt(e)
                      }"
                    >
                      {{ $v('직접 입력') }}
                    </button>

                    <span
                      class="custom-ip"
                      v-if="!props.row[column.binding].edit && props.row[column.binding].data"
                      @click="e => {
                        props.row[column.binding].disabled ? null : props.row[column.binding].edit = true;
                        clickEvt(e)
                      }"
                    >
                      {{ props.row[column.binding].data }}
                    </span>
                  </div>

                  <!-- @change="filterHandler()" -->
                  <el-select
                    v-else
                    v-model="props.row[column.binding]"
                    :disabled="column.disabled"
                    :placeholder="$v('선택')"
                    :popper-append-to-body="false"
                  >
                    <el-option
                      v-for="item in protocolTypesOptions[column.binding]"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </div>
              </template>
            </cmp-grid>
          </div>
        </article>
        <!-- /. 프로토콜 타입 선택 -->
      </section>
    </div>

    <section class="modal-footer big-button-area">
      <button
        v-if="readOnly"
        class="button"
        @click="close"
      >
        {{ $v('닫기') }}
      </button>
      <button
        v-if="!readOnly"
        class="button"
        type="is-anti"
        @click="close"
      >
        {{ $v('취소') }}
      </button>
      <button
        v-if="!readOnly"
        class="button"
        type="is-primary"
        @click="confirm"
      >
        {{ $v('확인') }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import { cloneDeep } from 'lodash'
import API from '@sd-fe/cmp-core'
import TaskSourceModalMixins from './TaskSourceModalMixins.script'

export default {
  name: 'TaskSourceModalFileServer',
  mixins: [TaskSourceModalMixins],
  watch: {
    async active (newVal) {
      if (newVal) {
        console.clear()
        console.log('%c@@ DATA :: ', 'color: skyblue', this.data)

        await this.getCompanyList()
        await this.getClusters()

        this.cloneData = cloneDeep(this.data)
        this.setProtocolTypeColumns(this.cloneData)
        this.setProtocolType(this.data)
      }
    },

    /**
     * {클러스터} 변경 이벤트
     */
    async selectedCluster (row) {
      // 선택된 {클러스터}가 있는 경우에만 {노드, 이미지, 네트워크} 표기
      this.showRelatedData = !!row
      if (!row) return

      const { dataItem: cluster } = row

      this.setRelatedFileServer(cluster)

      // console.log(cluster, '---- cluster')

      // 클러스터 선택이 바뀔때마다 하위 node/image/네트워크를 선택 해제합니다.
      // this.setSelectedNode(null)
      // this.setSelectedImage(null)
      // this.setSelectedNetwork(null)
    }
  },
  methods: {
    /**
     * CompnyList 저장
     */
    async getCompanyList () {
      await this.$store.dispatch('common/getSimpleCompanyList')
      const companies = this.$store.state.common.company

      this.companyList = {}
      for (const { field, label } of companies) {
        this.companyList[field] = { key: field, value: label }
      }

      // console.log('@getCompanyList', this.companyList)
    },

    /**
     * 초기에 클러스터 데이터를 호출하여 가져옵니다.
     */
    async getClusters () {
      this.loading = true

      try {
        const clusters = await API.compute.getElementListSimple()

        this.rawClusters = clusters.filter(cls => cls.centralIdx)
        await this.setClusterTableData(this.rawClusters)
      } catch (error) {
        console.error('@@@ getClusters' + error)
        this.$alert(this.$t('common.ALERT.NUTA.009'), { confirmButtonText: this.$t('common.BTN.confirm') })
      } finally {
        this.loading = false
      }
    },

    /**
     * 클러스터 테이블을 위해 데이터를 세팅합니다.
     * @param {Array} rawClusters 순수 클러스터 데이터
     */
    setClusterTableData (rawClusters = this.rawClusters) {
      // console.log('cloneData', this.cloneData)
      // console.log('클러스터 데이터: ', rawClusters)

      // 테이블 데이터 가공
      this.clusterGridData = rawClusters.map(cls => {
        let usageVcpu = 0
        if (cls.vms) {
          for (const vm of cls.vms) {
            usageVcpu += Number(vm.vcpu)
          }
        }

        const byte = (item) => this.$options.filters.byte(item || 0)

        const {
          clusterUuid, elementIdx, cpuPercent, memoryPercent, diskPercent,
          vmCpuSum, vmMemSum, vdiskCapacitySum, // 사용량
          nonNodeCpuSum, nonNodeMemSum, nonNodeStorageCapacityBytes, // 전체
          firstCpuPercent, firstDiskPercent, firstMemoryPercent, // 1차 임계치
          secondCpuPercent, secondDiskPercent, secondMemoryPercent // 2차 임계치
        } = cls

        return {
          hypervisorCpuUsagePpm: this.$options.filters.percent(cls.hypervisorCpuUsagePpm),
          clusterUuid,
          elementIdx,
          type: cls.storageType,
          name: cls.clusterName,
          node: cls.nodeCnt,
          vm: cls.vmCnt,
          cpuPercent, // vCPU 사용량
          memoryPercent,
          diskPercent,
          vcpu: { size: usageVcpu, all: cls.nodeCpuCoresSum },
          vcpuUsagePercent: cls.hypervisorCpuUsagePpm / 100, // vCPU 사용량
          assign: {
            vcpuCnt: { size: vmCpuSum, all: nonNodeCpuSum, standard1: firstCpuPercent, standard2: secondCpuPercent },
            memory: { size: vmMemSum, all: nonNodeMemSum, standard1: firstMemoryPercent, standard2: secondMemoryPercent },
            disk: { size: vdiskCapacitySum, all: nonNodeStorageCapacityBytes, standard1: firstDiskPercent, standard2: secondDiskPercent }
          },
          assignPercent: {
            vcpuCnt: vmCpuSum / nonNodeCpuSum,
            memory: vmMemSum / nonNodeMemSum,
            disk: vdiskCapacitySum / nonNodeStorageCapacityBytes
          },
          assignPercentText: {
            vcpuCnt: `${vmCpuSum}Core / ${nonNodeCpuSum}Core`,
            memory: `${byte(vmMemSum)} / ${byte(nonNodeMemSum)}`,
            disk: `${byte(vdiskCapacitySum)} / ${byte(nonNodeStorageCapacityBytes)}`
          }
        }
      })
    },

    // ------------------------------------------------------------
    // --------------------- File Server 선택 ----------------------
    // ------------------------------------------------------------

    /**
     * 파일 서버 설정
     * @param {Object} cluster this.selectedCluster
     */
    async setRelatedFileServer (cluster = this.selectedCluster) {
      try {
        const response = await API.compute.getAllFileServerList()

        const result = []
        for (const fs of response) {
          if (fs.clusterUuid === cluster.clusterUuid && fs.userFsIdx && fs.isPub) {
          // 관계사 정보 세팅
            fs.companyNameList = fs.companyList ? fs.companyList.map(({ companyIdx }) => {
              const { value } = this.companyList[companyIdx]
              return value || '-'
            }) : []

            result.push(fs)
          } else continue
        }

        this.fsModalTableData = result
      } catch (error) {
        console.error('@@ TaskSourceodalFileServer > setRelatedFileServer', error)
      }
    },

    // -----------------------------------------------------------------
    // ------------------------ 프로토콜 타입 설정 -------------------------
    // -----------------------------------------------------------------

    /**
     * 프로토콜 타입 설정 (NFS / SMB)
     * @param {Object} cloneData
     */
    setProtocolTypeColumns ({ protocolType, resourceType }) {
      const disabled = resourceType === 'CHANGE'
      this.columns.protocolColumns = {
        SMB: [
          { header: this.$v('부하 분산 사용'), binding: 'isDistributed', customHtml: true, disabled },
          { header: this.$v('압축 여부'), binding: 'isCompression', customHtml: true },
          { header: this.$v('엑세스 제한 여부'), binding: 'isAccess', customHtml: true },
          { header: this.$v('SMB 암호화 사용'), binding: 'isSmb3Encryption', customHtml: true }
        ],
        NFS: [
          { header: this.$v('부하 분산 사용'), binding: 'isDistributed', customHtml: true, disabled },
          { header: this.$v('압축 여부'), binding: 'isCompression', customHtml: true },
          { header: this.$v('엑세스 제한 여부'), binding: 'isAccess', customHtml: true },
          { header: this.$v('인증 타입'), binding: 'authenticationType', customHtml: true },
          { header: this.$v('스쿼시 타입'), binding: 'squashType', customHtml: true },
          { header: this.$v('익명 유저 아이디'), binding: 'anonymousUid', customHtml: true, input: true },
          { header: this.$v('익명 그룹 아이디'), binding: 'anonymousGid', customHtml: true, input: true }
        ]
      }[protocolType]
    },

    /**
     * 프로토타입 관련 테이블 설정 -> customizing 직접입력
     * @param {Object} cloneData
     */
    setProtocolType ({ isDistributed, isCompression, isAccess, authenticationType, squashType, isSmb3Encryption, anonymousUid, anonymousGid }) {
      const editable = { edit: false }

      this.protocolTypes = [{
        isDistributed,
        isCompression,
        isAccess,
        authenticationType,
        squashType,
        isSmb3Encryption,
        anonymousUid: { ...editable, data: anonymousUid },
        anonymousGid: { ...editable, data: anonymousGid }
      }]
    },

    // ===================================================
    // ======================= 기타 =======================
    // ===================================================

    /**
     * [직접 입력]한 데이터를 저장합니다.
     */
    saveCustomValue (props) {
      props.edit = false
    },

    close (data) {
      this.selectedCluster = null
      this.selectedFileServer = null

      this.gridRefresh(this.clusterGrid)
      this.gridRefresh(this.nodeGrid)

      this.$emit('close')
      this.clusterGridData = []
    },

    /**
     * [확인] 버튼 클릭했을 때 발생하는 이벤트입니다.
     * @return {Function || Boolean}
     */
    async confirm () {
      // 클러스터/File Server 선택 validation
      const conditions = [
        { condition: this.selectedCluster, message: this.$v('클러스터를 먼저 선택하세요.') },
        { condition: this.selectedFileServer, message: this.$v('File Server를 선택하세요.') }
        // { condition: this.selectedProtocol, message: this.$t('프로토콜 타입 설정을 진행해주세요.') }
      ]

      // 기본으로 다 선택되어있는지 확인
      const validator = conditions.every(cond => {
        if (!cond.condition) this.$alert(cond.message, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
        return cond.condition
      })

      if (!validator) return

      const ipAllocator = this.$store.state.auth.user.userId

      const [{ anonymousGid, anonymousUid, ...values }] = this.protocolTypes

      const emitData = {
        ...values,
        cluster: this.selectedCluster.dataItem,
        clusterUuid: this.selectedCluster.dataItem.clusterUuid,
        fileServer: this.selectedFileServer.dataItem,
        fileServerUuid: this.selectedFileServer.dataItem.fileServerUuid,
        anonymousGid: anonymousGid?.data, // 직접 입력
        anonymousUid: anonymousUid?.data, // 직접 입력
        ipAllocator
      }

      return this.emitSavedData(Object.assign(emitData))
    },

    initClusterGrid (grid) {
      this.clusterGrid = grid
    },
    initFileServerGrid (grid) {
      this.nodeGrid = grid
    }
  },
  data () {
    return {
      loading: true,
      clusterGrid: null,
      nodeGrid: null,
      imageGrid: null,
      cloneData: null,
      rawClusters: [], // 가공되지 않은 cluster raw 데이터를 저장합니다.
      selectedCluster: null,
      selectedFileServer: null,
      selectedProtocol: null,
      showRelatedData: false,
      // ----
      // ----
      // ----
      columns: {
        // 클러스터 그리드 컬럼
        clusterHeaderMergeColumns: {
          colSpan: [
            // { startIdx: 7, endIdx: 10, header: '할당량' }
            { startIdx: 6, endIdx: 8, header: '임계치(%)' }
          ],
          rowSpan: ['name', 'node', 'vm', 'highVal', 'virtualPercent', 'vcpuUsagePercent']
        },
        clusterColumns: [
          { header: this.$t('common.REGCON.name'), binding: 'name', width: 150 },
          { header: 'Node', binding: 'node', width: 50, customHtml: true },
          { header: 'VM', binding: 'vm', width: 60, customHtml: true },
          { header: this.$t('common.GRID.COMPUTE.highSpec'), binding: 'highVal', width: 120, customHtml: true },
          { header: this.$t('common.GRID.NUTA.virtualRate'), binding: 'virtualPercent', width: 70, customHtml: true },
          { header: this.$t('common.GRID.DATABASE.usageCpu'), binding: 'vcpuUsagePercent', width: 150, customHtml: true },
          { header: this.$t('common.GRID.NUTA.virtualRate'), binding: 'assignPercent.vcpuCnt', customHtml: true },
          { header: 'Memory', binding: 'assignPercent.memory', customHtml: true },
          { header: 'Disk', binding: 'assignPercent.disk', customHtml: true }
        ],
        shareColumns: [
          { header: this.$v('File Server 명'), binding: 'fileServerName', width: 150 },
          { header: this.$v('도메인 명'), binding: 'dnsDomainName' },
          { header: this.$v('네트워크 카테고리'), binding: 'networkList', customHtml: true },
          { header: this.$v('관계사명'), binding: 'companyList', customHtml: true },
          { header: this.$v('총 할당량'), binding: 'fsFreeSpaceByte', customHtml: true }
        ],
        protocolColumns: []
      },

      protocolTypes: [],
      protocolTypesOptions: {
        isSmb3Encryption: [{ label: '사용함', value: true }, { label: '사용안함', value: false }],
        isDistributed: [{ label: '사용함', value: true }, { label: '사용안함', value: false }],
        isCompression: [{ label: '사용함', value: true }, { label: '사용안함', value: false }],
        isAccess: [{ label: '사용함', value: true }, { label: '사용안함', value: false }],
        authenticationType: [{ label: 'System', value: 'SYSTEM' }, { label: 'None', value: 'NONE' }],
        squashType: [{ label: 'Root Squash', value: 'ROOT_SQUASH' }, { label: 'All Squash', value: 'ALL_SQUASH' }, { label: 'None', value: 'NONE' }]
      },
      clusterGridData: [],
      fsModalTableData: [],
      ovaOriginRefSubnet: null, // ## [OVA] -> 최초 선택
      companyList: {}
    }
  }
}
</script>

<style lang="scss" scoped>
  .set-cluster-node-modal {
    .filter-wrapper {
      display: flex;
      width: 100%;
      > div {
        display: flex;
        margin-right: $gap-m;

        > strong {
          line-height: 20px;
          display: block;
          font-size: 13px;
          font-style: normal;
          font-weight: normal;
          letter-spacing: -0.65px;
          color: $white;
          margin-right: $gap-s;
        }

        ul.cluster-filtering {
          display: flex;
          > li {
            margin-right: 15px;
            &:last-child { margin-right: 0; }
          }
        }
      }
    }

    .contents-wrapper {
      height: 68vh;
      overflow-y: auto;

      .cell-flex-wrap {
        padding: 0 $gap;
      }
      .custom-ip {
        color: $main-blue;
        &:hover {
          text-decoration: underline;
        }
      }
    }

    .node-contents {
      margin-bottom: 50px;

      &:last-child { margin-bottom: 0;}

      .progressbar-wrap {
        display: flex;
        align-items: center;
        padding: 6px 10px;
        border-radius: 6px;
        background-color: $ticket-back-color;;
        .progress-desc {
          display: inline-block;
          margin-left: $gap-m;
          color: $color-lightgrey;
        }
      }

      .active-ipm {
        text-align: center;
        justify-content: center;
        align-items: center;
      }
    }

  }
</style>
