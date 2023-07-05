<!--
  * 파일명 : TaskSourceModalCompute.vue
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
            {{ $v('클러스터 선택') }}
          </h5>
          <div class="table-area">
            <cmp-grid
              :item-source="clusterGridData"
              :columns="columns.clusterColumns"
              :header-merge="columns.clusterHeaderMergeColumns"
              :selectable="!readOnly"
              @selectedRow="setSelectedCluster"
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
            {{ $t('common.PLACEHOLDER.selectName', { name: $t('main.DASHBOARD.node') }) }}
          </h5>
          <div class="table-area">
            <cmp-grid
              :item-source="nodeGridData"
              :columns="columns.nodeColumns"
              :selectable="!readOnly"
              @selectedRow="setSelectedNode"
              :init-custom-action="initNodeGrid"
              :init-auto-select-row="checkSelectedRow(this.selectedNode, 'node')"
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
        <!-- /. 노드 선택 -->

        <article
          class="node-contents -node"
          v-if="showRelatedData"
        >
          <div
            v-for="ntw in networkList"
            :key="`${ntw.cateName}_${ntw.Idx}`"
            class="network-lists"
          >
            <h5 class="modal-sub-title sub-title">
              {{ $t('admin.WF.network') }} - [ {{ ntw.cateKey }} ]{{ ntw.vlanId ? ' ( vlan Id: ' + ntw.vlanId + ' )' : '' }}
            </h5>
            <div class="table-area">
              <cmp-grid
                :item-source="networkGridData"
                :columns="columns.networkColumns"
                :selectable="!readOnly"
                @selectedRow="setSelectedNetwork(...arguments, ntw)"
                :init-custom-action="initNodeGrid"
                :init-auto-select-row="checkSelectedNetwork()"
                init-auto-select-row-key="subnetUuid"
                @loaded-rows="onLoadedNetworkRows"
              >
                <template
                  v-for="column in columns.networkColumns"
                  :slot="column.binding"
                  slot-scope="props"
                >
                  <div :key="column.binding">
                    <el-input
                      v-if="props.row[column.binding].edit"
                      v-model="props.row[column.binding].data"
                      type="text"
                      @keydown.native.enter="saveCustomIpPool(props.row[column.binding])"
                      @blur="saveCustomIpPool(props.row[column.binding])"
                    />

                    <!-- IP 관리대장 확인이 필요한 경우는 "-" 표기 -->
                    <span v-if="props.row.message">-</span>
                    <div v-else>
                      <button
                        class="button"
                        v-if="editIP(props, column) && column.binding !== 'customIp'"
                        @click="e => {
                          isReadOnly(props, column) ? null : props.row[column.binding].edit = true;
                          clickEvt(e)
                        }"
                      >
                        {{ $v('직접 입력') }}
                      </button>

                      <span
                        class="custom-ip"
                        v-if="showIP(props, column) && column.binding !== 'customIp'"
                        @click="e => {
                          isReadOnly(props, column) ? null : props.row[column.binding].edit = true;
                          clickEvt(e)
                        }"
                      >
                        {{ readIP(props, column) }}
                      </span>

                      <!-- ///// -->

                      <button
                        class="button"
                        v-if="editIP(props, column) && column.binding === 'customIp'"
                        @click="isReadOnly(props, column) ? null : handleIpSelection(props, true)"
                      >
                        {{ $v('IP 선택') }}
                      </button>

                      <span
                        class="custom-ip"
                        v-if="showIP(props, column) && column.binding === 'customIp'"
                        @click="isReadOnly(props, column) ? null : handleIpSelection(props, true)"
                      >
                        {{ readIP(props, column) }}
                      </span>
                    </div>
                  </div>
                </template>

                <template #ipBand="props">
                  {{ props.row.ipBand }}
                </template>

                <template #ipPool="props">
                  <button-popup
                    v-if="props.row.subnetPools"
                    :popup-data="setIpPools(props.row.subnetPools)"
                    trigger="hover"
                  >
                    IP Pool
                  </button-popup>
                </template>

                <template #activeIPAM="props">
                  <cmp-status-tag
                    :type="props.row.activeIPAM ? 'is-complete' : 'is-fail'"
                    :line-style="true"
                    style="width: 50px;"
                  >
                    {{ props.row.activeIPAM ? 'ON' : 'OFF' }}
                  </cmp-status-tag>
                </template>
              </cmp-grid>
            </div>
          </div>
        </article>
        <!-- /. 네트워크 선택 -->

        <article
          v-if="showRelatedData && data.resourceType === 'NEW'"
          class="node-contents"
        >
          <h5 class="modal-sub-title sub-title">
            {{ $v('Cloud init Script 선택') }}
          </h5>

          <!-- <cloud-init-fetch-list
            use-preview
            :preview-data="cloudInitPreviewData"
            :read-only="readOnly"
            :contents="script"
            @change="changeCloudInitScript"
          /> -->
          <cloud-init-fetch-list
            :saved-script="replacedScript"
            :network-cate-idx="cloneData.networkList[0].cateIdx"
            :network-info="cloudInitPreviewData"
            @change="changeCloudInitScript"
          />
          <!-- /. Cloud init Script 선택 * -->
        </article>
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

    <el-dialog
      append-to-body
      :title="$v('IP 선택')"
      :visible="isOpenIpSelection"
      @close="handleIpSelection({}, false)"
    >
      <select-ip-component
        :parameter="updateNetwork ? updateNetwork.params : null"
        @save="selectIP"
      />
    </el-dialog>
  </el-dialog>
</template>

<script>
import ButtonPopup from '@/components/ButtonPopup/ButtonPopup'
// import CloudInitFetchList from '@/components/CloudInit/CloudInitFetchList'
import { Tooltip } from '@grapecity/wijmo'
import { cloneDeep } from 'lodash'
import TaskSourceModalMixins from './TaskSourceModalMixins.script'
import API, { SelectIpComponent, CloudInitFetchList } from '@sd-fe/cmp-core'

