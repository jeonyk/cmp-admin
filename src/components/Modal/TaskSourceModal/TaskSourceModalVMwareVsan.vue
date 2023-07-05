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
            <vmware-esxi-list
              v-if="active"
              :selectable="!readOnly"
              view-center-tree
              searchable-name
              type="cluster"
              ref="clusterListRef"
              @select="(row) => selectedCluster = row"
              :init-auto-select-row="cloneData.cluster"
              init-auto-select-row-key="clusterId"
            />
          </div>
        </article>
        <!-- /. 클러스터 선택 -->

        <article
          class="node-contents -node"
          v-if="showRelatedData"
        >
          <h5 class="modal-sub-title sub-title">
            {{ $v('네트워크 선택') }}
          </h5>
          <div class="table-area">
            <cmp-grid
              :item-source="networkDeviceOptions"
              :columns="columns.networkColumns"
              :selectable="!readOnly"
              @selectedRow="$event => selectedNetwork = $event"
              :init-auto-select-row="checkSelectedRow(selectedNetwork, '_network')"
              init-auto-select-row-key="device"
            />
          </div>
        </article>
        <!-- /. 네트워크 선택 -->

        <article
          class="node-contents -node"
          v-if="showRelatedData"
        >
          <h5 class="modal-sub-title sub-title">
            {{ $v('스토리지 설정') }}
          </h5>
          <div class="table-area">
            <vertical-table
              type="horizontal"
              :data="cloneData"
              :columns="sourceColumns"
            >
              <template #spbmProfileUuid>
                <span v-if="readOnly">{{ cloneData.spbmProfileUuid }}</span>

                <el-select
                  v-else
                  v-model="cloneData.spbmProfileUuid"
                >
                  <el-option
                    v-for="(item, idx) in storagePolicyOptions"
                    :key="`profileId_${idx}`"
                    :label="item.name"
                    :value="item.profileId"
                  />
                </el-select>
              </template>
              <!-- /. 스토리지 정책 -->

              <template #tcpPort>
                <span v-if="readOnly">{{ cloneData.tcpPort }}</span>

                <div
                  v-else
                  class="flex-wrap width"
                >
                  <el-input
                    class="tcp-port-input"
                    v-model="cloneData.tcpPort"
                    type="number"
                    :placeholder="$v('TCP 포트')"
                    @keydown.native="e => {
                      const invalid = ['i','+','e','-', '.']
                      if(invalid.includes(e.key)) e.preventDefault()
                    }"
                  />
                  <!-- @change="changeTcpPort" -->
                  <el-tooltip
                    placement="top"
                    effect="light"
                    popper-class="shade-popper"
                  >
                    <i class="mdi mdi-information-outline" />
                    <div
                      v-if="iscsiRegex"
                      v-html="regexInfo.tcpPort.alertMsg"
                      slot="content"
                    />
                  </el-tooltip>
                </div>
              </template>
              <!-- /. TCP 포트 -->

              <template #iqn>
                <span v-if="readOnly">{{ cloneData.iqn }}</span>

                <div
                  v-else
                  class="flex-wrap"
                >
                  <el-input
                    :placeholder="$v('시스템 생성 IQN 사전 채우기')"
                    v-model="cloneData.iqn"
                  />
                  <el-tooltip
                    placement="top"
                    effect="light"
                    popper-class="shade-popper"
                  >
                    <i class="mdi mdi-information-outline" />
                    <div
                      v-if="iscsiRegex"
                      v-html="iscsiRegex.iqn.alertMsg"
                      slot="content"
                    />
                  </el-tooltip>
                </div>
              </template>
              <!-- /. IQN -->

              <template #initiatorList>
                <span v-if="readOnly">{{ cloneData.initiatorList ? cloneData.initiatorList.join(', ') : '' }}</span>

                <div
                  v-else
                  class="flex-wrap"
                >
                  <select-multiple-tag
                    v-model="cloneData.initiatorList"
                    width="auto"
                    input-width="300px"
                    :placeholder="$v('이니시에이터 이름을 입력하세요.')"
                    :after-placeholder="$v('이니시에이터 이름을 입력하세요.')"
                    :before-change="beforeChangeInitiator"
                    is-modify
                    :add-button-text="$v('추가')"
                    @change="changeInitiatorList"
                    ref="initiatorListRef"
                  />

                  <el-tooltip
                    placement="top"
                    effect="light"
                    popper-class="shade-popper"
                  >
                    <i class="mdi mdi-information-outline" />
                    <div
                      v-html="iscsiRegex.iqn.alertMsg"
                      slot="content"
                    />
                  </el-tooltip>
                </div>
              </template>
              <!-- /. 허용 이니시에이터 -->
            </vertical-table>
          </div>
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
  </el-dialog>
</template>

