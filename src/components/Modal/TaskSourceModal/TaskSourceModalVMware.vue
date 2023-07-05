<!--
  * 파일명 : TaskSourceModalVMware.vue
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
            {{ $v('ESXi 선택 (호스트)') }}
          </h5>
          <div class="table-area">
            <vmware-esxi-list
              v-if="active"
              :selectable="!readOnly"
              view-center-tree
              searchable-name
              :image-info="cloneData.selectImage"
              :manage-group-idx="cloneData.manageGroupIdx"
              :init-auto-select-row="cloneData.esxi"
              init-auto-select-row-key="hostUuid"
              ref="esxiListRef"
              @select="(row) => selectedEsxi = row"
            />
          </div>
        </article>
        <!-- /. ESXi 선택 -->

        <article
          class="node-contents -node"
          v-if="showRelatedData"
        >
          <h5 class="modal-sub-title sub-title">
            {{ $v('네트워크 선택') }}
          </h5>
          <div class="table-area">
            <cmp-grid
              :item-source="cloneData.networkList"
              :columns="columns.networkInfoColumns"
            >
              <template #networkId="{ row }">
                <el-select
                  v-if="!readOnly"
                  v-model="row.networkId"
                  :placeholder="$v('네트워크를 선택하세요.')"
                  :popper-append-to-body="false"
                  @change="(val) => changeNetwork(row, val)"
                >
                  <el-option
                    v-for="net in networkInfoList"
                    :key="net.networkId"
                    :label="net.name"
                    :value="net.networkId"
                  />
                </el-select>
                <span v-else-if="networkInfoList.find(net => net.networkId === row.networkId)">
                  {{ networkInfoList.find(net => net.networkId === row.networkId).name }}
                </span>
                <span v-else>-</span>
              </template>
              <template #vlanId=" { row }">
                <span v-if="row.networkId">
                  {{ row.vlanId || '-' }}
                </span>
                <small v-else>
                  {{ $v('네트워크를 선택하세요.') }}
                </small>
              </template>
              <template #distributedSwitchName=" { row }">
                <span v-if="row.networkId">
                  {{ row.distributedSwitchName || '-' }}
                </span>
                <small v-else>
                  {{ $v('네트워크를 선택하세요.') }}
                </small>
              </template>
            </cmp-grid>
          </div>
        </article>
        <!-- /. 네트워크 선택 -->

        <article
          class="node-contents -node"
          v-if="showRelatedData"
        >
          <h5 class="modal-sub-title sub-title">
            {{ $v('데이터스토어 선택') }}
          </h5>
          <div class="table-area">
            <!-- :loading="loading.isGetDatastore" -->
            <vmware-datastore-list
              :init-auto-select-row="cloneData.datastore"
              :datastore-list="datastoreList"
              :will-added-disk-size-gb="willAddedDiskSizeGb"
              @select="row => selectedDatastore = row"
            />
          </div>
        </article>
        <!-- /. 데이터스토어 선택 -->

        <article
          class="node-contents -node"
          v-if="showRelatedData"
        >
          <h5 class="modal-sub-title sub-title">
            {{ $v('SCSI 컨트롤러') }}
          </h5>
          <div class="table-area">
            <vmware-set-disk-controller-form
              :data="cloneData.scsiControllerList"
              :default-scsi-controller="initSCSIController"
              :disk-list="cloneData.externalDisk"
              @change="data =>{
                changeDiskControllers(data)
              }"
            />
          </div>
        </article>
        <!-- /. 데이터스토어 선택 -->

        <article
          v-if="showRelatedData"
          class="node-contents"
        >
          <h5 class="modal-sub-title sub-title">
            {{ !readOnly ? $v('사용자 지정 규격 선택') : $v('사용자 지정 규격 검토') }}
          </h5>

          <select-custom-spec
            :read-only="readOnly"
            :selected-custom-spec="selectedCustomSpec"
            :network-list="cloneData.networkList"
            :os-system="cloneData.selectImage.osSystem"
            @save="onSaveCustomSpec"
            @reset="onResetCustomSpec"
          />
        </article>
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
import API, {
  VMwareEsxiList,
  setChangeHistory,
  VMwareDatastoreList,
  VMwareSetDiskControllerForm,
  SelectCustomSpec
} from '@sd-fe/cmp-core'
import TaskSourceModalMixins from './TaskSourceModalMixins.script'

