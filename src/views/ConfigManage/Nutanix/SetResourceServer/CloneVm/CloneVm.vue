<template>
  <section
    class="clone-vm"
    v-loading="loading.isGetGroupTree || loading.isServiceData || loading.setInitData"
  >
    <div
      class="clone-vm-contents"
      :style="{maxHeight: height}"
    >
      <!-- 기존 자원 정보 -->
      <g-foldable
        class="clone-vm-foldable"
        :title="$t('common.GRID.beforeResInfo')"
        :expand-reverse-color="false"
      >
        <template #fold-arrow="fold">
          <i
            class="mdi mdi-chevron-down fold-arrow"
            :class="{'-is-expand': fold.state}"
          />
        </template>
        <template #contents>
          <vertical-table
            class="clone-vm-vertical-table"
            :data="resourceInfo"
            :columns="resourceColumns"
            type="horizontal"
            :use-border-top="false"
            no-border
          >
            <template #projectInfo>
              {{ resourceInfo.companyName + ' > ' + resourceInfo.groupName + ' > ' + resourceInfo.projectName }}
            </template>
            <!-- 관계사/조직/프로젝트 -->

            <template #clusterNode>
              {{ joinObjectWithArrow(resourceInfo.clusterNode) }}
            </template>
            <!-- 클러스터/노드 -->

            <template #networkCate>
              {{ resourceInfo.networkList && resourceInfo.networkList.length ? resourceInfo.networkList[0].cateKey : '-' }}
            </template>
            <!-- 네트워크 조직 -->

            <template #spec>
              <span>vCPU: {{ resourceInfo.vcpu }}Core</span><br>
              <span>Memory: {{ resourceInfo.memory }}GB</span><br>
              <span>RootDisk: {{ resourceInfo.rootDiskSize ? resourceInfo.rootDiskSize : 0 }}GB</span>
            </template>
            <!-- 설정된 사양 정보 -->

            <template #externalDisk>
              <div class="join-comma-list">
                <span
                  v-for="(disk, idx) in resourceInfo.externalDiskList"
                  :key="idx"
                >
                  {{ disk.diskName || `${disk.deviceBus}.${disk.deviceIndex}` }}:&nbsp;{{ isNaN(disk.diskSize)
                    ? disk.diskSize
                    : byteToGb(disk.diskSize) + 'GB' }}
                </span>
              </div>
              <!-- {{ externalDiskValue }} -->
            </template>
            <!-- Local Disk -->

            <template #osImage>
              <set-os-icon
                class="align-center-wrap"
                :os-name="`${resourceInfo.osName ? resourceInfo.osName : ''}${resourceInfo.osBit ? ' / ' + resourceInfo.osBit : ''}`"
              />
            </template>
            <!-- OS 이미지 -->

            <template #installProgramList>
              <div class="join-comma-list">
                <span
                  v-for="(pkg,pkgIdx) in resourceInfo.installProgramList"
                  :key="`install_${pkgIdx}`"
                >
                  {{ pkg.name }} {{ pkg.version }}
                </span>
              </div>
            </template>
            <!-- 설치프로그램 -->

            <template #licenseList>
              <div class="join-comma-list">
                <span
                  v-for="sw in resourceInfo.licenseList"
                  :key="`swLicense_${sw.swIdx}`"
                >
                  {{ sw.name }}
                </span>
              </div>
            </template>
            <!-- 설치프로그램 -->

            <template #manageGroup>
              <span v-if="resourceInfo.manageGroupName">{{ resourceInfo.manageGroupName }}</span>
              <span v-else>-</span>
            </template>
            <!-- 운영그룹 -->
          </vertical-table>
        </template>
      </g-foldable>

      <!-- 복제 되는 친구들 -->
      <g-foldable
        class="clone-vm-foldable"
        :title="`${resourceInfo.hostname|| ''} #${(index < 9 ? '0' + Number(index + 1) : Number(index + 1))}`"
        v-for="(clone, index) in cloneVms"
        :key="'clone '+ index"
        :expand-reverse-color="false"
        default-status
      >
        <template #fold-arrow="fold">
          <i
            class="mdi mdi-chevron-down fold-arrow"
            :class="{'-is-expand': fold.state}"
          />
        </template>
        <template #header-suffix>
          <p
            class="clone-price-wrap"
          >
            {{ $v('월 예상 비용') }}
            <span class="clone-price">
              ₩<b>{{ clone.price | locale }}</b>
            </span>
          </p>
          <button
            class="button"
            type="is-icon"
            @click.stop="deleteItem(index, clone)"
          >
            <i class="delete-icon" />
          </button>
        </template>
        <template #contents>
          <vertical-table
            class="clone-vm-vertical-table"
            :data="clone"
            :columns="cloneColumns"
            no-border
          >
            <toggle-is-urgent-checkbox
              slot="isUrgent"
              v-if="packageType !== 'PL'"
              v-model="clone.isUrgent"
              :action-name="$v('자원 복제')"
            />

            <template #projectInfo>
              <div
                class="flex-wrap"
                style="gap: 10px;"
              >
                <span v-if="clone.projectInfo && clone.projectInfo.company !== null">
                  {{ `${clone.projectInfo.company.groupName || '-'} > ${clone.projectInfo.group.groupName || '-'} > ${clone.projectInfo.project.projectName || '-'}` }}
                </span>
                <button
                  class="button"
                  type="is-primary"
                  @click="selectProjectModalView = true"
                  style="min-width: 140px;"
                  ref="projectTrigger"
                >
                  {{ clone.projectInfo && clone.projectInfo.company !== null ? $v('프로젝트 변경') : $v('프로젝트 선택') }}
                </button>
              </div>

              <div
                v-if="selectProjectModalView"
                class="custom-popup -app-manager"
              >
                <select-from-tree
                  type="project"
                  :search-title="$v('프로젝트를 검색하세요.')"
                  :header="$v('프로젝트 리스트')"
                  v-if="selectProjectModalView"
                  class="-body"
                  @close="selectProjectModalView = false"
                  :selected-project-info="clone.originProjectInfo ? clone.originProjectInfo.project : null"
                  :group-tree-data="groupTreeData"
                  :loading="loading.isGetGroupTree"
                  :user-group-idx="user.userGroup"
                  :trigger-btn="$refs"
                  @select="(projectInfo) => changeProjectInfo(clone, projectInfo)"
                />
              </div>
              <!-- 프로젝트 선택 -->
            </template>
            <!-- 관계사-조직-프로젝트 -->

            <template #networkList>
              <div
                class="flex-wrap"
                style="gap: 20px;"
              >
                <span v-if="clone.networkList && clone.networkList.length">
                  {{ clone.networkList[0].cateKey }}
                </span>

                <button
                  class="button"
                  type="is-primary"
                  @click="() => {
                    editingCloneItem = clone
                    networkCateModalView = true
                  }"
                >
                  {{
                    '네트워크 카테고리 ' + (clone.networkList && clone.networkList.length
                      ? $v('변경')
                      : $v('선택'))
                  }}
                </button>
              </div>
            </template>
            <!-- 관계사-조직-프로젝트 -->

            <template #hostname>
              <div class="flex-wrap setting-hostname-wrap">
                <el-input
                  v-model="clone.hostname"
                  maxlength="256"
                  placeholder="호스트 명"
                  clearable
                  show-word-limit
                  :disabled="clone.passHostname"
                  style="margin-right: 10px;"
                />
                <button
                  v-if="!clone.passHostname"
                  v-loading="loading.isCreateHostNameIdx"
                  class="button check-hostname-btn"
                  type="is-primary"
                  :disabled="!clone.hostname"
                  @click="checkHostnameAvailable(clone)"
                >
                  호스트 명 중복 검사
                </button>
                <button
                  v-else
                  class="button"
                  type="is-primary"
                  @click="() => {
                    clone.passHostname = false
                    updatePreviewData(clone)
                  }"
                >
                  변경
                </button>
              </div>
            </template>
            <!-- 예상 호스트명 -->

            <template #specOption>
              <div class="flex-wrap">
                <b>{{ resourceInfo.hostname }}</b>
                <small style="margin-left: 10px;">{{ `vCPU : ${resourceInfo.vcpu}Core, RAM : ${resourceInfo.memory}GB, DISK : ${resourceInfo.rootDiskSize || 0}GB` }}</small>
              </div>

              <ul class="spec-wrap">
                <li>
                  <div class="set-vcpu">
                    vCPU:&nbsp;
                    <el-input
                      v-model="clone.vcpu"
                      style="width: 100px"
                      type="number"
                      @blur="e => {
                        if(!+clone.vcpu) clone.vcpu = 1
                      }"
                      @keydown.native="e => {
                        const invalid = ['i','+','e','-', '.']
                        if(invalid.includes(e.key)) e.preventDefault()
                      }"
                      @input="e => { setCorePerSocketOptions(clone) }"
                      @change="changeSpec(clone)"
                    />
                    core,
                  </div>

                  <div class="set-vcpu">
                    소켓당 코어 수 :&nbsp;
                    <el-select
                      v-model="clone.corePerSocket"
                      :popper-append-to-body="false"
                      style="width: 100px;"
                    >
                      <el-option
                        v-for="item in clone.corePerSocketOptions"
                        :key="item"
                        :label="item"
                        :value="item"
                      />
                    </el-select>
                    <small>( 소켓 수: {{ clone.socket }} )</small>
                  </div>
                </li>

                <li>
                  RAM:&nbsp;
                  <el-input
                    v-model="clone.memory"
                    style="width: 100px"
                    type="number"
                    @blur="e => {
                      if(!+clone.memory) clone.memory = 1
                    }"
                    @keydown.native="e => {
                      const invalid = ['i','+','e','-', '.']
                      if(invalid.includes(e.key)) e.preventDefault()
                    }"
                    @change="changeSpec(clone)"
                  />
                  GB
                </li>
              </ul>
            </template>
            <!-- 사양 옵션 -->

            <el-input
              slot="note"
              v-model="clone.note"
              resize="none"
              type="textarea"
              :placeholder="$t('common.PLACEHOLDER.remark')"
              :autosize="{ minRows: 3, maxRows: 6}"
            />
            <!-- 비고 -->

            <template #ipam>
              <div
                class="flex-wrap"
                v-if="clone.networkList && clone.networkList.length"
              >
                <span
                  v-if="clone.networkIp"
                  style="margin-right: 20px"
                >{{ clone.networkIp.customIp.data ? clone.networkIp.customIp.data : $v('자동 할당') }}</span>
                <button
                  class="button"
                  type="is-primary"
                  @click="activeIpModal(clone)"
                >
                  {{ $v('IP 설정') }}
                </button>
              </div>
              <p
                class="empty-data"
                v-else
              >
                {{ $v('네트워크 조직을 선택해주세요.') }}
              </p>
            </template>
            <!-- IPAM -->

            <template #script>
              <div>
                <button
                  class="button"
                  :type="!clone.script ? 'is-primary' : 'is-dark'"
                  @click="() => {
                    editingCloneItem = clone
                    scriptModalView = true
                  }"
                >
                  {{
                    'Cloud Init Script ' + (clone.script
                      ? $v('변경')
                      : $v('선택'))
                  }}
                </button>

                <button
                  v-if="clone.script"
                  class="button"
                  type="is-dark"
                  style="margin-left: 5px"
                  @click="() => (clone.script = '')"
                >
                  {{ $v('등록 해제') }}
                </button>

                <cloud-init-simple
                  class="script-exam"
                  v-if="clone.script"
                  :script="clone.script"
                  :preview-data="clone.cloudInitPreviewData"
                  @change="script => clone.replaceScript = script"
                />
              </div>
            </template>
            <!-- Cloud Init Script -->

            <template #manageGroup>
              <el-select
                v-model="clone.manageGroupIdx"
                :placeholder="$v('운영그룹을 선택하세요.')"
                :popper-append-to-body="false"
              >
                <el-option
                  v-for="group in manageGroupOptions"
                  :key="group.operatingGroupIdx"
                  :label="group.operatingGroupName"
                  :value="group.operatingGroupIdx"
                  :disabled="group.disabled"
                />
              </el-select>
            </template>
          <!-- 운영그룹 -->
          </vertical-table>
        </template>
      </g-foldable>
      <button
        class="button -add-vm-btn"
        type="is-primary"
        @click="addCloneItem"
      >
        <!-- +복제 항목 개수 추가 -->
        +{{ $t('common.GRID.COMPUTE.addCloneItem') }}
      </button>
    </div>

    <section class="modal-button-area">
      <button
        class="button -modal-button"
        type="is-anti"
        @click="close()"
      >
        {{ $v('취소') }}
      </button>
      <button
        class="button -modal-button"
        @click="save"
        type="is-primary"
      >
        {{ $t('복제') }}
      </button>
    </section>

    <!-- 'IP 선택' 모달 -->
    <el-dialog
      :title="$t('common.BTN.CONF.selectIp')"
      :visible.sync="ipModalView"
      width="1100px"
      top="7vh"
      @close="ipModalView = false"
    >
      <select-network-ip-grid
        v-loading="loading.cluster || loading.clusterSubnet || loading.ipBands"
        v-if="ipModalView"
        :grid-data="ipModalTableData"
        :init-selected="editingCloneItem.ip"
        :custom-disable-ips="cloneVmsIp"
        @cancel="ipModalView = false"
        @save="params => {
          setSelectedNetwork(params, editingCloneItem.networkList[0])
        }"
      />
    </el-dialog>

    <!-- 네트워크 카테고리 선택 모달 -->
    <network-category-tree-selection
      :visible="networkCateModalView"
      :init-data="editingCloneItem && editingCloneItem.networkList"
      :cate-limit="1"
      @close="networkCateModalView = false"
      @save="data => changeNetworkCate(editingCloneItem, data)"
    />

    <!-- Cloud Init Script 설정 모달 -->
    <cloud-init-fetch-list-modal
      v-if="scriptModalView"
      :active="scriptModalView"
      :init-script="editingCloneItem.script"
      @close="scriptModalView = false"
      @save-script="(data) => {
        editingCloneItem.script = data
        updatePreviewData(editingCloneItem)
        scriptModalView = false
        editingCloneItem = null
      }"
    />
  </section>
