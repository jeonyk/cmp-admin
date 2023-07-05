<!--
  * 파일명 : ConfigNetworkCategory.vue
  * 파일 기능 :
  * 작성자 : 염창윤 외 3명
  * 최종 작성일 : 2021-02-03
  * License By Shinsegae I&C
  * 2021-02-03 Wijmo Grid 엑셀 다운로드 추가
 -->

<template>
  <div
    class="network-category"
    v-loading="isGetNetworkCategory"
  >
    <!-- <total-count :total-count="totalCnt" /> -->

    <div class="network-category-body">
      <dashboard-panel
        class="body-panel -left"
        title="카테고리"
        :padding-top="0"
      >
        <template #header>
          <button
            class="button"
            @click="manageCategoryModal = true"
          >
            카테고리 관리
          </button>
        </template>
        <div class="side-tree-area">
          <g-tree
            :data="copiedTreeData"
            class="project-tree"
            @selected="selectTreeItem"
            :view-line="true"
            :selectable-all-item="false"
          >
            <!-- :select-object.sync="selectedNetworkCategory" -->
            <template #title="{node}">
              {{ node.cateName }}
            </template>
          </g-tree>
        </div>
      </dashboard-panel>
      <!-- 카테고리 트리 -->

      <dashboard-panel
        class="body-panel -right"
        :title="selectedNetworkCategory ? `${selectedNetworkCategory.cateKey} 네트워크 정보` : '네트워크 정보'"
      >
        <template v-if="!selectedNetworkCategory">
          <div class="empty-zone">
            카테고리를 선택하세요.
          </div>
        </template>
        <template v-else>
          <section class="network-contents">
            <div class="button-area -right">
              <button
                class="button"
                type="is-primary"
                @click.stop="addElement"
              >
                등록
              </button>
              <button
                class="button"
                type="is-anti"
                @click.stop="removeElement"
              >
                삭제
              </button>
            </div>
            <section class="table-area">
              <h5 class="product-title">
                Element
              </h5>
              <cmp-grid
                v-loading="isGetVmRequest"
                :element-loading-text="$t('common.PLACEHOLDER.loading')"
                :loading="isGetVmRequest"
                :item-source="resourceInfo[0].tableData"
                :columns="elementColumnData"
                :init-custom-action="initElementGrid"
                selectable
                @selectedRow="rowSelect(...arguments, 'element')"
              >
                <template
                  v-for="column in resourceInfo[0].columnData"
                  :slot="column.binding"
                  slot-scope="props"
                >
                  <div :key="column.binding">
                    <span>{{ props.row[column.binding] }}</span>
                  </div>
                </template>

                <template #state="props">
                  <div style="text-align: center;">
                    <span :class="['state-icon', props.row.state]" />
                  </div>
                </template>
                <!-- 상태 -->

                <template #connectSuccessTime="props">
                  <span>{{ props.row.connectSuccessTime | date }}</span>
                </template>
              <!-- 마지막 동기 시간 -->
              </cmp-grid>
            </section>
          </section>
          <!-- Element -->

          <section class="network-contents">
            <div class="button-area -right">
              <button
                class="button"
                type="is-primary"
                @click.stop="modSubnet('add')"
              >
                등록
              </button>
              <!-- <button
                class="button"
                @click="updateVlanModal = true"
              >
                변경
              </button> -->
              <button
                class="button"
                type="is-anti"
                @click.stop="modSubnet('remove')"
              >
                삭제
              </button>
            </div>
            <section
              class="table-area"
            >
              <h5 class="sub-title">
                Vlan
              </h5>
              <cmp-grid
                :item-source="elementSubnetRegiList"
                :columns="resourceInfo[1].columnData"
                :init-custom-action="initVlanGrid"
                selectable
                is-read-only
              >
                <!-- @selectedRow="rowSelect(...arguments, 'vlan')" -->
                <template
                  v-for="column in resourceInfo[1].columnData"
                  :slot="column.binding"
                  slot-scope="props"
                >
                  <div :key="column.binding">
                    <span>{{ props.row[column.binding] }}</span>
                  </div>
                </template>

                <template #subnetPools="props">
                  <span v-if="props.row.subnetPools">
                    <div
                      v-for="(pool,idx) in props.row.subnetPools"
                      :key="idx"
                    >
                      {{ pool.startAddress }} - {{ pool.endAddress }}
                    </div>
                  </span>
                </template>
                <template #updateTime="props">
                  {{ props.row.updateTime|date }}
                </template>

                <!-- 상태 -->

                <template #time="props">
                  <span>{{ props.row.time | date }}</span>
                </template>
              <!-- 마지막 동기 시간 -->
              </cmp-grid>
            </section>
          </section>
        </template>
      </dashboard-panel>
    </div>

    <!-- 모달 -->
    <manage-category-modal
      :active.sync="manageCategoryModal"
      @close="closeManageCategoryModal"
      :data="copiedTreeData"
    />
    <!-- Element 등록 모달 -->
    <el-dialog
      :title="'Element ' +(modalType==='remove'?'삭제':'등록')"
      :visible.sync="registElModal"
      class="detail-modal"
      width="70%"
      @close="registElModal = false"
      top="10vh"
    >
      <section
        class="modal-body"
      >
        <!-- <wj-flex-grid-search
          id="theSearch"
          placeholder="Text..."
        /> -->
        <div class="table-area">
          <cmp-grid
            v-loading="isGetVmRequest"
            :element-loading-text="$t('common.PLACEHOLDER.loading')"
            :loading="isGetVmRequest"
            :item-source="registerTargetElementList"
            :columns="elementModalColumnData"
            :init-custom-action="initElementModalGrid"
            header-checkbox
            grid-id="modalElementGrid"
          >
            <template
              v-for="column in resourceInfo[0].columnData"
              :slot="column.binding"
              slot-scope="props"
            >
              <div :key="column.binding">
                <span>{{ props.row[column.binding] }}</span>
              </div>
            </template>

            <template #state="props">
              <div style="text-align: center;">
                <span :class="['state-icon', props.row.state]" />
              </div>
            </template>
            <!-- 상태 -->

            <template #connectSuccessTime="props">
              <span>{{ props.row.connectSuccessTime | date }}</span>
            </template>
          </cmp-grid>
          <!-- searching -->
        </div>
      </section>

      <div class="modal-footer modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="registElModal = false"
        >
          취소
        </button>
        <button
          v-loading="isRegiterNetworkCategory"
          class="button -modal-button"
          type="is-primary"
          @click="registerElement(modalType==='remove')"
        >
          {{ modalType==='remove'?'삭제':'등록' }}
        </button>
      </div>
    </el-dialog>

    <!-- Vlan 변경 모달 -->
    <el-dialog
      :title="'Vlan ' +(modalType==='remove'?'삭제':'등록')"
      :visible.sync="updateVlanModal"
      class="detail-modal"
      width="70%"
      @close="updateVlanModal = false"
      top="10vh"
    >
      <section
        class="modal-body"
      >
        <div class="table-area">
          <cmp-grid
            v-loading="isGetVmRequest"
            :element-loading-text="$t('common.PLACEHOLDER.loading')"
            :loading="isGetVmRequest"
            :item-source="(modalType==='remove'?subnetRegiList:subnetUnregiList)"
            :columns="subnetColumnData"
            :init-custom-action="initVlanModalGrid"
            header-checkbox
            grid-id="modalSubnetGrid"
          >
            <template
              v-for="column in subnetColumnData"
              :slot="column.binding"
              slot-scope="props"
            >
              <div :key="column.binding">
                <span>{{ props.row[column.binding] }}</span>
              </div>
            </template>
            <template #updateTime="props">
              {{ props.row.updateTime|date }}
            </template>
            <template #subnetPools="props">
              <span v-if="props.row.subnetPools">
                <div
                  v-for="(pool,idx) in props.row.subnetPools"
                  :key="idx"
                >
                  {{ pool.startAddress }} - {{ pool.endAddress }}
                </div>
              </span>
            </template>
            <!-- 상태 -->

            <template #connectSuccessTime="props">
              <span>{{ props.row.connectSuccessTime | date }}</span>
            </template>
          </cmp-grid>
        </div>
        <!-- 운영 여부 -->
      </section>

      <div class="modal-footer modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="updateVlanModal = false"
        >
          취소
        </button>
        <button
          class="button -modal-button"
          type="is-primary"
          @click="registerSubnet(modalType==='remove')"
        >
          {{ modalType==='remove'?'삭제':'등록' }}
        </button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import API, { GTree, DashboardPanel } from '@sd-fe/cmp-core'
