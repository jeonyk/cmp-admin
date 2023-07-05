<!--
  * 파일명 : TaskSourceModalMarketplace.vue
  * 파일 기능 : 가능한 Central을 클릭 > 클러스터 선택 > 관련 네트워크 선택이 가능한 모달입니다. 모든 값이 입력되면 저장할 수 있습니다.
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 클러스터 선택(Central) 할당량 프로그레스바 수정
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
    <section
      class="modal-body"
      v-loading="loading"
    >
      <article class="node-contents -cluster">
        <h5 class="modal-sub-title sub-title">
          <!-- Central 선택 -->
          Central {{ $t('common.BTN.select') }}
        </h5>
        <register-contents
          title="Central"
          style="border-top: 1px solid #3D435E;"
        >
          <el-radio-group
            v-model="selectedCentralName"
            @change="setSelectedCentral"
          >
            <el-radio
              v-for="(c, idx) in centralRadioList"
              :key="c.centralName + idx"
              :disabled="!c.isCalm"
              :label="c.centralName"
            />
          </el-radio-group>
        </register-contents>
      </article>
      <!-- /. Central 선택 -->

      <article
        class="node-contents -cluster"
        v-if="clusterGridData.length"
      >
        <h5 class="modal-sub-title sub-title">
          <!-- 클러스터 선택 -->
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
          >
            <template #highVal="props">
              <cmp-status-tag
                v-if="props.row.type"
                :contents="props.row.type"
              />
            </template>
            <!-- /. 고사양 -->

            <template #assignPercentvcpu="props">
              <div class="progressbar-wrap">
                <progress-bar
                  class="size-progress-bar"
                  :value="props.row.assign.vcpu.size"
                  :total="props.row.assign.vcpu.all"
                  :notice-percent="props.row.assign.vcpu.standard1"
                  :alert-percent="props.row.assign.vcpu.standard2"
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
            <!-- 할당량.vCPU -->

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
            <!-- 할당량.Memory -->

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
            <!-- 할당량.Disk -->
          </cmp-grid>
        </div>
      </article>
      <!-- /. 클러스터 선택 -->

      <article
        class="node-contents -node"
        v-if="showRelatedData"
      >
        <h5 class="modal-sub-title sub-title">
          <!-- 네트워크 -->
          {{ $t('admin.WF.network') }}
        </h5>
        <div class="table-area">
          <!-- :header-merge="columns.networkHeaderMergeColumns" -->
          <cmp-grid
            :item-source="networkGridData"
            :columns="columns.networkColumns"
            :selectable="!readOnly"
            @selectedRow="setSelectedNetwork(...arguments, cloneData.networkList[0])"
            :init-custom-action="initNetworkGrid"
            :init-auto-select-row="checkSelectedRow(selectedNetwork, 'network')"
            init-auto-select-row-key="subnetUuid"
            @loaded-rows="onLoadedNetworkRows"
          >
            <template #customIp="props">
              <el-input
                v-if="props.row.customIp.edit"
                v-model="props.row.customIp.data"
                @keydown.native.enter="saveCustomIpPool(props.row.customIp)"
                @blur="saveCustomIpPool(props.row.customIp)"
              />
              <!-- IP 관리대장 확인이 필요한 경우는 "-" 표기 -->
              <span v-if="props.row.message">-</span>
              <div v-else>
                <button
                  class="button"
                  v-if="editIP(props)"
                  @click="isReadOnly(props) ? null : handleIpSelection(props, true)"
                >
                  {{ $v('IP 선택') }}
                </button>

                <span
                  class="custom-ip"
                  v-if="showIP(props)"
                  @click="isReadOnly(props) ? null : handleIpSelection(props, true)"
                >
                  {{ readIP(props) }}
                </span>
              </div>
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
                style="width: 60px;"
              >
                {{ props.row.activeIPAM ? 'ON' : 'OFF' }}
              </cmp-status-tag>
            </template>
          </cmp-grid>
        </div>
      </article>
      <!-- /. 네트워크 선택 -->
    </section>

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
import { Tooltip } from '@grapecity/wijmo'
import { cloneDeep } from 'lodash'
import TaskSourceModalMixins from './TaskSourceModalMixins.script'
import API, { SelectIpComponent } from '@sd-fe/cmp-core'

