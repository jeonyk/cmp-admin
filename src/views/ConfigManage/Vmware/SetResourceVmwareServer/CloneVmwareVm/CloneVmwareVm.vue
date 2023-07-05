<template>
  <section
    class="clone-vmware-vm"
    v-loading="loading.isServiceData ||
      loading.setInitData ||
      loading. isGetNetworkCate ||
      loading.isGetDatastore ||
      loading.isGetGroupTree"
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
          <vm-default-info-table :vm-info="resourceInfo" />
        </template>
      </g-foldable>

      <!-- 복제 되는 친구들 -->
      <g-foldable
        class="clone-vm-foldable"
        :title="`${resourceInfo.hostname || ''} #${(index < 9 ? '0' + Number(index + 1) : Number(index + 1))}`"
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
            :use-border-top="false"
          >
            <toggle-is-urgent-checkbox
              slot="isUrgent"
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
                  :selected-project-info="resourceInfo.projectInfo ? resourceInfo.projectInfo.project : null"
                  :group-tree-data="groupTreeData"
                  :loading="loading.isGetGroupTree"
                  :user-group-idx="user.userGroup"
                  :trigger-btn="$refs"
                  @select="(projectInfo) => changeProjectInfo(clone, projectInfo)"
                />
                <!-- :before-save-func="beforeSaveProjectInfo" -->
              </div>
            </template>
            <!-- 관계사-조직-프로젝트 -->

            <template #networkCates>
              <div
                class="flex-wrap"
                style="gap: 10px;"
              >
                <span v-if="clone.networkList && clone.networkList.length">
                  {{ clone.networkList[0].cateKey }}
                </span>

                <button
                  class="button"
                  type="is-primary"
                  @click="() => {
                    networkCateModalView = true
                    editingCloneItem = clone
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
            <!-- 네트워크 조직 -->

            <template #networkInfo>
              <cmp-grid
                v-if="clone.networkList && clone.networkList.length"
                :item-source="clone.networkList"
                :columns="networkInfoColumns"
              >
                <template #networkId="{ row }">
                  <el-select
                    v-model="row.networkId"
                    placeholder="네트워크를 선택하세요."
                    :popper-append-to-body="false"
                  >
                    <el-option
                      v-for="net in networkInfoList"
                      :key="net.networkId"
                      :label="net.name"
                      :value="net.networkId"
                    />
                  </el-select>
                </template>
                <template #vlanId=" { row }">
                  <span v-if="row.networkId">
                    {{ row.vlanId || '-' }}
                  </span>
                  <small v-else>
                    네트워크를 선택하세요.
                  </small>
                </template>
                <template #distributedSwitchName=" { row }">
                  <span v-if="row.networkId">
                    {{ row.distributedSwitchName || '-' }}
                  </span>
                  <small v-else>
                    네트워크를 선택하세요.
                  </small>
                </template>
              </cmp-grid>
              <span
                v-else
                class="empty-data"
              >네트워크-조직을 추가해주세요.</span>
            </template>
            <!-- 네트워크 선택 -->

            <template #hostname>
              <div class="flex-wrap">
                <el-input
                  v-model="clone.hostname"
                  :maxlength="80"
                  placeholder="호스트 명"
                  clearable
                  show-word-limit
                  :disabled="clone.passHostname"
                  style="margin-right: 10px;"
                />
                <button
                  v-if="!clone.passHostname"
                  v-loading="loading.isCreateHostNameIdx"
                  class="button"
                  type="is-primary"
                  :disabled="!clone.hostname"
                  @click="checkHostnameAvailable(clone)"
                  style="min-width: 160px;"
                >
                  호스트 명 중복 검사
                </button>
                <button
                  v-else
                  class="button"
                  type="is-primary"
                  @click="clone.passHostname = false"
                >
                  변경
                </button>
              </div>
            </template>
            <!-- 호스트명 -->

            <template #datastore>
              <datastore-list
                :loading="loading.isGetDatastore"
                :init-auto-select-row="clone.datastore"
                :datastore-list="datastoreList"
                :will-added-disk-size-gb="clone.datastore
                  ? clone.datastore.willAddedDiskSizeGB
                  : resourceInfo.willAddedDiskSizeGB"
                @select="data => clone.datastore = data"
              />
            </template>
            <!-- 데이터스토어 선택 -->

            <template #specOption>
              <div class="flex-wrap">
                <b>{{ resourceInfo.hostname }}</b>
                <small style="margin-left: 10px;">{{ `vCPU : ${resourceInfo.vcpu}Core, RAM : ${resourceInfo.memory}GB, DISK : ${resourceInfo.rootDiskSize}GB` }}</small>
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
        +{{ $v('복제 항목 개수 추가') }}
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
        {{ $v('복제') }}
      </button>
    </section>

    <!-- 네트워크 카테고리 선택 모달 -->
    <network-category-tree-selection
      :visible="networkCateModalView"
      :init-data="editingCloneItem ? editingCloneItem.networkList : null"
      @close="networkCateModalView = false"
      @save="data => changeNetworkCate(editingCloneItem, data)"
    />
  </section>
