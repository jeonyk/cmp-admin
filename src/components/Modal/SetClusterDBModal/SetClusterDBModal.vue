<!--
  * 파일명 : SetClusterNodeModal.vue
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
              :item-source="imageGridData"
              :columns="columns.imageColumns"
              :selectable="!readOnly"
              :init-custom-action="initImageGrid"
              @selectedRow="setSelectedImage"
              @loaded-rows="onLoadedRows"
              :init-auto-select-row="initImageRow"
              :init-auto-select-row-key="initImageRowKey"
            >
              <template #imageType="props">
                <cmp-status-tag
                  v-if="props.row.imageType"
                  type="is-wait"
                  :contents="(props.row.imageType).split('_IMAGE')[0]"
                />
              </template>
            </cmp-grid>
          </div>
        </article>
        <!-- /. Network Profile -->

        <article
          class="node-contents -node network-list"
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
              <!-- :header-merge="columns.networkHeaderMergeColumns" -->
              <cmp-grid
                :item-source="networkGridData"
                :columns="columns.networkColumns"
                :selectable="!readOnly"
                @selectedRow="setSelectedNetwork(...arguments, ntw)"
                :init-custom-action="initNodeGrid"
                :init-auto-select-row="checkSelectedNetwork()"
                init-auto-select-row-key="subnetUuid"
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

                    <button
                      class="button"
                      v-if="!props.row[column.binding].edit && !props.row[column.binding].data && !props.row[column.binding].disabled"
                      @click="e => {
                        props.row[column.binding].edit = true;
                        clickEvt(e)
                      }"
                    >
                      <!-- 직접 입력 -->
                      {{ $t('common.PLACEHOLDER.enterDirect') }}
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
import ButtonPopup from '@/components/ButtonPopup/ButtonPopup'
import { Tooltip } from '@grapecity/wijmo'
import { cloneDeep } from 'lodash'
import API from '@sd-fe/cmp-core'

