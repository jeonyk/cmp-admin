<!--
  * 파일명 : RackLists.vue
  * 파일 기능 : 랙실장도: 클러스터 정보 및 내부 호스트/네트워크 장비 정보 표시, 네트워크 장비 생성/변경/삭제 기능
  * 작성자 : 염창윤 외 2명
  * 최종 작성일 : 2021-02-15
  * License By Shinsegae I&C
  * 2021-02-15 랙실장도 버그: 네트워크 장비 이름 변경 > 엉뚱한게 같이 변경되는 현상 수정
 -->

<template>
  <div
    :class="['rack-lists', rackMode === 'edit' ? 'mode-edit' : '']"
    v-loading="clusterLoading || saveLoading"
  >
    <div
      class="button-area -right"
      data-html2canvas-ignore="true"
    >
      <button
        class="button -pdf-download"
        type="is-icon"
      >
        <pdf-download
          file-name="racks"
          file-background-color="#1F1E32"
        />
      </button>
      <!-- 일반 모드 -->
      <template v-if="rackMode === 'default'">
        <button
          class="button"
          type="is-primary"
          @click="e => {
            rackMode = 'edit'
            calcMaxHeight()
          }"
        >
          <!-- 랙실장도 편집 -->
          {{ $t('config.RACK.editRack') }}
        </button>
      </template>
      <!-- 편집 모드 -->
      <template v-else>
        <button
          class="button -cancel"
          @click="cancelEditMode"
        >
          {{ $t("취소") }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="saveRackData"
        >
          {{ $v("저장") }}
        </button>
      </template>
      <!-- <button
        class="button"
        type="is-primary"
        @click="e => {
          updatedNetworkInfo = null
          networkCreateModal = true
        }"
      >
        {{ $t('config.RACK.addNetworkEquip') }}
      </button> -->
    </div>
    <g-tab
      :data="rackTabData"
      @click="clickTab"
    />
    <div class="table-top-wrap">
      <filtering-component
        @reset-data="e => {
          mainType = $t('main.DASHBOARD.all')
          changeType($t('main.DASHBOARD.all'))
        }"
      >
        <div class="filter-form">
          <div class="filter-name">
            {{ $t('common.TERMS.cluster') }}
          </div>
          <div class="filter-options">
            <el-select
              v-model="mainType"
              :placeholder="$t('common.BTN.select')"
              @change="changeType"
            >
              <el-option
                v-for="(item, idx) in mainTypeOptions"
                :key="idx"
                :label="item.clusterName"
                :value="item.clusterName"
              />
            </el-select>
          </div>
        </div>
      </filtering-component>
      <div
        class="button-area -right"
        data-html2canvas-ignore="true"
      >
        <button
          class="button"
          type="is-primary"
          @click="e => {
            isOpenedCreateRack = true
          }"
        >
          <!-- 랙 추가 -->
          {{ $t('config.RACK.addRack') }}
        </button>
      </div>
    </div>

    <div class="flex-wrap -flex-start top-label">
      <!-- <i class="cluster-icon" /> -->
      <chart-label
        v-for="(label, idx) in rackLabels"
        :key="idx"
        :label="$t(label.keyPath) || label.label"
        :color="label.color"
        :border-color="label.borderColor"
      />
    </div>

    <div style="padding: 0 0 0;">
      <section class="rack-contents-list">
        <div
          class="rack-contents-wrap"
          v-for="(rack, index) in filteredRackList"
          :key="index"
        >
          <div class="rack-contents">
            <a
              class="cluster-name"
              @click.stop="clusterDetail(rack.elementIdx)"
            >
              {{ rack.rackName }}
            </a>
            <div
              class="edit-area"
            >
              <a
                class="icon-edit"
                @click="e => {
                  updatedRackInfo = rack
                  isOpenedCreateRack = true
                }"
              />
              <a
                class="icon-delete"
                @click="deleteRackItem(rack, index)"
              />
            </div>
            <!-- <div
              v-if="Object.keys(rack.rack).length &&
                rack.rack.blocks &&
                rack.rack.blocks.length"
              class="cluster-body"
            > -->
            <div>
              <section class="detail-section">
                <draggable
                  :list="rack.clusters"
                  draggable=".resource-item"
                  :group="{name: 'elementGroup'}"
                  data-zone="elementGroup"
                  handle=".-draggable-icon"
                  :sort="true"
                  :ghost-class="(rack.clusters && rack.clusters.length)? '' :'ghost'"
                  @start="onDragStart"
                  @end="e => onDragEnd(e, rack, rack.clusters)"
                >
                  <li
                    class="resource-item"
                    v-for="(item, idx) in rack.clusters"
                    :key="idx"
                  >
                    <rack-draggable-item
                      :data="item"
                      :selected-rack="rack"
                      :cluster="item.type === 'NODE' ? item : null"
                      :active="true"
                      :type="item.type === 'NODE' ? 'block' : null"
                      :background-color="item.type === 'NODE' ? '#1D2E4D' : '#58265B'"
                      :border-color="item.type === 'NODE' ? '#36476D' : '#7A477D'"
                      :node-count="item.type === 'NODE' ? item.maxCount : null"
                      :rack-mode="rackMode"
                      @create-in-cluster="e => createBlockInCluster(e, rack, item, idx)"
                      @drag-end="calcMaxHeight"
                      @click-block="findHost"
                      @delete-network="item.type !== 'NODE' ? deleteNetworkItem(rack, item, idx) : null"
                      @edit-network="item.type !== 'NODE' ? editNetworkItem(rack, item, idx) : null"
                      @delete-block="e => deleteBlockItem(e, rack, item, idx)"
                      @edit-block="e => editBlockItem(e, item)"
                    >
                      <span v-if="item.type === 'NODE'">{{ item.positionOrdinal }}</span>
                      <template v-else>
                        <el-tooltip
                          v-if="item.name.length > 13"
                          :content="item.name"
                          placement="top"
                          effect="light"
                        >
                          <a
                            class="ellipsis-wrap"
                            @click="e => {
                              updatedNetworkInfo = item
                              networkCreateModal = true
                            }"
                          >
                            {{ item.name }}
                          </a>
                        </el-tooltip>
                        <a
                          class="name-block"
                          @click="e => {
                            updatedNetworkInfo = item
                            networkCreateModal = true
                          }"
                          v-else
                        >{{ item.name }}</a>
                      </template>
                    </rack-draggable-item>
                  </li>
                </draggable>
              </section>
            </div>
            <div
              class="add-area"
              ref="addArea"
            >
              <a
                class="add-icon"
                @click="toggleAddBtns"
              />
              <div
                ref="cardArea"
                class="card-area"
                @mouseleave="hideAddBtns"
              >
                <button
                  class="button network"
                  @click="e => {
                    openedCreateNetwork(e, rack)
                  }"
                >
                  <i
                    class="icon-add"
                  />
                  <!-- 네트워크 장비 추가 -->
                  <span>{{ $t('config.RACK.addNetworkEquip') }}</span>
                </button>
                <button
                  class="button block"
                  @click="e => {
                    openedCreateBlock(e, rack)
                  }"
                >
                  <i class="icon-add" />
                  <!-- 서버 블록(Block) 추가 -->
                  <span>{{ $t('config.RACK.addServerBlock') }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div
        class="buttons-footer"
      >
        <button
          class="button -cancel"
          size="is-large"
          @click="cancelEditMode"
        >
          <!-- 취소 -->
          {{ $t("common.BTN.cancel") }}
        </button>
        <button
          class="button"
          type="is-primary"
          size="is-large"
          @click="saveRackData"
        >
          <!-- 저장 -->
          {{ $t('common.BTN.save') }}
        </button>
      </div>
    </div>

    <!-- 모달 -->
    <!-- 랙 추가 -->
    <el-dialog
      :title="updatedRackInfo ? $v('랙 수정') : $v('랙 추가')"
      :visible.sync="isOpenedCreateRack"
      width="800px"
      @close="closeCreateRackModal"
    >
      <modal-rack-create
        ref="modalRackCreate"
        :selected-block="selectedCluster"
        :data="updatedRackInfo"
        @close-modal="closeCreateRackModal"
        @apply-save="handleApplySaveRack"
      />
    </el-dialog>

    <!-- 블록 추가 -->
    <el-dialog
      :title="isEditBlockModal ? $v('블록 수정') : $v('블록 추가')"
      :visible.sync="isOpenedCreateBlock"
      width="800px"
      @close="closeBlockModal"
    >
      <modal-block-create
        ref="modalBlockCreate"
        :cluster-list="filteredClusterList"
        :rack-idx="selectedElementIdx"
        :selected-data-center="selectedDatacenter"
        :rack-list="rackUiList"
        :selected-rack="selectedRack"
        :selected-cluster="selectedCluster"
        :is-edit-block-modal="isEditBlockModal"
        :serviced-host-list="servicedHostList"
        :is-create-in-cluster="isCreateInCluster"
        :is-opened="isOpenedCreateBlock"
        @close-modal="closeBlockModal"
        @apply-save="e=>handleApplySaveBlock(e)"
      />
    </el-dialog>

    <!-- 네트워크 장비 추가 -->
    <!-- :title="`네트워크 장비 ${updatedNetworkInfo ? '수정' : '추가'}`" -->
    <el-dialog
      :title="updatedNetworkInfo ? $t('common.MODAL.modNetworkEquip') : $t('common.MODAL.addNetworkEquip')"
      :visible.sync="networkCreateModal"
      width="800px"
      @close="closeModal"
    >
      <network-equip-creator
        ref="networkEquipCreator"
        :rack-idx="selectedElementIdx"
        :data="updatedNetworkInfo"
        :ctg-datas="ctgDatas"
        :clusters="clusterList"
        @close-modal="networkCreateModal = false"
        @apply-save="applySaveNetwork"
      />
    </el-dialog>

    <!-- 구성관리>클러스터 -->
    <el-dialog
      :title="$t('main.LAYOUT.resPool')"
      :visible.sync="detail.cluster"
      top="15vh"
      width="1200px"
    >
      <section class="modal-body rack-detail-modal">
        <set-cluster :element-idx="selectedElementIdx" />
      </section>
      <section class="modal-footer modal-button-area">
        <button
          class="button"
          @click="detail.cluster = false"
          type="is-primary"
        >
          {{ $t('common.BTN.confirm') }}
        </button>
      </section>
    </el-dialog>

    <!-- 구성관리>호스트 -->
    <el-dialog
      :title="$t('common.MODAL.physicalServ')"
      :visible.sync="detail.host"
      top="15vh"
      width="1200px"
    >
      <section class="modal-body rack-detail-modal">
        <set-host :host-uuid="selectedHostUuid" />
      </section>
      <section class="modal-footer modal-button-area">
        <button
          class="button"
          type="is-primary"
          @click="detail.host = false"
        >
          {{ $t('common.BTN.confirm') }}
        </button>
      </section>
    </el-dialog>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import draggable from 'vuedraggable'

import { groupBy, cloneDeep } from 'lodash'

import ChartLabel from './ChartLabel'
import NetworkEquipCreator from './NetworkEquipCreator'
import RackDraggableItem from './RackDraggableItem/RackDraggableItem'
import ModalBlockCreate from './ModalBlockCreate.vue'
import ModalRackCreate from './ModalRackCreate.vue'
import SetCluster from '../SetCluster/SetCluster'
import SetHost from '../SetHost/SetHost'

export default {
  name: 'RackLists',
  components: {
    draggable,
    'network-equip-creator': NetworkEquipCreator,
    'modal-block-create': ModalBlockCreate,
    'modal-rack-create': ModalRackCreate,
    'rack-draggable-item': RackDraggableItem,
    'chart-label': ChartLabel,
    'set-cluster': SetCluster,
    'set-host': SetHost
    // 'server-cluster-comp': ServerClusterComp,
  },
  computed: {
    /** 탭영역 데이터 */
    datacenterList () {
      let result = cloneDeep(this.networkCateList) || []
      if (result && result.length) {
        result = result.filter(cate => cate.upperCategoryIdx === 0)
          .map(item => {
            const cateIdxList = []
            this.networkCateList.forEach(d => {
              if (d.cateKey.includes(item.cateKey)) cateIdxList.push(d.ipCategoryIdx)
            })
            return {
              field: item.cateKey,
              cateIdx: item.ipCategoryIdx,
              name: item.cateKey + 'IDC',
              isActive: false,
              cateIdxList
            }
          })
      }
      return result
    }
  },
  watch: {
    selectedDatacenter: {
      immediate: true,
      deep: true,
      handler (newVal) {
        if (!newVal) return
        newVal.isActive = true

        this.mainTypeOptions = []
        this.mainType = this.$t('main.DASHBOARD.all')
        this.setTypeOptions(newVal.cateIdx) // 필터 설정 -> 타입 옵션 세팅

        // this.filteredRackList = this.rackList.filter(item => item.datacenter === newVal.field) // 클러스터 리스트 필터링
      }
    },
    showSearchResult () { // 노드 추가 레이어 활성화 감지
      if (this.showSearchResult) {
        window.addEventListener('click', this.onClickWindow)
      } else {
        window.removeEventListener('click', this.onClickWindow)
      }
    }
  },
  async created () {
    await this.getIpCategories()
    await this.getElementData()
    this.calcMaxHeight()
  },
  methods: {
    // max height 계산
    calcMaxHeight () {
      const arrHeight = []
      const el = document.querySelectorAll('.rack-contents')
      el.forEach(item => {
        item.style.height = 'auto'
        setTimeout(() => {
          arrHeight.push(item.offsetHeight)
        }, 30)
      })
      setTimeout(() => {
        if (arrHeight.length > 1) {
          const maxHeight = arrHeight.reduce((a, b) => a > b ? a : b)
          el.forEach(item => {
            item.style.height = maxHeight + 'px'
          })
        }
      }, 50)
    },
    // 클러스터 추가 레이어 toggle
    toggleAddBtns (evt) {
      const tg = evt.target
      const toggle = tg.nextSibling.classList.contains('on')
      if (toggle) {
        tg.nextSibling.classList.remove('on')
        this.showSearchResult = false
      } else {
        tg.nextSibling.classList.add('on')
        this.showSearchResult = true
      }
    },
    // 바닥 클릭 시 레이어 hide
    onClickWindow (e) {
      const addArea = e.target.parentNode.classList.contains('add-area')
      const cardArea = e.target.parentNode.classList.contains('card-area')
      if (!cardArea && !addArea) {
        const layerAdd = document.querySelectorAll('.card-area')
        layerAdd.forEach(item => item.classList.remove('on'))
        this.showSearchResult = false
      }
    },
    // mouseleave 시 레이어 hide
    hideAddBtns (evt) {
      evt.target.classList.remove('on')
      this.showSearchResult = false
    },

    // 랙 삭제
    deleteRackItem (cluster, idx) {
      this.$confirm(this.$v('해당 랙을 삭제하시겠습니까?'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.$alert(this.$t('common.ALERT.BASE.017')) // 삭제하였습니다.
        this.filteredRackList.splice(idx, 1)
        this.rackUiList.splice(idx, 1)
        // this.getElementData()
      }).catch(() => false)
    },
    // 랙 추가 모달 hide
    closeCreateRackModal () {
      this.$refs.modalRackCreate.initData()
      this.isOpenedCreateRack = false
    },
    /** EVENT_HANDLER - (생성) 랙 생성 */
    handleApplySaveRack (payload) {
      const arrRackIdx = this.rackUiList.map(item => item.rackIdx)
      const maxIdx = arrRackIdx.length > 0 ? Math.max(...arrRackIdx) : 0

      const addRackData = {
        rackName: payload.rackName,
        rackIdx: maxIdx + 1,
        sequence: 0,
        cateIdx: this.selectedDatacenter.cateIdx,
        clusters: [],
        blockList: []
      }
      if (payload.isNew) { // 생성
        this.rackUiList.push(addRackData)
        this.filteredRackList.push(addRackData)
      } else { // 수정
        const selectedData = this.rackUiList.filter(item => {
          return item.rackIdx === payload.rackIdx
        })
        selectedData[0].rackName = payload.rackName
      }

      setTimeout(e => this.calcMaxHeight(), 100)

      this.closeCreateRackModal()
    },

    // 블록 추가 팝업
    openedCreateBlock (e, rack) { // 클러스터 외부 클릭 시
      this.selectedRack = rack
      this.selectedElementIdx = rack.rackIdx
      this.isOpenedCreateBlock = true
      this.selectedCluster = null
      this.getSelectedElement(e)
    },
    createBlockInCluster (e, rack, item, idx) { // 클러스터 내부 클릭 시
      this.updatedBlockInfo = item.blocks.filter(item => item.type === 'NODE')
      this.isOpenedCreateBlock = true
      this.isCreateInCluster = true
      this.selectedCluster = item
      this.selectedRack = rack
      this.getSelectedElement(e)
    },
    getSelectedElement (evt) {
      const selectedElement = evt.target.closest('.rack-contents')
      this.selectedRackElement = selectedElement
    },
    // 블록 수정
    editBlockItem (payload, item) {
      this.isEditBlockModal = true
      this.isOpenedCreateBlock = true
      this.selectedCluster = item.blocks[payload.idx]
      // item.blocks[block.idx] =
    },
    // 블록 삭제
    deleteBlockItem (payload, rack, cluster, idx) {
      this.$confirm(this.$v('해당 블록을 삭제하시겠습니까?'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.$alert(this.$t('common.ALERT.BASE.017')) // 삭제하였습니다.
        if (cluster.blocks.length === 1) {
          rack.clusters.splice(idx, 1)
        } else {
          cluster.blocks.splice(payload.idx, 1)
        }
        // this.getElementData()
      }).catch(() => false)
    },
    /** EVENT_HANDLER - (생성) 블록 생성 */
    handleApplySaveBlock (payload) {
      const targetRackUiList = this.rackUiList.filter(item => item.rackIdx === payload.rackIdx)
      if (this.isEditBlockModal) { // 블록 수정 적용
        this.selectedCluster.clusterName = payload.clusterName
        this.selectedCluster.clusterUuid = payload.clusterUuid
        this.selectedCluster.rackBlockName = payload.rackBlockName
        this.selectedCluster.rackBlockStartUnit = payload.rackBlockStartUnit
        this.selectedCluster.rackBlockEndUnit = payload.rackBlockEndUnit
        this.selectedCluster.maxCount = payload.maxCount
        this.selectedCluster.hostList = payload.hostList
        this.selectedCluster.nodeIdx = payload.nodeIdx
        this.selectedCluster.nodeCount = payload.nodeCount
      } else { // 추가
        if (this.isCreateInCluster) { // 선택한 클러스터 내부 생성
          const hostList = payload.hostList.map((item, idx) => {
            return {
              ...item,
              hostInfo: {
                hostUuid: item.hostUuid,
                hostName: item.nodeName
              }
            }
          })
          const arrBlockIdx = []
          this.rackUiList.forEach(rack => {
            rack.clusters.forEach(cluster => {
              if (cluster.type === 'NODE') {
                for (const block of cluster.blocks) {
                  arrBlockIdx.push(block.rackBlockIdx)
                }
              }
            })
          })
          const maxIdx = arrBlockIdx.length > 0 ? Math.max(...arrBlockIdx) : 0

          const block = {
            clusterName: payload.clusterName,
            clusterUuid: payload.clusterUuid,
            rackBlockIdx: maxIdx + 1,
            rackBlockName: payload.rackBlockName,
            hostList: hostList,
            rackBlockStartUnit: Number(payload.rackBlockStartUnit),
            rackBlockEndUnit: Number(payload.rackBlockEndUnit),
            maxCount: payload.maxCount,
            nodeCount: payload.nodeCount,
            sequence: maxIdx + 1
          }
          this.selectedCluster.blocks.push(block)
        } else { // 새로운 클러스터 생성
          const hostList = payload.hostList.map((item, idx) => {
            return {
              ...item,
              hostInfo: {
                hostUuid: item.hostUuid,
                hostName: item.nodeName
              }
            }
          })

          const arrBlockIdx = []
          this.rackUiList.forEach(rack => {
            rack.clusters.forEach(cluster => {
              if (cluster.type === 'NODE') {
                for (const block of cluster.blocks) {
                  arrBlockIdx.push(block.rackBlockIdx)
                }
              }
            })
          })
          const maxIdx = arrBlockIdx.length > 0 ? Math.max(...arrBlockIdx) : 0

          const block = {
            clusterName: payload.clusterName,
            clusterUuid: payload.clusterUuid,
            rackBlockIdx: maxIdx + 1,
            rackBlockName: payload.rackBlockName,
            hostList: hostList,
            rackBlockStartUnit: Number(payload.rackBlockStartUnit),
            rackBlockEndUnit: Number(payload.rackBlockEndUnit),
            maxCount: payload.maxCount,
            nodeCount: payload.nodeCount,
            sequence: maxIdx + 1
          }

          const clusterItem = {
            clusterName: payload.clusterName,
            clusterUuid: payload.clusterUuid,
            type: 'NODE',
            blocks: [
              block
            ]
          }

          targetRackUiList[0].clusters.push(clusterItem)
        }
      }
      this.closeBlockModal()
      setTimeout(e => this.calcMaxHeight(), 100)
    },
    closeBlockModal () {
      this.$refs.modalBlockCreate.initData()
      this.isOpenedCreateBlock = false
      this.updatedBlockInfo = null
      this.isCreateInCluster = false
      this.isEditBlockModal = false
    },

    /**
     * 데이터센터 - 네트워크 환경 - 망분류 관련 데이터
     */
    async getIpCategories () {
      try {
        const resCtgData = await API.network.getNetworkCategory()
        if (!resCtgData) {
          this.rackTabData = []
          return
        }
        this.ctgDatas = resCtgData // 네트워크 카테고리 오리진 데이터 저장

        this.rackTabData = resCtgData.filter(cate => cate.upperCategoryIdx === 0)
          .map(item => {
            const cateIdxList = []
            this.ctgDatas.forEach(d => {
              if (d.cateKey.includes(item.cateKey)) cateIdxList.push(d.ipCategoryIdx)
            })
            return {
              field: item.cateKey,
              cateIdx: item.ipCategoryIdx,
              name: item.cateKey + 'IDC',
              isActive: false,
              cateIdxList
            }
          })

        this.selectedDatacenter = this.rackTabData[0]
        this.clickTab(this.rackTabData[0])
      } catch (error) {
        console.error(error)
      }
    },
    /**
     * element 데이터를 가져옵니다.
     */
    async getElementData () {
      try {
        this.clusterLoading = true
        const rackData = await API.compute.getRackData()

        if (!rackData) return
        this.setElementData(rackData)

        this.clusterLoading = false
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.rackList = []
        this.$alert(message)
        return false
      } finally {
        this.clusterLoading = false
      }
    },
    /**
     * cluster 데이터를 가져옵니다. 블록 추가 시 클러스터 선택
     */
    async getClusterData () {
      try {
        this.clusterLoading = true
        const data = await API.compute.getElementListSimple()
        this.clusterList = data
        if (!data) return
        this.clusterLoading = false
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.$alert(message)
        return false
      } finally {
        this.clusterLoading = false
      }
    },
    /**
     * element 데이터를 랙실장도에 맞게 세팅합니다.
     * element에 rack정보가 있으면 그 정보를, 없으면 rack 정보 형태와 동일하게 가공합니다.
     * @param {Array} data element 정보
     */
    setElementData (data) {
      const elements = data.map(el => {
        const clusters = [] // 블럭에 들어갈 호스트 배열

        // element내부 host정보를 blockSerial로 그루핑합니다.
        // 형태: { blockSerial: [...호스트1], [...호스트2] }
        // console.log('@el.data ', el.data)
        el.data = JSON.parse(el.data)
        const grouping = groupBy(el.blockList, 'clusterUuid')
        // console.log('@그루핑!', grouping)

        for (const key in grouping) {
          const blocks = []

          grouping[key].forEach((item, i) => {
            blocks[i] = item
          })
          clusters.push({ // clusters
            clusterName: grouping[key][0].clusterName,
            clusterUuid: grouping[key][0].clusterUuid,
            blocks: blocks,
            type: 'NODE'
          })
        }

        if ('data' in el === false) { // el.data 정보가 없을 때 el.data 생성
          el.data = Object.assign({
            clusters: [...clusters]
          }, el)
        } else if (el.data.clusters?.length) {
          el.data.clusters = [...el.data.clusters]
        } else {
          // el.data = null
        }

        return { // 클러스터 정보 세팅 후 리턴
          cateIdx: el.cateIdx,
          rackName: el.rackName,
          rackIdx: el.rackIdx,
          sequence: el.sequence,
          data: el.data,
          // datacenter: this.elNetworkInfo(el.cateKey).datacenter,
          // networkInfo: this.elNetworkInfo(el.cateKey).networkType,
          clusters: clusters,
          blockList: el.blockList || []
        }
      })

      this.rackList = elements // origin data
      this.rackUiList = elements.map(item => item.data) // ui data

      this.clickTab(this.selectedDatacenter)
      this.changeType(this.mainType)
    },
    /**
     * element의 cateKey로 데이터센터와 네트워크 타입(SDN, LEGACY) 리턴
     * @param {String} cateKey
     * @return {Object} {datacenter: 데이터센터, networkType: 네트워크 타입}
     */
    elNetworkInfo (cateKey) {
      const cateInfo = cateKey.includes('-') ? cateKey.split('-') : [cateKey]
      const datacenter = cateInfo[0]
      const networkType = cateInfo.length > 1 ? cateInfo[1].toUpperCase() : undefined
      return { datacenter, networkType }
    },
    /**
     * Block(호스트)의 최대 포지션 갯수를 설정합니다.
     * @param {Array} blocks
     */
    setNodeCount (blocks) {
      const ordinals = blocks.map(item => { return item.positionOrdinal })
      const maxNum = Math.max.apply(null, ordinals) // 호스트의 positionOrdinal값 중 가장 큰 값

      // 블럭의 갯수를 짝수로 설정
      if (maxNum % 2 === 0 || maxNum === 1) return maxNum
      else return maxNum + 1
    },
    /**
     * 데이터센터(TAB) 선택
     * @param {Object} param 선택한 탭 정보
     */
    async clickTab (param) {
      this.selectedDatacenter = param

      this.filteredRackList = this.rackUiList.filter(item => {
        // return param.cateIdxList.includes(item.cateIdx)
        return item.cateIdx === param.cateIdx
      })

      await this.getClusterData()
      this.filteredClusterList = this.clusterList.filter(item => {
        return item.cateIdx === this.selectedDatacenter.cateIdx
      })

      this.calcMaxHeight()
    },
    /**
     * 데이터 센터에 따른 네트워크 환경 옵션 세팅
     */
    async setTypeOptions (cateIdx) {
      // this.ctgDatas.forEach(ctg => {
      //   if (ctg.upperCategoryIdx === cateIdx) {
      //     this.mainTypeOptions.push(ctg)
      //   }
      // })

      await this.getClusterData()
      this.mainTypeOptions = this.clusterList.filter(item => {
        return item.cateIdx === cateIdx
      })
      // this.mainTypeOptions.unshift({ clusterName: this.$t('main.DASHBOARD.all') })
    },
    /**
     * 네트워크 환경 선택 (필터: 타입 change 이벤트)
     * @param {String} type 'SDN', 'LEGACY'
     */
    changeType (type) {
      const filteredCenter = this.rackUiList.filter(item => item.cateIdx === this.selectedDatacenter.cateIdx)

      this.filteredRackList = []
      if (type && type !== this.$t('main.DASHBOARD.all')) {
        this.rackUiList.forEach(rack => {
          const arr = rack.clusters.filter(item => {
            return item.clusterName === type
          })

          if (arr.length > 0) {
            this.filteredRackList.push(rack)
          }
        })
      } else {
        this.filteredRackList = filteredCenter
      }
    },

    async cancelEditMode () {
      const action = await this.$confirm(this.$v('랙실장도 편집을 취소하시겠습니까?'),
        {
          confirmButtonText: this.$v('확인'),
          cancelButtonText: this.$v('취소')
        }).catch(() => false)

      if (action === 'confirm') {
        this.rackMode = 'default'
      }
    },

    // 드래그 이벤트
    onDragEnter (e) {
      e.preventDefault()
      e.target.classList.add('-drag-over')
    },
    onDragLeave (e) {
      e.preventDefault()
      e.target.classList.remove('-drag-over')
    },
    onDragStart (e) {
      // console.log('dragStart', e)
      e.item.classList.add('-active')
    },
    /**
     * 드래그가 끝났을 때, 모든 .empty-zone 의 '-drag-over' 클래스를 제거합니다.
     * @param {event} e 드래그 끝났을 때, 커스텀 event
     * @param {Object} cluster 드래그 되는 영역의 클러스터 정보
     * @return 드래그 끝났을 때, 랙실장도 전체 데이터를 저장합니다.
     */
    onDragEnd (e, rack, cluster) {
      // console.log(e.from.closest('.rack-contents'), rack, cluster)
      e.item.classList.remove('-active')
      const emptyNodes = document.querySelectorAll('.empty-zone')

      emptyNodes.forEach(el => {
        el.classList.remove('-drag-over')
      })

      setTimeout(e => this.calcMaxHeight(), 100)
    },

    /**
     * 네트워크 장비 생성 팝업
     * @param {Object} rack 추가 할 랙
     */
    openedCreateNetwork (e, rack) {
      this.selectedElementIdx = rack.rackIdx
      this.updatedNetworkInfo = null
      this.networkCreateModal = true
    },
    /**
     * 네트워크 장비 모달 닫을 때 이벤트 - networkEquipCreator 컴포넌트의 initData()실행해서 모든 데이터를 초기화합니다.
     */
    closeModal () {
      this.$refs.networkEquipCreator.initData()
      this.updatedNetworkInfo = null
    },
    /**
     * 네트워크 장비 생성/수정 -> 확인시 발생 이벤트
     * @param {Object} payload 추가/수정하려는 네트워크 장비 정보
     */
    applySaveNetwork (payload) {
      if (!payload || !Object.keys(payload).length) return

      const item = this.rackUiList.filter(el => el.rackIdx === payload.elementIdx)

      const addCluster = item.length ? item[0] : undefined
      if (payload.isNew) { // 생성
        if (addCluster === undefined) throw new Error('cateIdx 확인')

        if (addCluster.clusters.length) addCluster.clusters.unshift(payload)
        else addCluster.clusters.push(payload)

        addCluster.clusters.forEach((bl, idx) => {
          bl.order = idx
          return bl
        })
      } else { // 수정
        addCluster.clusters = addCluster.clusters.map(el => {
          if (el.order === payload.order) el = payload
          return el
        })
      }

      this.networkCreateModal = false
      setTimeout(e => this.calcMaxHeight(), 100)
    },
    /**
     * 네트워크 장비 삭제
     * @param {Object} cluster 삭제하려는 object가 속한 cluster
     * @param {Object} item 삭제하려는 object
     * @param {Number} idx 삭제 item의 index
     */
    deleteNetworkItem (cluster, item, idx) {
      this.$confirm(this.$t('common.CONFIRM.NETWORK.004'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.$alert(this.$t('common.ALERT.BASE.017'))
        cluster.clusters.splice(idx, 1)
      }).catch(() => false)
    },
    editNetworkItem (rack, item, idx) {
      this.selectedElementIdx = rack.rackIdx
      this.updatedNetworkInfo = item
      this.networkCreateModal = true
    },

    /**
     * 랙실장도 데이터 저장
     * @param {Object} data 저장하려는 클러스터 통밥
     */
    async saveRackData (data) {
      const action = await this.$confirm(this.$v('저장하시겠습니까?'),
        {
          confirmButtonText: this.$v('저장'),
          cancelButtonText: this.$v('취소')
        }).catch(() => false)

      if (action === 'confirm') {
        try {
          this.saveLoading = true

          this.rackList = this.rackUiList.map((rack, i) => {
            const data = JSON.stringify(rack)
            const blocks = []
            for (const cluster of rack.clusters) {
              if (cluster.type === 'NODE') {
                cluster.blocks.forEach(block => {
                  blocks.push(block)
                })
              }
            }

            const blockList = blocks.map(item => {
              const hostList = item.hostList.map((host, idx) => {
                return {
                  ...host,
                  sequence: idx + 1
                }
              })
              return {
                clusterUuid: item.clusterUuid,
                maxCount: item.maxCount,
                rackBlockIdx: item.rackBlockIdx,
                rackBlockName: item.rackBlockName,
                rackBlockStartUnit: item.rackBlockStartUnit,
                rackBlockEndUnit: item.rackBlockEndUnit,
                sequence: item.rackBlockIdx,
                hostList: hostList
              }
            })
            return {
              cateIdx: rack.cateIdx,
              data: data,
              rackIdx: rack.rackIdx,
              rackName: rack.rackName,
              sequence: rack.rackIdx,
              blockList: blockList
            }
          })

          const response = await API.compute.saveRackData(this.rackList)
          if (response) this.getElementData()
          this.rackMode = 'default'
        } catch (error) {
          const message = (error.response && error.response.data) ? error.response.data.message : error.message
          this.$alert(message, '알림', {
            confirmButtonText: this.$t('common.BTN.confirm'),
            type: 'error'
          })
          this.saveLoading = false
          throw error
        } finally {
          this.saveLoading = false
        }
      }
    },
    /**
     * 클러스터 클릭시, 발생 이벤트: 클러스터 상세 정보를 보여줍니다. (구성관리 > 클러스터)
     * @param {Number} elementIdx 클릭한 클러스터의 elementIdx
     */
    clusterDetail (elementIdx) {
      this.selectedElementIdx = elementIdx
      this.$nextTick(function () {
        this.detail.cluster = true
      })
    },
    /**
     * 블럭(호스트) 클릭시, 발생 이벤트: 호스트 상세 정보를 보여줍니다. (구성관리 > 호스트)
     * @param {Number} hostUuid 클릭한 클러스터의 hostUuid
     */
    findHost (hostUuid) {
      this.selectedHostUuid = hostUuid
      this.$nextTick(function () {
        this.detail.host = true
      })
    }
  },
  data () {
    return {
      updatedNetworkInfo: null, // 업데이트 네트워크 장비 정보
      updatedRackInfo: null, // 업데이트 랙 정보

      clusterLoading: false, // 클러스터 목록 로딩
      saveLoading: false, // 클러스터 저장 로딩

      selectedDatacenter: null, // 선택한 데이터센터 : '김포IDC', '송도IDC'
      mainType: '', // 선택한 클러스터

      selectedElementIdx: null, // 클릭한 클러스터의 elementIdx
      selectedHostUuid: null, // 클릭한 호스트의 positionOrdinal
      allNetworkCategoryList: [], // 전체 네트워크 카테고리 목록
      networkCategoryLoad: false,

      servicedHostList: [],
      isEditBlockModal: false, // 블록 수정 상태
      vmwareRackList: [],
      networkCateList: [],
      selectedRack: null,
      selectedCluster: null,

      detail: {
        cluster: false, // 클러스터 상세 모달 active
        host: false // 호스트 상세 모달 active
      },
      networkCreateModal: false, // 네트워크 장비 모달 active
      isOpenedCreateRack: false, // 랙 추가 모달 active
      isOpenedCreateBlock: false, // 블록 추가 모달 active
      isCreateInCluster: false, // 블록 추가 (내부) active
      rackTabData: [],
      mainTypeOptions: [],

      updatedBlockInfo: [], // 해당 랙 블록 데이타
      selectedRackElement: null, // 선택 된 랙 엘리먼트

      rackLabels: [ // visual 가이드 라벨
        { label: '랙(Rack)', color: '#080A1F', borderColor: '#3D3C49', keyPath: 'config.RACK.rack' },
        { label: '클러스터(Cluster)', color: '#1D2E4D', borderColor: '#36476D', keyPath: 'config.RACK.cluster' },
        { label: '블럭(Block)', color: '#365283', borderColor: '#365283', keyPath: 'config.RACK.block' },
        { label: '서버(Server)', color: '#082049', borderColor: '#1D3968', keyPath: 'config.RACK.server' },
        { label: '네트워크(Network)', color: '#58265B', borderColor: '#7A477D', keyPath: 'config.RACK.network' }
      ],
      ctgDatas: [], // 네트워크 카테고리 전체 origin 데이터

      // 랙실장도 데이터
      rackList: [], // origin api data
      rackUiList: [], // ui data
      filteredRackList: [], // filtered ui data
      clusterList: [], // 등록 된 클러스터 데이터
      filteredClusterList: [], // 데이타 센터 기준 클러스터 데이터

      rackMode: 'default', // 기본 모드('default'), 편집 모드('edit')
      showSearchResult: false // node 추가 레이어 활설화 상태
    }
  }
}
</script>

<style lang="scss" scoped>
  .rack-lists {
    $equip: #461949;
    $host: #1D2E4D;
    .table-top-wrap{
      .button-area{
        display: none;
        margin-bottom: 40px;
      }
    }
    .filtering-component{
      margin-bottom: 40px;
    }

    .top-label {
      position: relative;
      .cluster-icon {
        display: inline-block;
        width: 15px;
        height: 14px;
        background-position: center;
        background-size: contain;
        background-repeat: no-repeat;
        background-image: url('../../../../assets/images/cluster-icon.png');
        & + .chart-label {
          margin-left: 0;
        }
        & + .chart-label .-bullet {
          display: none;
        }
      }
    }
    .button.-pdf-download {margin-right: $gap;}

    .rack-select {
      width: 300px;
      .el-input {
        > .el-input__inner {
          border: none;
          border-bottom: 1px solid #64676b;
        }
      }
    }
    .rack-contents-list {
      margin-top: 0;
      margin-left: -24px;
      display: flex;
      flex-wrap: wrap;

      // 클러스터 하나하나
      .rack-contents-wrap {
        position: relative;
        margin-left: 20px;
        margin-top: 40px;
        // &:nth-child(6n + 1) {
        //   margin-left: 0;
        // }
      }
      .rack-contents {
        padding: $gap $gap-s;
        width: 250px;
        height: auto;
        min-height: 500px;
        box-sizing: border-box;
        background: #080A1F;
        // background: $ticket-back-color;
        // box-shadow: 0px -8px $purple-gray;
        // filter: drop-shadow(0px -8px $purple-gray);
        border-radius: $radius-s;
        .cluster-name {
          overflow: hidden;
          display: block;
          line-height: 20px;
          text-align: center;
          font-size: 15px;
          font-weight: 700;
          white-space: nowrap;
          text-overflow: ellipsis;
          padding: 0 40px $gap;
          &:hover { color: $main-blue; }
        }
        .edit-area{
          display: none;
          position: absolute;
          top: 20px;
          right: 10px;
          // display: flex;
          align-items: center;
          .icon-edit{
            display: block;
            width: 20px;
            height: 20px;
            background: url('../../../../assets/images/icon-rack-edit.svg') no-repeat 50% 50%;
            background-size: 20px 20px;
          }
          .icon-delete{
            display: block;
            margin-left: 5px;
            width: 20px;
            height: 20px;
            background: url('../../../../assets/images/icon-rack-delete.svg') no-repeat 50% 50%;
            background-size: 20px 20px;
          }
        }
        .cluster-body {
          overflow-y: auto;
          // min-height: 235px;
          // padding: 0;
          &::-webkit-scrollbar { width: 6px; }

          /* Track, Handle, Hover */
          &::-webkit-scrollbar-track { width: 6px; }
          &::-webkit-scrollbar-thumb,
          &::-webkit-scrollbar-thumb:hover { width: 6px; }
        }

        .detail-section {
          .resource-item {
            &.-active {
              > .rack-draggable-item {
                color: $color-black;
                background-color: #fff !important;
                border-color: #fff !important;
              }
            }
            & + .resource-item {margin-top: $gap;}
            .ellipsis-wrap {
              display: inline-block;
              white-space: nowrap;
              text-overflow: ellipsis;
              overflow: hidden;
              max-width: 105px;
            }
          }
          .empty-zone {
            margin-top: 0;
          }
        }

        .add-area{
          display: none;
          position: relative;
          margin-top: $gap;
          // padding: $gap 0 $gap-s;
          text-align: center;
          .add-icon{
            width: 25px;
            height: 25px;
            border-radius: 13px;
            background: $white url('../../../../assets/images/icon-rack-add-b.svg') no-repeat 50% 50%;
          }
          .card-area{
            visibility: hidden;
            position: absolute;
            top: 37px;
            padding: $gap-s;
            border-radius: 5px;
            background-color: $white;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 10;
            &::before{
              content: '';
              position: absolute;
              top: -5px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-bottom: 10px solid $white;
              border-left: 10px solid transparent;
              border-right: 10px solid transparent;
            }
            &.on{
              visibility: visible;
              opacity: 1;
            }
            .button{
              width: 100%;
              border: 0;
              .icon-add{
                display: inline-block;
                vertical-align: middle;
                width: 15px;
                height: 15px;
                background: url('../../../../assets/images/icon-rack-add-w.svg') no-repeat 50% 50%;
                background-size: 15px 15px;
              }
              span{
                display: inline-block;
                vertical-align: middle;
              }
              & + .button{
                margin-top: 5px;
              }
              &.network{
                background-color: #58265B;
                &:hover {background-color: darken(#58265B, 5%);}
              }
              &.block{
                background-color: #365283;
                &:hover {background-color: darken(#365283, 5%);}
              }
            }
          }
        }

      }
    }
    .rack-detail-modal {
       .cmp-grid-wrapper {
        overflow: auto;
        max-width: 100%;
        min-height: 100px;
        #cmpGrid {
          width: 1600px;
        }
      }
    }
    .buttons-footer{
      display: none;
      padding-top: 60px;
      text-align: center;
      .button{
        // height: 42px;
        & + .button {
          margin-left: 10px;
        }
      }
    }

    &.mode-edit{
      .table-top-wrap .button-area{
        display: block;
      }
      .edit-area{
        display: flex !important;
      }
      .add-area{
        display: block !important;
      }
      .buttons-footer{
        display: block;
      }
    }
  }
</style>