export default {
  name: 'TaskSourceModalMarketplace',
  mixins: [TaskSourceModalMixins],
  components: {
    'button-popup': ButtonPopup,
    'select-ip-component': SelectIpComponent
  },
  props: {
    data: { // 선택된 row를 가져옵니다
      type: Object,
      default () {}
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
  watch: {
    async active (newVal) {
      if (newVal) {
        console.clear()
        console.log('%c@@ DATA :: ', 'color: skyblue', this.data)

        this.cloneData = cloneDeep(this.data)
        this.networkList = this.cloneData.networkList

        await this.getOperationList(this.data.manageGroupIdx, 'MARKET')
        this.getCentralList()
        this.getIpBands(this.networkList)
      }
    },

    /**
     * {클러스터} 변경 이벤트
     */
    async selectedCluster (row) {
      // 선택된 {클러스터}가 있는 경우에만 {네트워크} 표기
      this.showRelatedData = !!row
      if (!row) return

      const { dataItem: cluster } = row

      const subnets = await this.getClusterSubnets(cluster)

      this.setNetworkGridData(subnets)
    },

    async selectedCentralName (cName) {
      if (cName) {
        const elements = await this.getAllCentrals.filter(central => central.centralName === cName)[0]?.elements
        const clusterUuids = elements?.map(el => el.clusterUuid)
        await this.getClusters(clusterUuids)
      }
    }
  },
  methods: {
    /**
     * 초기에 Central 데이터를 호출하여 가져옵니다.
     */
    async getCentralList () {
      this.loading = true

      try {
        const centrals = await API.compute.getCentralList()

        this.getAllCentrals = cloneDeep(centrals) // raw 데이터 저장

        // central radio 버튼을 위한 데이터
        this.centralRadioList = centrals.map(central => {
          const { centralName, centralIdx, isCalm, elements } = central
          return { centralName, centralIdx, isCalm, elements }
        })

        return this.setSelectedCentral(this.cloneData?.central?.centralName)
      } catch (error) {
        console.error('@@@ getCentralList' + error)
        this.$alert(this.$t('common.ALERT.NUTA.016'))
      } finally {
        this.loading = false
      }
    },

    /**
     * @param { Array } clUuids 선택한 클러스터의 uuid 들의 배열
     */
    async getClusters (clUuids) {
      this.loading = true
      try {
        const clusters = await API.compute.getElementListSimple()

        // 각 clusterUuid 와 선택된 클러스터 uuid 비교
        // cluster 에 해당하는 Element 리스트를 배열로 담습니다.
        const matchingClusters = []
        clusters.forEach(elem => {
          clUuids.forEach(id => {
            if (elem.clusterUuid === id) matchingClusters.push(elem)
          })
        })

        this.rawClusters = matchingClusters.filter(cls => {
          return this.compareOperationList('CLUSTER', cls.clusterUuid)
        })

        return this.setClusterTableData(matchingClusters)
      } catch (error) {
        console.error('@@@ getElementList' + error)
        this.$alert(this.$t('common.ALERT.NUTA.009'), { confirmButtonText: this.$t('common.BTN.confirm') })
      } finally {
        this.loading = false
      }
    },

    /**
     * 클러스터 테이블을 위한 데이터를 가공합니다.
     * @param {Array} rawClusters cluster raw 배열
     */
    setClusterTableData (rawClusters) {
      this.clusterGridData = rawClusters.map(cls => {
        const byte = (item) => this.$options.filters.byte(item || 0)

        const {
          clusterUuid, elementIdx,
          vmCpuSum, vmMemSum, vdiskCapacitySum, // 사용량
          nonNodeCpuSum, nonNodeMemSum, nonNodeStorageCapacityBytes, // 전체
          clusterName, storageType, nodeCnt, vmCnt,
          firstCpuPercent, firstDiskPercent, firstMemoryPercent, // 1차 임계치
          secondCpuPercent, secondDiskPercent, secondMemoryPercent // 2차 임계치
        } = cls

        return {
          clusterUuid,
          elementIdx,
          type: storageType,
          name: clusterName,
          node: nodeCnt,
          vm: vmCnt,
          assign: {
            vcpu: { size: vmCpuSum || 0, all: nonNodeCpuSum, standard1: firstCpuPercent, standard2: secondCpuPercent },
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

        // MP는 자동 IP 만 노출시킵니다
        if (!isAuto) return

        // 자동 IP 이지만 IP Pool 이 없는 경우는 포함하지 않습니다.
        if (isAuto && !subnet.subnetPools) return

        const { pass, message, data: ipInfo = {} } = this.compareInIpBands(subnet, isAuto)
        const { band, params } = ipInfo || { band: {}, param: {} } // IP 관리대장에 등록된 정보들 || (없으면) 기본 값
        console.log('IPAM type : ', isAuto, '\npass : ', pass, '\nmessage : ', message, '\nband : ', band, '\nparams : ', params)

        // 이미 기존에 선택되어있던 네트워크가 있다면 해당 내용 텍스트들로 data 를 채워줍니다.
        // 기존에 선택되어있던 내용이 없다면 기본 데이터 || 빈 문자열입니다. (자동일때, 수동일때 조건도 포함됩니다)
        const temp = { ...(this.cloneData.network || this.cloneData.networkList[0]) }
        const regIp = temp?.subnetUuid === subnet?.subnetUuid // 이미 이전에 선택된 네트워크가 있는 경우 true
        // const hasSelected = regIp // 선택된 네트워크가 있고 && 수동 IP 일때

        // const defaultCustomIp = regIp ? temp.ipAddress : ''
        const defaultCustomIp = (regIp) ? temp.customIp?.data : ''
        // const defaultGateway = (hasSelected) ? temp.gateway : band.gatewayIpAddress
        // const defaultNetmask = (hasSelected) ? temp.netmask : band.netmask
        // const defaultDns = (hasSelected) ? temp.dns : band.dnsIpAddress
        // const defaultPrefix = (hasSelected) ? temp.prefix : band.prefixLength

        // [직접 입력] 되었는지 여부 와 입력된 데이터 등을 설정합니다.
        // 이 라인을 주석처리하면 에러가 납니다.. disabled 여부만 설정해주세요
        const editable = { edit: false, disabled: this.readOnly } // v3 코드) 이젠 IPAM 도 수정 가능함?

        const customIp = { ...editable, disabled: this.readOnly, data: defaultCustomIp }
        // const defaultGatewayIp = { ...editable, data: defaultGateway }
        // const netmask = { ...editable, data: defaultNetmask }
        // const dns = { ...editable, data: defaultDns }
        // const prefix = { ...editable, data: defaultPrefix }
        const activeIPAM = isAuto

        const subnetData = {
          ...copySubnet,
          customIp, // IP
          // defaultGatewayIp, // Gateway
          // netmask, // Netmask
          // dns, // DNS
          // prefix,
          // ipBand, // IP 대역
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
        // Object.defineProperty(subnetData, 'savedNetmask', { value: subnet.netmask, writable: false })

        data.push(subnetData)
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
        const isAuto = !!subnet?.defaultGatewayIp

        // true 일 경우 자동 IP 입니다.
        if (isAuto) {
        // 자동 IP 이지만 IP Pool 이 없는 경우는 포함하지 않습니다.
          if (!subnet.subnetPools) return

          // 이미 기존에 선택되어있던 네트워크가 있다면 해당 내용 텍스트들로 data 를 채워줍니다.
          // 기존에 선택되어있던 내용이 없다면 빈 문자열 || 수동으로 ip 가 설정되어있다면 해당 ip 입니다. (자동일때, 수동일때 조건도 포함됩니다)
          const temp = { ...this.cloneData.network }
          const regIp = temp?.subnetUuid === subnet.subnetUuid // 이미 이전에 선택된 네트워크가 있는 경우 true
          // const hasSelected = regIp && !isAuto // 선택된 네트워크가 있고 && 자동 IP 일때

          // const defaultCustomIp = (hasSelected) ? temp.ipAddress : ''
          const defaultCustomIp = (regIp) ? temp.customIp?.data : ''

          // 이 라인을 주석처리하면 에러가 납니다.. disabled 여부만 설정해주세요
          const editable = { edit: false, disabled: !isAuto }
          const customIp = { ...editable, data: defaultCustomIp }

          const subnetData = {
            ...copySubnet,
            customIp, // IP
            activeIPAM: isAuto
          }

          // 자동 / 수동 할당인경우 확인할 수 있는 프로퍼티 생성
          Object.defineProperty(subnetData, 'isIPAM', { value: isAuto, writable: false })

          data.push(subnetData)
        }
      })

      this.networkGridData = [...data]
      // console.log('%c ========= ', 'color: #77FD33')
      // console.log(this.networkGridData, '==== this.networkGridData')
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
          // item.defaultGatewayIp.data = gatewayIpAddress // Gateway 자동 할당
          // item.dns.data = dnsIpAddress // DNS 자동 할당
          // item.netmask.data = netmask // Netmask 자동 할당
        }
      })

      this.updateNetwork = null
    },

    saveCustomIpPool (props) {
      props.edit = false
    },
    /**
     * 선택된 클러스터와 노드를 모두 취소해줍니다.
     */
    setResetGrid () {
      this.selectedCluster = null
      this.selectedNetwork = null

      this.gridRefresh(this.clusterGrid)
      this.gridRefresh(this.networkGrid)
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
      this.selectedCentralName = undefined
      this.clusterGridData = []
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

        // 3. API로 validation 추가
        // const serverChecking = await this.ipChecking(customIP.data, item)
        // if (!serverChecking) return false

        // 4. API로 validation 추가
        const serverChecking = await this.ipChecking(customIP.data, item)
        if (!serverChecking) return false
      }

      // 임시?
      // if (customIP.data) this.selectedNetworkList[0].ipAddress = customIP.data
      // this.selectedNetworkList[0].ipAddress = customIP.data

      this.selectedNetworkList[0] = {
        ...this.selectedNetworkList[0],
        ipAddress: customIP.data // customIP
      }
      if (!customIP.data) delete this.selectedNetworkList[0].ipAddress
      return true
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

    /**
     * 기본 및 상세 validation 처리를 합니다.
     */
    async confirm () {
      const conditions = [
        { condition: this.selectedCentralName, message: this.$v('Central을 먼저 선택하세요.') },
        { condition: this.selectedCluster, message: this.$v('클러스터를 먼저 선택하세요.') },
        { condition: this.selectedNetworkList.length, message: this.$v('네트워크를 선택하세요.') }
      ]

      // 기본으로 다 선택되어있는지 확인
      const validator = conditions.every(cond => {
        if (!cond.condition) this.$alert(cond.message, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
        return cond.condition
      })

      if (!validator) return

      const selectedNetwork = this.selectedNetwork.dataItem

      // 선택된 네트워크가 수동인 경우 : 자동인경우 - validation 체크
      const passed = !selectedNetwork.isIPAM ? true : this.networkAutoValidation(selectedNetwork)
      // console.log(!selectedNetwork.isIPAM ? '수동' : '자동')

      // console.log(await passed, '=== 형식을 모두 만족하였읍니다~!! 🔥🔥🔥')

      if (await passed) {
        const ipAllocator = this.$store.state.auth.user.userId

        const emitData = {
          central: this.selectedCentral,
          cluster: this.selectedCluster.dataItem,
          networkList: this.selectedNetworkList,
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
      }).catch(() => false)
    },

    /**
     * 선택 센트럴 = this.selectedCentral
     */
    setSelectedCentral (name) {
      this.selectedCentral = this.getAllCentrals.filter(list => list.centralName === name)[0]
      this.selectedCentralName = name
    },

    /**
     * 선택 클러스터 = this.selectedCluser
     */
    setSelectedCluster (param) {
      this.$emit('selectedCluster', param)
      this.selectedCluster = param
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
     * [클러스터 선택 모달]이 켜질때 클러스터 / 노드 가 자동으로 선택됩니다.
     * @param {Object} element 바인딩된 데이터
     * @param {String} propName 카피된 데이터에서 어떤게 필요한지 프로퍼티를 string 으로 받음
     */
    checkSelectedRow (element, propName) {
      if (element) return element?.dataItem
      else if (this.cloneData) return this.cloneData[propName]
      else return null
    },

    initClusterGrid (grid) {
      this.clusterGrid = grid
    },
    initNetworkGrid (grid) {
      this.networkGrid = grid
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
    }

  },
  data () {
    return {
      ipformat: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      loading: true,
      clusterGrid: null,
      networkGrid: null,
      cloneData: null,
      rawClusters: [], // 가공되지 않은 cluster raw 데이터를 저장합니다.
      networkList: [],
      ipBands: [],
      updateNetwork: null,
      isOpenIpSelection: false,
      selectedCentral: null,
      selectedCluster: null,
      selectedNetwork: null,
      selectedNetworkList: [],
      showRelatedData: false,
      columns: {
        // 클러스터 그리드 컬럼
        clusterHeaderMergeColumns: {
          colSpan: [
            { startIdx: 4, endIdx: 6, header: '임계치(%)' }
          ],
          rowSpan: ['name', 'node', 'vm', 'relateVm', 'gpu', 'highVal', 'network', 'image']
        },
        clusterColumns: [
          { header: this.$t('common.REGCON.name'), binding: 'name', width: 150 },
          { header: 'Node', binding: 'node', width: 70, customHtml: true },
          { header: 'VM', binding: 'vm', width: 70, customHtml: true },
          // { header: '관련 VM', binding: 'relateVm', width: 70, customHtml: true },
          // { header: 'GPU', binding: 'gpu', width: 70, customHtml: true },
          { header: this.$t('common.GRID.COMPUTE.highSpec'), binding: 'highVal', width: 100, customHtml: true }, // 고사양
          // { header: this.$t('admin.WF.network'), binding: 'network', width: 70, customHtml: true }, // 네트워크
          // { header: this.$t('common.REGCON.image'), binding: 'image', width: 70, customHtml: true }, // 이미지
          { header: 'vCPU', binding: 'assignPercent.vcpu', customHtml: true },
          { header: 'Memory', binding: 'assignPercent.memory', customHtml: true },
          { header: 'Disk', binding: 'assignPercent.disk', customHtml: true }
        ],
        // 네트워크 그리드 컬럼
        networkHeaderMergeColumns: {
          colSpan: [
            { startIdx: 1, endIdx: 3, header: 'IP Pool' }
          ],
          rowSpan: ['subnetName', 'vlanId']
        },
        networkColumns: [
          { header: this.$t('common.REGCON.name'), binding: 'subnetName' }, // 이름
          { header: 'VLAN', binding: 'vlanId', width: 130, format: 'd*' },
          { header: 'IP', binding: 'customIp', customHtml: true },
          { header: 'POOL', binding: 'ipPool', customHtml: true },
          { header: this.$t('common.GRID.COMPUTE.activeIPAM'), binding: 'activeIPAM', customHtml: true } // IPAM 활성여부
        ],
        imageColumns: [
          { header: this.$t('service.osType'), binding: 'osType' }, // OS 타입
          { header: 'Bit', binding: 'osBit' },
          { header: this.$t('common.GRID.COMPUTE.imageName'), binding: 'osName' }, // 이미지명
          { header: this.$t('common.GRID.COMPUTE.osSizeGb'), binding: 'osRootDiskSize' }, // OS 용량 (GB)
          { header: this.$t('common.GRID.type'), binding: 'imageType', width: 150, customHtml: true } // 타입
        ]
      },
      clusterGridData: [],
      networkGridData: [],
      getAllCentrals: [],
      centralRadioList: [],
      selectedCentralName: undefined,
      isReadOnly ({ row }) {
        // props.row[column.binding].disabled
        return row.customIp.disabled
      },
      readIP ({ row }) {
        return row.customIp.data
      },
      showIP ({ row }) {
        // !props.row[column.binding].edit && props.row[column.binding].data
        return !row.customIp.edit && row.customIp.data
      },
      editIP ({ row }) {
        // !props.row[column.binding].edit && !props.row[column.binding].data && !props.row[column.binding].disabled
        return !row.customIp.edit && !row.customIp.data && !row.customIp.disabled
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

    .modal-body {
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
      &:last-child { margin-bottom: 0; }
    }

    .active-ipm {
      text-align: center;
      justify-content: center;
      align-items: center;
    }
  }

  .progressbar-wrap .size-progress-bar.progress-bar { max-width: auto !important; }
</style>