</template>

<script>
import API, {
  VerticalTable, SetOSIcon, NetworkCategoryTreeSelection, SelectFromTree,
  isAvailableHostname,
  getBillingModel, vmChargeInfo,
  CloudInitFetchListModal, CloudInitSimple,
  NXSelectNetworkIpGrid, ToggleIsUrgentCheckbox
} from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
import { cloneDeep } from 'lodash'

import GFoldable from '@/components/common/g-foldable/g-foldable'

import ComputeUpdateMixins from '@/components/Modal/UpdateResource/ComputeUpdateForm/ComputeUpdate.mixins.js'
// import SelectNetworkIpGrid from '@/components/Modal/UpdateResource/ComputeUpdateForm/SelectNetworkIpGrid/SelectNetworkIpGrid'

export default {
  name: 'CloneVm',
  mixins: [ComputeUpdateMixins],
  components: {
    VerticalTable,
    'set-os-icon': SetOSIcon,
    NetworkCategoryTreeSelection,
    'g-foldable': GFoldable,
    'select-network-ip-grid': NXSelectNetworkIpGrid,
    SelectFromTree,
    CloudInitFetchListModal,
    CloudInitSimple,
    ToggleIsUrgentCheckbox
  },
  props: {
    vmData: {
      type: Object,
      default: null
    },
    height: { // 콘텐츠에 스크롤 생기기 시작 높이
      type: String,
      default: '67vh'
    },
    isIpam: { // IPAM을 통해 만들어진 VM인지? (Static IP x)
      type: Boolean,
      default: true
    }
  },
  computed: {
    ...mapState({
      packageType: state => state.auth.packageType,
      user: state => state.auth.user
    })
  },
  async created () {
    if (!this.isIpam) await this.getClusters()
    await this.getGroupTreeData()
    await this.getOperationGroup() // 운영그룹

    this.resourceInfo = await this.setResource(this.vmData)
    console.log('@@가공 정보: ', this.resourceInfo)

    await this.setManageGroupOptions() // 운영그룹 disable 설정 (this.resourceInfo 세팅 후 설정 가능)

    this.$nextTick(function () {
      if (!Object.values(this.resourceInfo.projectInfo).includes(null)) this.addCloneItem() // 복제 VM default로 한 개 추가
      this.setInitColumns(this.resourceInfo)
    })
  },
  methods: {
    /**
     * 그룹 tree 데이터 세팅
     */
    async getGroupTreeData () {
      try {
        this.loading.isGetGroupTree = true
        const response = await API.iam.getGroupManageTree({ project: true })

        this.groupTreeData = response || []
      } catch (error) {
        console.error(error)
        this.$alert('조직 조회에 문제가 발생했습니다.', () => false)
      } finally {
        this.loading.isGetGroupTree = false
      }
    },
    /**
     * API: 프로젝트 정보 조회
     * @param {Number} projectIdx
     */
    async getProject (projectIdx) {
      if (isNaN(projectIdx)) return
      try {
        this.curProject = {}
        const data = await API.iam.getProject({ projectIdx })
        return data
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        return this.$alert(message)
      }
    },
    /**
    * API: 운영그룹 목록을 조회합니다.
    */
    async getOperationGroup () {
      try {
        const { data } = await API.billing.getOperationGroup({
          moduleType: 'NX',
          operatingGroupType: 'COMPUTE'
        })
        this.manageGroupOptions = data || []
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('운영 그릅 조회에 실패하였습니다.'), () => false)
      }
    },
    /**
     * API: 이미지 정보 조회 (단건)
     * @param {Number} userImageIdx
     */
    async getImage (userImageIdx) {
      if (isNaN(userImageIdx)) return
      try {
        const data = await API.compute.getImage(userImageIdx)
        return data || null
      } catch (error) {
        console.error('이미지 상세 조회에 문제가 발생했습니다: ', error)
      }
    },
    /**
     * 클론 될 자원 컬럼 초기 세팅
     */
    setInitColumns (origin) {
      if (this.isIpam) this.cloneColumns = this.removeColumn(this.cloneColumns, ['ipam'])

      this.cloneColumns = this.cloneColumns.map(col => {
        const checkRequired = (col) => {
          if (['computeName', 'specOption', 'hostname', 'networkList'].includes(col.binding)) return true
          else if (['note', 'isUrgent', 'script'].includes(col.binding)) return false
          else if (col.binding === 'projectInfo' && (!this.resourceInfo?.companyCi || !this.resourceInfo?.companyPrefix)) return true
          else {
            const value = Array.isArray(origin[col.binding]) ? origin[col.binding].length : origin[col.binding]
            return !value
          }
        }

        return {
          ...col,
          required: checkRequired(col)
        }
      })
    },
    /**
     * 기존 자원 정보 데이터 세팅
     */
    async setResource (vm) {
      this.loading.setInitData = true
      try {
        console.log('@최초 VM: ', vm)
        const pr = await this.getProject(vm.projectIdx)
        let projectInfo = {}

        if (pr?.length) {
          projectInfo = {
            company: {
              companyPrefix: pr[0].companyPrefix,
              companyCi: pr[0].companyCi,
              companyCode: pr[0].companyCode,
              groupName: pr[0].companyName,
              groupIdx: pr[0].companyIdx
            },
            group: {
              groupName: pr[0].groupName,
              groupIdx: pr[0].groupIdx
            },
            project: {
              ...pr[0]
            }
          }
        }

        const clusterNode = {
          cluster: vm.clusterName,
          node: vm.nodeName
        }

        const networkCateList = vm.nics || vm.networkList || []

        let selectImage
        if (vm.imageId) selectImage = await this.getImage(vm.imageId)

        // 운영정보
        let manageGroupName, manageGroupType
        const manageGroupIdx = vm?.manageGroupIdx
        if (manageGroupIdx) {
          const findManageGorupInfo = this.manageGroupOptions.find(g => g.operatingGroupIdx === manageGroupIdx)

          if (findManageGorupInfo) {
            manageGroupName = findManageGorupInfo.operatingGroupName
            manageGroupType = findManageGorupInfo?.clusterNodeList?.length ? findManageGorupInfo.clusterNodeList[0].clusterNodeType : undefined
          }
        }

        const k = (1024 * 1024 * 1024)
        const origin = {
          ...vm,
          isUrgent: vm.isUrgent || false,
          socket: vm.socket || 0,
          corePerSocket: vm.vcpu / vm.socket,
          corePerSocketOptions: this.getDivisors(vm.vcpu),
          memory: Number(vm.memoryCapacityInBytes / k).toFixed(0),
          projectInfo,
          clusterNode,
          networkList: networkCateList.map(n => {
            return {
              ...n,
              // cateId: n.cateIdx || n.netId || n.netIdx
              cateId: n.cateIdx,
              cateCode: n.cateCode || vm.hostname.slice(-3, -2),
              name: n.cateKey
            }
          }),
          selectImage,
          isChangingHostname: false,
          manageGroupName,
          manageGroupType,
          installProgramList: vm?.installProgramList || [],
          licenseList: vm?.licenseList || []
        }
        // 과금
        const { billingInfo, appliedModel } = await this.getBillingInfo(origin)

        origin.billingModel = billingInfo
        origin.appliedModel = appliedModel
        origin.price = await this.vmPriceInfo(origin)

        return origin
      } catch (error) {
        console.error(error)
      } finally {
        this.loading.setInitData = false
      }
    },

    joinObjectWithArrow (obj) {
      if (!obj) return
      const values = Object.values(obj)
      return values.join(' > ')
    },
    /**
     * 사양 (vCPU, RAM), 네트워크 조직 변경 이벤트
     */
    async changeSpec (clone) {
      clone.price = await this.vmPriceInfo(clone)
    },
    // IP 설정 모달 open
    async activeIpModal (clone) {
      if (!clone.networkList?.length) return

      this.editingCloneItem = clone
      await this.getIpBands(clone.networkList[0])
      this.setIpGridData()
      this.ipModalView = true
    },

    /**
     * '복제 항목 개수 추가' 클릭 시, 복제 VM의 갯수를 늘립니다.
     */
    async addCloneItem () {
      this.loading.setInitData = true
      const cloneItem = cloneDeep(this.resourceInfo)

      cloneItem.isUrgent = true

      cloneItem.hostname = ''
      cloneItem.passHostname = false

      cloneItem.originProjectInfo = this.resourceInfo.projectInfo

      cloneItem.frontId = Math.random().toString(36).substr(2, 9)
      cloneItem.usableResourceName = true
      cloneItem.manageGroupIdx = this.resourceInfo?.manageGroupIdx || ''
      cloneItem.script = ''

      cloneItem.price = await this.vmPriceInfo(this.resourceInfo)

      // 자원 명 중복 체크 -> API 미개발로 주석 처리
      // await this.testResourceName(cloneItem, null, true)

      this.cloneVms.push(cloneItem)

      this.loading.setInitData = false
    },
    deleteItem (idx, deletedItem) {
      this.cloneVms.splice(idx, 1)

      this.cloneVmsIp = this.cloneVms.map(item => item?.ip?.ipAddress)

      for (let i = 0; i < this.cloneVms.length; i++) {
        if (deletedItem?.computeName &&
         (this.cloneVms[i]?.computeName === deletedItem.computeName)) {
          this.cloneVms[i].usableResourceName = true
          break
        }
      }
    },
    /**
     * 네트워크 조직 변경 시, 발생 이벤트
     * @param {Object} vm 호스트명이 변경되는 단일 vm 정보
     * @param {Array} data 새로 설정되는 네트워크 카테고리 정보
     */
    changeNetworkCate (vm, data) {
      const originNetworkList = this.resourceInfo.networkList
      this.$set(vm, 'networkList', [])

      if (data?.length) {
        vm.networkList = originNetworkList.map((item, idx) => {
          return {
            ...item,
            cateId: data[idx]?.cateIdx,
            cateIdx: data[idx]?.cateIdx,
            cateKey: data[idx]?.cateKey,
            cateCode: data[idx]?.cateCode,
            cateName: data[idx]?.cateName
          }
        })
      }

      if (!this.isIpam) {
        vm.networkIp = null
        vm.ip = null
      }
      this.changeSpec(vm)

      this.$forceUpdate()
    },
    /**
     * 관계사-조직-프로젝트 변경 시, 발생 이벤트
     */
    async changeProjectInfo (item, projectInfo, comp) {
      item.projectInfo = projectInfo

      const { billingInfo, appliedModel } = await this.getBillingInfo(origin)
      item.billingModel = billingInfo
      item.appliedModel = appliedModel
      item.price = await this.vmPriceInfo(item)
      this.allTestResourceName()
    },
    /**
     * 빈 항목이 있으면 alert 메세지 출력
     * @param {Array} checkItems 체크할 키 : 값 모음
     * @return {Boolean} 빈 항목이 유무 리턴, 빈 항목이 있으면 false 반환
     */
    noEmptyContents (checkItems) {
      if (!checkItems?.length) return
      const message = {
        vmsName: this.$v('이름을 입력하지 않은 자원이 있습니다.'),
        duplicateName: this.$v('사용 중인 자원명으로 설정한 자원이 있습니다.'),
        vmsNetworkCate: this.$v('네트워크 카테고리를<br>선택하지 않은 자원이 있습니다.'),
        availableHostname: this.$v('호스트 명 중복 검사를<br>완료하지 않은 자원이 있습니다.'),
        vmsVcpuSize: this.$v('신청 불가능한 사양이 입력된 자원이 있습니다.<br>( vCPU 최소값: 1Core, RAM 최소값: 1GB )'),
        vmsipam: this.$v('Network IP를 선택하지 않은 자원이 있습니다.'),
        vmsProject: this.$v('프로젝트를 선택하지 않은 자원이 있습니다.'),
        vmsManageGroup: this.$v('운영그룹을 선택하지 않은 자원이 있습니다.')
      }

      let pass = true

      for (let i = 0; i < checkItems.length; i++) {
        const key = Object.keys(checkItems[i])[0]
        const value = checkItems[i][key]
        const flag = value === '' ||
          value === false ||
            value === null ||
            value === undefined ||
            (value && typeof value === 'object' && !Object.keys(value)?.length) ||
            (Array.isArray(value) && !value.length)

        if (flag) { // value가 비어있을 때 alert창을 띄워줍니다.
          this.$alert(message[key], { dangerouslyUseHTMLString: true })
          pass = false
          break
        }
      }
      return pass
    },
    close () {
      this.$emit('close')
    },
    /**
     * vm 복제 이벤트
     */
    save () {
      if (!this.cloneVms.length) return this.$alert(this.$t('common.ALERT.COMP.059')) // 복제할 자원이 없습니다.

      // 클론 될 자원 중,
      // 0. 관/조/프 선택 필수
      // 1. 이름이 없는 친구들이 있는지, (제거, 자원 명 => 메타로 분리)
      // 1-1. 중복 자원명이 있는지,
      // 2. 호스트명 중복 검사를 하지 않은 친구들이 있는지 검사합니다.
      // 3. 네트워크 카테고리를 선택하지 않은 친구들이 있는지 검사합니다.
      // 4. 사양의 vCPU/RAM이 0인 친구들이 있는지,
      // 5. IPAM을 통해 만들어진 자원이 아니면(this.isIpam = false) IP가 할당되지 않은 친구들이 있는지 검사합니다.
      // 6. 운영그룹을 선택하지 않은 친구들이 있는지 검사합니다.
      const notProjectInfo = this.cloneVms.filter(vm => !vm.projectInfo?.project?.projectIdx) // 0
      // const noNameVms = this.cloneVms.filter(vm => !vm.computeName?.trim()) // 1
      // const duplicateName = this.cloneVms.filter(vm => !vm.usableResourceName) // 1-1

      const unavailableHostnameVms = this.cloneVms.find(vm => !vm.passHostname) // 2
      const noNetworkCateVms = this.cloneVms.filter(vm => !vm.networkList?.length) // 3
      const noSizeVms = this.cloneVms.filter(vm => !vm.vcpu || !vm.memory) // 4
      const notIp = this.cloneVms.filter(vm => !vm.networkIp) // 5
      const notManageGroup = this.cloneVms.filter(vm => !vm.manageGroupIdx) // 6

      const checkValidItems = [
        { vmsProject: this.resourceInfo?.companyCi && this.resourceInfo?.companyPrefix ? true : !notProjectInfo.length },
        // { vmsName: !noNameVms.length }, // 1
        // { duplicateName: !duplicateName.length }, // 1-1
        { availableHostname: !unavailableHostnameVms }, // 2
        { vmsNetworkCate: !noNetworkCateVms.length }, // 3
        { vmsVcpuSize: !noSizeVms.length }, // 4
        { vmsipam: this.isIpam ? true : !notIp.length }, // 5
        { vmsManageGroup: !notManageGroup.length } // 6
      ]
      if (!this.noEmptyContents(checkValidItems)) return

      const vms = this.cloneVms.map(v => {
        const updated = {
          projectIdx: v.projectInfo.project?.projectIdx || undefined,
          groupIdx: v.projectInfo.group?.groupIdx || undefined,
          groupName: v.projectInfo.group?.groupName || undefined,
          isUrgent: v.isUrgent,
          hostname: v.hostname,
          hostName: v.hostname,
          vcpu: v.vcpu,
          socket: v.socket,
          memory: v.memory,
          networkList: v.networkList,
          price: v.price,
          script: v.replaceScript || v.script,
          manageGroupIdx: v.manageGroupIdx,
          vmUuid: this.resourceInfo?.vmUuid,

          // 메타 정보, 커스텀 요금은 원본 정보 그대로 넣어줌 (UI에서만 넣어줄 수 있음)
          metaInfo: this.resourceInfo?.metaInfo || '',
          customFee: this.resourceInfo?.customSpecList
            ? this.resourceInfo?.customSpecList.map(item => ({
              serviceIdx: item.serviceIdx,
              amount: item.resourceAmount
            }))
            : undefined

        }
        return updated
      })

      this.$emit('save', {
        vmData: this.resourceInfo,
        cloneVms: vms
      })
    },
    /**
     * vertical table에서 column을 제거합니다.
     * @param {Array} columns columns
     * @param {String, Array} binding 제거 할 column의 binding 키
     */
    removeColumn (columns, binding) {
      let filteredColumns
      if (Array.isArray(binding)) { // 제거 할 column이 배열로 들어올 때
        filteredColumns = columns.filter(col => !binding.includes(col.binding))
      } else filteredColumns = columns.filter(col => col.binding !== binding)
      return filteredColumns
    },
    byteToGb (size) {
      if (size) return this.$options.filters.byteToGb(size)
      else return 0
    },
    // ========= STATIC IP ==========
    /**
     * 기본적으로 처음에 클러스터 데이터를 가져옵니다.
     */
    async getClusters () {
      this.loading.cluster = true
      try {
        const clusters = await API.compute.getClusters()
        this.originClusters = [...clusters]
      } catch (error) {
        console.error('Erro::getClusters' + error)
      } finally {
        this.loading.cluster = false
      }
    },
    /**
     * 클러스터 Subnet 데이터를 가져옵니다.
     */
    async getClusterSubnets (elementIdx) {
      if (!elementIdx) return []
      try {
        this.loading.clusterSubnet = true
        const subnets = await API.compute.getClusterSubnets(elementIdx)
        return subnets
      } catch (error) {
        console.error('**Error: Get Cluster Subnet: ', error)
      } finally {
        this.loading.clusterSubnet = false
      }
    },
    /**
     * IP Band 전체 조회
     */
    async getIpBands ({ cateIdx }) {
      try {
        this.loading.ipBands = true
        const response = await API.network.getIpBands(cateIdx)
        this.ipBands = response
      } catch (error) {
        console.error('@@ getIpBands', error)
        this.ipBands = []
      } finally {
        this.loading.ipBands = false
      }
    },
    /**
     * 클러스터에 연결된 네트워크 정보를 네트워크 그리드에 세팅합니다. (업무쪽에서 get)
     * @param {Object} 하나의 클러스터 정보
     */
    async setIpGridData () {
      if (!this.editingCloneItem?.clusterUuid) {
        this.ipModalTableData = []
        return
      }

      const cls = this.originClusters.find(c => c.clusterUuid === this.editingCloneItem.clusterUuid)

      const data = []
      const subnets = await this.getClusterSubnets(cls?.elementIdx)

      subnets.forEach(subnet => {
        const copySubnet = {
          ...subnet,
          cateIdx: cls.cateIdx,
          cateName: cls.cateName || ''
        }

        // true 일 경우 자동 IP 입니다.
        const isAuto = !!subnet?.defaultGatewayIp

        // 자동 IP 이지만 IP Pool 이 없는 경우는 포함하지 않습니다.
        if (isAuto && !subnet.subnetPools) return

        const { pass, message, data: ipInfo = {} } = this.compareInIpBands(subnet, isAuto)
        const { band, params } = ipInfo || { band: {}, param: {} } // IP 관리대장에 등록된 정보들 || (없으면) 기본 값

        // 이미 기존에 선택되어있던 네트워크가 있다면 해당 내용 텍스트들로 data 를 채워줍니다.
        // 기존에 선택되어있던 내용이 없다면 기본 데이터 || 빈 문자열입니다. (자동일때, 수동일때 조건도 포함됩니다)
        const temp = { ...this.editingCloneItem.networkList[0] }
        const regIp = temp?.subnetUuid === subnet?.subnetUuid // 이미 이전에 선택된 네트워크가 있는 경우 true
        const hasSelected = regIp && !isAuto // 선택된 네트워크가 있고 && 수동 IP 일때
        const ipBand = band.ipRange || undefined // IP 대역

        const defaultCustomIp = regIp ? temp.ipAddress : ''
        const defaultGateway = (hasSelected) ? temp.gateway : band.gatewayIpAddress
        const defaultNetmask = (hasSelected) ? temp.netmask : band.netmask
        const defaultDns = (hasSelected) ? temp.dns : band.dnsIpAddress
        const defaultPrefix = (hasSelected) ? temp.prefix : band.prefixLength

        // [직접 입력] 되었는지 여부 와 입력된 데이터 등을 설정합니다.
        // 이 라인을 주석처리하면 에러가 납니다.. disabled 여부만 설정해주세요
        const editable = { edit: false, disabled: false } // v3 코드) 이젠 IPAM 도 수정 가능함?

        const customIp = { ...editable, data: defaultCustomIp }
        const defaultGatewayIp = { ...editable, data: defaultGateway }
        const netmask = { ...editable, data: defaultNetmask }
        const dns = { ...editable, data: defaultDns }
        const prefix = { ...editable, data: defaultPrefix }
        const activeIPAM = isAuto

        const subnetData = {
          ...copySubnet,
          customIp, // IP
          defaultGatewayIp, // Gateway
          netmask, // Netmask
          dns, // DNS
          prefix, // Prefix
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
      })

      this.ipModalTableData = [...data]
    },
    /**
     * Subnet vs IP 관리대장 비교 (업무 쪽 동일)
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
        prefixLength
      } = subnet

      const subnetRANGE = subnetIp ? `${subnetIp}/${prefixLength}` : undefined // IP 대역

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

        if (isAuto && (compare1 && compare2)) data = { band: { ...band, ipRange: bandRANGE }, params: { ipBandIdx } } // (IPAM ON) VLAN ID, 대역 모두 일치
        if (!isAuto && (compare1)) data = { band, params: { vlanId: bandVLAN } } // (IPAM OFF) VLAN ID 만 일치

        if (compare1 || compare2) { // 🌸 디버깅을 해보자!
          console.log(
            '%c## 비교 시작 ', 'color: yellow',
            '\nIPAM ON :: ', isAuto,
            '\nVLAN ID :: ', String(subnetVLAN), 'vs', bandVLAN, String(subnetVLAN) === bandVLAN,
            '\nIP 대역 :: ', subnetRANGE, bandRANGE, subnetRANGE === bandRANGE,
            '\n', data
          )
        }
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
     * 선택 네트워크 Ip (vm 업데이트와 동일 로직)
     */
    setSelectedNetwork (param, cateInfo) {
      if (!cateInfo) return

      const result = JSON.parse(JSON.stringify(this.editingCloneItem.networkList))
      const addSelectedInfo = {
        ...cateInfo,
        cateName: param?.cateName,
        subnetName: param?.subnetName,
        subnetUuid: param?.subnetUuid,
        vlanId: param?.vlanId,
        gateway: param?.gateway,
        dns: param?.dns,
        netmask: param?.netmask,
        prefix: param?.prefixLength
      }
      let hasIdIdx
      const hasId = result.filter((item, idx) => {
        if (item.cateId === cateInfo.cateId) {
          hasIdIdx = idx
          return true
        }
      })
      if (param.ipAddress) addSelectedInfo.ipAddress = param.ipAddress
      else delete addSelectedInfo.ipAddress

      if (hasId.length) result.splice(hasIdIdx, 1, addSelectedInfo)
      else result.push(addSelectedInfo)

      const item = this.cloneVms.find(item => item.frontId === this.editingCloneItem.frontId)

      item.networkIp = param
      item.networkList = [...result]
      item.ip = param
      this.updatePreviewData(item)

      this.cloneVmsIp = this.cloneVms.map(item => item.ip.ipAddress)
    },
    async checkHostnameAvailable (vm) {
      this.loading.isCreateHostNameIdx = true
      const isUsingHostnames =
        this.cloneVms.filter(vm => vm.passHostname)
          .map(vm => vm.hostname)
      const flag = await isAvailableHostname(vm.hostname, isUsingHostnames)
      this.loading.isCreateHostNameIdx = false

      if (!flag) return this.$alert('이미 존재하는 호스트 명입니다.', () => false)
      vm.passHostname = flag

      this.updatePreviewData(vm)
    },

    /**
     * 자원 명 중복 체크 후, 사용 가능 여부를 리턴합니다.
     */
    async isAvailableResourceName (cloneVm, index = null) {
      const insertName = cloneVm.computeName?.trim()
      if (!insertName) return

      try {
        this.loading.isCheckAvailableName = true
        const vmList = await await API.compute.getVms({
          projectIdx: cloneVm.projectInfo.project?.projectIdx,
          isProgress: true
        })
        const projectResourceName = vmList ? vmList.map(item => { // 프로젝트 내 기생성 Compute 명
          return item.computeName
        }) : []
        const cloneItemsResourceName = [] // 복제되는 친구들의 Compute 명
        this.cloneVms.forEach((vm, idx) => {
          if (index === null || index !== idx) cloneItemsResourceName.push(vm.computeName)
        })

        const availableInResource = ![...projectResourceName, ...cloneItemsResourceName].includes(insertName)

        // work 쪽 API 미개발로 주석 처리
        // 장바구니/주문함/사전협의/할일(작업완료되기전)에 동일 자원 명 있는 지 검사 (True: 존재 o)
        // const { data } = await API.work.isExistOrderedResource(
        //     cloneVm.projectInfo.project?.projectIdx,
        //     'computeName',
        //     insertName
        // )
        // const availableInWork = !data
        const availableInWork = true

        return availableInResource && availableInWork
      } catch (error) {
        console.log(error)
      } finally {
        this.loading.isCheckAvailableName = false
      }
    },
    /**
     * [디바운싱] 자원명 사용 가능 여부를 검사합니다.
     * @param {Object} clone 검사할 대상
     * @param {Number} index 검사할 대상의 index (새로 추가 시 null)
     * @param {Boolean} immediate 즉시 검사 여부를 결정합니다.
     */
    async testResourceName (clone, index = null, immediate = false) {
      const test = async () => {
        const isAvailable = await this.isAvailableResourceName(clone, index)
        clone.usableResourceName = isAvailable
      }
      if (immediate) return test()

      if (this.timer) clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        test()
        this.$forceUpdate()
      }, 300)
    },
    /**
     * 클론 전체 자원명 사용 가능 여부 검사
     */
    allTestResourceName () {
      this.cloneVms.forEach((clone, index) => {
        this.testResourceName(clone, index, true)
      })
    },
    /**
     * Cloud Init Script 변수에 치환될 Preview 데이터를 업데이트 합니다.
     * @param {Object} vm 클론 단일 아이템
     */
    updatePreviewData (vm) {
      const originVmNetworkInfo = this.resourceInfo?.nics?.length ? this.resourceInfo.nics[0] : null
      const baseNetwork = {
        dns: originVmNetworkInfo?.dns,
        gateway: originVmNetworkInfo?.gateway,
        netmask: originVmNetworkInfo?.netmask,
        prefix: originVmNetworkInfo?.prefix
      }
      const network = vm?.networkIp || baseNetwork

      vm.cloudInitPreviewData = {
        hostName: vm.passHostname ? vm.hostname : '',
        dns: network?.dns || '',
        gateway: network?.gateway || '',
        ip: network?.customIp?.data || '',
        netmask: network?.netmask || '',
        prefix: network?.prefix || ''
      }
    },
    /**
     * 운영그룹 Option 에 사용 가능 여부 값 추가 (disabled)
     */
    setManageGroupOptions (data = this.manageGroupOptions) {
      const manageGroupType = this.resourceInfo?.manageGroupType
      const clusterUuid = this.resourceInfo?.clusterUuid
      const nodeUuid = this.resourceInfo?.hostUuid

      // 운영그룹 사용 가능 여부를 반환합니다.
      const disableManageGroup = (group) => {
        if (manageGroupType && (manageGroupType === 'CLUSTER') && clusterUuid) return group.clusterNodeList.every(item => item.clusterNodeId !== clusterUuid)

        if (manageGroupType && (manageGroupType === 'NODE') && nodeUuid) return group.clusterNodeList.every(item => item.clusterNodeId !== nodeUuid)

        return true
      }

      this.manageGroupOptions = data.map(mg => {
        const disabled = disableManageGroup(mg)

        return {
          ...mg,
          disabled
        }
      })
    },

    // ======== [과금] ========
    /**
     * 클론 각각 다른 과금모델 적용 (프로젝트가 다를 수 있기 때문)
     */
    async getBillingInfo (vm) {
      try {
        const { billingInfo, appliedModel } = await getBillingModel(vm.projectInfo?.project)

        return { billingInfo, appliedModel }
      } catch (error) {
        console.error(error)
        this.$alert('과금 모델 조회에 문제가 발생했습니다.', () => false)
      }
    },
    /**
     * 클론 각각 과금을 세팅합니다. (과금 + 커스텀 요금)
     */
    async vmPriceInfo (vm) {
      if (!vm?.billingModel) return 0
      const price = await vmChargeInfo(vm, vm.billingModel, vm.appliedModel)

      const customFeePrice = await this.vmCustomFeeInfo(vm, vm.appliedModel) // 커스텀 요금
      console.log('👻', price)
      console.log('🤡', customFeePrice)
      return price + customFeePrice
    },
    vmCustomFeeInfo (vm, appliedModel) {
      const vmCustomSpecList = vm.customSpecList
      if (vmCustomSpecList) {
        const customSpecPriceList = vm.customSpecList.map(data => {
          const findCustomPrice = appliedModel?.options?.find(option => option.serviceIdx === data.serviceIdx)
          const valueByFare = this.getFares(data, findCustomPrice)

          return valueByFare
        })

        return customSpecPriceList.reduce((acc, cur) => acc + cur, 0)
      } else return 0
    },
    /**
     * 변동 과금인 경우 가격 구하기
     */
    getFares (data, customPrice) {
      if (!customPrice || !data) return 0
      if (customPrice.chargeType === 1) {
        // 고정 과금
        return parseInt(data.resourceAmount) * customPrice.fares[0].cost
      } else {
        const findFare = customPrice.fares.find(fare => {
          const findValue = parseInt(data.resourceAmount)
          if (fare.lowestLimit <= findValue && findValue <= fare.upperLimit) return fare
          else return false
        })
        if (findFare) return findFare.cost
        else return customPrice.fares[customPrice.fares.length - 1].cost
      }
    },

    // ======== [vCPU 소켓 설정] ========
    setCorePerSocketOptions (clone) {
      clone.corePerSocketOptions = this.getDivisors(clone.vcpu)

      if (!clone.corePerSocketOptions.includes(+clone.corePerSocket)) clone.corePerSocket = 1
    },
    /**
     * num 의 약수를 배열로 반환
     */
    getDivisors (num) {
      const divisors = []
      for (let i = 1; i <= num; i++) {
        if (num % i === 0) divisors.push(i)
      }
      return divisors
    }
  },
  data (root) {
    return {
      timer: null,
      hostName: '',
      loading: {
        setInitData: false,
        isServiceData: false,
        isCreateHostNameIdx: false, // 호스트명 인덱스 생성
        cluster: false, // 클러스터 조회
        clusterSubnet: false, // 클러스터 서브넷 조회
        isGetGroupTree: false,
        ipBands: false
      },
      groupTreeData: [],
      manageGroupOptions: [],
      billingModel: { // 과금 모델
        all: null,
        sw: null,
        hw: null,
        l4: null,
        l7: null,
        firewall: null,
        npc: null
      },
      appliedModel: {}, // 현재 적용되어 있는 과금 모델

      ipModalView: false, // IP 선택 모달
      networkCateModalView: false, // 네트워크 카테고리 모달
      selectProjectModalView: false, // 프로젝트 선택 모달
      scriptModalView: false, // Cloud Init Script 모달
      editingCloneItem: null, // IP 할당 중인 clone 아이템
      // isChangingHostname: false, // 호스트명 변경 중인지?
      resourceInfo: { // 기존 자원 정보
        projectInfo: {
          company: '신세계 I&C',
          group: 'IDC 사업팀',
          project: 'ITSM 프로젝트'
        },
        clusterNode: {
          cluster: 'CLUSTER001',
          node: 'NODE001'
        },
        isUrgent: false,
        computeName: 'ITSM Project Dev Server',
        hostname: 'sic-tanos-dwl01',
        itsmName: '[아,nu] ITSM Project Dev Server',
        networkCate: '김포 - Legacy- 내부',
        specOption: '일반 (SSD +  HDD)',
        vcpu: 1,
        memory: 1,
        rootDisk: 100,
        osImage: 'Linux/Kali_linux(x64)',
        externalDisk: [
          { name: '/app', data: '180GB' },
          { name: '/data1', data: '250GB' },
          { name: '/data2', data: '500GB' }
        ]
      },

      originClusters: [], // 클러스터 목록
      ipModalTableData: [],
      cloneVms: [ // 클론 할 vm들
      ],
      cloneVmsIp: [], // IP 수동 할당한 ip 주소들..

      resourceColumns: [ // 기존 자원 정보 항목 key
        { binding: 'projectInfo', header: '관계사/조직/프로젝트', keyPath: 'common.GRID.compGroupProject' },
        { binding: 'clusterNode', header: '클러스터/노드', keyPath: 'common.GRID.COMPUTE.clusterNode' },
        // { binding: 'computeName', header: '자원 명', keyPath: 'common.GRID.resourceName' },
        { binding: 'hostname', header: '호스트 명', keyPath: 'common.GRID.hostName' },
        // { binding: 'itsmName', header: '업무 명', keyPath: 'common.GRID.busiName' },
        { binding: 'networkCate', header: root.$v('네트워크 카테고리') },
        { binding: 'spec', header: '설정된 사양 정보', keyPath: 'common.GRID.settedSpecInfo' },
        { binding: 'osImage', header: 'OS 이미지', keyPath: 'common.GRID.COMPUTE.osImage' },
        { binding: 'externalDisk', header: 'Local Disk' },
        { binding: 'installProgramList', header: root.$v('설치프로그램') },
        { binding: 'licenseList', header: root.$v('S/W 라이선스') },
        { header: root.$v('운영그룹'), binding: 'manageGroup' },
        { binding: 'customFee', header: root.$v('Custom 요금'), colspan: true }
      ],
      cloneColumns: [ // 클론 vm 정보 항목 key
        { header: root.$v('긴급 처리 여부'), binding: 'isUrgent' },
        { binding: 'hostname', header: root.$v('호스트 명'), required: true },
        // { binding: 'computeName', header: '이름', keyPath: 'common.MODAL.name', required: true },
        { binding: 'projectInfo', header: '관계사-조직-프로젝트', keyPath: 'common.GRID.compGroupProject' },
        { binding: 'networkList', header: root.$v('네트워크 카테고리') },
        { binding: 'specOption', header: '사양옵션', keyPath: 'common.REGCON.specOption', required: true },
        { header: 'IP', binding: 'ipam', required: true },
        { header: 'Cloud Init Script', binding: 'script' },
        { header: root.$v('운영그룹'), binding: 'manageGroup', required: true }
      ]

    }
  }
}
</script>