export default {
  name: 'TaskSourceModalCompute',
  mixins: [TaskSourceModalMixins],
  components: {
    'button-popup': ButtonPopup,
    'select-ip-component': SelectIpComponent,
    'cloud-init-fetch-list': CloudInitFetchList
  },
  props: {
    data: { // 선택된 row를 가져옵니다
      type: Object,
      default () {}
    },
    tableData: { // 전체 테이블 데이터
      type: Array,
      default: () => []
    },
    orderData: {
      type: Object,
      default: undefined
    },
    id: {
      type: [Number, String],
      default: undefined
    },
    active: {
      type: Boolean,
      default: false
    },
    readOnly: { // 읽기 전용
      type: Boolean,
      default: false
    }
  },
  computed: {
    isOVA () {
      if (this.data?.ovaUuid) return true
      else return false
    }
  },
  watch: {
    selectedNetwork (network) {
      this.updatePreviewData(network)
    },
    async active (newVal) {
      if (newVal) {
        console.clear()
        console.log('%c@@ DATA :: ', 'color: skyblue', this.data)

        this.cloneData = cloneDeep(this.data)
        this.networkList = this.cloneData.networkList
        this.script = this.data.script

        await this.getOperationList(this.data.manageGroupIdx, 'COMPUTE')
        this.getImages(this.data)
        this.getClusters()
        this.getIpBands(this.networkList)
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

      const subnets = await this.getClusterSubnets(cluster)
      const hosts = await this.getClusterHosts(cluster)

      this.setRelatedHosts(hosts)
      this.setNetworkGridData(subnets)

      // console.log(cluster, '---- cluster')
      // console.log(subnets, '---- subnets')
      // console.log(hosts, '---- hosts')

      // 클러스터 선택이 바뀔때마다 하위 node/image/네트워크를 선택 해제합니다.
      this.setSelectedNode(null)
      this.setSelectedImage(null)
      this.setSelectedNetwork(null)
    }
  },
  methods: {
    /**
     * Cloud Init Script 변수에 치환될 Preview 데이터를 업데이트 합니다.
     * network: Grid Row
     */
    updatePreviewData (networkRow = this.selectedNetwork) {
      if (!networkRow || !networkRow.dataItem) return

      const network = networkRow.dataItem

      const HOSTNAME = this.data.hostname
      const IP_ADDRESS = network.customIp?.data || '' // || network.subnetInfo.subnetIp
      const NETMASK = network.netmask?.data || network.subnetInfo.netmask
      const GATEWAY = network.defaultGatewayIp?.data || network.subnetInfo.defaultGatewayIp
      const DNS = network.dns?.data || ''
      const PREFIX = network.prefix.data || network.subnetInfo.prefixLength

      const previewData = { HOSTNAME, IP_ADDRESS, GATEWAY, NETMASK, DNS, PREFIX }
      this.cloudInitPreviewData = cloneDeep(previewData)
    },

    /**
     * 초기에 클러스터 데이터를 호출하여 가져옵니다.
     */
    async getClusters () {
      this.loading = true

      try {
        const clusters = await API.compute.getElementListSimple()

        // for (const cluster of clusters) {
        //   const { imageType } = await this.getImages(cluster)
        //   cluster.imageType = imageType
        // }

        this.rawClusters = clusters.filter(cls => {
          return cls.centralIdx && this.compareOperationList('CLUSTER', cls.clusterUuid)
        })

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

      // ## [OVA] -> ova가 등록되어 있는 센트럴에 등록 되어있는 클러스터만 선택 가능하게 처리; this.data와 동일한 centralIdx를 가진 클러스터만 선택 가능하게 설정
      const condition1 = cls => this.isOVA ? this.data?.centralIdx === cls.centralIdx : true
      const condition2 = imageType => imageType === 'DISK_IMAGE' // 이미지 타입이 ‘DISK_IMAGE’ 인 클러스터만 선택 가능, 나머지는 disable 처리

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

        const imageType = this.imageTypes[clusterUuid]

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
          },
          isSelectable: condition1(cls) && condition2(imageType),
          isImageDiskType: condition2(imageType),
          notRegisteredImage: imageType === undefined
        }
      })
    },

    // -------------------------------------------------------
    // --------------------- 노드 (호스트) ----------------------
    // -------------------------------------------------------

    /**
     * 클러스터의 [노드(호스트)] 정보를 가져옵니다.
     * @param {Number} elementIdx
     * @return {Array} hosts
     */
    async getClusterHosts ({ elementIdx }) {
      if (!elementIdx) return []
      try {
        this.loading = true
        return await API.compute.getHosts(elementIdx)
      } catch (error) {
        console.error('**Error: Get Cluster Hosts: ', error)
      } finally {
        this.loading = false
      }
    },

    /**
     * [클러스터]가 선택 된 경우, 선택된 클러스터와 동일한 uuid를 가진 [노드(호스트)]들을 세팅합니다.
     * @param {Array} hosts 호스트 정보
     */
    async setRelatedHosts (hosts = []) {
      this.nodeGridData = hosts.filter(host => this.compareOperationList('NODE', host.hostUuid))
    },

    // -------------------------------------------------------
    // ------------------------ 이미지 -------------------------
    // -------------------------------------------------------

    // OS 이미지 목록 조회
    async getImages ({ imageId }) {
      try {
        this.loading = true
        const { clusterImages } = await API.compute.getImage(imageId) || []

        const imageTypes = { }
        if (clusterImages) {
          for (const { clusterUuid, imageType } of clusterImages) {
            imageTypes[clusterUuid] = imageType
          }
        }

        this.imageTypes = imageTypes
      } catch (error) {
        this.imageTypes = {}
        console.error('@OS 이미지 조회 실패: ', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    // OVA 목록 조회 (VMTemplate인 경우)
    async getOVAList () {
      if (!this.isNew) return // 변경 > VM 템플릿 선택 옵션 없음
      try {
        this.loading = true
        const { data } = await API.compute.getOVAList() || []
        return data
      } catch (error) {
        console.error(this.$v('VM 템플릿 리스트 조회를 실패하였습니다.', error))
        return []
      } finally {
        this.loading = false
      }
    },

    // ------------------------------------------------------
    // ---------------------- Subnet ------------------------
    // ------------------------------------------------------

    /**
     * IP Band 전체 조회
     */
    async getIpBands ([{ cateIdx }]) {
      try {
        const response = await API.network.getIpBands(cateIdx)
        this.ipBands = response
      } catch (error) {
        console.error('@@ getIpBands', error)
        this.ipBands = []
      }
    },

    /**
     * Subnet vs IP 관리대장 비교
     * [메모]
     *    - IP 관리대장에서는 VLAN ID + 대역 이 둘다 있는 경우에만 ipBandIdx 가 생성 됨 (IPAM ON)
     *       => ipBandIdx 로만 IP 관리대장 검색
     *    - (IPAM OFF) 인 경우는 대역이 없고 VLAN ID 만 있기 때문에 비교 ipBandIdx 로 검색이 불가능
     *       => VLAN ID 로만 IP 관리대장 검색
     *    - 기본적으로 subnet 의 VLAN ID 는 "필수"이지만, IP 관리대장의 VLAN ID 는 "선택"이다.
     *
     * [조건]
     *  1) IPAM ON
     *    - VLAN ID, 대역 모두 일치                 :: 정상  => [IP 선택] 버튼 노출
     *    - VLAN ID, 대역 둘다 없거나 / 둘다 다른 경우  :: 비정상  => 선택 불가능, 등록 요청 메세지
     *    - VLAN ID, 대역 둘 중 하나라도 다른 경우     :: 비정상 => 선택 불가능, 확인 요청 메세지
     *
     *  2) IPAM OFF (Static IP - 대역이 없으므로 VLAN 만 비교함)
     *    - VLAN ID (subnet) === VLAN ID (IP 관리대장)    :: 정상   => [IP 선택] 버튼 노출
     *    - VLAN ID (subnet) =/= VLAN ID (IP 관리대장)    :: 비정상  => (IP 관리대장의 VLAN ID가 없는 경우도 포함) 선택 불가능, 확인 요청 메세지
     */
    compareInIpBands (subnet, isAuto) {
      const {
        vlanId: subnetVLAN, // VLAN ID
        subnetIp,
        prefixLength,
        subnetPools
      } = subnet

      const subnetRANGE = subnetIp ? `${subnetIp}/${prefixLength}` : undefined // IP 대역
      const cateIdx = this.cloneData.networkList[0].cateIdx

      // pool 범위 필터링
      const pools = Array(260) // ip 에 .0 ~ .255 까지 있겠지?

      if (subnetPools) { // pool 있는 경우만
        subnetPools.forEach(({ startAddress, endAddress }) => {
          const range = addrs => Number(addrs.split('.').slice(-1)[0])
          const start = range(startAddress)
          const end = range(endAddress)
          // console.log(startAddress, endAddress, start, end)

          for (let i = start; i <= end; i++) pools[i] = i
        })
      }

      // subnet vs IP 관리대장 값 비교 시작

      let matchVLAN = false // VLAN ID (비교 결과)
      let matchRANGE = false // IP 대역 (비교 결과)
      let data = null // 세팅해줘야할 default Data 저장

      for (const {
        vlanId: bandVLAN, // VLAN ID
        ipRange: bandRANGE, // IP 대역
        ipBandIdx,
        ...band
      } of this.ipBands) { // ipBandIdx
        const compare1 = String(subnetVLAN) === bandVLAN
        const compare2 = subnetRANGE === bandRANGE

        if (compare1) matchVLAN = true
        if (compare2) matchRANGE = true

        if (isAuto && (compare1 && compare2)) data = { band: { ...band, ipRange: bandRANGE }, params: { pools, cateIdx, ipBandIdx } } // (IPAM ON) VLAN ID, 대역 모두 일치
        if (!isAuto && (compare1)) data = { band, params: { cateIdx, vlanId: bandVLAN } } // (IPAM OFF) VLAN ID 만 일치

        // if (compare1 || compare2) { // 🌸 디버깅을 해보자!
        //   console.log(
        //     '%c## 비교 시작 ', 'color: yellow',
        //     '\nIPAM ON :: ', isAuto,
        //     '\nVLAN ID :: ', String(subnetVLAN), 'vs', bandVLAN, String(subnetVLAN) === bandVLAN,
        //     '\nIP 대역 :: ', subnetRANGE, bandRANGE, subnetRANGE === bandRANGE,
        //     '\n', data
        //   )
        // }
      }

      // console.log(matchVLAN, matchRANGE, data)

      if (isAuto) {
        // 1) IPAM ON 일경우
        if (matchVLAN && matchRANGE) return { pass: true, message: null, data }
        else if (!matchVLAN && !matchRANGE) return { pass: false, message: this.$v('IP 관리대장을 등록해주세요.'), data }
        else if (!matchVLAN || !matchRANGE) return { pass: false, message: this.$v('IP 관리대장을 확인해주세요.'), data }
      } else {
        // 2) IPAM OFF 일경우
        if (matchVLAN) return { pass: true, message: null, data }
        else return { pass: false, message: this.$v('IP 관리대장을 확인해주세요.'), data }
      }
    },

    /**
     *
     * 클러스터 Subnet 데이터를 가져옵니다. (네트워크 그리드 목록)
     * @param {Number} elementIdx 클러스터의 index
     */
    async getClusterSubnets ({ elementIdx }) {
      if (!elementIdx) return []
      try {
        return await API.compute.getClusterSubnets(elementIdx)
      } catch (error) {
        console.error('@@ getClusterSubnets', error)
        return []
      }
    },

    /**
     * 클러스터에 연결된 네트워크 정보를 네트워크 그리드에 세팅합니다.
     * @param {Array} subnets subnet 정보
     */
    setNetworkGridData (subnets) {
      // console.log(subnets, 'subnets....')
      // console.log('%c ========= ', 'color: #77FF33')
      // console.clear()

      const data = []
      subnets.forEach(subnet => {
        const copySubnet = {
          ...subnet
          // cateIdx: cls.cateIdx,
          // cateName: cls.cateName || ''
        }

        // true 일 경우 자동 IP 입니다.
        const isAuto = !!subnet?.defaultGatewayIp

        // 자동 IP 이지만 IP Pool 이 없는 경우는 포함하지 않습니다.
        if (isAuto && !subnet.subnetPools) return

        const { pass, message, data: ipInfo = {} } = this.compareInIpBands(subnet, isAuto)
        const { band, params } = ipInfo || { band: {}, param: {} } // IP 관리대장에 등록된 정보들 || (없으면) 기본 값
        // console.log('IPAM type : ', isAuto, '\npass : ', pass, '\nmessage : ', message, '\nband : ', band, '\nparams : ', params)

        // 이미 기존에 선택되어있던 네트워크가 있다면 해당 내용 텍스트들로 data 를 채워줍니다.
        // 기존에 선택되어있던 내용이 없다면 기본 데이터 || 빈 문자열입니다. (자동일때, 수동일때 조건도 포함됩니다)
        const temp = { ...this.cloneData.networkList[0] }
        const regIp = temp?.subnetUuid === subnet?.subnetUuid // 이미 이전에 선택된 네트워크가 있는 경우 true
        const hasSelected = regIp // 선택된 네트워크가 있고 && 수동 IP 일때
        const ipBand = band.ipRange || undefined // IP 대역

        const defaultCustomIp = regIp ? temp.ipAddress : ''
        const defaultGateway = (hasSelected) ? temp.gateway : band.gatewayIpAddress
        const defaultNetmask = (hasSelected) ? temp.netmask : band.netmask
        const defaultDns = (hasSelected) ? temp.dns : band.dnsIpAddress
        const defaultPrefix = (hasSelected) ? temp.prefix : band.prefixLength

        // [직접 입력] 되었는지 여부 와 입력된 데이터 등을 설정합니다.
        // 이 라인을 주석처리하면 에러가 납니다.. disabled 여부만 설정해주세요
        const editable = { edit: false, disabled: this.readOnly } // v3 코드) 이젠 IPAM 도 수정 가능함?

        const customIp = { ...editable, disabled: this.readOnly, data: defaultCustomIp }
        const defaultGatewayIp = { ...editable, data: defaultGateway }
        const netmask = { ...editable, data: defaultNetmask }
        const dns = { ...editable, data: defaultDns }
        const prefix = { ...editable, data: defaultPrefix }
        const activeIPAM = isAuto

        const subnetData = {
          subnetInfo: { ...copySubnet }, // subnet 원본
          ...copySubnet,
          customIp, // IP
          defaultGatewayIp, // Gateway
          netmask, // Netmask
          dns, // DNS
          prefix,
          ipBand, // IP 대역
          activeIPAM, // IPM 활성 여부

          ipCategoryIdx: band.ipCategoryIdx, // IP 검색시 필요
          // 네트워크 선택 validation
          isSelectable: pass,
          message,
          params
        }

        // 자동 / 수동 할당인경우 확인할 수 있는 프로퍼티 생성
        Object.defineProperty(subnetData, 'isIPAM', { value: isAuto, writable: false })

        // 혹시 모르니까.. 서버에서 받아온 netmask 저장
        Object.defineProperty(subnetData, 'savedNetmask', { value: subnet.netmask, writable: false })

        data.push(subnetData)

        // ## [OVA] -> 참고하는 subnet 우선 선택 되어있도록 처리; this.data.spec.nicList[0]의 subnetReferenceUuid와 동일한 subnetUuid를 가진 네트워크 자원으로 설정
        const ovaNicList = this.data?.spec?.nicList
        if (
          this.isOVA &&
          ovaNicList?.length &&
          ovaNicList[0].subnetReferenceUuid === subnetData.subnetUuid
        ) {
          this.ovaOriginRefSubnet = subnetData
        }
      })

      this.networkGridData = [...data]
      // console.log('%c ========= ', 'color: #77FD33')
      // console.log(this.networkGridData, '==== this.networkGridData')
    },

    /**
     * // ❌ v2) 에서 사용되었던 코드 (혹시 몰라 일단 임시저장)
     * 클러스터에 연결된 네트워크 정보를 네트워크 그리드에 세팅합니다.
     * @param {Array} subnets subnet 정보
     */
    setNetworkGridData_V2 (subnets) {
      // console.log(subnets, 'subnets....')
      // console.log('%c ========= ', 'color: #77FF33')

      const data = []
      subnets.forEach(subnet => {
        const copySubnet = {
          ...subnet
          // cateIdx: cls.cateIdx,
          // cateName: cls.cateName || ''
        }

        // true 일 경우 자동 IP 입니다.
        const isAuto = !!subnet?.defaultGatewayIp

        // 자동 IP 이지만 IP Pool 이 없는 경우는 포함하지 않습니다.
        if (isAuto && !subnet.subnetPools) return

        // 이미 기존에 선택되어있던 네트워크가 있다면 해당 내용 텍스트들로 data 를 채워줍니다.
        // 기존에 선택되어있던 내용이 없다면 기본 데이터 || 빈 문자열입니다. (자동일때, 수동일때 조건도 포함됩니다)
        const temp = { ...this.cloneData.networkList[0] }
        const regIp = temp?.subnetUuid === subnet?.subnetUuid // 이미 이전에 선택된 네트워크가 있는 경우 true
        const hasSelected = regIp && !isAuto // 선택된 네트워크가 있고 && 수동 IP 일때
        const ipBand = subnet.subnetIp ? `${subnet.subnetIp}/${subnet.prefixLength}` : undefined

        const defaultCustomIp = regIp ? temp.ipAddress : ''
        const defaultGateway = (hasSelected) ? temp.gateway : subnet.defaultGatewayIp
        const defaultNetmask = (hasSelected) ? temp.netmask : subnet.netmask
        const defaultDns = (hasSelected) ? temp.dns : ''
        const defaultPrefix = (hasSelected) ? temp.prefix : subnet.prefixLength

        // [직접 입력] 되었는지 여부 와 입력된 데이터 등을 설정합니다.
        // 이 라인을 주석처리하면 에러가 납니다.. disabled 여부만 설정해주세요
        const editable = { edit: false, disabled: isAuto }

        const customIp = { ...editable, disabled: false, data: defaultCustomIp }
        const defaultGatewayIp = { ...editable, data: defaultGateway }
        const netmask = { ...editable, data: defaultNetmask }
        const dns = { ...editable, data: defaultDns }
        const activeIPAM = isAuto

        const subnetData = {
          ...copySubnet,
          customIp, // IP
          defaultGatewayIp, // Gateway
          netmask, // Netmask
          dns, // DNS
          prefix: defaultPrefix,
          ipBand, // IP 대역
          activeIPAM // IPM 활성 여부
        }

        // 자동 / 수동 할당인경우 확인할 수 있는 프로퍼티 생성
        Object.defineProperty(subnetData, 'isIPAM', { value: isAuto, writable: false })

        // 혹시 모르니까.. 서버에서 받아온 netmask 저장
        Object.defineProperty(subnetData, 'savedNetmask', { value: subnet.netmask, writable: false })

        data.push(subnetData)

        // ## [OVA] -> 참고하는 subnet 우선 선택 되어있도록 처리; this.data.spec.nicList[0]의 subnetReferenceUuid와 동일한 subnetUuid를 가진 네트워크 자원으로 설정
        const ovaNicList = this.data?.spec?.nicList
        if (
          this.isOVA &&
          ovaNicList?.length &&
          ovaNicList[0].subnetReferenceUuid === subnetData.subnetUuid
        ) {
          this.ovaOriginRefSubnet = subnetData
        }
      })

      this.networkGridData = [...data]
      // console.log('%c ========= ', 'color: #77FD33')
      // console.log(this.networkGridData, '==== this.networkGridData')
    },

    /**
     * [네트워크] 영역에서 선택한 row가 [수동] 일 경우에 validation 처리
     * 참고 ** DNS 는 입력이 옵션입니다.
     * @param { Object } item this.selectedNetwork.dataItem
     */
    async networkManualValidation (item = this.selectedNetwork.dataItem) {
      const ipFormatData = [item.customIp, item.defaultGatewayIp, item.dns, item.netmask]

      const isIPEditing = ipFormatData.some(cond => cond?.edit)
      const isIPEmpty = ipFormatData.some(cond => cond?.data === '' || !cond?.data)
      const ipformatCheck = ipFormatData.every(item => this.ipformat.test(item.data))

      // IP, Gateway, Netmask, Prefix 수정중 일 경우
      const conditions = [
        { condition: isIPEmpty, message: this.$t('common.ALERT.PROJECT.060') }, // IP가 없습니다. IP 를 먼저 입력해주세요.
        { condition: isIPEditing, message: this.$t('common.ALERT.SECURITY.026') }, // IP를 수정 중 입니다. 완료 하신 후 다시 확인 해주세요.
        { condition: !ipformatCheck, message: this.$t('common.ALERT.PROJECT.023') } // 입력하신 값은 IP형식이 아닙니다.
      ]

      const validator = conditions.every(cond => {
        // true 가 있으면 차단
        if (cond?.condition) this.$alert(cond.message)
        return !cond?.condition
      })

      if (!validator) return false

      // 1. 자원 목록에 동일한 IP 가 등록되어있는지 확인
      // const isUsing = await this.isUsingIpinSources(item.customIp)
      // if (isUsing) return false

      // 2. API로 validation 추가
      const serverChecking = await this.ipChecking(item.customIp.data, item)
      if (!serverChecking) return false

      this.selectedNetworkList[0] = {
        ...this.selectedNetworkList[0],
        ipAddress: item.customIp.data, // customIP
        gateway: item.defaultGatewayIp.data, // Gateway
        dns: item.dns.data, // DNS
        netmask: item.netmask.data, // netmask
        prefix: item.prefix.data // prefix
      }

      return true
    },
    /**
     * [네트워크] 영역에서 선택한 row가 [자동] 일 경우에 validation 처리
     * [직접입력] 을 사용하여 아이피가 등록되지 않은 경우는 서버에서 자동으로 IP 가 할당됩니다.
     * @param { Object } data this.selectedNetwork.dataItem
     */
    async networkAutoValidation (item = this.selectedNetwork.dataItem) {
      const customIP = item.customIp

      // [직접입력] 으로 직접 입력이 된 경우
      if (customIP.data) {
        const ipformatCheck = this.ipformat.test(customIP.data)

        // 1. ip 형식이 맞는지 확인
        if (!ipformatCheck) {
          this.$alert(this.$t('common.ALERT.PROJECT.023')) // 입력하신 값은 IP형식이 아닙니다.
          return false
        }

        // ip 형식 가공
        const atoi = ip => {
          const pad = n => { return (n.length < 3) ? pad('0' + n) : n }
          return parseInt(ip.split('.').map((el) => pad(el)).join(''), 10)
        }

        // 2. 직접 입력된 IP 가 startAddress ~ endAddress 내부에 있는지 확인합니다.
        //    ipPool 범위중 하나라도 포함될 경우 true 를 반환합니다.
        const isIncluded = item.subnetPools?.some(pool => {
          // console.log(atoi(customIP.data))
          return (
            atoi(customIP.data) >= atoi(pool.startAddress) &&
            atoi(customIP.data) <= atoi(pool.endAddress)
          )
        })

        if (!isIncluded) {
          this.$alert(this.$t('common.ALERT.SECURITY.028')) // IP 범위를 벗어났습니다.
          return false
        }

        // 3. 자원 목록에 동일한 IP 가 등록되어있는지 확인
        // const isUsing = await this.isUsingIpinSources(customIP)
        // if (isUsing) return false

        // 4. API로 validation 추가
        const serverChecking = await this.ipChecking(customIP.data, item)
        if (!serverChecking) return false
      }

      // 임시?
      // if (customIP.data) this.selectedNetworkList[0].ipAddress = customIP.data
      // this.selectedNetworkList[0].ipAddress = customIP.data

      this.selectedNetworkList[0] = {
        ...this.selectedNetworkList[0],
        ipAddress: customIP.data, // customIP
        gateway: item.defaultGatewayIp.data, // Gateway
        dns: item.dns.data, // DNS
        netmask: item.netmask.data, // netmask
        prefix: item.prefix.data // prefix
      }
      if (!customIP.data) delete this.selectedNetworkList[0].ipAddress
      return true
    },

    /**
     * v3) 임시 주석처리!
     * UI 에서 ip 를 체크합니다. (안정화 후 테스트를 해봐야할것 같음 🟧)
     * @param { String } customIP [직접입력] 으로 입력된 ip 가 현재 자원에서 사용중인지 확인합니다.
     */
    isUsingIpinSources ({ data }) {
      const networkList = this.tableData.map((d, idx) => {
        let ip
        d.networkList.forEach(({ ipAddress }) => { ip = ipAddress })
        return { ip, idx }
      })

      console.log(this.tableData)
      console.log(networkList)

      let isUsing = false
      for (const { ip, idx } of networkList) {
        if (this.id === idx) break // 현재 보고있는 모달이 클러스터 [수정] 일경우 제외
        if (ip === undefined) continue // 등록된 ip가 없다면 (cluster 등록 X 했다는 의미) 패스

        // 목록 ip 와 현재 [직접입력] ip 비교
        const regex = new RegExp(ip, 'g')
        isUsing = regex.test(data)
      }
      console.log(networkList, data, isUsing, '==== result')

      // 현재 목록에서 해당 ip 가 존재할 때 :: true
      if (isUsing) {
        // 해당 IP 는 사용중입니다.
        this.$alert(this.$t('common.ALERT.SECURITY.059'), { callback: () => false })
      }
      return isUsing
    },
    /**
     * 서버에서 ip 를 체크합니다.
     * @param { String } data 직접 입력된 ip 의 string 데이터
     * @param { Object } item 자원에 할당된 네트워크 정보 selectedNetwork
     */
    async ipChecking (data, item) {
      try {
        const vlanId = item.vlanId
        const ipCategoryIdx = item.ipCategoryIdx
        const itemIdx = this.cloneData.srcIdx

        // network (true = 사용가능), work (false = 사용 가능)
        const networkIpCheck = await API.network.ipCheck({ ip: data, ipCategoryIdx, vlanId }) // ip 대역 체크
        const taskIpCheck = await API.work_v3.taskIpCheck({ ip: data, itemIdx }) // 장바구니 ip 사용중 체크

        if (!networkIpCheck || taskIpCheck) {
          this.$alert(this.$t('common.ALERT.PROJECT.021'), '', () => false) // 이미 등록되어 있는 IP 입니다
          return false
        } else return true
      } catch (error) {
        console.error('@@ ipChecking', error)
        const message = {
          NET1507: this.$t('common.ALERT.PROJECT.076'), // 미등록 IP 입니다.
          NET1508: this.$t('common.ALERT.PROJECT.021') // 이미 사용중인 IP 입니다
        }[error.data.code]

        this.$alert(message || this.$t('common.ALERT.PROJECT.077'), '', () => false) // 해당 IP는 등록이 불가능합니다.
        return false
      }
    },

    // -------------------------------------------------------
    // ----------------- Cloud Init Script -------------------
    // -------------------------------------------------------

    /**
     * CloudInitScript 변경 이벤트
     */
    changeCloudInitScript (text) {
      // this.script = text
      this.replacedScript = text
    },

    // ===================================================
    // ======================= 기타 =======================
    // ===================================================

    /**
     * IP 선택 모달 오픈
     * @param {Object} network
     * @param {String} key
     */
    handleIpSelection (props, status) {
      const { row = null } = props
      this.isOpenIpSelection = status
      this.updateNetwork = row
    },

    /**
     * IP 선택하면 그리드에 저장
     */
    selectIP ({ ip, gatewayIpAddress, dnsIpAddress, netmask, ...info }) {
      this.isOpenIpSelection = false
      const data = this.updateNetwork

      this.networkGridData.forEach(item => {
        // 230510 회의록 기반) https://docs.google.com/document/d/1kKL3owxMp72WFl-Swox9WjW8_2w0T0jt/edit#

        if (item.subnetUuid === data.subnetUuid) { // index 로 넣으면 너무 위험한 방법이라 ㅠ
          item.customIp.data = ip // IP 자동 할당
          item.defaultGatewayIp.data = gatewayIpAddress // Gateway 자동 할당
          item.dns.data = dnsIpAddress // DNS 자동 할당
          item.netmask.data = netmask // Netmask 자동 할당
        }
      })

      this.updateNetwork = null
    },

    /**
     * [직접 입력] 시 자동으로 해당 셀에 생긴 input 박스에 focus 를 입력합니다.
     * @param {Event Object} e 이벤트 객체
     */
    async clickEvt (e) {
      return new Promise(function (resolve, reject) {
        setTimeout(() => {
          const node = e?.path ? e.path.querySelectorAll('input') : null
          if (node && node.length) resolve(node[0])
        }, 20)
      })
        .then(abc => abc.focus())
        .catch(err => {
          console.error(err, 'Element doensn\'t exist.')
        })
    },
    /**
     * [직접 입력]한 ip 를 저장합니다.
     */
    saveCustomIpPool (props) {
      props.edit = false
      // 미리보기 데이터 업데이트 (Cloud Init Script)
      this.updatePreviewData(this.selectedNetwork)
    },
    /**
     * 선택된 클러스터와 노드를 모두 취소해줍니다.
     */
    setResetGrid () {
      this.selectedCluster = null
      this.selectedNode = null
      this.selectedNetwork = null
      this.selectedImage = null

      this.gridRefresh(this.clusterGrid)
      this.gridRefresh(this.nodeGrid)
    },
    gridRefresh (grid) {
      if (grid) {
        const cv = grid.collectionView
        if (cv) cv.refresh()
      }
    },
    close (data) {
      this.setResetGrid()
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
        { condition: this.selectedCluster, message: this.$t('common.ALERT.NUTA.010') }, // 클러스터를 먼저 선택하세요.
        { condition: this.selectedNode, message: this.$t('common.ALERT.BASE.006') }, // 노드를 선택하세요.
        // { condition: this.selectedImage, message: this.$t('common.ALERT.NUTA.008') }, // 이미지를 선택해주세요.
        { condition: this.selectedNetworkList.length, message: this.$t('common.ALERT.NETWORK.003') } // 네트워크를 선택하세요.
      ]

      // 기본으로 다 선택되어있는지 확인
      const validator = conditions.every(cond => {
        if (!cond.condition) this.$alert(cond.message, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
        return cond.condition
      })

      if (!validator) return

      const selectedNetwork = this.selectedNetwork.dataItem

      // 선택된 네트워크가 수동인 경우 : 자동인경우 - validation 체크
      const passed = !selectedNetwork.isIPAM ? this.networkManualValidation(selectedNetwork) : this.networkAutoValidation(selectedNetwork)
      // console.log(!selectedNetwork.isIPAM ? '수동' : '자동')

      // console.log(await passed, '=== 형식을 모두 만족하였읍니다~!! 🔥🔥🔥')

      if (await passed) {
        const ipAllocator = this.$store.state.auth.user.userId

        const emitData = {
          cluster: this.selectedCluster.dataItem,
          node: this.selectedNode.dataItem,
          // image: this.selectedImage.dataItem?.raw,
          networkList: this.selectedNetworkList,
          script: this.replacedScript,
          ipAllocator
        }

        return this.emitSavedData(Object.assign(emitData))
      }
    },

    /**
     * 데이터를 emit 하여 부모컴포넌트에 보냅니다.
     * @param { Object } emitData 가공된 데이터
     */
    emitSavedData (emitData) {
      this.$confirm(this.$t('common.CONFIRM.BASE.019'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.$emit('confirm', emitData)
        this.$emit('close')

        this.selectedCluster = null
        this.selectedNode = null
        this.selectedImage = null
        this.selectedNetworkList = []
      }).catch(() => false)
    },

    /**
     * 선택 클러스터 = this.selectedCluser
     */
    setSelectedCluster (param) {
      this.$emit('selectedCluster', param)
      this.selectedCluster = param
    },
    /**
     * 선택 노드 = this.selectedNode
     */
    setSelectedNode (param) {
      this.$emit('selectedNode', param)
      this.selectedNode = param
    },
    /**
     * 선택 네트워크 = this.selectedNetwork
     */
    setSelectedNetwork (param, cateInfo) {
      const data = param ? param.dataItem : null
      const result = JSON.parse(JSON.stringify(this.selectedNetworkList))

      const addSelectedInfo = {
        ...cateInfo,
        subnetName: data?.subnetName,
        subnetUuid: data?.subnetUuid,
        vlanId: data?.vlanId
      }

      if (data) {
        let hasIdIdx
        const hasId = result.filter((network, nIdx) => {
          if (network.cateId === cateInfo.cateId) {
            hasIdIdx = nIdx
            return true
          }
        })
        if (hasId.length) result.splice(hasIdIdx, 1, addSelectedInfo)
        else result.push(addSelectedInfo)
      } else {
        result.forEach((network, nIdx) => {
          if (network?.cateId === cateInfo?.cateId) return result.splice(nIdx, 1)
        })
      }

      this.$emit('selectedNetwork', param)
      this.selectedNetwork = param
      this.selectedNetworkList = [...result]
    },

    /**
     * 선택 이미지 = this.selectedImage
     */
    setSelectedImage (param) {
      this.$emit('selectedImage', param)
      this.selectedImage = param

      // VM 템플릿인지 확인 (일단 임시 땜빵; Compute 가 이미지 하나뿐이라 ...)
      const isVMTemplate = !!this.data.ovaUuid
      if (isVMTemplate) this.initImageRow = param ? param.dataItem : null
      // console.log(this.initImageRow)
    },

    /**
     * 자동선택된 이미지의 페이지로 이동합니다
     * 없으면 그냥 0에 머무를 예정
     */
    initImagePage () {
      if (this.imageGrid && this.initImageRow) {
        setTimeout(() => {
          const index = this.imageGridData.findIndex(img => (img.userImageIdx === this.initImageRow?.userImageIdx))
          const page = Math.abs(parseInt(index / 10))
          this.imageGrid.collectionView.moveToPage(page)
        }, 50)
      }
    },

    /**
     * [클러스터 선택 모달]이 켜질때 {클러스터 / 노드} 가 자동으로 선택됩니다. (클러스터/노드 공통으로 사용됨)
     * @param {Object} element 바인딩된 데이터
     * @param {String} propName 카피된 데이터에서 어떤게 필요한지 프로퍼티를 string 으로 받음
     */
    checkSelectedRow (element, propName) {
      // console.log(element, '=== 저장된 요소')
      if (element) return element?.dataItem
      else if (this.cloneData) return this.cloneData[propName]
      else return null
    },

    /**
     * [클러스터 선택 모달]이 켜질때 {네트워크} 가 자동으로 선택됩니다.
     */
    checkSelectedNetwork () {
      if (this.selectedNetwork) return this.selectedNetwork.dataItem

      // ## [OVA] -> 최초 선택
      else if (
        this.isOVA &&
        this.ovaOriginRefSubnet &&
        !this.cloneData?.networkList[0]?.subnetUuid
      ) return this.ovaOriginRefSubnet

      else if (this.cloneData) return this.cloneData.networkList[0]
      else return null
    },

    initClusterGrid (grid) {
      this.clusterGrid = grid
    },
    initNodeGrid (grid) {
      this.nodeGrid = grid
    },
    initImageGrid (grid, data) {
      this.imageGrid = grid
      this.initImagePage()
    },

    /**
    * disabled row 설정 -> 선택 불가능 클러스터는 dimmed 처리
    */
    onLoadedNetworkRows (grid) {
      this.$nextTick(function () {
        for (let i = 0; i < grid.rows.length; i++) {
          const row = grid.rows[i]
          const item = row.dataItem
          const cssList = row.cssClass

          if (item.isSelectable === false) {
            item.disable = true
            row.cssClass = cssList + ' is-disable-row'
          } else {
            item.disable = false
            row.cssClass = cssList?.replace(' is-disable-row', '') || ''
          }
        }

        grid.formatItem.addHandler((s, e) => {
          const rowData = s.rows[e.row]?._data
          this.imageTooltip.setTooltip(e.cell, rowData?.message)
        })
      })
    },

    // ------------- ## [OVA] 자원 분기 처리 ---------------
    /**
    * disabled row 설정 -> 선택 불가능 클러스터는 dimmed 처리
    */
    onLoadedRows (grid) {
      this.$nextTick(function () {
        for (let i = 0; i < grid.rows.length; i++) {
          const row = grid.rows[i]
          const item = row.dataItem
          const cssList = row.cssClass

          if (item.isSelectable === false) {
            item.disable = true
            row.cssClass = cssList + ' is-disable-row'
          } else {
            item.disable = false
            row.cssClass = cssList?.replace(' is-disable-row', '') || ''
          }
        }

        grid.formatItem.addHandler((s, e) => {
          const rowData = s.rows[e.row]?._data
          if (rowData?.osType?.includes('WINDOWS')) {
            this.imageTooltip.setTooltip(e.cell,
              '<small>* WINDOWS는 지원하지 않습니다.</small>')
          }
          if (rowData?.notRegisteredImage === true) {
            const tooltipMsg = this.$v('선택한 이미지에 clusterImage 가 등록되지 않았습니다. 이미지를 확인해주세요.')
            this.imageTooltip.setTooltip(e.cell, `<small>* ${tooltipMsg}</small>`)
            return
          }
          if (rowData?.isImageDiskType === false) {
            const tooltipMsg = this.$v('선택한 이미지가 해당 클러스터 내 ISO 이미지로 등록되어 있어 선택 불가능합니다.')
            this.imageTooltip.setTooltip(e.cell, `<small>* ${tooltipMsg}</small>`)
          }
        })
      })
    }
  },
  data () {
    return {
      ipformat: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      loading: true,
      clusterGrid: null,
      nodeGrid: null,
      imageGrid: null,
      imageTypes: {},
      cloneData: null,
      rawClusters: [], // 가공되지 않은 cluster raw 데이터를 저장합니다.
      networkList: [],
      ipBands: [],
      updateNetwork: null,
      isOpenIpSelection: false,
      selectedCluster: null,
      selectedNode: null,
      selectedNetwork: null,
      selectedNetworkList: [],
      selectedImage: null,
      initImageRow: null,
      initImageRowKey: null,
      scripts: undefined, // Script 불러오기, Cloud Init Script 텍스트 저장
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
        // 노드 그리드 컬럼
        nodeHeaderMergeColumns: {
          colSpan: [
            { startIdx: 1, endIdx: 3, header: this.$t('main.DASHBOARD.usage') }
            // { startIdx: 6, endIdx: 8, header: '할당량' }
          ],
          rowSpan: ['name', 'gpu', 'relateVm']
        },
        nodeColumns: [
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
        // 네트워크 그리드 컬럼
        networkHeaderMergeColumns: {
          colSpan: [
            { startIdx: 2, endIdx: 3, header: 'IP Pool' }
          ],
          rowSpan: ['subnetName', 'vlanId']
        },
        networkColumns: [
          { header: this.$t('common.REGCON.name'), binding: 'subnetName' }, // 이름
          { header: 'VLAN', binding: 'vlanId', width: 130, format: 'd*' },
          { header: 'IP', binding: 'customIp', customHtml: true, sorting: false },
          { header: 'Gateway', binding: 'defaultGatewayIp', customHtml: true, sorting: false },
          { header: 'DNS', binding: 'dns', customHtml: true, sorting: false },
          { header: 'Netmask', binding: 'netmask', customHtml: true, sorting: false },
          { header: 'Prefix', binding: 'prefix', customHtml: true, width: 130, sorting: false },
          { header: 'IP 대역', binding: 'ipBand', customHtml: true, sorting: false },
          { header: 'Pool', binding: 'ipPool', width: 130, customHtml: true, sorting: false },
          { header: this.$t('common.GRID.COMPUTE.activeIPAM'), binding: 'activeIPAM', width: 130, customHtml: true, sorting: false } // IPAM 활성 여부
        ],
        imageColumns: [
          { header: this.$t('service.osType'), binding: 'osType' }, // OS 타입
          { header: 'Bit', binding: 'osBit' },
          { header: this.$t('common.GRID.COMPUTE.imageName'), binding: 'name' }, // 이미지명
          { header: this.$t('common.GRID.COMPUTE.osSizeGb'), binding: 'osRootDiskSize' }, // OS 용량 (GB)
          { header: this.$t('common.GRID.type'), binding: 'imageType', width: 150, customHtml: true } // 타입
        ]
      },
      clusterGridData: [],
      nodeGridData: [],
      networkGridData: [],
      imageGridData: [],
      ovaOriginRefSubnet: null, // ## [OVA] -> 최초 선택
      isReadOnly ({ row }, { binding }) {
        // props.row[column.binding].disabled
        return row[binding].disabled
      },
      readIP ({ row }, { binding }) {
        return row[binding].data
      },
      showIP ({ row }, { binding }) {
        // !props.row[column.binding].edit && props.row[column.binding].data
        return !row[binding].edit && row[binding].data
      },
      editIP ({ row }, { binding }) {
        // !props.row[column.binding].edit && !props.row[column.binding].data && !props.row[column.binding].disabled
        return !row[binding].edit && !row[binding].data && !row[binding].disabled
      },
      setIpPools: subnetPools => {
        return subnetPools.map(pool => {
          const { startAddress, endAddress } = pool
          return { label: `${startAddress} - ${endAddress}` }
        })
      },
      imageTooltip: new Tooltip({
        showAtMouse: true,
        showDelay: 200
      }),
      // Cloud Init Script에 치환할 데이터
      cloudInitPreviewData: {
        hostName: '',
        ip: '',
        gateway: '',
        netmask: '',
        dns: '',
        prefix: ''
      },
      script: '',
      replacedScript: ''
    }
  }
}
</script>

<style lang="scss" scoped>
  .set-cluster-node-modal {
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
