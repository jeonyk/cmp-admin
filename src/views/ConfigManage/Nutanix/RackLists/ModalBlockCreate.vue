<!--
  * 파일명 : NetworkEquipCreator.vue
  * 파일 기능 : VMware 블록 생성 form
  * 작성자 : 이유준
  * 최종 작성일 : 2021-01-15
  * License By Shinsegae I&C
  * 2021-01-15 Update: lodash 사용방식 변경
 -->

<template>
  <div class="network-equip-creator">
    <section class="modal-body">
      <register-contents
        :title="$v('클러스터 선택')"
        required
      >
        <el-select
          :placeholder="$v('선택')"
          :popper-append-to-body="false"
          class="datacenter-selector"
          ref="selectCluster"
          v-model="blockInfo.clusterName"
          @change="changeCtg"
          :disabled="isEditBlockModal || isCreateInCluster"
          :style="{ width: '250px' }"
        >
          <el-option
            v-for="(item, idx) in clusterOptions"
            :key="idx"
            :label="item.clusterName"
            :value="item.clusterName"
          />
        </el-select>
      </register-contents>

      <register-contents
        :title="$v('블록 명')"
        required
      >
        <el-input
          :placeholder="$v('블록명을 입력하세요')"
          :popper-append-to-body="false"
          class="datacenter-selector"
          v-model="blockInfo.rackBlockName"
          :disabled="false"
          :style="{ width: '250px' }"
        />
      </register-contents>

      <register-contents
        :title="$v('랙 Unit 번호')"
        required
      >
        <el-input
          :popper-append-to-body="false"
          class="datacenter-selector"
          v-model="blockInfo.rackBlockStartUnit"
          :disabled="false"
          :style="{ width: '80px' }"
        />
        <span class="gap">~</span>
        <el-input
          :popper-append-to-body="false"
          class="datacenter-selector"
          v-model="blockInfo.rackBlockEndUnit"
          :disabled="false"
          :style="{ width: '80px' }"
        />
      </register-contents>

      <register-contents
        :title="$v('블록 내 노드 수')"
        required
      >
        <el-radio-group
          v-model="maxCount"
        >
          <el-radio
            v-for="item of [1,2,4]"
            :label="item "
            :value="item"
            :key="item"
          >
            {{ item +'개' }}
          </el-radio>
        </el-radio-group>
      </register-contents>
      <!-- 블록 내 노드 수 -->

      <div
        class="host-container"
      >
        <h3 class="host-title">
          노드 할당
        </h3>
        <div class="divider" />
        <div
          v-if="!isEditBlockModal && serviceHostCount === 0"
          class="no-service-host"
        >
          {{ $v('연결 가능한 호스트가 없습니다.') }}
          <br>
        </div>
        <section
          v-if="isShowBlock && isSelectHost"
          class="host-container--draggable"
          :class="{ 'host-grid-full' : hostList.length===1}"
        >
          <div
            v-for="(host, index) in hostList"
            class="host-card"
            :class="{'host-card__height-full': maxCount===1 || maxCount===2,'no-data-card':host && host.value === null}"
            :key="index"
          >
            <span class="host-index">
              <el-input
                :popper-append-to-body="false"
                @change="changeNodeIdx(index, blockInfo.nodeIdx[index].value)"
                v-model="blockInfo.nodeIdx[index].value"
                :disabled="false"
                :style="{ width: '100%' }"
              />
            </span>
            <!-- <i class="draggable-icon" /> -->
            <el-select
              class="host-selector"
              :class="{'no-data-selector': host && host.value === null}"
              v-model="hostList[index]"
              value-key="label"
              @change="e=> handleChangeHostOption(e, index)"
            >
              <el-option
                v-for="(item) in HostOptions"
                :key="item.hostUuid"
                :label="item.label"
                :value="item"
                :disabled="item.isSelected"
              />
            </el-select>
          </div>
        </section>
      </div>
      <!-- 이름 -->
    </section>

    <section class="modal-footer modal-button-area">
      <button
        class="button -modal-button"
        type="is-anti"
        @click="closeModal"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button -modal-button "
        type="is-primary"
        @click="applySave"
      >
        {{ !isEditBlockModal ? $t('common.BTN.add') : $t('common.BTN.apply') }}
      </button>
    </section>
  </div>