export default {
  name: 'TaskSourceModalVMware',
  mixins: [TaskSourceModalMixins],
  components: {
    'vmware-esxi-list': VMwareEsxiList,
    'vmware-datastore-list': VMwareDatastoreList,
    'vmware-set-disk-controller-form': VMwareSetDiskControllerForm,
    SelectCustomSpec
  },
  watch: {
    active (newVal) {
      if (newVal) {
        // _initNetworkList: cloneDeep(this.data.networkList)
        this.cloneData = cloneDeep(this.data)
        this.script = this.data.script

        // 데이터스토어 관련 저장
        const externalDisk = this.cloneData.externalDisk || this.cloneData.externalDiskList
        this.cloneData.allExternalDisksSize = externalDisk.reduce((a, b) => a + parseInt(b.size), 0)
        this.getVmwareVmDefaultDisk() // 기본 디스크 조회
        this.onSaveCustomSpec(this.cloneData.customizationSpec)

        this.selectedEsxi = null
        this.networkInfoList = []

        // console.clear()
        console.log('%cDATA :: ', 'color: pink', this.cloneData)
      }
    },

    /**
     * {클러스터} 변경 이벤트
     */
    async selectedEsxi (row) {
      // 선택된 {클러스터}가 있는 경우에만 {노드, 이미지, 네트워크} 표기
      this.showRelatedData = !!row
      if (!row) return

      const { hostUuid } = row

      this.getNetworkInfoList(hostUuid)
      this.getDatastoreList(hostUuid)
    }
  },
  computed: {
    willAddedDiskSizeGb () {
      const { rootDiskSize, spec, allExternalDisksSize } = this.cloneData
      return (rootDiskSize || +spec?.flavorDisk || 0) + allExternalDisksSize
    }
  },
  methods: {

    // -------------------------------------------------------
    // ---------------------- 데이터스토어 ----------------------
    // -------------------------------------------------------

    // 'vmInfo.externalDisk': {
    //   immediate: true,
    //   deep: true,
    //   handler () {
    //     this.vmInfo.allExternalDisksSize = this.vmInfo.externalDisk.reduce((a, b) => a + parseInt(b.size), 0)
    //   }
    // },

    /**
     * Datastore 조회
     */
    async getDatastoreList (hostUuid = this.cloneData.esxi.hostUuid) {
      try {
        // this.loading.isGetDatastore = true
        const data = await API.vmware.datastore.getDatastoreList({ hostUuid })
        this.datastoreList = data
      } catch (error) {
        console.error(error)
        return this.$alert(this.$v('Datastore 조회에 문제가 발생했습니다.'))
      } finally {
        // this.loading.isGetDatastore = false
      }
    },

    // -------------------------------------------------------
    // ------------------------ 컨트롤러 ------------------------
    // -------------------------------------------------------

    /**
   * API: VM 기본 디스크를 조회합니다.
   */
    async getVmwareVmDefaultDisk () {
      try {
        // this.loading.isGetDefaultDisk = true
        const disk = await API.vmware.vm.getVmwareVmDefaultDisk()

        // ** controllerKey = 1000이고 unitNumber = 0 인 디스크는 루트 디스크
        const initSCSIController = {
          busNumber: 0, // 1씩 증가
          type: disk.defaultSCSIControllerType,
          sharedBus: disk.defaultSCSIControllerSharedBus,
          scsiCtlrUnitNumber: disk.defaultSCSIControllerUnitNumber,
          controllerKey: disk.defaultSCSIControllerKey
        }

        this.initSCSIController = initSCSIController

        if (!this.cloneData.scsiControllerList.length) this.cloneData.scsiControllerList = [{ ...initSCSIController }]
      } catch (error) {
        console.error(error)
        this.$alert('기본 디스크 조회에 문제가 발생했습니다.', () => false)
      } finally {
        // this.loading.isGetDefaultDisk = false
      }
    },

    /**
     * [admin] disk 컨트롤러 설정 변경 시 이벤트
     */
    changeDiskControllers (data) {
      // if (this.estimate) return
      const list = data.map(controller => {
        const { controllerKey, sharedBus, type, busNumber } = controller

        return {
          busNumber,
          controllerKey,
          scsiCtlrUnitNumber: 7,
          sharedBus,
          type
          // "userVmIdx": 0
        }
      })
      this.$set(this.cloneData, 'scsiControllerList', list)
    },

    // -------------------------------------------------------
    // ------------------------ 네트워크 -------------------------
    // -------------------------------------------------------

    /**
     * network 조회
     */
    async getNetworkInfoList (hostUuid = this.cloneData.esxi.hostUuid) {
      try {
        // this.loading.isGetNetworkInfo = true
        const data = await API.vmware.network.getVmwareNetworkList({ hostUuid })
        this.networkInfoList = data
      } catch (error) {
        console.error(error)
        return this.$alert(this.$v('Network 조회에 문제가 발생했습니다.'))
      } finally {
        // this.loading.isGetNetworkInfo = false
      }
    },

    /**
     * 네트워크 정보 변경시 이벤트
     */
    changeNetwork (cateRow, selectedNetworkId) {
    // 변경 시
      // networkId: 변경 후 네트워크 ID
      // deviceName: 변경 후 네트워크 명
      // name: 변경 전 네트워크 명
      const netInfo = this.networkInfoList.find(net => net.networkId === selectedNetworkId)
      if (netInfo) {
        cateRow.deviceName = netInfo.name
        cateRow.vlanId = netInfo?.vlanId
        cateRow.distributedSwitchName = netInfo?.distributedSwitchName
        cateRow.distributedSwitchUuid = netInfo?.distributedSwitchUuid
        cateRow.distributedPortGroupKey = netInfo?.distributedPortGroupKey
      }

      if (this.cloneData?._initNetworkList) {
        const originNetInfo = this.cloneData?._initNetworkList.find(net => net.cateIdx === cateRow.cateIdx)

        if (originNetInfo) {
          const beforeNetStr = `${originNetInfo.cateKey}(${originNetInfo.deviceName})`
          const afterNetStr = `${cateRow.cateKey}(${cateRow.deviceName})`
          setChangeHistory(
            this.$v('네트워크 정보'),
            this.changeHistory,
            beforeNetStr,
            afterNetStr
          )

          cateRow.name = originNetInfo.deviceName
        }
      }
    },

    // -------------------------------------------------------
    // ------------------- 사용자 지정 규격 ----------------------
    // -------------------------------------------------------

    /**
     * 사용자 지정 규격 저장
     */
    onSaveCustomSpec (spec) {
      this.selectedCustomSpec = spec
    },

    onResetCustomSpec () {
      this.selectedCustomSpec = null
    },

    // ===================================================
    // ======================= 기타 =======================
    // ===================================================

    /**
     * 선택된 클러스터와 노드를 모두 취소해줍니다.
     */
    close () {
      this.selectedEsxi = null
      this.$emit('close')
    },

    /**
     * [확인] 버튼 클릭했을 때 발생하는 이벤트입니다.
     * @return {Function || Boolean}
     */
    async confirm () {
      const selectedNetworkList = this.cloneData.networkList.every(item => !!item.networkId)

      // 클러스터/노드 선택 validation
      const conditions = [
        { condition: this.selectedEsxi, message: this.$t('ESXi를 먼저 선택하세요.') },
        { condition: selectedNetworkList, message: this.$v('네트워크를 선택하세요.') },
        { condition: this.selectedDatastore, message: this.$v('데이터스토어를 선택하세요.') },
        { condition: this.cloneData.scsiControllerList.length, message: this.$v('SCSI를 선택하세요.') }
        // { condition: this.script, message: this.$v('Cloud Init Script를 입력하세요.') }
      ]

      // 기본으로 다 선택되어있는지 확인
      const validator = conditions.every(cond => {
        if (!cond.condition) this.$alert(cond.message, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
        return cond.condition
      })

      if (!validator) return

      // console.log(await passed, '=== 형식을 모두 만족하였읍니다~!! 🔥🔥🔥')

      const ipAllocator = this.$store.state.auth.user.userId

      const emitData = {
        esxi: this.selectedEsxi,
        deployHostUuid: this.selectedEsxi?.hostUuid,
        networkList: this.cloneData.networkList,
        script: this.script,
        hostUuid: this.selectedEsxi.hostUuid,
        datastore: this.selectedDatastore,
        datastoreId: this.selectedDatastore.datastoreId,
        customizationSpec: this.selectedCustomSpec,
        ipAllocator
      }

      return this.emitSavedData(Object.assign(emitData))
    }
  },
  data () {
    return {
      loading: false,
      cloneData: null,
      selectedEsxi: null,
      selectedDatastore: null,
      datastoreList: [],
      initSCSIController: null, // 초기 SCSI 컨트롤러 정보
      selectedNetworkList: [],
      scripts: undefined, // Script 불러오기, Cloud Init Script 텍스트 저장
      showRelatedData: false,
      // ----
      // ----
      // ----
      columns: {
        // 네트워크 그리드 컬럼
        networkInfoColumns: [
          { header: this.$v('네트워크 카테고리'), binding: 'cateKey', filtable: false },
          { header: this.$v('네트워크'), binding: 'networkId', customHtml: true, filtable: false },
          { header: 'VLAN ID', binding: 'vlanId', customHtml: true, filtable: false },
          { header: this.$v('분산 스위치 명'), binding: 'distributedSwitchName', customHtml: true, filtable: false }
        ]
      },
      networkInfoList: [],
      selectedCustomSpec: null
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