<script>
import { cloneDeep, uniqBy } from 'lodash'
import API, { setChangeArrHistory, VMwareEsxiList, SelectMultipleTag } from '@sd-fe/cmp-core'
import TaskSourceModalMixins from './TaskSourceModalMixins.script'

export default {
  name: 'TaskSourceModalFileServer',
  mixins: [TaskSourceModalMixins],
  components: {
    'vmware-esxi-list': VMwareEsxiList,
    'select-multiple-tag': SelectMultipleTag
  },
  computed: {
    iscsiRegex () { return this.regexInfo }
  },
  watch: {
    async active (newVal) {
      if (newVal) {
        this.cloneData = cloneDeep(this.data)

        // console.clear()
        console.log('%cDATA :: ', 'color: pink', this.cloneData)
      }
    },

    /**
     * {클러스터} 변경 이벤트
     */
    async selectedCluster (row) {
      // 선택된 {클러스터}가 있는 경우에만 {노드, 이미지, 네트워크} 표기
      this.showRelatedData = !!row
      if (!row) return

      const { connectIdx, clusterId } = row

      this.getStoragePolicyProfile()
      this.getVmwClusterNetworkDevice({ connectIdx, clusterId })

      // console.log(cluster, '---- cluster')

      // 클러스터 선택이 바뀔때마다 하위 node/image/네트워크를 선택 해제합니다.
      // this.setSelectedNode(null)
      // this.setSelectedImage(null)
      // this.setSelectedNetwork(null)
    }
  },
  methods: {
    /**
     * API: VM 스토리지 정책을 조회합니다.
     */
    async getStoragePolicyProfile (params) {
      try {
        // this.loading.isGetStoragePolicy = true
        const response = await API.vmware.vm.getStoragePolicyProfile(params)

        this.storagePolicyOptions = uniqBy(response, 'profileId') || []
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('{name} 목록 조회에 문제가 발생했습니다.', { name: `VM ${this.$v('스토리지 정책')}` }), () => false)
      } finally {
        // this.loading.isGetStoragePolicy = false
      }
    },
    /**
     * API: VM 클러스터 네트워크 디바이스를 조회합니다..
     */
    async getVmwClusterNetworkDevice (params) {
      try {
        // this.loading.isGetNetworkDevice = true
        const response = await API.vmware.cluster.getVmwClusterNetworkDevice(params)

        this.networkDeviceOptions = uniqBy(response, 'device') || []
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('{name} 목록 조회에 문제가 발생했습니다.', { name: 'Network Device' }), () => false)
      } finally {
        // this.loading.isGetNetworkDevice = false
      }
    },

    /**
     * 이니시에이터 추가 전 validation
     */
    beforeChangeInitiator (param, done) {
      if (this.validText(param, 'iqn')) done()
      else {
        const ref = this.$refs?.initiatorListRef
        if (ref) ref.inputVisible = true

        this.$alert(this.iscsiRegex.iqn.alertMsg, {
          dangerouslyUseHTMLString: true,
          callback: () => false
        })
        return false
      }
    },
    /**
     * 텍스트 validation
     */
    validText (val, field) {
      const exp = this.iscsiRegex[field].condition
      const regexp = new RegExp(exp, 'gi')

      return (regexp.test(val))
    },

    /**
     * 이니시에이터 변경 이벤트
     */
    changeInitiatorList (data) {
      this.cloneData.initiatorList = data

      if (this.readOnly) {
        setChangeArrHistory(
          this.$v('이니시에이터'),
          this.changeHistory,
          null,
          null,
          this.initData.initiatorList,
          this.cloneData.initiatorList
        )
      }
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
      this.selectedNetwork = null

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
      const ranageCheck = number => (number > 1025) && (number < 65535)

      // 클러스터/네트워크 선택 validation
      const conditions = [
        { condition: this.selectedCluster, message: this.$v('클러스터를 먼저 선택하세요.') },
        { condition: this.selectedNetwork, message: this.$v('네트워크를 선택하세요.') },
        { condition: this.cloneData.spbmProfileUuid, message: this.$v('스토리지 정책을 선택하세요.') },
        { condition: this.cloneData.tcpPort, message: this.$v('TCP포트를 입력하세요.') },
        { condition: ranageCheck(Number(this.cloneData.tcpPort)), message: this.$v('TCP 포트는 1025에서 65535 사이의 숫자여야 합니다.') }
      ]

      // 기본으로 다 선택되어있는지 확인
      const validator = conditions.every(cond => {
        if (!cond.condition) this.$alert(cond.message, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
        return cond.condition
      })

      if (!validator) return

      const ipAllocator = this.$store.state.auth.user.userId
      const projectIdx = this.$parent.$parent.$parent.$parent.$parent?.taskData.projectIdx // 프로젝트 Idx 를 왜 config에 저장하냐고 ㅠ

      const emitData = {
        ...this.cloneData,
        cluster: this.selectedCluster,
        clusterId: this.selectedCluster.clusterId,
        connectIdx: this.selectedCluster.connectIdx,
        network: this.selectedNetwork.dataItem.device,
        _network: this.selectedNetwork.dataItem, // UI 저장용
        projectIdx,
        ipAllocator
      }

      console.log('==== emitData :: ', emitData)
      return this.emitSavedData(Object.assign(emitData))
    },

    initClusterGrid (grid) {
      this.clusterGrid = grid
    },
    initNetworkGrid (grid) {
      this.nodeGrid = grid
    }
  },
  data () {
    return {
      loading: false,
      clusterGrid: null,
      nodeGrid: null,
      imageGrid: null,
      cloneData: null,
      rawClusters: [], // 가공되지 않은 cluster raw 데이터를 저장합니다.
      selectedCluster: null,
      storagePolicyOptions: [],
      networkDeviceOptions: [],
      selectedNetwork: null,
      selectedProtocol: null,
      showRelatedData: false,
      // ----
      // ----
      // ----
      columns: {
        networkColumns: [
          { header: this.$v('이름'), binding: 'device' },
          { header: 'VLAN', binding: 'hostname' }
        ]
      },

      rawData: [],
      sourceColumns: [
        { header: this.$v('스토리지 정책'), binding: 'spbmProfileUuid', edit: 'select', required: true },
        { header: this.$v('TCP 포트'), binding: 'tcpPort', placeholder: this.$v('TCP 포트'), edit: 'input', required: true },
        { header: this.$v('IQN'), binding: 'iqn', placeholder: this.$v('시스템 생성 IQN 사전 채우기'), edit: 'input' },
        { header: this.$v('허용 이니시에이터'), binding: 'initiatorList', edit: 'custom' }
      ],

      protocolTypes: [],
      clusterGridData: [],
      networkGridData: [],
      ovaOriginRefSubnet: null, // ## [OVA] -> 최초 선택
      companyList: {},

      // 🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧🟧 나중에 컴포넌트화 할것 같음
      // vSAN iSCSI 정규식
      regexInfo: {
        iqn: {
          condition: /^iqn\.[0-9]{4}-(0[1-9]|1[0-2])\.[a-z0-9]+(\.[a-z0-9]+)*(:[a-z0-9-.:]+)?$/g,
          alertMsg: '<div style="text-align: left;">vSAN에서 IQN을 자동으로 생성합니다.<br/>IQN을 입력하려는 경우 IQN은 다음과 같은 요구 사항을 충족해야 합니다.<br/><br /><small>* iqn.YYYY-MM.domain:Name 형식이어야 합니다.<br />* 마지막 필드(및 콜론)는 선택 사항입니다.<br />* 날짜가 유효해야 합니다(MM:01-12).<br />*ASCII 소문자("a"..."z"), 숫자(0-9) 및 특수 문자(-.:)만 허용됩니다.</small></div>'
        },
        tcpPort: {
          condition: (val) => (+val >= 1025) && (+val <= 65535),
          alertMsg: 'TCP 포트는 1025에서 65535 사이의 숫자여야 합니다.'
        },
        lunId: {
          condition: (val) => (+val >= 1) && (+val <= 255),
          alertMsg: 'LUN ID는 1에서 255 사이의 숫자여야 합니다.'
        },
        chapUserName: {
          condition: /^(?=.*[@_\-.:])[a-zA-Z0-9@_\-.:]+$/g,
          alertMsg: '<div style="text-align: left;">사용자 이름은 다음과 같은 요구 사항을 충족해야 합니다.<br/><br/><small>* 하나 이상의 문자를 포함해야 합니다.<br/>*허용되는 특수 문자는 (\'_\', \'-\', \'.\', \'@\', \':\')입니다.<br/>* 특수 문자로 시작할 수 없습니다.<br />* 표시되는 ASCII 문자만 사용해야 합니다.</small></div>'
        },
        chapPassword: {
          condition: /^(?!\s)(?!.*\s$)(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%&^*])[ -~]{12,16}$/g,
          alertMsg: '<div style="text-align: left;">암호는 다음과 같은 요구사항을 충족해야 합니다.<br/><br/><small>* 12-16자 사이의 길이,<br>* 대문자 1자 이상, <br/>* 소문자 1자 이상, <br/>* 숫자 1자 이상, <br />* 특수 문자(!, @, #, $, %, &, ^, *) 1자 이상, <br />* 공백을 포함하여 표시되는 ASCII 문자만, <br />* 공백으로 시작하거나 끝날 수 없습니다.</small></div>'
        }

      }

    }
  }
}
</script>

<style lang="scss" scoped>
  .set-cluster-node-modal {
    .mdi {
      color: $main-blue;
      margin-left: $gap-s;
    }

    .width {
      max-width: 200px;
    }

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
