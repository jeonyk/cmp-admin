<!--
  * 파일명 : TaskSourceModalDatabase.vue
  * 파일 기능 : [클러스터/노드]를 설정할 수 있는 모달입니다.
  *           클러스터 데이터를 외부에서 받아 관련 노드/이미지/네트워크 정보를 선택할 수 있도록 하단에 그려줍니다.
  *           클러스터/노드/이미지/네트워크 정보를 모두 선택해야만 저장이 가능합니다.
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 클러스터/노드 선택 - 그리드 sorting 및 프로그레스바 수정
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
            {{ $t('main.DASHBOARD.setCluster') }}
          </h5>
          <div class="table-area">
            <cmp-grid
              :item-source="clusterGridData"
              :columns="columns.clusterColumns"
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

        <!-- v-if="type==='both' || type === 'node'" -->
        <article
          class="node-contents -node"
          v-if="showRelatedData"
        >
          <h5 class="modal-sub-title sub-title">
            DB Paramter
          </h5>
          <div class="table-area">
            <cmp-grid
              :item-source="dbParameterData"
              :columns="columns.dbParameterColumns"
              :selectable="!readOnly"
              @selectedRow="$event => selectedDBParam = $event"
              :init-custom-action="initDBParamGrid"
              :init-auto-select-row="checkSelectedRow(this.selectedDBParam, 'dbParam')"
              init-auto-select-row-key="nodeName"
            >
              <template #hypervisorCpuUsagePpm="props">
                {{ props.row.hypervisorCpuUsagePpm / 10000 }} %
              </template>
              <template #hypervisorMemoryUsagePpm="props">
                {{ props.row.hypervisorMemoryUsagePpm / 10000 }} %
              </template>
              <template #storageCapacityBytes="props">
                {{ props.row.storageCapacityBytes | byte }}
              </template>
              <template #storageUsageBytes="props">
                {{ props.row.storageUsageBytes | byte }}
              </template>
            </cmp-grid>
          </div>
        </article>
        <!-- /. DB Parameter -->

        <article
          class="node-contents -node"
          v-if="showRelatedData"
        >
          <h5 class="modal-sub-title sub-title">
            Network Profile
          </h5>
          <div class="table-area">
            <cmp-grid
              :item-source="networkProfileData"
              :columns="columns.networkProfileColumns"
              :selectable="!readOnly"
              :init-custom-action="initProfileGrid"
              @selectedRow="$event => selectedProfile = $event"
              @loaded-rows="onLoadedRows"
              :init-auto-select-row="checkSelectedRow(this.selectedProfile, 'profile')"
              init-auto-select-row-key="profileUuid"
            />
          </div>
        </article>
        <!-- /. Network Profile -->
      </section>
    </div>

    <section class="modal-footer big-button-area">
      <button
        class="button"
        type="is-anti"
        @click="close"
      >
        {{ $v('취소') }}
      </button>
      <button
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
  name: 'TaskSourceModalDatabase',
  mixins: [TaskSourceModalMixins],
  watch: {
    async active (newVal) {
      if (newVal) {
        console.clear()
        console.log('%c@@ DATA :: ', 'color: skyblue', this.data)

        this.cloneData = cloneDeep(this.data)

        await this.getOperationList(this.data.manageGroupIdx, 'DATABASE')
        this.getClusters(this.cloneData)
        this.script = this.data.script
      }
    },

    /**
     * {클러스터} 변경 이벤트
     */
    async selectedCluster (row) {
      // 선택된 {클러스터}가 있는 경우에만 {노드, 이미지, 네트워크} 표기
      this.showRelatedData = !!row
      if (!row) return

      this.getDBParameter(this.cloneData)
      this.getNetworkProfile(this.cloneData)

      // console.log(cluster, '---- cluster')

      // 클러스터 선택이 바뀔때마다 하위 node/image/네트워크를 선택 해제합니다.
      // this.setSelectedNode(null)
      // this.setSelectedImage(null)
      // this.setSelectedNetwork(null)
    }
  },
  methods: {
    /**
     * Profile 정보 데이터 가져오기
     * @param {Number} userProfIdx
     */
    async getProfiles (userProfIdx) {
      try {
        const response = await API.database.getUserProfilePopUp({ userProfIdx })
        return response
      } catch (error) {
        console.error('@@@ TaskSourceModalDatabase > getProfiles', error)
        this.$alert(this.$t('common.ALERT.NUTA.009'), { confirmButtonText: this.$t('common.BTN.confirm') })
      }
    },
    /**
     * Profile 정보 호출
     * Cluster 정보 세팅
     * @param {Object} data
     */
    async getClusters (data = this.cloneData) {
      this.loading = true

      try {
        const { imageId, profileId } = data

        const { eraClusters: software } = await this.getProfiles(imageId)
        const { eraClusters: hardware } = await this.getProfiles(profileId)

        // console.log(software, hardware)

        const intersection = []
        for (const { eraClusterIdx: swIdx, eraProfiles: [swProfile], ...sw } of software) {
          for (const { eraClusterIdx: hwIdx, eraProfiles: [hwProfile] } of hardware) {
            if (swIdx === hwIdx) {
              // console.log('## eraProfiles', swProfile, hwProfile)

              const clusterInfo = {
                ...swProfile.propertyMap,
                ...hwProfile.propertyMap,
                imageUuid: swProfile.profileUuid,
                imageVersionUuid: swProfile.versionUuid,
                profileUuid: hwProfile.profileUuid,
                clusterName: sw.eraClusterName,
                imageName: swProfile.profileName,
                profileName: hwProfile.profileName,
                osVendor: swProfile.profileOsInfo.osVendor,
                osVersion: swProfile.profileOsInfo.osVersion,
                osBit: swProfile.profileOsInfo.osPlatform,
                eraIdx: swProfile.eraConfig.eraIdx,
                dbName: swProfile.engineType,
                clusterId: hwIdx,
                clusterUuid: sw.clusterUuid
                // updateId: data.id
              }

              // console.log(clusterInfo)
              intersection.push(clusterInfo)
            }
          }
        }

        // console.log(intersection)
        this.clusterGridData = intersection.filter(cls => {
          return this.compareOperationList('CLUSTER', cls.clusterUuid)
        })
      } catch (error) {
        console.error('@@@ getClusters' + error)
        this.$alert(this.$t('common.ALERT.NUTA.009'), { confirmButtonText: this.$t('common.BTN.confirm') })
      } finally {
        this.loading = false
      }
    },

    // ---------------------------------------------------------
    // --------------------- DB Parameter ----------------------
    // ---------------------------------------------------------

    /**
     * DB Parameter 컬럼, 데이터 세팅
     * @param {Object} data
     */
    async getDBParameter (data = this.cloneData) {
      try {
        const getProfiles = {
          type: 'DATABASE_PARAMETER',
          engine: data.engineType,
          topology: data.topology,
          eraIdx: data.eraIdx,
          isLatest: true
        }
        const { DATABASE_PARAMETER: parameter } = await API.database.getProfiles(getProfiles)
        if (!parameter) return

        this.columns.dbParameterColumns = []

        // parameter modal columns 세팅
        const [{ propertyMap }] = parameter // 무조건 [0]번째만 있는듯
        for (const prop in propertyMap) this.columns.dbParameterColumns.push({ header: prop, binding: prop })
        this.columns.dbParameterColumns.unshift({ header: 'profileName', binding: 'profileName' })

        // paramter modal data 세팅
        this.dbParameterData = parameter.map(param => {
          const { propertyMap, profileUuid, profileName, versionUuid } = param
          return {
            ...propertyMap,
            profileUuid,
            profileName,
            versionUuid,
            tmp_table_size: this.$options.filters.byte(Number(param.propertyMap.tmp_table_size))
          }
        })
      } catch (error) {
        console.error('@@ TaskSourceModalDatabase > getDBParameter', error)
        this.$alert(this.$v('DB Parameter를 불러오는 도중 문제가 발생하였습니다.'))
      }
    },

    // ------------------------------------------------------------------
    // ------------------------ Network Profile -------------------------
    // ------------------------------------------------------------------

    /**
     * NetworkProgfile 데이터 세팅
     * @param {Object} data
     */
    async getNetworkProfile (data = this.cloneData) {
      try {
        const getProfiles = {
          type: 'NETWORK',
          engine: data.engineType,
          topology: data.topology,
          eraIdx: data.eraIdx,
          isLatest: true
        }

        const { NETWORK: networks } = await API.database.getProfiles(getProfiles)
        if (!networks) return

        this.networkProfileData = networks.map(({ propertyMap, profileName, profileUuid }) => {
          return {
            vlanId: propertyMap.VLAN_ID,
            vlanName: propertyMap.VLAN_NAME,
            vlanType: propertyMap.VLAN_TYPE,
            profileName: profileName,
            profileUuid: profileUuid
          }
        })
      } catch (error) {
        console.error('@@ TaskSourceModalDatabase > getNetworkProfile', error)
        this.$alert(this.$v('Network Profile을 불러오는 도중 문제가 발생하였습니다.'))
      }
    },

    // ===================================================
    // ======================= 기타 =======================
    // ===================================================

    close (data) {
      this.selectedCluster = null
      this.selectedDBParam = null
      this.selectedProfile = null

      this.gridRefresh(this.clusterGrid)
      this.gridRefresh(this.dbParamGrid)

      this.$emit('close')
      this.clusterGridData = []
    },

    /**
     * [확인] 버튼 클릭했을 때 발생하는 이벤트입니다.
     * @return {Function || Boolean}
     */
    async confirm () {
      // 클러스터/노드 선택 validation
      const conditions = [
        { condition: this.selectedCluster, message: this.$v('클러스터를 먼저 선택하세요.') },
        { condition: this.selectedDBParam, message: this.$v('DB Parameter를 선택해주세요.') },
        { condition: this.selectedProfile, message: this.$v('Network Profile을 선택해주세요.') }
      ]

      // 기본으로 다 선택되어있는지 확인
      const validator = conditions.every(cond => {
        if (!cond.condition) this.$alert(cond.message, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
        return cond.condition
      })

      if (!validator) return

      const ipAllocator = this.$store.state.auth.user.userId

      const { clusterId, clusterName, imageUuid, imageVersionUuid, profileUuid, eraIdx } = this.selectedCluster.dataItem
      const { profileUuid: dbParameterId, profileName, versionUuid } = this.selectedDBParam.dataItem
      const { vlanName: networkName, profileUuid: networkId } = this.selectedProfile.dataItem
      const networkList = [{ ...this.cloneData.networkList[0], networkName, networkId }]

      const emitData = {
        clusterId,
        clusterName,
        imageUuid,
        imageVersionUuid,
        profileUuid,
        eraIdx,

        dbParameterId,
        profileName,
        versionUuid,

        networkList,
        ipAllocator,

        // UI 데이터 저장용 + validation 에 사용
        cluster: this.selectedCluster.dataItem,
        dbParam: this.selectedDBParam.dataItem,
        profile: this.selectedProfile.dataItem
      }

      return this.emitSavedData(Object.assign(emitData))
    },

    /**
     * 자동선택된 이미지의 페이지로 이동합니다
     * 없으면 그냥 0에 머무를 예정
     */
    initImagePage () {
      if (this.profileGrid && this.initImageRow) {
        setTimeout(() => {
          const index = this.networkProfileData.findIndex(img => (img.userImageIdx === this.initImageRow?.userImageIdx))
          const page = Math.abs(parseInt(index / 10))
          this.profileGrid.collectionView.moveToPage(page)
        }, 50)
      }
    },

    initClusterGrid (grid) {
      this.clusterGrid = grid
    },
    initDBParamGrid (grid) {
      this.dbParamGrid = grid
    },
    initProfileGrid (grid, data) {
      this.profileGrid = grid
      this.initImagePage()
    }
  },
  data () {
    return {
      ipformat: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      loading: true,
      clusterGrid: null,
      dbParamGrid: null,
      profileGrid: null,
      cloneData: null,
      selectedCluster: null,
      selectedDBParam: null,
      selectedProfile: null,
      // initImageRow: null,
      // initImageRowKey: null,
      showRelatedData: false,
      // ----
      // ----
      // ----
      columns: {
        // 클러스터 그리드 컬럼
        clusterColumns: [
          { header: this.$v('이름'), binding: 'clusterName' },
          { header: 'VCPUs', binding: 'CPUS' },
          { header: 'RAM', binding: 'MEMORY_SIZE' },
          { header: 'DB Name', binding: 'dbName' },
          { header: 'DB Version', binding: 'VERSION' },
          { header: 'OS Vendor', binding: 'osVendor' },
          { header: 'OS Version', binding: 'osVersion' },
          { header: 'OS Bit', binding: 'osBit' }
        ],
        // DB Parameter 컬럼
        dbParameterColumns: [
          { header: this.$t('common.REGCON.name'), binding: 'nodeName', width: 150 },
          { header: 'vm 수', binding: 'numVms', keyPath: 'common.GRID.COMPUTE.numberOfVm' },
          { header: 'Node Serial', binding: 'serial' },
          { header: 'Block Serial', binding: 'blockSerial' },
          { header: 'Block Model', binding: 'blockModelName' },
          { header: this.$t('common.GRID.CLUSTER.usageCpu'), binding: 'hypervisorCpuUsagePpm', customHtml: true },
          { header: this.$t('common.GRID.COMPUTE.usageMemory'), binding: 'hypervisorMemoryUsagePpm', customHtml: true },
          { header: this.$t('common.GRID.COMPUTE.diskTotal'), binding: 'storageCapacityBytes', customHtml: true },
          { header: this.$t('common.GRID.CLUSTER.usageDisk'), binding: 'storageUsageBytes', customHtml: true }
        ],
        networkProfileColumns: [
          { header: 'PROFILE_NAME', binding: 'profileName' },
          { header: 'VLAN_TYPE', binding: 'vlanType' },
          { header: 'VLAN_NAME', binding: 'vlanName' }
        ]
      },
      clusterGridData: [],
      dbParameterData: [],
      networkGridData: [],
      networkProfileData: []
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