</template>

<script>
// import { cloneDeep } from 'lodash'
import API from '@sd-fe/cmp-core'

export default {
  props: {
    data: {
      type: Array,
      default: () => []
    },
    clusterList: { // 선택 할 api 클러스트 리스트
      type: Array,
      default: () => []
    },
    rackIdx: {
      type: Number,
      default: 0
    },
    rackList: {
      type: Array,
      default: () => []
    },
    selectedRack: {
      type: Object,
      default: null
    },
    selectedCluster: {
      type: Object,
      default: null
    },
    selectedBlock: {
      type: Object,
      default: null
    },
    selectedDataCenter: {
      type: Object,
      default: null
    },
    isEditBlockModal: {
      type: Boolean,
      default: false
    },
    isCreateInCluster: { // 해당 클러스터 내부 블럭 생성
      type: Boolean,
      default: false
    },
    isOpenedCreateBlock: {
      type: Boolean,
      default: false
    },
    isOpened: {
      type: Boolean,
      default: false
    },
    servicedHostList: {
      type: Array,
      default: () => []
    }
  },
  async created () {
    // const maxCount = this.maxCount
    // this.setCtgOptions()
    this.setClusterOptions()
    this.setHostList(this.maxCount)
  },
  computed: {
    HostOptions () {
      const hosts = this.serviceHostList || []
      const result = hosts.map((el, idx) => {
        const isSelected = el.isSelected || false
        return { ...el, value: el.hostUuid, label: el.hostUuid, isSelected }
      })

      result.unshift({ value: null, label: '없음' })

      return result
    },
    isShowBlock () {
      // console.log('isShowBlock')
      // const rackIdx = this.listInfo.element
      // return rackIdx !== null && rackIdx !== undefined
      return true
    }
  },
  watch: {
    isOpened: {
      immediate: true,
      handler (newVal) {
        if (newVal) {
          // console.log('블록 편집 모달 열림: ', this.selectedCluster)
          this.setInitData(this.selectedCluster)
          this.setServiceHostOption(this.blockInfo.clusterName)
          this.setClusterOptions()
          // 선택된 블록에 맥스 카운트가 없다면 초기값으로 호스트 설정
          if (this.selectedCluster === null) {
            this.setHostList(1)
          } else {
            this.setHostList(this.selectedCluster.maxCount)
          }
        } else {
          setTimeout(() => {
            this.setInitData()
          }, 200)
        }
      }
    },
    maxCount: {
      immediate: true,
      handler (count) {
        // console.log('maxCount ', count)
        this.setHostList(count)
        this.setServiceHostOption(this.blockInfo.clusterName)
      }
    },
    hostList: {
      immediate: true,
      handler (host) {
        // console.log('hostList 변경 감지: ', host)
      }
    }
  },
  methods: {
    /**
     * 블록 추가 팝업 초기화
     */
    initData () {
      this.blockInfo.clusterName = null
      this.blockInfo.rackBlockName = null
      this.blockInfo.rackBlockStartUnit = null
      this.blockInfo.rackBlockEndUnit = null
      this.blockInfo.hostList = null
      this.blockInfo.nodeIdx = [
        { value: 1 },
        { value: 2 },
        { value: 3 },
        { value: 4 }
      ]
      this.clusterOptions = []
    },
    /**
     * 클러스터 선택 옵션 설정
     */
    setClusterOptions () {
      this.clusterOptions = this.clusterList.map(item => {
        return {
          clusterName: item.clusterName,
          clusterUuid: item.clusterUuid
        }
      })
    },

    /**
     * 호스트 리스트 세팅
     */
    setHostList (maxCount) {
      if (this.isEditBlockModal) { // 수정
        this.hostList = Array.from({ length: maxCount }, (el, index) => {
          const result = this.selectedCluster.hostList[index]
          return result ? { ...result } : { value: null, label: '없음' }
        })
        this.blockInfo.hostList = this.hostList
      } else {
        this.hostList = Array.from({ length: this.maxCount }, (el, index) => ({ value: null, label: '없음' }))
      }
    },
    /** 노드 인덱스 교체 */
    changeNodeIdx (index, val) {
      const alert = (message, callback) => {
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: callback
        })
      }
      if (Number(val) > 4 || Number(val) < 1) return alert(this.$v('1 ~ 4 사이의 값을 입력해주세요'), () => false)
      const targetIdx = this.originIdx.findIndex((item) => {
        return item.value === Number(val)
      })

      // 배열 요소 swap
      const temp = this.originIdx[index]
      this.originIdx[index] = this.originIdx[targetIdx]
      this.originIdx[targetIdx] = temp

      // hostList 배열 요소 swap
      const tempNodes = this.blockInfo.hostList[index]
      this.blockInfo.hostList[index] = this.blockInfo.hostList[targetIdx]
      this.blockInfo.hostList[targetIdx] = tempNodes

      this.blockInfo.nodeIdx.forEach((item, i) => {
        item.value = this.originIdx[i].value
      })
    },
    /** 옵션에 선택된지 선택이 되지 않았는지 옵션을 추가해줍니다. */
    setOptionIsSelected () {
      this.serviceHostList = this.serviceHostList.map((option) => {
        // if (this.hostList.some((host) => host?.value?.hostUuid === option?.value?.hostUuid)) {
        if (this.hostList.some((host) => host.value === option.value)) {
          return { ...option, isSelected: true }
        } else { return { ...option, isSelected: false } }
      })
    },
    /** EVENT_HANDLER - (옵션변경) 호스트옵션 변경시 발생 */
    handleChangeHostOption (target, nodeIdx) {
      console.log(target, nodeIdx)
      this.blockInfo.hostList = this.hostList

      // TODO 위에 주석 삭제
      this.setOptionIsSelected()
    },
    resetHostList () {
      this.maxCount = 1
      this.setHostList(1)
    },
    async setServiceHostOption (val) {
      this.serviceHostList = []
      if (val) {
        this.serviceHostList = this.clusterList.filter(item => item.clusterName === val)[0].hosts.map((item, i) => {
          return {
            ...item,
            label: item.hostUuid,
            value: item.hostUuid,
            isSelected: false
          }
        })
      }

      const filteredRackList = this.rackList.filter(item => {
        return item.cateIdx === this.selectedDataCenter.cateIdx
      })

      const selectedHostList = []
      filteredRackList.forEach(rack => {
        for (const cluster of rack.clusters) {
          if (cluster.type === 'NODE') {
            cluster.blocks.forEach(block => {
              for (const host of block.hostList) {
                selectedHostList.push(host.hostUuid)
              }
            })
          }
        }
      })

      const filteredHostList = this.serviceHostList.map(host => {
        selectedHostList.forEach(item => {
          if (item === host.hostUuid) {
            host.isSelected = true
          }
        })
        return host
      })

      const filteredHost = filteredHostList.filter(host => host.isSelected !== true)
      this.serviceHostCount = filteredHost.length
      if (this.serviceHostCount === 0 && !this.isEditBlockModal) {
        this.isSelectHost = false
      } else {
        this.isSelectHost = true
      }
      this.serviceHostList = filteredHostList
      return this.serviceHostList
    },
    /** API_HANDLER - (GET) VMware 호스트 리스트를 가져옵니다. */
    async getVmwareHosts () {
      // console.log('getVmwareHosts')
      try {
      // ESXi 는 vmware의 호스트를 의미합니다.
        const result = await API.vmware.host.getVmwareHostList()
        return result
      } catch (err) {
        this.$alert(this.$v('호스트를 가져올 수 없습니다.'))
      }
    },
    /**
     * 수정일 때, 초기 데이터 세팅
     * @param {Object} data 초기 데이터 {isNew, listInfo(선택 네트워크카테고리), order, rackIdx, type, name, desc}
     */
    async setInitData (block) {
      if (block && this.isEditBlockModal) { // 수정 상태
        this.blockInfo.clusterName = block.clusterName
        this.blockInfo.rackBlockName = block.rackBlockName
        this.blockInfo.rackBlockStartUnit = block.rackBlockStartUnit
        this.blockInfo.rackBlockEndUnit = block.rackBlockEndUnit
        this.blockInfo.nodeCount = block.nodeCount
        this.maxCount = block.maxCount
        this.changeCtg(block.clusterName)
      } else if (block && this.isCreateInCluster) { // 클러스터 내부에 블록 생성
        this.blockInfo.clusterName = block.clusterName
        this.changeCtg(this.blockInfo.clusterName)
      } else {
        this.maxCount = 1
        this.setHostList(1)
      }
    },
    /**
     * 카테고리 변경 이벤트
     * @param {Number} val 선택한 카테고리의 ipCategoryIdx
     */
    changeCtg (val) {
      // console.log('changeCtg: ', val)
      this.setServiceHostOption(val)
    },

    /**
     * 모달 닫기 이벤트
     */
    closeModal () {
      this.$emit('close-modal')
    },
    /**
     * [추가, 수정]
     */
    applySave () {
      if (!this.validForm()) return

      let message
      if (this.selectedCluster === null && !this.isEditBlockModal) message = this.$v('블록을 추가하시겠습니까?')
      else message = this.$v('블록을 수정하시겠습니까?')

      this.$confirm(message, '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(() => {
        const nodeList = this.hostList.filter(item => item.value !== null)
        const payload = {
          ...this.blockInfo,
          rackIdx: this.rackIdx,
          clusterUuid: this.clusterList.filter(item => item.clusterName === this.blockInfo.clusterName)[0].clusterUuid,
          hostList: nodeList || [],
          maxCount: this.maxCount,
          nodeCount: nodeList.length,
          type: 'NODE' // UI 로직
        }
        this.$emit('apply-save', payload)
      })
        .catch(() => false)
    },
    /**
     * 생성, 수정시 validation
     * @return validation 통과 유무
     */
    validForm () {
      const alert = (message, callback) => {
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: callback
        })
      }

      let hasNodeName = false
      const filteredNodeNames = []

      const filteredRackList = this.rackList.filter(item => {
        return item.cateIdx === this.selectedDataCenter.cateIdx
      })

      const filteredClusters = filteredRackList.map(item => {
        const blocks = []
        let isEditBlockName = false
        item.clusters.forEach(cluster => {
          if (cluster.clusterName === this.blockInfo.clusterName) {
            for (const block of cluster.blocks) {
              if (this.selectedCluster) {
                block.rackBlockName === this.selectedCluster.rackBlockName ? isEditBlockName = true : isEditBlockName = false
              }
              if (block.rackBlockName === this.blockInfo.rackBlockName && !isEditBlockName) {
                blocks.push(block.rackBlockName)
              }
            }
          }
        })
        return blocks
      })

      filteredClusters.forEach(item => {
        const isName = item.some(name => name === this.blockInfo.rackBlockName)
        filteredNodeNames.push(isName)
      })

      hasNodeName = filteredNodeNames.some(item => item === true)

      const unitNum1 = Number(this.blockInfo.rackBlockStartUnit)
      const unitNum2 = Number(this.blockInfo.rackBlockEndUnit)

      if (!this.blockInfo.clusterName) return alert(this.$v('클러스터를 선택해주세요.'), () => false)
      if (!this.blockInfo.rackBlockName) return alert(this.$v('블록명을 입력해주세요.'), () => false)
      if (hasNodeName) return alert(this.$v('중복된 블록명이 있습니다. 다른 블록명을 입력해주세요'), () => false)
      if (!this.blockInfo.rackBlockStartUnit || !this.blockInfo.rackBlockEndUnit) return alert(this.$v('랙 Unit 번호를 입력해주세요.'), () => false)
      if (unitNum1 < 1 || unitNum1 > 60 || !Number.isInteger(unitNum1)) return alert(this.$v('랙 Unit 번호는 1 ~ 60 사이의 정수만 가능합니다.'), () => false)
      if (unitNum2 < 1 || unitNum2 > 60 || !Number.isInteger(unitNum2)) return alert(this.$v('랙 Unit 번호는 1 ~ 60 사이의 정수만 가능합니다.'), () => false)

      const isSelected = this.hostList.filter(item => item.value === null)
      if (this.maxCount < 4 && isSelected.length > 0) return alert(this.$v('노드를 할당해주세요.'), () => false)
      if (this.maxCount === 4 && isSelected.length > 1) return alert(this.$v('노드를 할당해주세요.'), () => false)
      return true
    }
  },
  data () {
    return {
      serviceHostList: [],
      serviceHostCount: null,
      isSelectHost: true,
      hostList: [],
      maxCount: 1,

      clusterOptions: [],
      blockInfo: {
        clusterName: null,
        clusterUuid: null,
        rackBlockName: null,
        rackBlockStartUnit: null,
        rackBlockEndUnit: null,
        nodeCount: null,
        nodeIdx: [
          { value: 1 },
          { value: 2 },
          { value: 3 },
          { value: 4 }
        ],
        hostList: []
      },
      originIdx: [
        { value: 1 },
        { value: 2 },
        { value: 3 },
        { value: 4 }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.network-equip-creator {
  .datacenter-selector {
    width: 150px;
    margin-right: $gap-s;
  }

  .modal-body {
    border-top: 1px solid $border-color;
    // height: 420px;
    .host-container {
      width:100%;
     .host-title {
      margin-top: $gap *2;
      margin-bottom: $gap/2;
      color: white;
      font-weight: 300;
     }
     .divider {
      width: 100%;
      height: 1px;
      margin: auto;
      background: #727797;
    }
    .host-container--draggable {
      display: grid;
      align-items: center;
      position: relative;
      grid-template-columns: 1fr 1fr;
      grid-gap: 2px;
      background: #1D2E4D;
      min-height: 80px;
      margin-top: 20px;
      margin-left: auto;
      margin-right:auto;
      padding: 8px;
      border-radius: 4px;
      &.host-grid-full {
        grid-template-columns: 1fr;
      }
      .host-card {
        .host-index {
          width: 15%;
          max-width: 60px;
          font-weight: 600;
          .el-input{
            .el-input__inner{
              text-align: center;
              font-weight: 600;
            }
          }
        }

        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        color: #fff;
        height: 80px;
        font-style: normal;
        background: #365283;
        border: none;
        border-radius: 4px;
        box-sizing: border-box;
        &.host-card__height-full {
          height: 160px;
        }
        &.no-data-card {
          box-sizing: border-box;
          background: none;
          border: 2px dashed #365283;

        }
        .host-selector {
          margin-left:10px;
          width: 80%;
          &:not(is-focus) {
            border:1px solid white;
          }
          &.no-data-selector {
            border: 1px solid #727797;
            color: #727797;
          }
        }
      }
    }
    }

    .contents{
      .el-input + .gap{
        padding-right: 10px;
      }
    }
  }
  .no-service-host {
    display: flex;
    height: 200px;
    flex-shrink: 1;
    justify-content: center;
    align-items: center;
  }
}
</style>