<style lang="scss">
  .clone-vm {
    .clone-vm-contents {
      overflow-y: auto;
      overflow-x: hidden;
      .el-radio-group {
        > .el-radio {
          margin-right: $gap;
        }
      }
    }
    .clone-vm-foldable.fordable-wrap {
      margin-top: $gap;
      & > .foldable-title {
        color: $white;
        background-color: $dark-slate !important;
        .fold-arrow {
          transition: transform .25s;
          &.-is-expand {
            transform: rotate(-180deg);
          }
        }
      }
      & > .foldable-article {
        padding: 0;
        color: #9D9D9D;
        background-color: transparent;
        border-top: 1px solid $dark-gray;
      }
      .contents-title {
        min-width: 140px;
      }
      small {
        display: inline-block;
        font-size: 13px;
        color: #9D9D9D;
      }
      .-reference {
        margin-top: 5px;
        color: $input-placeholder;
        span, &.-alert { color: $main-red; }
      }
      .setting-hostname-wrap {
        .el-input::v-deep .el-input__inner { padding: 0 55px 0 15px; }
        .check-hostname-btn { min-width: 150px; }
      }
    }
    .-add-vm-btn {
      width: 100%;
      height: 50px;
    }
    ul.spec-wrap {
      color: #9D9D9D;
      margin-top: 22px;
      > li {
        display: flex;
        gap: $gap-s;
        align-items: center;
      }
      .set-vcpu {
        display: flex;
        align-items: center;
        gap: $gap-s;
        margin-bottom: $gap-s;
        & +.set-vcpu { margin-left: $gap; }
      }
    }

    .clone-price-wrap {
      font-size: 12px;
      font-weight: normal;
      width: 180px;
      opacity: .7;
      .clone-price {
        margin-left: $gap-s;
        > b { margin-left: 3px; font-size: 16px; font-weight: 600; }
      }
    }

    .script-exam { margin-top: $gap-s; }
  }
</style>
