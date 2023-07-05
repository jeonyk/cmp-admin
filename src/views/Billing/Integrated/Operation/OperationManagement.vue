<template>
  <div
    v-loading="isLoadingOperation"
    class="operation"
  >
    <div class="operation-grid">
      <div class="operation-grid-filter">
        <button
          class="button"
          type="is-primary"
          @click="isManageOperUnitModal = true"
        >
          운영그룹 단위 설정
        </button>
        <!-- <div class="operation-grid-filter__radio">
          <span class="label">Compute 운영그룹 단위 설정</span>
          <el-radio-group
            v-model="computeManagementUnit"
            @change="onChangeRadio"
            :disabled="isLoadingOperation"
          >
            <el-radio label="CLUSTER">
              클러스터
            </el-radio>
            <el-radio label="NODE">
              노드
            </el-radio>
          </el-radio-group>
        </div> -->
        <div class="operation-grid-filter__action">
          <button
            class="button"
            type="is-primary"
            @click="onClickAdd"
          >
            {{ $v("추가") }}
          </button>
          <button
            class="button"
            type="is-black"
            :disabled="!checkedRow || checkedRow.length !== 1"
            @click="onClickChange"
          >
            {{ $v("변경") }}
          </button>
          <button
            class="button"
            type="is-anti"
            @click="onClickDelete"
            :disabled="!checkedRow || !checkedRow.length"
          >
            {{ $v("삭제") }}
          </button>
        </div>
      </div>
      <div class="operation-grid-main">
        <cmp-grid
          use-checkbox
          header-checkbox
          @checkedRowsData="onCheckGridItem"
          :changing-page-reset="false"
          :columns="gridColumns"
          :item-source="gridData"
        >
          <template #moduleType="{ row }">
            {{ row.moduleType | printModuleType }}
          </template>
          <template #clusterNodeList="{ row }">
            <span v-if="row.clusterNodeList.length === 1">
              {{ row.clusterNodeList[0].clusterNodeId }}
            </span>
            <el-tooltip
              v-else-if="row.clusterNodeList.length > 1"
              effect="light"
            >
              <span>
                {{ row.clusterNodeList[0].clusterNodeId }} 외 {{ row.clusterNodeList.length - 1 }}
              </span>
              <div slot="content">
                <div
                  v-for="clusterNode in row.clusterNodeList"
                  :key="clusterNode.clusterNodeId"
                >
                  {{ clusterNode.clusterNodeId }}
                </div>
              </div>
            </el-tooltip>
          </template>
          <template #isBilling="{ row }">
            {{ row.isBilling ? 'O': 'X' }}
          </template>
          <template #isShow="{ row }">
            {{ row.isShow ? 'O' : 'X' }}
          </template>
        </cmp-grid>
      </div>
    </div>
    <el-dialog
      width="650px"
      :visible.sync="isActiveEditModal"
      :title="modalTitle"
    >
      <div class="edit-modal">
        <register-contents
          title="CSP 타입"
          required
        >
          <el-radio-group
            :disabled="editMode === 'change'"
            v-model="form.moduleType"
          >
            <el-radio label="NX">
              Nutanix
            </el-radio>
            <el-radio label="VMWARE">
              VMware
            </el-radio>
          </el-radio-group>
        </register-contents>
        <register-contents
          title="운영그룹 타입"
          required
        >
          <el-radio-group v-model="form.managementType">
            <el-radio label="COMPUTE">
              Compute
            </el-radio>
            <el-radio label="STORAGE">
              Storage
            </el-radio>
          </el-radio-group>
        </register-contents>
        <register-contents
          title="운영그룹 이름"
          required
        >
          <el-input
            v-model="form.managementName"
            placeholder="운영그룹 이름을 입력해주세요."
          />
        </register-contents>
        <register-contents
          :title="formManagementType === 'CLUSTER' ? '클러스터' : '노드'"
          required
        >
          <!-- <el-select v-model="form.selectedClusterOrNode">
            <el-option
              v-for="opt in displayClusterOrNode"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select> -->
          <!-- <searchable-select
            v-model="form.selectedClusterOrNode"
            :options="displayClusterOrNode"
            disabled-change-text
            placeholder="선택"
            @change="onChangeSelectClusterNode"
          /> -->
          <button
            class="button"
            type="is-primary"
            @click="onClickSelectDetail"
          >
            {{ formManagementType === 'CLUSTER' ? '클러스터 선택' : '노드 선택' }}
          </button>
          <div
            v-if="checkedItem.length"
            class="selected-items"
          >
            <clearable-tag
              v-for="item in checkedItem"
              :key="item.value"
              :content="item.label"
              :unique-key="item.value"
              @clear="onDeleteItemInChecked"
            />
          </div>
        </register-contents>
        <register-contents title="빌링 여부">
          <el-checkbox v-model="form.isBilling" />
        </register-contents>
        <register-contents title="사용자 노출 여부">
          <el-checkbox v-model="form.isShow" />
        </register-contents>
      </div>
      <section class="modal-button-area">
        <button
          class="button"
          type="is-anti"
          @click="isActiveEditModal = false"
        >
          {{ $v("취소") }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="onClickSaveManagement"
        >
          {{ $v("저장") }}
        </button>
      </section>
    </el-dialog>
    <!-- 운영그룹 관리 생성/편집 -->
    <el-dialog
      :title="formManagementType === 'CLUSTER' ? '클러스터 선택' : '노드 선택'"
      :visible.sync="isActiveSelectDetailModal"
    >
      <div class="select-detail">
        <div class="select-detail-header">
          <search-component :placeholder="$v('검색어를 입력하세요.')" />
        </div>
        <div class="select-detail-grid">
          <cmp-grid
            use-checkbox
            :header-checkbox="false"
            :columns="selectDetailGrid[formManagementType]"
            :item-source="displayClusterOrNode"
            empty-text="선택 가능한 데이터가 없습니다."
            @checkedRowsData="onCheckSelectDetail"
          />
        </div>
      </div>
      <section class="modal-button-area">
        <button
          class="button"
          type="is-anti"
          @click="onClickCancelSelectDetail"
        >
          취소
        </button>
        <button
          class="button"
          type="is-primary"
          @click="onClickSaveSelectDetail"
        >
          완료
        </button>
      </section>
    </el-dialog>
    <!-- 클러스터/노드 선택 -->
    <el-dialog
      :visible.sync="isManageOperUnitModal"
      :title="$v('운영그룹 단위 설정')"
      width="400px"
    >
      <div class="setting">
        <div
          v-for="setting in userOperationSettings"
          :key="`${setting.moduleType}-${setting.operatingGroupType}`"
          class="setting-row"
        >
          <span class="setting-row-label">
            {{ getSettingLabel(setting) }}
          </span>
          <el-radio-group v-model="setting.clusterNodeType">
            <el-radio label="CLUSTER">
              클러스터
            </el-radio>
            <el-radio label="NODE">
              노드
            </el-radio>
          </el-radio-group>
        </div>
      </div>
      <section class="modal-button-area">
        <button
          class="button"
          type="is-anti"
          @click="onClickCancelSettings"
        >
          {{ $v('취소') }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="onSaveSettings"
        >
          {{ $v('저장') }}
        </button>
      </section>
    </el-dialog>
    <!-- 운영그룹 단위 설정 -->
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import { mapGetters } from 'vuex'
import { flatten } from 'lodash'

export default {
  name: 'OperationManagement',
  filters: {
    printModuleType (value) {
      if (!value) return ''
      return {
        NX: 'Nutanix',
        VMWARE: 'VMware'
      }[value]
    }
  },
  computed: {
    ...mapGetters({
      moduleType: 'cloud/getModuleType'
    }),
    checkedItem () {
      return this.formManagementType === 'CLUSTER'
        ? this.checkedCluster
        : this.checkedNode
    },
    modalTitle () {
      return this.editMode === 'new'
        ? this.$v('운영그룹 추가')
        : this.$v('운영그룹 변경')
    },
    displayClusterOrNodeNoFilter () {
      if (!this.isActiveEditModal) return []
      return this.formManagementType === 'CLUSTER'
        ? this.clusterOptionsNoFilter
        : this.nodeOptionsNoFilter
    },
    clusterOptionsNoFilter () {
      if (this.form.moduleType === 'NX') {
        return this.clusters[this.form.moduleType]
          .map(cluster => ({
            label: cluster.clusterName,
            name: cluster.clusterName,
            value: cluster.clusterUuid,
            checked: false
          }))
      } else {
        return this.clusters[this.form.moduleType]
          .map(cluster => ({
            label: cluster.name,
            name: cluster.name,
            value: cluster.clusterId,
            checked: false
          }))
      }
    },
    nodeOptionsNoFilter () {
      if (this.form.moduleType === 'NX') {
        return this.nodes[this.form.moduleType]
          .map(node => ({
            label: node.nodeName,
            name: node.nodeName,
            value: node.hostUuid,
            clusterName: node.clusterName,
            clusterUuid: node.clusterUuid,
            checked: false
          }))
      } else {
        return this.nodes[this.form.moduleType]
          .map(node => ({
            label: node.name,
            name: node.name,
            value: node.hostUuid,
            clusterName: node.cluster.name,
            clusterUuid: node.cluster.clusterId,
            checked: false
          }))
      }
    },
    displayClusterOrNode () {
      return this.formManagementType === 'CLUSTER'
        ? this.clusterOptions
        : this.nodeOptions
    },
    clusterOptions () {
      // 클러스터 중복 선택 가능
      // const filterFromList = (cluster) => {
      //   const sameClusterType = this.gridData
      //     .filter(grid => grid.operatingGroupType === this.form.managementType)
      //     .map(grid => grid.clusterNodeList.map(r => r.clusterNodeId))
      //   if (this.editMode === 'new') {
      //     return !flatten(sameClusterType).includes(cluster.value)
      //   } else if (this.editMode === 'change' && this.chcekedRow && this.checkedRow[0]) {
      //     const checkedRow = this.checkedRow[0]
      //     const clusterNodeListIds = checkedRow.clusterNodeList.map(cn => cn.clusterNodeId)
      //     if (clusterNodeListIds.includes(cluster.value)) return true
      //     return !flatten(sameClusterType).includes(cluster.value)
      //   }
      // }

      if (this.form.moduleType === 'NX') {
        return this.clusters[this.form.moduleType]
          .map(cluster => ({
            label: cluster.clusterName,
            name: cluster.clusterName,
            value: cluster.clusterUuid,
            checked: false
          }))
          .filter(
            cluster =>
              !this.checkedCluster.map(c => c.value).includes(cluster.value)
          )
          // .filter(filterFromList)
      } else {
        return this.clusters[this.form.moduleType]
          .map(cluster => ({
            label: cluster.name,
            name: cluster.name,
            value: cluster.clusterId,
            checked: false
          }))
          .filter(
            cluster =>
              !this.checkedCluster.map(c => c.value).includes(cluster.value)
          )
          // .filter(filterFromList)
      }
    },
    nodeOptions () {
      // 기등록된 클러스터에서 필터링 (클러스터 > 하위 노드)
      // 기등록된 노드 필터링
      if (this.form.moduleType === 'NX') {
        return this.nodes[this.form.moduleType]
          .map(node => ({
            label: node.nodeName,
            name: node.nodeName,
            value: node.hostUuid,
            clusterName: node.clusterName,
            clusterUuid: node.clusterUuid,
            checked: false
          }))
          .filter(node => !this.checkedNode.map(c => c.value).includes(node.value))
          // .filter(node => {
          //   const clusterList = this.getRegisteredClusterList(this.form.managementType).map(c => c.clusterNodeId)
          //   if (clusterList.includes(node.clusterUuid)) return false
          //   return true
          // })
      } else {
        return this.nodes[this.form.moduleType]
          .map(node => ({
            label: node.name,
            name: node.name,
            value: node.hostUuid,
            clusterName: node.cluster.name,
            clusterUuid: node.cluster.clusterId,
            checked: false
          }))
          .filter(node => !this.checkedNode.map(c => c.value).includes(node.value))
          // .filter(node => {
          //   const clusterList = this.getRegisteredClusterList(this.form.managementType).map(c => c.clusterNodeId)
          //   if (clusterList.includes(node.clusterUuid)) return false
          //   return true
          // })
      }
    }
  },
  watch: {
    isActiveEditModal (visible) {
      if (!visible) {
        this.resetForm()
      } else {
        if (this.editMode === 'change') {
          const editData = this.checkedRow[0]
          this.form.managementType = editData.operatingGroupType
          this.form.managementName = editData.operatingGroupName
          this.form.isBilling = editData.isBilling
          this.form.isShow = editData.isShow
          this.checkedCluster = []
          this.checkedNode = []

          const computeManagementUnit = editData.clusterNodeList[0].clusterNodeType || 'CLUSTER'
          this.formManagementType = computeManagementUnit

          editData.clusterNodeList.forEach(clusterNode => {
            const target = this.displayClusterOrNodeNoFilter.find(cluster => cluster.value === clusterNode.clusterNodeId)
            if (target) {
              if (computeManagementUnit === 'CLUSTER') this.checkedCluster = [...this.checkedCluster, target]
              else this.checkedNode = [...this.checkedNode, target]
            }
          })
        }
        this.setFormManagementType()
      }
    },
    isActiveSelectDetailModal (visible) {
      if (!visible) {
        this.selectDetailChecked = []
        this.displayClusterOrNode.forEach(t => (t.checked = false))
      }
    },
    'form.moduleType': {
      handler (moduleType) {
        this.checkedCluster = []
        this.checkedNode = []
        this.setFormManagementType()
      },
      immediate: true
    },
    'form.managementType': {
      handler: 'setFormManagementType',
      immediate: true
    }
  },
  created () {
    this.init()
  },
  methods: {
    setFormManagementType () {
      const findSetting = this.operationSettings.find(setting => {
        return setting.moduleType === this.form.moduleType && setting.operatingGroupType === this.form.managementType
      })
      if (findSetting) {
        this.formManagementType = findSetting.clusterNodeType
      }
    },
    getSettingLabel (setting) {
      const moduleTypeLabel = {
        NX: 'Nutanix',
        VMWARE: 'VMware'
      }[setting.moduleType]

      return `${moduleTypeLabel} ${setting.operatingGroupType}`
    },
    onSaveSettings () {
      if (this.userOperationSettings.some(setting => !setting.clusterNodeType)) {
        return this.$alert(this.$v('운영그룹 단위를 선택해주세요.'))
      }

      // 그리드 데이터에서 검증하자
      for (const setting of this.userOperationSettings) {
        // 똑같은거
        const filtered = this.gridData.filter(item => {
          return item.moduleType === setting.moduleType && item.operatingGroupType === setting.operatingGroupType
        })

        if (filtered && filtered.length) {
          if (filtered.some(item => {
            const clusterNodeType = item.clusterNodeList.map(cnl => cnl.clusterNodeType)
            return !clusterNodeType.includes(setting.clusterNodeType)
          })) {
            return this.$alert(this.$v('기존 운영그룹 단위에 설정된 클러스터 혹은 노드가 존재하면<br>변경할 수 없습니다. 등록 해제한 뒤 변경해주세요.'), { dangerouslyUseHTMLString: true })
          }
        }
      }

      this.$confirm(this.$v('저장하시겠습니까?'))
        .then(async () => {
          try {
            await API.billing.updateOperationGroupSettings(this.userOperationSettings)
            this.$alert(this.$v('운영그룹 단위를 저장하였습니다.'), {
              onClose: () => {
                this.getOperationSettings()
                this.isManageOperUnitModal = false
              }
            })
          } catch (error) {
            console.log(error)
            this.$alert(this.$v('운영그룹 단위 저장에 실패하였습니다.'))
          }
        })
        .catch(() => {})
    },
    onClickCancelSettings () {
      this.getOperationSettings()
      this.isManageOperUnitModal = false
    },
    async getOperationSettings () {
      const { data } = await API.billing.getOperationGroupSettings()
      this.operationSettings = data
      // UI 데이터를 세팅
      ;(data || []).forEach(setting => {
        const findUserSetting = this.userOperationSettings.find(userSetting => {
          return userSetting.operatingGroupType === setting.operatingGroupType && userSetting.moduleType === setting.moduleType
        })
        if (findUserSetting) {
          findUserSetting.clusterNodeType = setting.clusterNodeType
        }
      })
    },
    // onChangeRadio (value) {
    //   if (!this.gridData.length) return

    //   const clusterNodeType = flatten(this.gridData.map(g => g.clusterNodeList.map(cn => cn.clusterNodeType)))
    //   if (!clusterNodeType.includes(value)) {
    //     this.$alert(this.$v('기등록된 운영그룹 단위와 달라 선택한 단위로 등록이 불가능합니다.<br>설정된 클러스터 및 노드를 해제한 뒤 등록해주세요.'), { dangerouslyUseHTMLString: true })
    //     this.computeManagementUnit = ''
    //   }
    // },
    /**
     * 클러스터의 하위 노드가 운영그룹에 등록되었는지 조회
     */
    // getRegisteredChildNodes (clusterUuid, groupType = 'COMPUTE') {
    //   // 등록된 노드
    //   const registeredNodes = flatten(this.gridData
    //     .filter(grid => grid.operatingGroupType === groupType)
    //     .map(grid => grid.clusterNodeList)
    //   ).filter(clusterNode => clusterNode.clusterNodeType === 'NODE')
    //   const hostUuids = registeredNodes.map(clusterNode => clusterNode.clusterNodeId)
    //   const clusterUuids = hostUuids.map(hostUuid => {
    //     const findNode = this.nodes.find(node => node.hostUuid === hostUuid)
    //     return findNode?.clusterUuid
    //   })

    //   return clusterUuids.includes(clusterUuid)
    // },
    /**
     *
     * 클러스터의 하위 노드 조회
     */
    // getNodesByClusterUuid (clusterUuid) {
    //   return this.nodes.filter(node => node.clusterUuid === clusterUuid)
    // },
    /**
     * 운영그룹에 기등록된 클러스터 조회
     * groupType = 'COMPUTE' | 'NODE'
     */
    getRegisteredClusterList (groupType = 'COMPUTE') {
      return flatten(this.gridData
        .filter(grid => grid.operatingGroupType === groupType)
        .map(grid => grid.clusterNodeList)
      ).filter(clusterNode => clusterNode.clusterNodeType === 'CLUSTER')
    },
    init () {
      this.isLoadingOperation = true

      const clear = () => {
        this.checkedRow = []
        this.checkedCluster = []
        this.checkedNode = []
        this.clusters = {
          NX: [],
          VMWARE: []
        }
        this.nodes = []
        this.editMode = 'new'
        this.selectDetailChecked = []
      }

      Promise.all([
        this.getOperationSettings(),
        this.getOperationList(),
        this.getClusterList(),
        this.getNodeList()
      ])
        .catch(() => {
          this.$alert(this.$v('운영그룹 조회에 실패하였습니다.'))
          clear()
        })
        .finally(() => (this.isLoadingOperation = false))
    },
    onDeleteItemInChecked (key) {
      if (this.formManagementType === 'CLUSTER') {
        this.checkedCluster = this.checkedCluster.filter(cluster => cluster.value !== key)
      } else {
        this.checkedNode = this.checkedNode.filter(node => node.value !== key)
      }
    },
    onClickCancelSelectDetail () {
      this.isActiveSelectDetailModal = false
    },
    onCheckSelectDetail (rows) {
      this.selectDetailChecked = rows
    },
    onClickSaveSelectDetail () {
      if (this.formManagementType === 'CLUSTER') {
        this.checkedCluster = [...this.checkedCluster, ...this.selectDetailChecked]
      } else {
        this.checkedNode = [...this.checkedNode, ...this.selectDetailChecked]
      }
      this.selectDetailChecked = []
      this.isActiveSelectDetailModal = false
    },
    onClickSelectDetail () {
      this.isActiveSelectDetailModal = true
    },
    async getNodeList () {
      const nutanixHosts = await API.compute.getHostList()
      const vmwareHosts = await API.vmware.host.getVmwareHostList()

      this.nodes.NX = nutanixHosts
      this.nodes.VMWARE = vmwareHosts
    },
    async getClusterList () {
      const nutanixCluster = await API.compute.getClusters()
      const vmwareCluster = await API.vmware.cluster.getVmwCluster()

      this.clusters.NX = nutanixCluster
      this.clusters.VMWARE = vmwareCluster
    },
    async getOperationList () {
      try {
        // const { data } = await API.billing.getOperationGroup({
        //   moduleType: 'ALL' // <-- 이거 빼야됨 CSP 합쳐지면
        // })
        // 그냥 두번 호출하고 합치자..
        const { data: nxData } = await API.billing.getOperationGroup({ moduleType: 'NX' })
        const { data: vmwData } = await API.billing.getOperationGroup({ moduleType: 'VMWARE' })
        const data = [].concat(nxData, vmwData)
        this.gridData = data
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('운영 그릅 조회에 실패하였습니다.'))
      }
    },
    resetForm () {
      this.form.selectedClusterOrNode = null
      this.form.managementName = ''
      this.form.managementType = 'COMPUTE'
      this.form.isBilling = false
      this.form.isShow = false
      this.checkedCluster = []
      this.checkedNode = []
    },
    onClickAdd () {
      if (!this.operationSettings.length) {
        return this.$alert(this.$v('운영그룹 설정을 먼저 진행하여야 합니다.'))
      }

      this.editMode = 'new'
      // this.formManagementType = this.computeManagementUnit
      this.isActiveEditModal = true
    },
    onClickChange () {
      if (!this.operationSettings.length) {
        return this.$alert(this.$v('운영그룹 설정을 먼저 진행하여야 합니다.'))
      }

      this.form.moduleType = this.checkedRow[0].moduleType
      this.editMode = 'change'
      this.formManagementType = this.checkedRow[0].operatingGroupType
      this.isActiveEditModal = true
    },
    onClickDelete () {
      if (!this.checkedRow.length) return

      this.$confirm(this.$v('선택한 항목을 삭제하시겠습니까?'))
        .then(async () => {
          const loading = this.$loading()
          const operatingGroupIdxLIst = this.checkedRow.map(row => row.operatingGroupIdx)

          try {
            await API.billing.deleteOperationGroup({ operatingGroupIdxLIst })
            this.$alert(this.$v('운영그룹을 삭제하였습니다.'), {
              onClose: () => this.init()
            })
          } catch (error) {
            console.log(error)
            this.$alert(this.$v('운영그룹 삭제에 실패하였습니다.'))
          } finally {
            loading.close()
          }
        })
        .catch(() => false)
    },
    onCheckGridItem (checked) {
      this.checkedRow = checked
    },
    getClusterNodeList () {
      return this.checkedItem.map(item => ({
        clusterNodeId: item.value,
        clusterNodeType: this.formManagementType
      }))
    },
    async validateManagement () {
      if (!this.form.managementName) {
        return this.$alert(this.$v('운영그룹 이름을 입력해주세요.'), {
          callback: () => false
        })
      }
      if (!this.checkedItem || !this.checkedItem.length) {
        return this.$alert(this.$v('클러스터 혹은 노드를 선택해주세요.'), {
          callback: () => false
        })
      }
      return true
    },
    async onClickSaveManagement () {
      const self = this

      if (!(await this.validateManagement())) return

      this.$confirm(self.$v('입력한 내용으로 저장하시겠습니까?'))
        .then(async () => {
          const message = {
            new: {
              success: self.$v('운영그룹을 생성하였습니다.'),
              fail: self.$v('운영그룹 생성에 실패하였습니다.')
            },
            change: {
              success: self.$v('운영그룹을 수정하였습니다.'),
              fail: self.$v('운영그룹 수정에 실패하였습니다.')
            }
          }[self.editMode]

          try {
            const req = {
              isBilling: self.form.isBilling,
              isShow: self.form.isShow,
              moduleType: self.moduleType,
              operatingGroupName: self.form.managementName,
              operatingGroupType: self.form.managementType,
              clusterNodeList: self.getClusterNodeList()
            }

            let callback = API.billing.createOperationGroup

            if (self.editMode === 'change') {
              req.operatingGroupIdx = self.checkedRow[0].operatingGroupIdx
              callback = API.billing.updateOperationGroup
            }

            self.isLoadingModal = true

            await callback(req)
            self.$alert(message.success, {
              callback: () => {
                self.isActiveEditModal = false
                self.isActiveSelectDetailModal = false
                self.init()
              }
            })
          } catch (error) {
            console.log(error)
            if (error.response?.data) {
              if (error.response.data?.code === 'BIL2001') {
                return self.$alert(this.$v('운영그룹 이름이 중복되었습니다.'))
              }
            }
            self.$alert(message.fail)
          } finally {
            self.isLoadingModal = false
          }
        })
        .catch(() => {})
    }
  },
  data: () => ({
    isLoadingModal: false,
    isManageOperUnitModal: false,

    selectDetailChecked: [],
    checkedNode: [],
    checkedCluster: [],
    clusters: {
      NX: [],
      VMWARE: []
    },
    nodes: {
      NX: [],
      VMWARE: []
    },
    isLoadingOperation: false,
    checkedRow: [],
    computeManagementUnit: '',
    isActiveEditModal: false,
    isActiveSelectDetailModal: false,
    gridData: [],
    editMode: 'new',
    gridColumns: [
      { binding: 'moduleType', header: 'CSP', customHtml: true, width: '0.5*' },
      { binding: 'operatingGroupType', header: '운영그룹 타입' },
      { binding: 'operatingGroupName', header: '운영그룹 이름' },
      { binding: 'clusterNodeList', header: '설정된 클러스터/노드', customHtml: true, width: '2*' },
      { binding: 'isBilling', header: '빌링 여부', customHtml: true, width: '0.5*' },
      { binding: 'isShow', header: '사용자 노출 여부', customHtml: true, width: '0.5*' }
    ],
    form: {
      selectedClusterOrNode: null,
      managementName: '',
      managementType: 'COMPUTE',
      isBilling: false,
      isShow: false,
      moduleType: 'NX'
    },
    selectDetailGrid: {
      CLUSTER: [
        { binding: 'name', header: '클러스터명' }
      ],
      NODE: [
        { binding: 'clusterName', header: '클러스터명' },
        { binding: 'name', header: '노드명' }
      ]
    },
    // 일단 추가
    formManagementType: '',
    operationSettings: [],
    userOperationSettings: [
      { clusterNodeType: '', moduleType: 'NX', operatingGroupType: 'COMPUTE' },
      { clusterNodeType: '', moduleType: 'NX', operatingGroupType: 'STORAGE' },
      { clusterNodeType: '', moduleType: 'VMWARE', operatingGroupType: 'COMPUTE' },
      { clusterNodeType: '', moduleType: 'VMWARE', operatingGroupType: 'STORAGE' }
    ]
  })
}
</script>

<style lang="scss" scoped>
.operation {
  &-grid {
    &-filter {
      display: flex;
      justify-content: space-between;
      margin-bottom: $gap-s;

      &__radio {
        display: flex;
        flex-wrap: nowrap;
        align-items: center;

        .label {
          display: inline-block;
          font-size: 14px;
          font-weight: bold;
          margin-right: $gap;
        }
      }

      &__action {
        > .button + .button {
          margin-left: 5px;
        }
      }
    }
  }

  .edit-modal {
    border-top: 1px solid $purple-gray;
  }

  .selected-items {
    margin: $gap-s 0 0 0;
    display: flex;
    flex-wrap: wrap;
  }

  .select-detail {
    &-header {
      margin-bottom: $gap-s;
    }
  }

  .setting {
    padding: $gap-s 0 $gap 0;

    > * + * {
      margin-top: $gap;
    }

    &-row {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;

      &-label {
        min-width: 180px;
        font-size: 15px;
        margin-right: $gap;
      }
    }
  }
}
</style>