</template>

<script>
import API, {
  NetworkCategoryTreeSelection, SelectFromTree,
  isAvailableHostname, joinExternalDiskList, setNetworkInfoOperation,
  getBillingModel, vmChargeInfo, ToggleIsUrgentCheckbox
} from '@sd-fe/cmp-core'
import { mapState } from 'vuex'
import { cloneDeep } from 'lodash'
import GFoldable from '@/components/common/g-foldable/g-foldable'
import VmDefaultInfoTable from '../VMwareComponents/VmDefaultInfoTable.vue'
import DatastoreList from '../VMwareComponents/DatastoreList.vue'

import ComputeUpdateMixins from '@/components/Modal/UpdateResource/ComputeUpdateForm/ComputeUpdate.mixins.js'

export default {
  name: 'CloneVmwareVm',
  mixins: [ComputeUpdateMixins],
  components: {
    NetworkCategoryTreeSelection,
    'g-foldable': GFoldable,
    VmDefaultInfoTable,
    DatastoreList,
    SelectFromTree,
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
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      packageType: state => state.auth.packageType
    })
  },
  async created () {
    await this.getGrooupTreeData()
    await this.getOperationGroup()

    if (this.vmData.hostUuid) {
      const hostUuid = this.vmData.hostUuid
      await this.getNetworkInfoList(hostUuid) // 네트워크 목록 조회
      await this.getDatastoreList(hostUuid) // datastorage 목록 조회
    }

    this.resourceInfo = await this.setResource(this.vmData)
    console.log('@@가공 정보: ', this.resourceInfo)

    await this.setManageGroupOptions() // 운영그룹 disable 설정 (this.resourceInfo 세팅 후 설정 가능)

    this.$nextTick(function () {
      if (this.resourceInfo && !Object.values(this.resourceInfo.projectInfo).includes(null)) this.addCloneItem() // 복제 VM default로 한 개 추가
    })
  },
  methods: {
    /**
     * 그룹 tree 데이터 세팅
     */
    async getGrooupTreeData () {
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
    * API: 운영그룹 목록을 조회합니다.
    */
    async getOperationGroup () {
      try {
        const { data } = await API.billing.getOperationGroup({
          moduleType: 'VMWARE',
          operatingGroupType: 'COMPUTE'
        })
        this.manageGroupOptions = data || []
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('운영 그릅 조회에 실패하였습니다.'), () => false)
      }
    },
    /**
     * 네트워크 카테고리 조회
     */
    async getNetworkCategory (param) {
      try {
        this.loading.isGetNetworkCate = true
        const categories = await API.network.getNetworkCategory(param)
        if (categories) return categories
        return categories
      } catch (error) {
        console.error('Error;Get NetworkCategory List: ', error)
      } finally {
        this.loading.isGetNetworkCate = false
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
     * network 조회
     */
    async getNetworkInfoList (hostUuid = this.vmInfo.esxi.hostUuid) {
      try {
        this.loading.isGetNetworkInfo = true
        const data = await API.vmware.network.getVmwareNetworkList({ hostUuid })
        this.networkInfoList = data
      } catch (error) {
        console.error(error)
        return this.$alert('Network 조회에 문제가 발생했습니다.')
      } finally {
        this.loading.isGetNetworkInfo = false
      }
    },
    /**
     * Datastore 조회
     */
    async getDatastoreList (hostUuid = this.vmInfo.esxi.hostUuid) {
      try {
        this.loading.isGetDatastore = true
        const data = await API.vmware.datastore.getDatastoreList({ hostUuid })
        this.datastoreList = data
      } catch (error) {
        console.error(error)
        return this.$alert('Datastore 조회에 문제가 발생했습니다.')
      } finally {
        this.loading.isGetDatastore = false
      }
    },
    /**
     * 데이터스토어 이름으로 datastoreId를 가져옵니다.
     */
    getDatastoreIdFromDatastoreName (datastoreName) {
      const datastore = this.datastoreList.find(name === datastoreName)
      return datastore?.datastoreId || null
    },
    /**
     * 기존 자원 정보 데이터 세팅
     */
    async setResource (vm) {
      this.loading.setInitData = true
      try {
        console.log('@최초 VM: ', vm)
        const userInfo = vm?.userInfo

        const pr = await this.getProject(vm?.projectIdx || userInfo.projectIdx)
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

        // 네트워크 카테고리 => networkAdapterList / userInfo.networkList 비교 (unitNumber)
        const networkCateList = []
        if (vm.networkAdapterList?.length && userInfo?.networkList?.length) {
          const userNetworks = userInfo.networkList

          vm.networkAdapterList.forEach(net => {
            const sameNetwork = userNetworks.find(item => net.unitNumber === item.unitNumber)
            if (sameNetwork) {
              const { cateKey, cateIdx, cateName } = sameNetwork
              networkCateList.push({
                ...net,
                cateKey,
                cateId: cateIdx,
                cateIdx,
                cateName,
                name: cateKey
              })
            }
          })
        }

        // external Disk
        let externalDisk = []
        let rootDisk, rootDiskSize
        if (vm.diskList) {
          externalDisk = joinExternalDiskList(vm.diskList, userInfo?.externalDiskList)

          rootDisk = externalDisk.find(disk => disk.controllerKey === 1000 && disk.unitNumber === 0)
          rootDiskSize = rootDisk ? rootDisk.size : 0
        }
        const externalDiskList = externalDisk.filter(disk => !(disk.controllerKey === 1000 && disk.unitNumber === 0))
        const allExternalDisksSize = externalDiskList.reduce((a, b) => a + b.size, 0)

        let datastore // 데이터스토어
        if (vm.vmPathName) {
          const datastoreName = this.$options.filters.textBetween(vm.vmPathName, '[', ']') // datastore 이름: vmPathName의 '[', ']' 사이에 있는 이름
          datastore = this.datastoreList.find(dt => dt.name === datastoreName)
        }

        let selectImage
        if (vm.userInfo?.imageId) selectImage = await this.getVMwareImage(vm.userInfo.imageId)

        // 운영정보
        let manageGroupName, manageGroupType
        const manageGroupIdx = vm?.userInfo?.manageGroupIdx
        if (manageGroupIdx) {
          const findManageGorupInfo = this.manageGroupOptions.find(g => g.operatingGroupIdx === manageGroupIdx)

          if (findManageGorupInfo) {
            manageGroupName = findManageGorupInfo.operatingGroupName
            manageGroupType = findManageGorupInfo?.clusterNodeList?.length ? findManageGorupInfo.clusterNodeList[0].clusterNodeType : undefined
          }
        }

        const origin = {
          ...vm,
          companyCi: projectInfo?.company?.companyCi,
          companyPrefix: projectInfo?.company?.companyPrefix,
          projectInfo,
          hostname: vm.name,
          selectImage,
          esxi: vm.esxi?.name,
          clusterId: vm.esxi?.cluster?.clusterId,
          hostUuid: vm.esxi?.hostUuid,
          vcpu: vm.cpuCores || 0,
          socket: vm.socket || 0,
          memory: vm.memorySize ? vm.memorySize / 1024 : 0,
          rootDiskSize,
          corePerSocket: vm.cpuCores / vm.socket,
          corePerSocketOptions: this.getDivisors(vm.cpuCores),
          externalDiskList,
          networkList: networkCateList,
          datastore,
          allExternalDisksSize,

          willAddedDiskSizeGB: allExternalDisksSize + rootDiskSize, // disable 데이터스토어를 설정하기 위함

          manageGroupIdx,
          manageGroupName,
          manageGroupType,

          // 메타 정보, 커스텀 요금은 원본 정보 그대로 넣어줌 (UI에서만 넣어줄 수 있음)
          metaInfo: vm?.metaInfo,
          customFee: vm?.customSpecList
            ? vm?.customSpecList.map(item => ({
              serviceIdx: item.serviceIdx,
              amount: item.resourceAmount
            }))
            : undefined
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
     * 관계사의 서비스 코드 세팅
     */
    setServiceCode (companyInfo) {
      if (!companyInfo.companyPrefix) return ''
      if (companyInfo.companyPrefix.length <= 3) return companyInfo.companyPrefix
      return companyInfo.companyPrefix.substring(companyInfo.companyPrefix.length - 3, companyInfo.companyPrefix.length)
    },

    /**
     * '복제 항목 개수 추가' 클릭 시, 복제 VM의 갯수를 늘립니다.
     */
    async addCloneItem () {
      this.loading.setInitData = true
      const cloneItem = cloneDeep(this.resourceInfo)

      cloneItem.isUrgent = true

      // 호스트명 직접 입력 대비
      cloneItem.hostname = ''
      cloneItem.passHostname = false

      cloneItem.originProjectInfo = this.resourceInfo.projectInfo

      this.cloneVms.push(cloneItem)
      this.setDatastoreList()

      this.loading.setInitData = false
    },

    /**
     * 복제 항목 삭제
     */
    deleteItem (idx, deletedItem) {
      const itemTitle = `${deletedItem.hostname || ''} #${(idx < 9 ? '0' + Number(idx + 1) : Number(idx + 1))}`

      this.$confirm(`복제 항목 <b>${itemTitle}</b>을<br>삭제하시겠습니까?`, '', {
        dangerouslyUseHTMLString: true
      }).then(() => {
        this.cloneVms.splice(idx, 1)

        // for (let i = 0; i < this.cloneVms.length; i++) {
        //   if (deletedItem?.hostname &&
        //  (this.cloneVms[i]?.hostname === deletedItem.hostname)) {
        //     this.cloneVms[i].usableResourceName = true
        //     break
        //   }
        // }

        this.setDatastoreList()
      }).catch(() => false)
    },
    /**
     * 네트워크 조직 변경 시, 발생 이벤트
     * @param {Object} vm 호스트명이 변경되는 단일 vm 정보
     * @param {Array} data 새로 설정되는 네트워크 카테고리 정보
     */
    changeNetworkCate (vm, data) {
      vm.networkList = data

      this.$forceUpdate()

      this.changeSpec(vm)
    },
    /**
     * 관계사-조직-프로젝트 변경 시, 발생 이벤트
     */
    changeProjectInfo (item, projectInfo) {
      item.projectInfo = projectInfo
      // this.allTestResourceName()
    },
    /**
     * API: [VMware] 이미지 정보 조회 (단건)
     * @param {Number} userImageIdx
     */
    async getVMwareImage (userImageIdx) {
      if (isNaN(userImageIdx)) return
      try {
        const data = await API.vmware.image.getVMwareImage(userImageIdx)
        return data || null
      } catch (error) {
        console.error('이미지 조회에 문제가 발생했습니다: ', error)
      }
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
        vmsVcpuSize: this.$v('신청 불가능한 사양이 입력된 자원이 있습니다.<br>( vCPU 최소값: 1Core, RAM 최소값: 1GB )'),
        vmsProject: this.$v('프로젝트를 선택하지 않은 자원이 있습니다.'),
        vmsNetworkCate: this.$v('네트워크 조직을 선택하지 않은 자원이 있습니다.'),
        vmsNetwork: this.$v('네트워크를 선택하지 않은 자원이 있습니다.'),
        availableHostname: this.$v('호스트 명 중복 검사를<br>완료하지 않은 자원이 있습니다.'),
        vmsDatastore: this.$v('데이터스토어를 선택하지 않은 자원이 있습니다.'),
        overflowDatastoreSize: this.$v('용량 부족 데이터스토어를 선택한 자원이 있습니다.')
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
     * 저장 전 필수 값 체크 validation
     * @return {Boolean} true: pass
     */
    beforeSaveValid () {
      // 클론 될 자원 중,
      // 0. 소스 vm의 관계사 Prefix/Ci 없을 때 => 관/조/프 선택 필수
      // 1-1. 이름이 없는 친구들이 있는지 (제거),
      // 1-2. 중복 자원명이 있는지 (제거),
      // 2. 네트워크 조직을 선택하지 않은 친구들이 있는지,
      // 3. 네트워크를 선택하지 않은 친구들이 있는지,
      // 4. [직접 입력 o]호스트명 중복 검사를 하지 않은 친구들이 있는지 검사합니다.
      // 5-1. 데이터스토어를 선택하지 않은 친구들이 있는지 검사합니다.
      // 5-2. 선택 데이터스토어가 용량 부족인 친구들이 있는지 검사합니다.
      // 6. 사양의 vCPU/RAM이 0인 친구들이 있는지,
      const notProjectInfo = this.cloneVms.filter(vm => !vm.projectInfo?.project?.projectIdx) // 0
      // const noNameVms = this.cloneVms.filter(vm => !vm.resourceName?.trim()) // 1-1
      // const duplicateName = this.cloneVms.filter(vm => !vm.usableResourceName) // 1-2
      const noNetworkCateVm = this.cloneVms.find(vm => !vm.networkList?.length) // 2
      const noNetworkVm = this.cloneVms.find(vm => {
        if (!vm.networkList.every(item => item.networkId)) return vm
      })
      const unavailableHostnameVms = this.cloneVms.find(vm => !vm.passHostname) // 4
      const noDatastoreVms = this.cloneVms.filter(vm => !vm.datastore) // 5-1
      const overFlowDatastoreSizeVms = this.cloneVms.filter(vm => vm.datastore?.isSelectable === false) // 5-2
      const noSizeVms = this.cloneVms.filter(vm => !vm.vcpu || !vm.memory) // 6

      const checkValidItems = [
        { vmsProject: this.resourceInfo?.companyCi && this.resourceInfo?.companyPrefix ? true : !notProjectInfo.length },
        { vmsNetworkCate: !noNetworkCateVm },
        { vmsNetwork: !noNetworkVm },
        { vmsDatastore: !noDatastoreVms.length },
        { overflowDatastoreSize: !overFlowDatastoreSizeVms.length },
        { vmsVcpuSize: !noSizeVms.length },
        { availableHostname: !unavailableHostnameVms }
      ]
      return (this.noEmptyContents(checkValidItems))
    },
    /**
     * vm 복제 이벤트
     */
    save () {
      if (!this.cloneVms.length) return this.$alert(this.$t('common.ALERT.COMP.059')) // 복제할 자원이 없습니다.

      const passValid = this.beforeSaveValid()

      if (!passValid) return

      const vms = this.cloneVms.map(v => {
        // 네트워크 정보 (operation 정보 세팅)
        const setOperationNetworkList = setNetworkInfoOperation(this.resourceInfo.networkList, v.networkList)

        const updated = {
          projectIdx: v.projectInfo.project?.projectIdx || undefined,
          isUrgent: v.isUrgent,
          hostName: this.resourceInfo.hostname,
          reqUserId: this.user.userId,
          userVmIdx: this.resourceInfo.userVmIdx,
          vmUuid: this.resourceInfo.vmUuid,
          vcpu: v.vcpu,
          socket: v.socket,
          memory: v.memory,
          networkList: setOperationNetworkList,
          cloneDatastoreId: v.datastore?.datastoreId,
          cloneHostname: v.hostname,
          cloneHostUuid: this.resourceInfo.hostUuid,
          manageGroupIdx: v.manageGroupIdx,
          price: v.price,

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
    /**
     * 프로젝트 선택 전 실행 메서드
     */
    beforeSaveProjectInfo (param, done) {
      if (!this.noCompanyPrefix(param)) return false
      else done()
    },
    /**
     * 선택한 관계사의 Prefix / ci가 존재하는지 판단
     * @param {Object} param 선택한 프로젝트 정보
    */
    noCompanyPrefix (param) {
      if (param?.companyIdx === null) return false

      const goToManageGroupPage = () => {
        this.$router.push({
          name: 'set-organization',
          query: {
            companyIdx: param.companyIdx
          }
        })
      }

      // Prefix 없을 때
      if (!param?.companyPrefix) {
        this.$confirm(
          this.$v('선택한 관계사의 Prefix를 먼저 등록해주세요.<br><br><span style="color: #d95252;">* 확인 클릭 시 등록 페이지로 이동합니다.</span>'),
          { dangerouslyUseHTMLString: true }
        )
          .then(() => goToManageGroupPage())
          .catch(() => false)
      }

      // Ci 없을 때
      if (!param?.companyCi) {
        this.$confirm(
          this.$v('선택한 관계사의 CI명을 먼저 등록해주세요.<br><br><span style="color: #d95252;">* 확인 클릭 시 등록 페이지로 이동합니다.</span>'),
          { dangerouslyUseHTMLString: true }
        )
          .then(() => goToManageGroupPage())
          .catch(() => false)
      }
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
    },
    /**
     * 자원 명 중복 체크 후, 사용 가능 여부를 리턴합니다.
     */
    async isAvailableResourceName (cloneVm, index = null) {
      const insertName = cloneVm.resourceName?.trim()
      if (!insertName) return

      try {
        this.loading.isCheckAvailableName = true

        const vmList = await API.vmware.vm.getVmwareVmList({
          isAdmin: true,
          isProgress: true,
          userId: this.user.userId,
          projectIdx: cloneVm.projectInfo.project?.projectIdx
        })
        const projectResourceName = vmList ? vmList.map(item => {
          const metaInfo = item?.userInfo?.metaInfo ? JSON.parse(item?.userInfo.metaInfo) : null
          // 프로젝트 내 기생성 자원명
          return metaInfo?.resourceName || ''
        }) : []
        const cloneItemsResourceName = [] // 복제되는 친구들의 Compute 명
        this.cloneVms.forEach((vm, idx) => {
          if (index === null || index !== idx) cloneItemsResourceName.push(vm.resourceName)
        })

        const availableInResource = ![...projectResourceName, ...cloneItemsResourceName].includes(insertName)

        // // 장바구니/주문함/사전협의/할일(작업완료되기전)에 동일 자원 명 있는 지 검사 (True: 존재 o) => 업무 쪽 API 완료 후 추가 예정
        // const { data } = await API.work.isExistOrderedResource(
        //     cloneVm.projectInfo.project?.projectIdx,
        //     'computeName',
        //     insertName
        // )
        // const availableInWork = !data

        // return availableInResource && availableInWork
        return availableInResource
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
    // async testResourceName (clone, index = null, immediate = false) {
    //   const test = async () => {
    //     const isAvailable = await this.isAvailableResourceName(clone, index)
    //     clone.usableResourceName = isAvailable
    //   }
    //   if (immediate) return test()

    //   if (this.timer) clearTimeout(this.timer)
    //   this.timer = setTimeout(() => {
    //     test()
    //     this.$forceUpdate()
    //   }, 300)
    // },
    /**
     * 클론 전체 자원명 사용 가능 여부 검사
     */
    // allTestResourceName () {
    //   this.cloneVms.forEach((clone, index) => {
    //     this.testResourceName(clone, index, true)
    //   })
    // },
    /**
     * 데이터스토어 목록에 willAddedDiskSizeGB 정보를 추가합니다.
     */
    setDatastoreList () {
      this.datastoreList.forEach(ds => { ds.willAddedDiskSizeGB = 0 })

      this.cloneVms.forEach(vm => {
        const findedDatastore = this.datastoreList.find(ds => ds.datastoreId === vm?.datastore?.datastoreId)

        findedDatastore.willAddedDiskSizeGB += vm.willAddedDiskSizeGB || 0

        vm.datastore = findedDatastore
      })
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
    },
    /**
     * 운영그룹 Option 에 사용 가능 여부 값 추가 (disabled)
     */
    setManageGroupOptions (data = this.manageGroupOptions) {
      const manageGroupType = this.resourceInfo?.manageGroupType
      const clusterUuid = this.resourceInfo?.clusterId
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
     * 사양 (vCPU, RAM), 네트워크 조직 변경 이벤트
     */
    async changeSpec (clone) {
      clone.price = await this.vmPriceInfo(clone)
    },
    /**
     * 클론 각각 과금을 세팅합니다. (과금 + 커스텀 요금)
     */
    async vmPriceInfo (vm) {
      if (!vm?.billingModel) return 0
      const price = await vmChargeInfo(vm, vm.billingModel, vm.appliedModel)
      console.log('👻', price)

      const customFeePrice = await this.vmCustomFeeInfo(vm, vm.appliedModel) // 커스텀 요금
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
    }

  },
  data (root) {
    return {
      hostName: '',
      loading: {
        setInitData: false,
        isServiceData: false,
        isGetNetworkCate: false, // 네트워크 카테고리 조회
        isCreateHostNameIdx: false, // 호스트명 인덱스 생성
        isGetDatastore: false, // 데이터스토어 조회
        cluster: false, // 클러스터 조회
        isGetGroupTree: false // 프로젝트 트리 조회
      },
      selectProjectModalView: false, // 프로젝트 선택 모달
      networkCateModalView: false, // 네트워크 카테고리 모달
      editingCloneItem: null, // IP 할당 중인 clone 아이템
      datastoreList: [], // 데이터스토어 목록
      groupTreeData: [],
      manageGroupOptions: [],
      resourceInfo: { // 기존 자원 정보
        projectInfo: {
          company: '신세계 I&C',
          group: 'IDC 사업팀',
          project: 'ITSM 프로젝트'
        },
        resourceName: 'ITSM Project Dev Server',
        hostName: 'sic-tanos-dwl01',
        itsmName: '[아,nu] ITSM Project Dev Server',
        vcpu: 1,
        memory: 1,
        rootDisk: 100,
        externalDisk: []
      },

      cloneVms: [], // 클론 할 vm들

      networkInfoColumns: [
        { header: '네트워크 조직', binding: 'cateKey', filtable: false },
        { header: '네트워크', binding: 'networkId', customHtml: true, filtable: false },
        { header: 'VLAN ID', binding: 'vlanId', customHtml: true, filtable: false, width: 150 },
        { header: 'Distributed Switch 명', binding: 'distributedSwitchName', customHtml: true, filtable: false }
      ],

      cloneColumns: [ // 클론 vm 정보 항목 key
        { header: root.$v('긴급 처리 여부'), binding: 'isUrgent' },
        { binding: 'projectInfo', header: root.$v('관계사/조직/프로젝트'), required: true },
        // { binding: 'resourceName', header: root.$v('자원 명'), required: true },
        { binding: 'networkCates', header: root.$v('네트워크 조직'), required: true },
        { binding: 'networkInfo', header: root.$v('네트워크 선택'), required: true },
        { binding: 'hostname', header: root.$v('호스트 명'), required: true },
        { header: '데이터스토어 선택', binding: 'datastore', required: true },
        { binding: 'specOption', header: root.$v('사양 옵션'), required: true },
        { binding: 'manageGroup', header: root.$v('운영그룹'), required: true }
      ]

    }
  }
}
</script>

<style lang="scss">
  .clone-vmware-vm {
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
        display: block;
        margin-top: 5px;
        color: $input-placeholder;
        span, &.-alert { color: $main-red; }
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

  }
</style>