import ManageCategoryModal from '@/components/Modal/ManageCategoryModal/ManageCategoryModal'

export default {
  name: 'ConfigNetworkCategory',
  components: {
    'dashboard-panel': DashboardPanel,
    'g-tree': GTree,
    'manage-category-modal': ManageCategoryModal

  },
  watch: {
    treeData (newVal) {
      this.setTreeData(newVal)
    }
  },
  created () {
    this.initPage()
  },
  methods: {
    setTreeData (treeData) {
      this.copiedTreeData = JSON.parse(JSON.stringify(treeData))
      this.copiedTreeData = this.copiedTreeData.map(treeItm => {
        return {
          ...treeItm,
          edit: false,
          selected: false
        }
      })
    },
    settingSubnets (data) {
      const subnets = { regi: [], unregi: [] }
      // this.subnetRegiList = []
      // this.subnetUnregiList = []
      // let check = true
      let num = null
      for (let i = 0; i < data.length; i++) {
        // check = true
        for (let j = 0; j < data[i].subnets.length; j++) {
          data[i].subnets[j].elementName = data[i].elementName
          data[i].subnets[j].elementIdx = data[i].elementIdx
          if (data[i].subnets[j].networkCategories) {
            num = data[i].subnets[j].networkCategories.find(idx => idx.cateIdx === this.selectedNetworkCategory.cateIdx)
            if (num) {
              subnets.regi.push(data[i].subnets[j])
              // break
            } else {
              subnets.unregi.push(data[i].subnets[j])
            }
          } else {
            subnets.unregi.push(data[i].subnets[j])
          }
        }
      }
      return subnets
    },
    closeManageCategoryModal () {
      this.manageCategoryModal = false
      this.getNetworkCategoryTree()
    },
    async getElementList  (params) {
      try {
        this.isGetVmRequest = true
        // this.tableData = []
        let data = []

        data = await API.compute.getElementList(params)

        // this.tableData = data
        return data
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.resourceInfo[0].tableData = []
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
      } finally {
        this.isGetVmRequest = false
      }
    },
    async regiterNetworkCategory  (params) {
      try {
        this.isRegiterNetworkCategory = true
        // this.tableData = []
        let data = []

        data = await API.compute.regiterNetworkCategory(params)

        // this.tableData = data
        return data
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.resourceInfo[0].tableData = []
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
      } finally {
        this.isRegiterNetworkCategory = false
      }
    },
    async addElement () {
      this.modalType = 'add'
      this.registElModal = true

      const data = await this.getElementList()
      const res = []
      let check = true
      for (let j = 0; j < data.length; j++) {
        check = true
        for (let i = 0; i < this.resourceInfo[0].tableData.length; i++) {
          if (data[j].elementIdx === this.resourceInfo[0].tableData[i].elementIdx) {
            check = false
            break
          }
        }
        if (check) {
          res.push(data[j])
        }
      }
      this.registerTargetElementList = res
    },
    async removeElement () {
      this.modalType = 'remove'
      this.registElModal = true

      this.registerTargetElementList = await this.getElementList({ cateIdx: this.selectedNetworkCategory.cateIdx })
    },
    async modSubnet (type) {
      this.modalType = type

      const element = await this.getElementList({ cateIdx: this.selectedNetworkCategory.cateIdx })
      const subnet = this.settingSubnets(element)
      this.subnetRegiList = subnet.regi
      this.subnetUnregiList = subnet.unregi
      this.updateVlanModal = true
    },
    async registerElement (isDeleted) {
      const registerList = []

      let message = ''
      for (let i = 0; i < this.registerTargetElementList.length; i++) {
        if (this.registerTargetElementList[i].checked) {
          message += this.registerTargetElementList[i].elementName + ','
          registerList.push({
            cateIdx: this.selectedNetworkCategory.cateIdx,
            elementIdx: this.registerTargetElementList[i].elementIdx,
            elementName: this.registerTargetElementList[i].elementName,
            isDeleted: isDeleted
          })
        }
      }
      if (message) { message = message.slice(0, -1) }
      if (registerList.length === 0) {
        // this.$alert('선택 된 Element가 없습니다.', '알림', {
        //   confirmButtonText: this.$t('common.BTN.confirm'),
        //   type: 'info'
        // })
        this.$alert(this.$t('common.ALERT.NUTA.002'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'info'
        })
      } else {
        message += ' Element를 ' + this.selectedNetworkCategory.cateKey
        if (isDeleted) {
          message += '에서 삭제 하시겠습니까?'
        } else {
          message += '에 등록 하시겠습니까?'
        }
        this.$confirm(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel')
        }).then(async () => {
          try {
            const res = await this.regiterNetworkCategory(registerList)
            let resMssage = ''
            for (let i = 0; i < res.length; i++) {
              for (let j = 0; j < registerList.length; j++) {
                if (res[i].elementIdx === registerList[j].elementIdx) {
                  resMssage += registerList[j].elementName + ' : ' + (res[i].isSuccess ? 'Success' : 'Fail') + '<br>'
                }
              }
            }
            this.$alert(resMssage, '알림', {
              confirmButtonText: this.$t('common.BTN.confirm'),
              type: 'info',
              dangerouslyUseHTMLString: true
            })
            this.selectTreeItem(this.selectedNetworkCategory)
            this.registElModal = false
            this.registerTargetElementList = []
          } catch (error) {
            this.$alert(this.$t('common.ALERT.BASE.020'), '알림', {
              confirmButtonText: this.$t('common.BTN.confirm'),
              type: 'error'
            })
          }
        }).catch((error) => {
          console.error(error)
        })
      }
    },
    async registerSubnet (isDeleted) {
      const registerList = []

      let message = ''
      if (isDeleted) {
        for (let i = 0; i < this.subnetRegiList.length; i++) {
          if (this.subnetRegiList[i].checked) {
            message += this.subnetRegiList[i].subnetName + ','
            registerList.push({
              cateIdx: this.selectedNetworkCategory.cateIdx,
              elementIdx: this.subnetRegiList[i].elementIdx,
              subnets: [{
                isDeleted: isDeleted,
                subnetUuid: this.subnetRegiList[i].subnetUuid,
                subnetName: this.subnetRegiList[i].subnetName
              }]
            })
          }
        }
      } else {
        for (let i = 0; i < this.subnetUnregiList.length; i++) {
          if (this.subnetUnregiList[i].checked) {
            message += this.subnetUnregiList[i].subnetName + ','
            registerList.push({
              cateIdx: this.selectedNetworkCategory.cateIdx,
              elementIdx: this.subnetUnregiList[i].elementIdx,
              subnets: [{ isDeleted: isDeleted, subnetUuid: this.subnetUnregiList[i].subnetUuid, subnetName: this.subnetUnregiList[i].subnetName }]
            })
          }
        }
      }

      if (message) { message = message.slice(0, -1) }
      if (registerList.length === 0) {
        this.$alert(this.$t('common.ALERT.NUTA.003'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'info'
        })
      } else {
        message += ' Subnet을 ' + this.selectedNetworkCategory.cateKey
        if (isDeleted) {
          message += '에서 삭제 하시겠습니까?'
        } else {
          message += '에 등록 하시겠습니까?'
        }
        this.$confirm(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel')
        }).then(async () => {
          try {
            const res = await this.regiterNetworkCategory(registerList)
            let resMssage = ''
            for (let i = 0; i < res.length; i++) {
              for (let j = 0; j < registerList.length; j++) {
                for (let k = 0; k < res[i].subnets.length; k++) {
                  for (let q = 0; q < registerList[j].subnets.length; q++) {
                    if (res[i].subnets[k].subnetUuid === registerList[j].subnets[q].subnetUuid) {
                      resMssage += registerList[j].subnets[q].subnetName + ' : ' + (res[i].isSuccess ? 'Success' : 'Fail') + '<br>'
                      break
                    }
                  }
                }
              }
            }
            this.$alert(resMssage, '알림', {
              confirmButtonText: this.$t('common.BTN.confirm'),
              type: 'info',
              dangerouslyUseHTMLString: true
            })
            this.selectTreeItem(this.selectedNetworkCategory)
            this.updateVlanModal = false
            // this.registerTargetElementList = []
          } catch (error) {
            this.$alert(this.$t('common.ALERT.BASE.020'), '알림', {
              confirmButtonText: this.$t('common.BTN.confirm'),
              type: 'error'
            })
          }
        }).catch((error) => {
          console.error(error)
        })
      }
    },
    async initPage () {
      await this.getNetworkCategoryTree()
    },
    async getNetworkCategoryTree () {
      try {
        this.isGetNetworkCategory = true
        this.treeData = await API.config.getConfigNetworkCategory()
        this.setTreeData(this.treeData)
        this.isGetNetworkCategory = false
      } catch (error) {
        console.error(error)
        this.isGetNetworkCategory = false
      }
    },
    settingElementSubnetRegiList (data) {
      this.elementSubnetRegiList = []
      if (data) {
        for (let i = 0; i < data.length; i++) {
          if (!this.selectedRow.element || this.selectedRow.element.elementIdx === data[i].elementIdx) {
            this.elementSubnetRegiList.push(data[i])
          }
        }
      }
    },
    rowSelect (selected, field) {
      // if (field === 'element') {
      if (selected) {
        this.selectedRow.element = selected.dataItem
        this.selectedRow.vlan = selected.dataItem.subnets
      } else {
        this.selectedRow.element = null
        this.selectedRow.vlan = null

        // JSON.parse(JSON.stringify(this.subnetRegiList))
      }
      this.settingElementSubnetRegiList(this.resourceInfo[1].tableData)

      // } else {

      // }
    },
    initElementGrid (grid) {
      this.elementGrid = grid
    },
    initElementModalGrid (grid) {
      this.elementModalGrid = grid
    },
    initVlanGrid (grid) {
      this.vlanGrid = grid
    },
    initVlanModalGrid (grid) {
      this.vlanModalGrid = grid
    },
    routeTo (to) {
      this.$router.push(to)
    },
    async selectTreeItem (param) {
      if (param.cateUpper === 0 || param.cateUpper === 1) return

      this.selectedNetworkCategory = param

      this.resourceInfo[1].tableData = []
      // this.resourceInfo[0].tableData = []
      this.resourceInfo[0].tableData = await this.getElementList({ cateIdx: param.cateIdx })
      const subnet = this.settingSubnets(this.resourceInfo[0].tableData)
      this.resourceInfo[1].tableData = subnet.regi
      this.settingElementSubnetRegiList(this.resourceInfo[1].tableData)
    }

  },
  data () {
    return {
      isGetNetworkCategory: false,
      elementSubnetRegiList: [],
      subnetRegiList: [],
      subnetUnregiList: [],
      modalType: null,
      isRegiterNetworkCategory: false,
      isGetVmRequest: false,
      registElementModal: false,
      manageCategoryModal: false,
      registElModal: false,
      updateVlanModal: false,
      copiedTreeData: [],
      treeData: [],
      selectedNetworkCategory: undefined,
      registerTargetElementList: [],
      subnetColumnData: [
        { header: 'VLAN ID', binding: 'vlanId', width: 80 },
        { header: '이름', binding: 'subnetName', width: '*', customHtml: true },
        { header: 'Element 명', binding: 'elementName', width: 200, customHtml: true },
        { header: 'IP 대역', binding: 'subnetPools', width: '*', customHtml: true },

        { header: '마지막 동기 시간', binding: 'updateTime', width: '*', customHtml: true, dataType: 'Date' }
      ],
      elementColumnData: [
        { header: 'idx', binding: 'elementIdx', width: 80 },
        { header: 'Element명', binding: 'elementName', width: '*' },
        { header: '클러스터명', binding: 'clusterName', width: '*' },
        // { header: '상태', binding: 'state', width: '*', customHtml: true },
        { header: '마지막 동기 시간', binding: 'connectSuccessTime', width: '*', customHtml: true, dataType: 'Date' }
      ],
      elementModalColumnData: [
        { header: 'idx', binding: 'elementIdx', width: 80 },
        { header: 'Element명', binding: 'elementName', width: '*' },
        { header: '클러스터명', binding: 'clusterName', width: '*' },
        // { header: '상태', binding: 'state', width: '*', customHtml: true },
        { header: '마지막 동기 시간', binding: 'connectSuccessTime', width: '*', customHtml: true, dataType: 'Date' }
      ],
      // 테이블 정보
      resourceInfo: [
        {
          field: 'element',
          label: 'Element',
          columnData: [
            { header: 'idx', binding: 'elementIdx', width: 80 },
            { header: 'Element명', binding: 'elementName', width: '*' },
            { header: '클러스터명', binding: 'clusterName', width: '*' },
            // { header: '상태', binding: 'state', width: '*', customHtml: true },
            { header: '마지막 동기 시간', binding: 'connectSuccessTime', width: '*', customHtml: true, dataType: 'Date' }
          ],
          tableData: []
        },
        {
          field: 'vlan',
          label: 'Vlan',
          columnData: [
            { header: 'VLAN ID', binding: 'vlanId', width: 80 },
            { header: '이름', binding: 'subnetName', width: '*', customHtml: true },
            { header: 'Element 명', binding: 'elementName', width: 200, customHtml: true },
            { header: 'IP 대역', binding: 'subnetPools', width: '*', customHtml: true },

            { header: '마지막 동기 시간', binding: 'updateTime', width: '*', customHtml: true, dataType: 'Date' }
          ],
          tableData: []
        }
      ],

      // 테이블 수정 정보
      stateOptions: [
        { value: 'success', label: '운영중 / 정상' },
        { value: 'error', label: '운영중 / 문제 발생' },
        { value: undefined, label: '운영 안함' }
      ],

      editStatus: {
        element: false,
        vlan: false
      },
      selectedRow: {
        element: undefined, // 선택한 Element
        vlan: undefined
      },

      vlanUpdateItem: {
        vlanId: '',
        name: '',
        desc: '',
        ip: '',
        isManage: undefined
      }
    }
  }
}
</script>
<style lang="scss">
  .network-category {
    &-body {
      display: flex;
      align-items: stretch;
      margin-top: $gap-m;
      > .body-panel {
        // &.-left {
        //   flex: 1 1 auto;
        //   width: 300px;
        // }

        &.-right {
          flex: 5 1 auto;
          margin-left: $gap * 2;
          min-width: calc(100% - 480px);

          .network-contents {
            position: relative;
            > .button-area {
              position: absolute;
              top: -10px;
              right: 0;
              z-index: 1;
            }
            & + .network-contents {
              margin-top: 60px;
            }

          }

          .table-area {
            .wj-cell {
              overflow: visible;
              // justify-content: flex-start;
              padding: 0 $gap * 2;
              cursor: pointer;
            }
          }
        }
      }
    }

    // 모달
    .detail-modal {
      .modal-body {
        overflow-y: auto;
        max-height: 60vh;
      }
    }
  }
</style>