export default {
  name: 'SetClusterDBModal',
  components: {
    'button-popup': ButtonPopup
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
    active (newVal) {
      if (newVal) {
        this.getClusters()
        this.cloneData = cloneDeep(this.data)
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

      const { dataItem: cluster } = row

      const subnets = await this.getClusterSubnets(cluster)
      const hosts = await this.getClusterHosts(cluster)

      this.setRelatedHosts(hosts)
      this.setNetworkGridData(subnets)
      this.setImageList(cluster)

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
     * 초기에 클러스터 데이터를 호출하여 가져옵니다.
     */
    async getClusters () {
      this.loading = true

      try {
        const clusters = await API.compute.getElementListSimple()
        // const clusters = await API.compute.getClusters()

        // VM Template 으로 생성한 경우 cluster 조건
        if (this.isOVA) {
          // 1. 신청 자원과 동일 central에 속한 클러스터만 노출 (centralIdx)
          // 2. VM 템플릿 지원 가능 클러스터만 노출 (isSupportOva: true)
          this.rawClusters = clusters.filter(cls =>
            (cls.centralIdx === this.data.centralIdx) &&
            (cls.isSupportOva === true)
          )

        // 일반 Compute 로 생상한 경우 전체 cluster
        } else {
          this.rawClusters = [...clusters]
        }

        this.rawClusters = this.rawClusters.filter(cls => cls.centralIdx)

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
      this.cloneData = cloneDeep(this.data)
      this.networkList = this.cloneData.networkList
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
          },
          // ## [OVA] -> ova가 등록되어 있는 센트럴에 등록 되어있는 클러스터만 선택 가능하게 처리; this.data와 동일한 centralIdx를 가진 클러스터만 선택 가능하게 설정
          isSelectable: this.isOVA ? this.data?.centralIdx === cls.centralIdx : true
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
      this.nodeGridData = cloneDeep(hosts)
    },

    // -------------------------------------------------------
    // ------------------------ 이미지 -------------------------
    // -------------------------------------------------------

    /**
     * [클러스터]가 선택 된 경우, 선택된 클러스터와 동일한 clusterUuid를 가진 [이미지] 목록을 세팅합니다.
     * VM 템플릿의 경우) API 를 호출함
     * clusterUuid 없으면 이미지 목록 전체 호출함
     */
    async setImageList (cluster) {
      // VM 템플릿인지 확인
      const isVMTemplate = !!this.data.ovaUuid
      this.initImageRowKey = isVMTemplate ? 'userImageIdx' : 'imageUuid'

      // [이미지] 목록 설정 : 조건 - VM Template 인 경우 는 그냥 전체 이미지 호출해서 보여줌
      const clusterUuid = cluster ? { clusterUuid: cluster.clusterUuid } : undefined
      const rawImages = isVMTemplate ? await this.getOVAList() : await this.getImages(clusterUuid)

      // [이미지] 목록 형식 가공
      const images = rawImages.map(img => ({
        name: img.osName, // 이미지명
        osRootDiskSize: img.osRootDiskSize, // OS 용량 (GB)
        imageType: img.imageType, // 타입
        osBit: img.osBit, // Bit
        osType: img.osType, // OS 타입
        imageUuid: img.imageUuid, // 이게 고유값
        userImageIdx: img.userImageIdx,
        raw: { ...img }
      }))

      this.imageGridData = images.filter(e => e.userImageIdx === this.cloneData.imageId)

      // 이미지 처음 호출시에는 imageId와 동일한 걸로 자동 선택 (사용자에서 생성할때 선택된 이미지)
      if (this.imageGridData.length > 0) {
        // const initImageRow = this.imageGridData.filter(({ imageUuid }) => imageUuid === this.cloneData.imageId)
        // this.initImageRow = initImageRow[0]
        // this.initImageRow = this.imageGridData[0]
      }

      // 이미지 자동 선택 (이미 선택된 이미지가 있는경우)
      if (this.cloneData?.image) {
        this.imageGridData.map(img => { if (img.imageUuid === this.cloneData?.image[this.initImageRowKey]) this.initImageRow = img })
      }

      // 자동선택된 이미지의 페이지로 이동합니다
      this.initImagePage()
    },

    // OS 이미지 목록 조회
    async getImages (param = { isManage: true }) {
      try {
        this.loading = true
        const res = await API.compute.getImages(param) || []
        return res
      } catch (error) {
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
      const isUsing = await this.isUsingIpinSources(item.customIp)
      if (isUsing) return false

      // 2. API로 validation 추가
      const serverChecking = await this.ipChecking(item.customIp.data, item)
      if (!serverChecking) return false

      this.selectedNetworkList[0] = {
        ...this.selectedNetworkList[0],
        ipAddress: item.customIp.data, // customIP
        gateway: item.defaultGatewayIp.data, // Gateway
        dns: item.dns.data, // DNS
        netmask: item.netmask.data, // netmask
        prefix: item.prefixLength // prefix
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
        const isIncluded = item.subnetPools.some(pool => {
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
        const isUsing = await this.isUsingIpinSources(customIP)
        if (isUsing) return false

        // 4. API로 validation 추가
        const serverChecking = await this.ipChecking(customIP.data, item)
        if (!serverChecking) return false
      }

      // 임시?
      // if (customIP.data) this.selectedNetworkList[0].ipAddress = customIP.data
      this.selectedNetworkList[0].ipAddress = customIP.data
      if (!customIP.data) delete this.selectedNetworkList[0].ipAddress

      return true
    },
    /**
     * UI 에서 ip 를 체크합니다.
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
        // API 결과 -> ip 사용중일경우 :: false / 사용 가능하다면 :: true
        const vlanId = item.vlanId
        const networkIpCheck = await API.network.ipCheck({ ip: data, vlanId }) // ip 대역 체크
        const taskIpCheck = await API.work.taskIpCheck({ ip: data, orderDataIdx: this.orderData?.orderDataIdx }) // 장바구니 ip 사용중 체크

        if (!networkIpCheck || !taskIpCheck) {
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
      this.script = text
    },

    // ===================================================
    // ======================= 기타 =======================
    // ===================================================

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
        { condition: this.selectedImage, message: this.$t('common.ALERT.NUTA.008') }, // 이미지를 선택해주세요.
        { condition: this.selectedNetworkList.length, message: this.$t('common.ALERT.NETWORK.003') }, // 네트워크를 선택하세요.
        // { condition: this.selectedNetworkList.length !== this.networkList.length, message: this.$t('common.ALERT.NETWORK.002') } // 네트워크를 모두 선택하세요.
        { condition: this.script, message: this.$v('Cloud Init Script를 입력하세요.') }
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
          image: this.selectedImage.dataItem?.raw,
          networkList: this.selectedNetworkList,
          script: this.script,
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
      cloneData: null,
      rawClusters: [], // 가공되지 않은 cluster raw 데이터를 저장합니다.
      networkList: [],
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
          { header: 'VLAN', binding: 'vlanId', width: 180, format: 'd*' },
          { header: 'IP', binding: 'customIp', customHtml: true, sorting: false },
          { header: 'Gateway', binding: 'defaultGatewayIp', customHtml: true, sorting: false },
          { header: 'Netmask', binding: 'netmask', customHtml: true, sorting: false },
          { header: 'DNS', binding: 'dns', width: 250, customHtml: true, sorting: false },
          { header: 'IP 대역', binding: 'ipBand', customHtml: true, sorting: false },
          { header: 'Pool', binding: 'ipPool', width: 180, customHtml: true, sorting: false },
          { header: this.$t('common.GRID.COMPUTE.activeIPAM'), binding: 'activeIPAM', customHtml: true, sorting: false } // IPAM 활성 여부
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
      setIpPools: subnetPools => {
        return subnetPools.map(pool => {
          const { startAddress, endAddress } = pool
          return { label: `${startAddress} - ${endAddress}` }
        })
      },
      imageTooltip: new Tooltip({
        showAtMouse: true,
        showDelay: 200
      })
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
