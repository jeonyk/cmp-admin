<!--
  * 파일명 : VMwareComputeUpdateForm.vue
  * 파일 기능 : VMware Compute 자원 정보 수정 form
  * 작성자 : 김예담
  * License By Shinsegae I&C
 -->

<template>
  <div
    class="compute-update-form"
    v-loading="loading.initVmData || loading.isGetConfig || loading.settingInitData || loading.isCheckAvailableName"
  >
    <marketplace-info
      v-if="!isEmpty(vmInfo.market)"
      class="marketplace-info"
      :data.sync="market"
      :loading="loading.isGetMarket"
      for-compute
    />

    <div
      class="form-wrapper"
      :style="{ maxHeight: !isEmpty(vmInfo.market) ? `calc(${height} - 200px)` : height }"
    >
      <section
        id="defaultInfo"
        v-if="data"
      >
        <p class="small-title">
          {{ $t('common.GRID.resDefaultInfo') }}
          <!-- 자원 기본 정보 -->
        </p>
        <vertical-table
          v-if="data && fixData"
          :data.sync="fixData"
          :columns="fixDataColumns"
          type="horizontal"
          :title-width-px="180"
        >
          <template #hostName>
            <div
              class="flex-wrap"
              style="gap: 5px;"
            >
              <cmp-status-tag
                v-if="data.market"
                type="mp"
                contents="MP"
              />
              <cmp-status-tag
                v-else-if="data.era"
                type="mp"
                contents="DB"
              />
              <span>{{ fixData.hostName }}</span>
            </div>
          </template>
          <!-- 호스트 명 -->

          <template #osImage>
            <set-os-icon
              class="align-center-wrap"
              :os-name="fixData.osImage || ''"
            />
          </template>
          <!-- OS 이미지 -->

          <template #nicIps>
            <span v-if="fixData.nicIps && fixData.nicIps.length">
              <ul
                v-for="(ip,nicdx) in fixData.nicIps"
                :key="nicdx"
              >
                <li>{{ ip.ipAddress }}</li>
              </ul>
            </span>
            <span v-else>-</span>
          </template>
          <!-- IP -->

          <template #serviceDate>
            <span>{{ fixData.serviceDate | date('YYYY.MM.DD HH:mm') }}</span>
          </template>
        </vertical-table>
      </section>

      <p
        class="small-title"
        v-if="data"
      >
        {{ $t('common.GRID.resChangeableInfo') }}
        <!-- 자원 변경 가능 정보 -->
      </p>
      <section
        id="changableInfo"
        v-if="changableColumns"
        class="create-compute-wrap"
        :style="{maxHeight: height}"
      >
        <vertical-table
          :data="vmInfo"
          :columns="changableColumns"
          :title-width-px="180"
        >
          <resource-filter-component
            slot="projectInfo"
            ref="groupSelect"
            :is-replace-filtering-component="false"
            :init-company-idx="!data && selectedProject ? selectedProject.companyIdx : undefined"
            :init-group-idx="!data && selectedProject ? selectedProject.groupIdx : undefined"
            :init-project-idx="!data && selectedProject ? selectedProject.projectIdx : undefined"
            cloud-type="private"
            @change="param => {
              if(noCompanyPrefix(param)) return
              vmInfo.projectInfo = param
              vmInfo.hostNameIdx = null

            }"
          />
          <!-- 프로젝트 선택 -->

          <el-input
            slot="resourceName"
            :placeholder="$t('common.MODAL.name')"
            v-model="vmInfo.resourceName"
            maxlength="25"
            show-word-limit
            style="width: 510px;"
          />
          <!-- 이름 -->

          <el-select
            slot="servicePart"
            v-model="vmInfo.servicePart"
            :placeholder="$t('common.PLACEHOLDER.serviceSelectCate')"
            :popper-append-to-body="false"
            class="form-input"
            @change="vmInfo.hostNameIdx = null"
          >
            <el-option
              v-for="item in servicePartOptions"
              :key="item.codeIdx"
              :label="item.codeName"
              :value="item.codeVal"
            />
          </el-select>
          <!-- 서비스 구분 -->

          <el-select
            slot="serviceType"
            v-model="vmInfo.serviceType"
            :placeholder="$t('common.PLACEHOLDER.serviceSelectType')"
            :popper-append-to-body="false"
            :disabled="!!(data && data.era)"
            class="form-input"
            @change="vmInfo.hostNameIdx = null"
          >
            <el-option
              v-for="item in serviceTypeOptions"
              :key="item.codeIdx"
              :label="item.codeName"
              :value="item.codeVal"
            />
          </el-select>
          <!-- 서비스 유형 -->

          <el-radio-group
            v-model="vmInfo.clusterType"
            slot="clusterType"
          >
            <el-radio label="MIXED">
              <!-- 일반 (HDD + SSD) -->
              {{ $t('common.GRID.COMPUTE.mixed') }}
            </el-radio>
            <el-radio label="ALL_FLASH">
              <!-- 고성능 (SSD) -->
              {{ $t('common.GRID.COMPUTE.allFlash') }}
            </el-radio>
            <el-radio
              label="ALL_HDD"
              disabled
            >
              <!-- GPU 사용 -->
              {{ $t('common.GRID.COMPUTE.allHdd') }}
            </el-radio>
          </el-radio-group>
          <!-- 사양 옵션 -->

          <template #networkList>
            <networkcate-selection
              @data="saveNetworkOrg"
              :cate-limit="1"
              :cate-lists="vmInfo.networkList"
            />
          </template>
          <!-- 네트워크 조직 -->

          <ul
            class="register-form-list"
            slot="hostName"
          >
            <li class="register-form-item disable">
              <span>{{ companyCode }}</span>
              <!-- 관계사 코드 -->
              <span style="margin: 0 10px;">-</span>
              <el-input
                v-model="vmInfo.serviceCode"
                class="-code"
                :placeholder="$t('common.PLACEHOLDER.code')"
                :disabled="vmInfo.hostNameIdx != null"
                maxlength="5"
                show-word-limit
                @input="e => vmInfo.hostNameIdx = null"
              />
              <!-- 코드 -->
            </li>
            <li class="register-form-item">
              <span
                style="margin-right: 10px;"
                class="disable"
              >-
                {{ vmInfo.servicePart ? vmInfo.servicePart : `\{${$t('common.GRID.serviceClass')}\}` }}
                <!-- 서비스 구분 -->
                {{ vmInfo.serviceType ? vmInfo.serviceType : `\{${$t('common.GRID.serviceType')}\}` }}
                <!-- 서비스 유형 -->
                {{ (vmInfo.networkOrg && vmInfo.networkOrg.cateCode) ? vmInfo.networkOrg.cateCode : `\{${$t('common.GRID.COMPUTE.networkOrg')}\}` }}
                <!-- 네크워크 조직 -->
                {{ vmInfo.hostNameIdx ? vmInfo.hostNameIdx : `\{${$t('common.GRID.hostName')} IDX\}` }}
                <!-- 호스트명 IDX -->
              </span>
              <button
                class="button"
                type="is-primary"
                :disabled="vmInfo.hostNameIdx"
                v-loading="loading.isCreateHostNameIdx"
                @click="e => {
                  if(vmInfo.hostNameIdx) return
                  createHostIndex(vmInfo)
                }"
              >
                <!-- 인덱스 생성 -->
                {{ $t('common.BTN.createIndex') }}
              </button>
              <el-tag
                v-if="vmInfo.hostNameIdx"
                style="margin-left: 10px;"
                closable
                @close="() => {
                  vmInfo.hostNameIdx = null
                  this.$forceUpdate()
                }"
              >
                {{ finalHostName }}{{ vmInfo.hostNameIdx }}
              </el-tag>
            </li>
          </ul>
          <!-- 호스트 명 -->

          <span
            slot="itsmName"
            class="disable"
            style="margin-right: 10px;"
          >
            {{ vmInfo.itsmName }}
          </span>
          <!-- 업무 명 -->

          <template #appManageTeam>
            <div class="select-team">
              <button
                class="button"
                type="is-primary"
                @click="opTeamPopView = true"
              >
                {{ $t('common.BTN.ADMIN.selectAppTeam') }}
                <!-- 운영팀 선택 -->
              </button>
              <el-tag
                v-if="vmInfo.appManageTeam"
                class="op-tag-lists"
                style="margin-left: 10px;"
              >
                {{ vmInfo.appManageTeam.groupName }}
              </el-tag>
            </div>

            <div
              v-if="opTeamPopView"
              class="custom-popup -app-team"
            >
              <app-operating-team
                v-if="opTeamPopView = true"
                class="-body"
                :data="vmInfo.appManageTeam"
                @operate-team="saveOperateTeam"
                @close="opTeamPopView = false"
                :group-tree-data="groupTreeData"
                :loading="treeDataLoading"
              />
            </div>
          </template>
          <!-- App 운영팀 -->

          <template #appTaskUser>
            <div class="flex-wrap">
              <button
                class="button"
                type="is-primary"
                @click="taskManPopView = true"
                style="min-width: 140px;"
              >
                {{ $t('common.BTN.ADMIN.selectManager') }}
                <!-- 업무 담당자 선택 -->
              </button>

              <div
                v-if="vmInfo.appTaskUser && vmInfo.appTaskUser.length"
                style="margin-left: 10px;"
              >
                <el-tag
                  v-for="person in vmInfo.appTaskUser"
                  :key="person.field"
                >
                  {{ person.userName }}({{ person.userId | maskingName }})
                </el-tag>
              </div>
            </div>

            <div
              v-if="taskManPopView"
              class="custom-popup -app-manager"
            >
              <select-from-tree
                v-if="taskManPopView = true"
                class="-body"
                @close="taskManPopView = false"
                :data="vmInfo.appTaskUser"
                :trigger-btn="$refs"
                @task-managers="saveTaskManager"
                :group-tree-data="groupTreeData"
                :loading="treeDataLoading"
              />
            </div>
          </template>
          <!-- APP 업무 담당자 -->

          <el-input
            slot="note"
            v-model="vmInfo.note"
            resize="none"
            type="textarea"
            :placeholder="$t('common.PLACEHOLDER.remark')"
            :autosize="{ minRows: 3, maxRows: 6}"
          />
          <!-- 비고 -->

          <div
            class="server-manager-wrap"
            slot="svManager"
          >
            <button
              class="button"
              @click="serverManagerPopView = true"
              type="is-primary"
              ref="svManagerTrigger"
            >
              {{ $t('common.BTN.ADMIN.selectServerManager') }}
              <!-- 서버담당자 선택 -->
            </button>
            <div
              class="custom-popup -server-manager"
              v-if="serverManagerPopView"
            >
              <server-manager
                :data="svManagerOptions"
                :active.sync="serverManagerPopView"
                @close="serverManagerPopView = false"
                @save="selectSvManager"
                class="-body"
                :trigger-btn="$refs"
                :selected-object.sync="vmInfo.svManager"
              />
            </div>
            <el-tag
              class="manager"
              v-if="vmInfo.svManager && vmInfo.svManager.roleName"
            >
              {{ vmInfo.svManager.roleName }}
            </el-tag>
          </div>
          <!-- 서버담당자 -->

          <cmp-grid
            slot="image"
            :item-source="images"
            selectable
            @selectedRow="selectImageFunction"
            :columns="computeColumns.imageColumns"
            :init-auto-select-row="vmInfo.selectImage"
            init-auto-select-row-key="userImageIdx"
            :use-excel-download="false"
          />
          <!-- 이미지 -->

          <template #spec>
            <div v-if="!data">
              <sc-select-spec
                ref="flavorSpec"
                v-if="!isEmpty(vmInfo.selectImage)"
                :data="displayCatalogFlavor"
                :os-type="defaultOsType"
                @selected-spec="saveSelectedSpec"
                :init-auto-select-row="vmInfo.spec"
                init-auto-select-row-key="flavorCustomIdx"
                :custom-min-value="data ? data.rootDiskSize : vmInfo.selectImage.osRootDiskSize"
                is-custom
              />
              <span
                v-else
                class="empty-data"
              >{{ $t('common.ALERT.NUTA.008') }}</span>
            <!-- 이미지를 선택해주세요. -->
            </div>
            <div v-else>
              <editable-spec-grid
                :origin-spec="vmInfo.spec"
                @save="param => {vmInfo.spec = param}"
                :min-vcpu-size="vmInfo.powerState === 'ON'
                  ? data.vcpu
                  : (defaultOsType === 'WINDOWS' ? 2 : 1)"
                :min-ram-size="vmInfo.powerState === 'ON'
                  ? Number(data.memory)
                  : (defaultOsType === 'WINDOWS' ? 2 : 1)"
                :min-disk-size="Number(vmInfo.rootDiskSize) || Number(data.flavorDisk)"
                :can-down-vcpu="vmInfo.powerState !== 'ON'"
                :can-down-ram="vmInfo.powerState !== 'ON'"
                ref="editableSpecRef"
                :disabled-disk-reason="disableDiskReason"
              />
            </div>
          </template>
          <!-- 사양 선택 -->

          <template #externalDisk>
            <div v-if="!isEmpty(vmInfo.selectImage)">
              <!-- <small
                class="disable"
                style="display: block; margin-bottom: 10px;"
                v-if="data && data.powerState !== 'ON'"
              >* {{ $t('common.ALERT.COMP.053') }}</small> -->
              <!-- VM 상태가 'OFF'인 상태에는 Local Disk 변경이 불가능합니다. -->

              <sc-range-input
                :os-type="!isMp ? defaultOsType : null"
                :data-length="1"
                :app-range="{ min: 50, max: 500 }"
                :step="50"
                :disks="vmInfo.externalDisk"
                @range-data="param => vmInfo.externalDisk = param"
              />
              <small
                class="-reference"
                v-if="data"
              >
                <i>*</i>&nbsp;
                {{ $v('이미 등록되어 있는 Disk 용량 변경시, 확장만 가능합니다.') }}</small>
              <!-- 호스트 명을 입력하세요. -->
            </div>
            <span
              v-else
              class="empty-data"
            >{{ $t('common.ALERT.NUTA.008') }}</span>
            <!-- 이미지를 선택해주세요. -->
          </template>
          <!-- Local Disk -->

          <template #installProgramList>
            <select-install-program-grid
              v-if="!isEmpty(vmInfo.selectImage)"
              :item-source="data && data.era ?
                data.osType ? installListByOsType[data.osType]: []
                :vmInfo.selectImage.osType ? installListByOsType[vmInfo.selectImage.osType] : []"
              @change="items => {
                checkInstallDataList = items
                vmInfo.installProgramList = items
              }"
              :sync-data="checkInstallDataList"
            />
            <span
              v-else
              class="empty-data"
            >{{ isUnregistered ? $t('common.PLACEHOLDER.noData') : $t('common.ALERT.NUTA.008') }}</span>
            <!-- 이미지를 선택해주세요. -->
          </template>
          <!-- 설치프로그램 -->

          <template #clusterNode>
            <div
              class="button-area flex-wrap"
              v-if="!isEmpty(vmInfo.selectImage)"
            >
              <span v-if="vmInfo.cluster">
                {{ vmInfo.cluster.name }}
              </span>
              <span
                v-if="vmInfo.node"
                class="flex-wrap"
              >
                <i
                  class="mdi mdi-chevron-right"
                  style="margin: 0 5px"
                />
                {{ vmInfo.node.nodeName }}
              </span>
              <button
                v-if="vmInfo.cluster && vmInfo.node"
                class="button"
                type="is-primary"
                style="margin-left: 20px"
                @click="resetClusterNode"
              >
                <!-- 클러스터-노드 변경 -->
                {{ $t('common.GRID.COMPUTE.changeClusterNode') }}
              </button>
              <button
                v-if="!vmInfo.node"
                class="button"
                type="is-primary"
                @click="clickSelectClusterNode('cluster')"
                :style="{marginLeft: vmInfo.cluster || vmInfo.node ? '20px' : 0}"
              >
                <!-- 클러스터 선택 -->
                {{ $t('main.DASHBOARD.setCluster') }}
              </button>
              <button
                v-if="!vmInfo.node"
                class="button"
                type="is-primary"
                style="margin-left: 20px"
                :disabled="!vmInfo.cluster"
                @click="clickSelectClusterNode('node')"
              >
                <!-- 노드 선택 -->
                {{ $t('main.DASHBOARD.setNode') }}
              </button>
            </div>
            <span
              v-else
              class="empty-data"
            >{{ $t('common.ALERT.NUTA.008') }}</span>
            <!-- 이미지를 선택해주세요. -->
          </template>

          <!-- 클러스터-노드 선택 -->

          <template #ipam>
            <div
              class="flex-wrap"
              v-if="vmInfo.cluster && vmInfo.node && vmInfo.networkList.length"
            >
              <span
                v-if="vmInfo.networkIp"
                style="margin-right: 20px"
              >{{ vmInfo.networkIp.customIp.data ? vmInfo.networkIp.customIp.data : $t('common.BTN.CONF.autoAssign') }}</span>
              <!-- 자동 할당 -->
              <button
                class="button"
                type="is-primary"
                @click="clickSelectClusterNode('networkIp')"
              >
                <!-- IP 설정 -->
                {{ $t('common.BTN.CONF.setIp') }}
              </button>
            </div>
            <p
              class="empty-data"
              v-else-if="!vmInfo.networkList.length"
            >
              {{ $t('common.ALERT.COMP.010') }}
              <!-- 네트워크 조직을 선택해주세요. -->
            </p>
            <p
              class="empty-data"
              v-else
            >
              <!-- 클러스터/노드를 선택해주세요. -->
              {{ $t('common.ALERT.COMP.060') }}
            </p>
          </template>
          <!-- IPAM -->

          <template #serviceDate>
            <el-date-picker
              class="service-date-pick"
              v-model="serviceDate.date"
              type="date"
              :placeholder="$t('common.GRID.serviceStart')"
              :picker-options="serviceOpenDateOptions"
              @change="changeServiceDate('date')"
            />
            <el-select
              v-model="serviceDate.time"
              :placeholder="$i18n.locale === 'en' ? 'time' : '시'"
              :popper-append-to-body="false"
              class="service-time-select"
              @change="changeServiceDate('time')"
            >
              <el-option
                v-for="time in 24"
                :key="'time' + time"
                :label="(time - 1) < 10 ? '0' + (time-1) : time - 1"
                :value="time - 1"
                :disabled="serviceDate.date && (+serviceDate.date === +new Date().setHours(0, 0, 0, 0))
                  ? new Date().getHours() > time-1
                  : false"
              />
            </el-select>
            &ensp;{{ $i18n.locale === 'en' ? ' : ' : '시' }}
            <el-select
              v-model="serviceDate.min"
              :placeholder="$i18n.locale === 'en' ? 'min' : '분'"
              :popper-append-to-body="false"
              class="service-time-select"
            >
              <el-option
                v-for="min in [0, 10, 20, 30, 40, 50]"
                :key="'min' + min"
                :label="min < 10 ? '0' + min : min"
                :value="min"
                :disabled="serviceDate.date
                  && +serviceDate.date === +new Date().setHours(0, 0, 0, 0)
                  && +serviceDate.time === new Date().getHours()
                  ? new Date().getMinutes() > min
                  : false"
              />
            </el-select>
            <span v-if="$i18n.locale !== 'en'">&ensp;분</span>
          </template>
          <!-- /. 서비스 개시일 -->

          <template #chargeDate>
            <el-date-picker
              class="service-date-pick"
              v-model="chargeDate"
              type="date"
              :placeholder="$t('common.GRID.billStart')"
              @change="(val) => { if(val) vmInfo.chargeDate = +new Date(chargeDate) }"
              :picker-options="vmInfo.creationTime && { // 과금 시작일 datepicker 옵션 설정
                disabledDate (time) {
                  const creationTime = vmInfo.creationTime
                  return time.getTime() < new Date(creationTime).setHours(0, 0, 0, 0)
                }
              }"
            />
          </template>
          <!-- /. 과금 시작일 -->

          <el-radio-group
            v-model="vmInfo.loadbalance"
            slot="loadbalance"
          >
            <el-radio label="none">
              <!-- 선택 안 함 -->
              {{ $i18n.locale === 'en' ? 'none' : '선택 안 함' }}
            </el-radio>
            <el-radio label="l4">
              L4
            </el-radio>
            <el-radio label="l7">
              L7
            </el-radio>
          </el-radio-group>
          <!-- /. 로드밸런스 선택 -->
        </vertical-table>
      </section>
    </div>

    <section class="modal-footer modal-button-area">
      <button
        class="button -modal-button"
        type="is-anti"
        @click="$emit('close')"
      >
        <!-- 취소 -->
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button -modal-button"
        @click="save"
        type="is-primary"
        disabled
      >
        <!-- {{ data ? '변경' : '생성' }} -->
        {{ data ? $t('common.BTN.change') : $t('common.BTN.create') }}
      </button>
    </section>

    <!-- 모달 -->
    <!-- 클러스터 선택 모달 -->
    <el-dialog
      :title="$t('common.PLACEHOLDER.selectName', { name: 'Cluster' })"
      :visible.sync="clusterModalView"
      width="1100px"
      top="7vh"
      @close="clusterModalView = false"
    >
      <select-cluster-grid
        v-if="clusterModalView"
        :loading="loading.cluster"
        :grid-data="clustersFilteredBySpec"
        :init-selected="vmInfo.cluster"
        @cancel="clusterModalView = false"
        @save="params => setClusterNode(params, 'cluster')"
      />
    </el-dialog>

    <!-- 노드 선택 모달 -->
    <el-dialog
      :title="$t('common.PLACEHOLDER.selectName', { name: 'Node' })"
      :visible.sync="nodeModalView"
      width="1100px"
      top="7vh"
      @close="nodeModalView = false"
    >
      <select-node-grid
        v-if="nodeModalTableData"
        :grid-data="nodeModalTableData"
        :init-selected="vmInfo.node"
        :cluster-name="vmInfo.cluster? vmInfo.cluster.name : ''"
        @cancel="nodeModalView = false"
        @save="params => setClusterNode(params, 'node')"
      />
    </el-dialog>

    <!-- 'IP 선택' 모달 -->
    <el-dialog
      :title="$t('common.BTN.CONF.selectIp')"
      :visible.sync="ipModalView"
      width="1100px"
      top="7vh"
      @close="ipModalView = false"
    >
      <select-network-ip-grid
        v-if="ipModalView"
        :grid-data="ipModalTableData"
        :init-selected="vmInfo.ip"
        @cancel="ipModalView = false"
        @save="params => {
          setClusterNode(params, 'networkIp')
          setSelectedNetwork(params, vmInfo.networkList[0])
        }"
      />
    </el-dialog>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import API, { VerticalTable, SelectFromTree } from '@sd-fe/cmp-core'
import SetOSIcon from '@/components/common/SetOSIcon/SetOSIcon'
import MarketplaceInfo from '@/components/MarketplaceInfo/MarketplaceInfo'
import NetworkCategorySelection from '@/components/NetworkCategorySelection/NetworkCategorySelection'
import SCSelectSpec from '../SCSelectSpec/SC_SelectSpec'
import { uniqBy, cloneDeep, isEmpty, groupBy, isEqual } from 'lodash'
import AppOperatingTeam from '../../ApprovalMemberModal/AppOperatingTeam'
// import AppTaskManager from '../../ApprovalMemberModal/AppTaskManager'
import SCRangeInput from '@/components/cmp-components/SCRangeInput.vue'
import ServerManager from '@/components/ServerManager/ServerManager'
import ResourceFilterComponent from '@/components/ResourceFilterComponent/ResourceFilterComponent'
import EditableSpecGrid from './EditableSpecGrid/EditableSpecGrid'
import SelectInstallProgramGrid from './SelectInstallProgramGrid/SelectInstallProgramGrid'
import SelectClusterGrid from './SelectClusterGrid/SelectClusterGrid'
import SelectNodeGrid from './SelectNodeGrid/SelectNodeGrid'
import SelectNetworkIpGrid from './SelectNetworkIpGrid/SelectNetworkIpGrid'

import ComputeUpdateMixins from './ComputeUpdate.mixins.js'

export default {
  name: 'VMwareComputeUpdateForm',
  mixins: [ComputeUpdateMixins],
  components: {
    'vertical-table': VerticalTable,
    'set-os-icon': SetOSIcon,
    'marketplace-info': MarketplaceInfo,
    'networkcate-selection': NetworkCategorySelection,
    'app-operating-team': AppOperatingTeam,
    SelectFromTree,
    'sc-select-spec': SCSelectSpec,
    'sc-range-input': SCRangeInput,
    'server-manager': ServerManager,

    ResourceFilterComponent,
    EditableSpecGrid,
    SelectInstallProgramGrid,

    SelectClusterGrid,
    SelectNodeGrid,
    SelectNetworkIpGrid
  },

  props: {
    project: {
      type: Object,
      default () {
        return {}
      }
    },
    data: {
      type: Object,
      default () {
        return {}
      }
    },
    selectedProject: { // 선택한 관-조-프 정보가 있을 때 사용 -> VM 생성 시!
      type: Object,
      default () {
        return undefined
      }
    },
    isMp: {
      type: Boolean,
      default: false
    },
    height: { // 콘텐츠에 스크롤 생기기 시작 높이
      type: String,
      default: '72vh'
    }
  },
  watch: {
    'vmInfo.clusterType': {
      immediate: true,
      handler (newVal) {
        if (newVal) {
          if (!this.data) { // 생성 일 때만..
            this.specListSetting()
            this.resetClusterNode()

            this.clustersFilteredBySpec = this.clusterModalTableData.map(row => {
              this.$set(row, 'isSelectable', row.highVal === this.vmInfo.clusterType)
              return row
            })
          }
        }
      }
    },
    finalHostName: {
      immediate: true,
      handler (newVal) {
        this.hostName = newVal
      }
    },
    itsmName: {
      immediate: true,
      handler (newVal) {
        this.vmInfo.itsmName = newVal
      }
    },
    'vmInfo.networkList': {
      immediate: true,
      handler (newVal) {
        if (!newVal?.length) this.networkField = ''
        else this.networkField = newVal[0]?.cateKey.split('-')[1]
      }
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      packageType: state => state.auth.packageType
    }),
    finalHostName () {
      // { 코드 }, { 서비스 구분 }, { 서비스 유형 }, { 네트워크 조직 }
      const serviceCode = this.vmInfo.serviceCode ? this.vmInfo.serviceCode : `{${this.$t('common.PLACEHOLDER.code')}}`// {코드}
      const selectServicePart = this.vmInfo.servicePart ? this.vmInfo.servicePart : `{${this.$t('common.GRID.serviceClass')}}` // {서비스 구분}
      const selectServiceType = this.vmInfo.serviceType ? this.vmInfo.serviceType : `{${this.$t('common.GRID.serviceType')}}` // {서비스 유형}
      const networkCate = this.vmInfo.networkList?.length ? this.vmInfo.networkList[0].cateCode : `{${this.$t('common.GRID.COMPUTE.networkOrg')}}` // {네트워크 조직}
      console.log('@networkCate: ', this.vmInfo.networkIrg?.cateCode)

      return `${this.companyCode}-${serviceCode}-${selectServicePart}${selectServiceType}${networkCate}`
    },
    companyCode () {
      let companyCode
      companyCode = this.vmInfo.projectInfo?.company
        ? this.setServiceCode(this.vmInfo?.projectInfo?.company.companyPrefix)
        : `{${this.$t('admin.ORG.affCode')}}` // {관계사 코드}

      if (this.vmInfo.projectInfo?.project?.inCommon) {
        companyCode = this.setServiceCode(this.vmInfo.projectInfo?.project?.ownerCompanyPrefix) ||
        this.setServiceCode(this.vmInfo.projectInfo?.project?.companyPrefix) ||
        '' // 공통일 때..
      }

      return companyCode
    },
    itsmName () {
      // if (this.data?.itsmName) return this.data.itsmName
      // else {
      let itsmName
      itsmName = `${this.vmInfo.projectInfo.company ? this.vmInfo.projectInfo.company?.companyCi : ''} ${this.vmInfo.resourceName || ''}`

      if (this.vmInfo.projectInfo?.project?.inCommon) itsmName = this.vmInfo.projectInfo?.project?.ownerCompanyCi || this.vmInfo.projectInfo?.project?.companyCi + ' ' + (this.vmInfo.resourceName || '')// 공통일 때..

      return itsmName
    },
    changableColumns () { // 자원 변경 가능 정보 컬럼
      const defaultCols = () => {
        if (this.isUnregistered) return this.unregisterChangable // 미등록 자원일 때.. (DB 제외)

        if (this.data) return this.changableDataColumns // 수정
        else return this.dataColumns // 생성
      }

      let columns = this.packageType === 'PL' ? this.removeColumn(defaultCols(), ['loadbalance']) : defaultCols()

      if (this.networkField !== 'SDN') { // SDN -> 로드밸런스 정보 선택 불가능
        columns = this.removeColumn(cloneDeep(columns), ['loadbalance'])
      }
      if (this.data && (this.data.era || this.data.market)) { // 마켓 || DB자원 -> 로드밸런스, 사양 정보 변경 불가능
        columns = this.removeColumn(columns, ['loadbalance', 'spec'])
      }
      return columns
    },
    // 미등록 자원인지? (마켓은 미등록 자원이 아직 없고, DB는 다른 컴포넌트 사용)
    isUnregistered () {
      if (!this.data) return false
      else if (this.data.ova) return false
      else {
        const compute = !this.data.market && !this.data.era
        return (compute && this.data?.chargeDate === undefined)
      }
    },
    /**
     * 디스크 변경 불가능 이유
     */
    disableDiskReason () {
      // 디스크 변경 불가능 조건
      // 1. 붙은 디스크 정보가 없거나
      // 2. CDROM 아니면서 SCSI.0인 디스크(RootDisk)가 없을 때
      if (!this.data.disks || !this.data.disks.find(disk => disk.deviceBus === 'SCSI' &&
      disk.deviceIndex === 0 &&
      !(disk.isCdrom || disk.deviceType === 'CDROM'))) return this.$t('common.ALERT.COMP.066') // '업데이트 가능한 rootDisk가 없습니다.'
      else return ''
    }
  },
  async created () {
    await this.init()
  },
  methods: {
    isEmpty (value) {
      if (!value) return true
      return isEmpty(value)
    },
    async init () {
      this.loading.initVmData = true
      await Promise.all([
        this.getManageTree(),
        // this.getProject({ projectIdx: this.project?.projectIdx }),
        this.getImages(), // 이미지 목록 조회
        this.getCatalogFlavor(), // 사양 정보 조회
        this.getUsableInstallList(), // 설치프로그램 목록 조회

        this.servicePartOptions = await this.getConfig({ codeType: 'SERVICE_CLASS' }), // 서비스 구분 조회
        this.serviceTypeOptions = await this.getConfig({ codeType: 'SERVICE_TYPE' }), // 서비스 유형 조회
        this.svManagerOptions = await this.getRole(0) // 서버담당자 조회
      ]).then(async () => {
        if (this.data) {
          this.setInitData(this.data)
        }

        this.loading.initVmData = false
      })
    },
    /**
     * 초기 데이터 세팅
     */
    async setInitData (data) {
      this.loading.settingInitData = true
      const vm = {
        ...data,
        hostName: data.vmName || data.hostname // 호스트명
      }

      // 마켓플레이스일 때
      if (data.market) {
        const marketKeys = Object.keys(data.market.reqInfo)
        console.log('마켓플레이스 정보: ', data.market)
        marketKeys.forEach(key => {
          if (!data[key]) data[key] = data.market.reqInfo[key]
        })
        vm.computeName = data.market.marketplaceName
        vm.bpUuid = data.market.application.bpUuid
        vm.userAppIdx = data.market.userAppIdx

        this.getProduct(vm.bpUuid)
      }

      // 데이터베이스일 때
      if (data.era) {
        const eraKeys = Object.keys(data.era.reqInfo)
        eraKeys.forEach(key => {
          if (!data[key]) data[key] = data.era.reqInfo[key]
        })
        vm.databaseName = data.era.databaseName
        data.roleId = data.roleId || data.roleIdx
        data.roleIdx = data.roleId
        vm.serviceType = 'd'

        const k = (1024 * 1024 * 1024)
        vm.memory = Number(data.memoryCapacityInBytes / k).toFixed(0)
      }

      // 미등록 자원일 때
      if (this.isUnregistered) {
        vm.computeName = data.vmName
        if (data.creationTime) this.chargeDate = +new Date(data.creationTime)
      }

      console.log('@data: ', data)

      // 이름(자원 명)
      vm.resourceName = data.era ? vm.databaseName : vm.computeName

      let subnetUuid = null

      // 네트워크 조직
      if (data.nics) {
        const idxList = []
        let networkList = []
        for (let i = 0; i < data.nics.length; i++) {
          // if (!data.nics[i].ipAddress) continue // ipAddress 없어도 보이게 설정 (21.11.09)
          if (subnetUuid === null) { subnetUuid = data.nics[i].subnetUuid }
          if (!data.nics[i].cateIdx) continue
          idxList.push(data.nics[i].cateIdx)
        }
        vm.subnetUuid = subnetUuid
        if (idxList.length) {
          networkList = await API.network.getIpCategories({ idxList: idxList.join(',') })
          networkList.forEach(el => {
            el.cateIdx = el.ipCategoryIdx
            el.cateId = el.ipCategoryIdx
            // return el
          })
        }
        vm.networkList = networkList
        vm.networkOrg = networkList[0]
      }

      // IP
      if (data.nicIps?.length) vm.nicIps = uniqBy(data.nicIps, 'ipAddress')

      // 호스트명
      this.$nextTick(() => {
        if (data.userVmIdx) {
          this.hostName = data.hostname
          this.vmInfo.userVmIdx = data.userVmIdx
        } else {
          this.vmInfo.hostNameIdx = data.hostNameIdx
        }
      })

      // 이미지
      if (data.imageId) {
        const image = await API.compute.getImage(data.imageId)
        vm.selectImage = image
        this.defaultOsType = ['WINDOWS', 'LINUX', 'UBUNTU', 'CENTOS', 'RHEL'].find(os => vm.selectImage?.osType.includes(os))

        const selectedImageInList = this.images.find(image => image.userImageIdx === vm.selectImage.userImageIdx)
        if (!selectedImageInList) this.images.unshift(vm.selectImage)
      }

      // APP 업무 담당자
      if (data.appTaskUser) {
        const selManagers = data.appTaskUser.map(user => {
          return {
            // userGroupCode: user.appTaskUserGroupCode,
            userGroupName: user.appTaskUserGroupName || '',
            userId: user.appTaskUserId || user.userId,
            userName: user.appTaskUserName || user.userName
          }
        })

        vm.appTaskUser = selManagers
      }

      // APP 운영팀
      if (data.appManageTeam || data.appManageTeamName) {
        vm.appManageTeam = Object.assign({
          groupCode: data.appManageTeamCode,
          groupIdx: data.appManageTeam,
          groupName: data.appManageTeamName
        }, {})
      }

      if (data.roleId !== undefined) { // 서버 담당자
        const role = await this.getRole(data.roleId)
        if (role?.length) {
          vm.roleIdx = role[0].roleIdx
          vm.roleName = role[0].roleName
          vm.svManager = role[0]
          vm.svManager.comp = [...role[0]?.company]
        }
      }

      // console.log('@selectImage_: ', vm.selectImage)

      // Local Disk
      const externalDisk = []
      if (data.disks) {
        for (let i = 0; i < data.disks.length; i++) {
          if (data.disks[i].isCdrom ||
          (data.disks[i].deviceType === 'CDROM' || data.disks[i].deviceBus === 'IDE')) continue

          if (
            (data.disks[i].deviceIndex === 0 || data.disks[i].diskIndex === 0) &&
            data.disks[i].deviceBus === 'SCSI') {
            vm.rootDiskSize = this.$options.filters.onlyGB(data.disks[i].vmDiskSize, 0, false)
          } else {
            // DISK 삭제 불가능 조건 : vm OFF일 때 || 미등록 자원 최초 수정일 때 || OVA 자원 생성 때, 최초로 갖고 있던 DISK || diskInfo[osType]과 동일한 diskName을 가졌을 때
            // const isDefaultDisk = () => {
            //   if (data.powerState !== 'ON') return true
            //   if (this.isUnregistered) return true
            //   return data.ova
            //     ? data.disks[i].default
            //     : (
            //       this.defaultOsType
            //         ? this.diskInfo[this.defaultOsType].default === data.disks[i].diskName
            //         : false
            //     )
            // }

            // DISK 변경 불가능 조건 : vm OFF일 때(제거) || 미등록 자원 최초 수정일 때 || OVA 자원 생성 때, 최초로 갖고 있던 DISK
            const isFixedDisk = () => {
              let message = ''
              const fixMsg = this.$t('common.BTN.CONF.cantChangableSize') // '사이즈 변경 불가능'
              // if (data.powerState !== 'ON') message = fixMsg
              if (this.isUnregistered) message = fixMsg
              if (data.ova) message = data.disks[i].fixed || ''
              return message
            }

            externalDisk.push({
              // default: isDefaultDisk(),
              default: false,
              fixed: isFixedDisk(),
              isAlreadyMount: this.isUnregistered ? true : data.disks[i].isAlreadyMount || false,
              name: data.disks[i].diskName ? data.disks[i].diskName : (data.disks[i].deviceBus + '.' + data.disks[i].deviceIndex),
              size: data.disks[i].vmDiskSize ? this.$options.filters.onlyGB(data.disks[i].vmDiskSize, 0, false) : data.disks[i].diskSize,
              deviceBus: data.disks[i].deviceBus,
              // deviceIndex: data.disks[i].deviceIndex || data.disks[i].diskIndex
              min: data.disks[i].vmDiskSize ? +this.$options.filters.onlyGB(data.disks[i].vmDiskSize, 0, false) : +data.disks[i].diskSize,
              max: this.diskSizeMax,

              deviceIndex: data.disks[i].deviceIndex,
              deviceType: data.disks[i].deviceType,
              isEmpty: false,
              vmDiskUuid: data.disks[i].vmDiskUuid,
              scUuid: data.disks[i].scUuid
            })
          }
        }
      }
      vm.externalDisk = externalDisk

      // 사양 설정
      vm.spec = Object.assign({
        flavorCustomIdx: data.flavorCustomIdx || (data.profileId ? data.profileId : `Custom_${Math.random().toString(36).substr(2, 9)}`), // 미등록 -> 등록 변경시, 선택 사양을 표시하기 위함
        flavorIdx: data.profileId,
        flavorName: data.profileName || 'Custom',
        flavorCpu: data.numVcpus || data.vcpu,
        flavorRam: this.$options.filters.byteToGb(data.memoryCapacityInBytes) || +data.memory,
        flavorDisk: vm.rootDiskSize || data.flavorDisk || 0
      }, {})
      // rootDiskSize 조건 (순위 별로)
      // 1. externalDisk 중에서
      //  (data.disks[i].deviceType === 'CDROM' && data.disks[i].deviceBus === 'IDE') 가 아니면서
      // (data.disks[i].deviceIndex === 0 || data.disks[i].diskIndex === 0) 이거나
      // 2. 사양 선택 목록에서 disk 사이즈 이거나
      // 3. 선택 이미지 os의 rootDiskSize

      const flavor = []
      for (let i = 0; i < this.displayCatalogFlavor.length; i++) {
        if (('' + vm.spec.flavorCustomIdx) === ('' + this.displayCatalogFlavor[i].flavorCustomIdx)) {
          flavor.push(this.displayCatalogFlavor[i])
        } else if (this.displayCatalogFlavor[i].flavorDisk >= vm.rootDiskSize) {
          flavor.push(this.displayCatalogFlavor[i])
        }
      }

      this.displayCatalogFlavor = flavor

      const spec = vm.spec
      if (spec.flavorName === 'Custom' || data.profileId === null) {
        this.displayCatalogFlavor.unshift(spec)
      }

      // 설치프로그램 : .
      const checkedItems = []
      const osType = data?.era ? data.osType : vm.selectImage?.osType || undefined

      if (osType) {
        this.defaultOsType = ['WINDOWS', 'LINUX', 'UBUNTU', 'CENTOS', 'RHEL'].find(os => osType.includes(os))
        // this.installListByOsType = { LINUX: [...], WINDOWS: [...] }
        const installsByOstype = this.installListByOsType[osType]
        if (installsByOstype && data.installProgramList) {
          data.installProgramList.forEach(program => {
            installsByOstype.forEach(item => {
              if (program.softwareId === item.softwareId) {
                item.selectedVersion = program.versionId
                checkedItems.push(item)
              }
            })
          })
        }
      }
      this.checkInstallDataList = checkedItems
      // }
      vm.installProgramList = this.checkInstallDataList

      // 서비스 개시일
      if (data.serviceDate) {
        const fullDate = new Date(data.serviceDate)
        this.serviceDate.date = new Date(data.serviceDate - fullDate.getHours() * 60 * 60 * 1000 - fullDate.getMinutes() * 60 * 1000)
        this.serviceDate.time = fullDate.getHours()
        this.serviceDate.min = fullDate.getMinutes()
        vm.serviceDate = data.serviceDate
      }

      // projectInfo

      if (data.projectIdx !== undefined) {
        const projectInfo = await this.getProject(data.projectIdx)

        if (projectInfo?.length) {
          const prInfo = projectInfo[0]

          vm.projectInfo = {
            company: {
              companyPrefix: prInfo.companyPrefix,
              companyCi: prInfo.companyCi,
              companyCode: prInfo.companyCode,
              groupName: prInfo.groupName,
              groupIdx: prInfo.groupIdx
            },
            group: {
              groupName: prInfo.groupName,
              groupIdx: prInfo.groupIdx
            },
            project: {
              projectName: prInfo.projectName,
              projectIdx: prInfo.projectIdx
            }
          }
        }
      }
      // ITSM 명
      vm.itsmName = data.itsmName

      this.vmInfo = vm
      this.initData = cloneDeep(vm)
      console.log('this.vmInfo: ', vm)

      await this.setResourceDefault(this.vmInfo) // 자원 기본 정보 세팅

      this.loading.settingInitData = false
    },

    /**
     * 관계사의 서비스 코드 세팅
     */
    setServiceCode (companyPrefix) {
      if (!companyPrefix) return ''
      if (companyPrefix.length <= 3) return companyPrefix
      return companyPrefix.substring(companyPrefix.length - 3, companyPrefix.length)
    },

    /**
     * 마켓플레이스 제품 정보
     */
    async getProduct (uuid) {
      try {
        this.loading.isGetMarket = true
        this.market = {}
        const res = await API.market.getProduct(uuid)
        this.market = await this.setMpInfoData(res)
        console.log(this.market)
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.market = {}
        this.$alert(message)
      } finally {
        this.loading.isGetMarket = false
      }
    },
    async setMpInfoData (response) {
      const findObj = { }

      findObj.versionInfo = response.pgVersion
      findObj.icon = response.bpInfo?.iconImage
      findObj.category = response.bpInfo?.category
      findObj.summary = response.bpInfo?.summary
      findObj.osInfo = response.bpImg.osType + ' ' + response.bpImg.osName + ' x' + response.bpImg.osBit
      return { ...response, ...findObj }
    },
    /**
     * 사양 선택 이벤트
     */
    saveSelectedSpec (spec) {
      this.vmInfo.spec = spec ? (spec.dataItem.edit ? {} : spec.dataItem) : {}
    },
    /**
     * Local Disk 변경시 이벤트
     */
    changeExternalDisk (range) {
      this.vmInfo.externalDisk = range
    },

    /**
     * 설치프로그램 목록을 조회 후 과금 세팅
     */
    async getUsableInstallList () {
      try {
        this.isGetInstall = true
        const data = await API.config.getUsableInstallList({ onlyUsable: true })

        const softwareList = groupBy(data, 'osType')
        const origin = {}

        for (const [key, value] of Object.entries(softwareList)) {
          const uniqBySwIdData = uniqBy(value, 'id')

          const installList = []

          uniqBySwIdData.forEach(sw => {
            const versionOptions = value.filter(item => item.id === sw.id)
              .map(version => { return { versionId: version.versionId, versionName: version.version, swIdx: version.swIdx } })

            const item = {
              softwareName: sw.name,
              softwareId: sw.id,

              osType: sw.osType,
              selectedVersion: sw.selectedVersion || versionOptions.length ? versionOptions[0].versionId : '',
              versionOptions
            }

            installList.push(item)
          })

          origin[key] = installList
        }

        this.installListByOsType = origin

        this.originInstallPrograms = data
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        console.error('GET "SW License List" Error: ', message)

        this.originInstallPrograms = []
        this.installListByOsType = {}
        this.isGetInstall = false
      } finally {
        this.isGetInstall = false
      }
    },
    /**
     * 설치프로그램 데이터 세팅
     */
    settingInstallProgram (data) {
      const obj = {}
      if (data && data.length > 0) {
        for (let i = 0; i < data.length; i++) {
          if (!obj[data[i].installOs]) {
            obj[data[i].installOs] = []
          }
          obj[data[i].installOs].push(data[i])
        }
      }
      return obj
    },
    /**
     * 이미지 선택시, 실행 메서드
     * @param {rowGroup} row 이미지 그리드에서 선택한 rowGroup
     */
    async selectImageFunction (row) {
      // this.vmInfo.selectImage = null
      this.externalDiskList = [] // 선택한 Local Disk
      this.displayCatalogFlavor = [] // 사양 목록
      this.vmInfo.externalDisk = [] // 선택한 externalDisk

      if (!this.isUnregistered) this.checkInstallDataList = [] // 선택한 설치프로그램

      if (row) {
        this.$set(this.vmInfo, 'selectImage', row._data)
        this.defaultOsType = ['WINDOWS', 'LINUX', 'UBUNTU', 'CENTOS', 'RHEL'].find(os => this.vmInfo.selectImage?.osType.includes(os))
      } else {
        this.vmInfo.selectImage = null
        this.defaultOsType = 'LINUX'
      }

      this.specListSetting() // 사양 목록 세팅
      this.resetClusterNode() // 클러스터, 노드, IP 리셋
      await this.getClusters() // 클러스터 조회
      await this.getUsableInstallList() // 설치프로그램 목록 조회
    },
    /**
     * 사양 목록을 세팅합니다.
     */
    specListSetting () {
      if (this.isUnregistered) return

      this.vmInfo.spec = null // 선택한 사양

      let obj = null
      this.displayCatalogFlavor = []

      const doc = this.$refs?.flavorSpec

      let specGrid = []
      const flavors = []

      if (doc?.specGridData) {
        specGrid = doc?.specGridData.filter(spec =>
          spec.flavorName === 'Custom' && spec.flavorDisk >= this.vmInfo.selectImage.osRootDiskSize
        )
      }

      for (let i = 0; i < this.catalogFlavor.length; i++) {
        obj = JSON.parse(JSON.stringify(this.catalogFlavor[i]))
        obj.flavorDisk += (this.vmInfo.selectImage?.osRootDiskSize || 0)
        obj.flavorCustomIdx = obj.flavorCustomIdx || obj.flavorIdx

        // 미등록 -> power On일 때, vcpu, memory, m 는 초깃값보다 작을 수 없음
        if (this.vmInfo.clusterType === 'MIXED' && (obj.flavorType !== 'NORMAL')) continue // 일반 성능
        else if (this.vmInfo.clusterType === 'ALL_FLASH' && (obj.flavorType !== 'HIGH')) continue // 고성능

        flavors.push(obj)
      }

      const data = [...specGrid, ...flavors]
      this.displayCatalogFlavor = data
    },
    /**
     * 미등록 자원 사양 validation
     * @param {Object} specItem 검사 할 사양
     * @return {Boolean} true = 통과
     */
    unregisteredSpecValid (specItem) {
      if (specItem.flavorDisk < +this.vmInfo.rootDiskSize || this.vmInfo.flavorDisk) return false // disk가 초깃값보다 작으면 false

      if (this.vmInfo.powerState !== 'ON') { // power ON 일 때, vcpu, ram이 초깃값보다 작으면 false
        if (
          specItem.vcpu < this.vmInfo.vcpu ||
          specItem.memory < this.vmInfo.memory
        ) return false
      }
      return true
    },
    /**
     * 프로젝트 정보 조회
     * @param {Number} projectIdx
     */
    async getProject (projectIdx) {
      if (!this.project) return
      try {
        this.curProject = {}
        const data = await API.iam.getProject({ projectIdx })
        return data
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        return this.$alert(message)
      } finally {
      }
    },
    async getCatalogFlavor () {
      try {
        this.catalogFlavor = []
        const data = await API.config.getCatalogFlavor()
        this.catalogFlavor = data
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        return this.$alert(message)
      } finally {
      }
    },
    /**
     * 이미지 조회
     */
    async getImages () {
      try {
        this.images = []
        const data = await API.compute.getImages({ isManage: true })
        this.images = data
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.images = []
        return this.$alert(message)
      } finally {
      }
    },
    /**
     * 역할 조회
     */
    async getRole (roleIdx = 0) {
      const response = await API.iam.getRole({
        roleIdx: roleIdx,
        params: {
          roleUpper: '서버'
        }
      })
      return response
    },
    saveNetworkOrg (data) {
      this.vmInfo.hostNameIdx = null

      this.vmInfo.networkList = data?.map(item => {
        const result = {
          cateId: item.cateIdx,
          cateKey: item.cateKey,
          cateCode: item.cateCode
        }
        return result
      })
      this.vmInfo.networkOrg = { cateCode: null, cateIdx: null, cateKey: null }
      if (data.length) {
        this.vmInfo.networkOrg = data[0]
        this.networkField = this.vmInfo.networkOrg.cateKey?.split('-')[1]
      } else this.networkField = ''

      this.$forceUpdate()
    },
    /**
     * 코드 정보 조회
     */
    async getConfig (params) {
      try {
        this.isGetConfig = true

        return await API.config.getCodeList(params)
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.isGetConfig = false
        return this.$alert(message)
      } finally {
        this.isGetConfig = false
      }
    },
    /**
     * 관계사-그룹 트리 데이터 조회
     */
    async getManageTree () {
      try {
        this.treeDataLoading = true
        const response = await API.iam.getGroupManageTree()
        if (!response) return
        this.groupTreeData = [...response]
      } catch (error) {
        this.groupTreeData = []
        this.treeDataLoading = false
        console.error(error)
      } finally {
        this.treeDataLoading = false
      }
    },
    /**
     * 인덱스 생성 버튼 클릭시 발생 이벤트
     */
    async createHostIndex () {
      try {
        this.loading.isCreateHostNameIdx = true

        const checkValidItems = [
          { projectInfo: [this.vmInfo.projectInfo?.company, this.vmInfo.projectInfo?.group, this.vmInfo.projectInfo?.project].every(info => info) },
          { servicePart: this.vmInfo.servicePart },
          { serviceType: this.vmInfo.serviceType },
          { networkCate: this.vmInfo.networkOrg?.cateCode },
          { serviceCode: this.vmInfo.serviceCode }
        ]
        if (!this.noEmptyContents(checkValidItems)) return

        if (!this.validateHostName(this.vmInfo.serviceCode)) {
          return this.$alert(this.$t('common.ALERT.COMP.012')) // 호스트명을 확인해주세요.
        }

        this.vmInfo.hostNameIdx = await this.settingHostNameIdx(this.vmInfo, this.hostName)
      } catch (error) {
        console.error('호스트명 인덱스 생성:: Error')
      } finally {
        this.loading.isCreateHostNameIdx = false
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
        resourceName: 'common.ALERT.ORG.009', // 이름을 입력해주세요.
        availableNameInResource: 'common.ALERT.BASE.073', // 선택하신 프로젝트에 동일한 이름을 가진<br>자원이 존재합니다.
        availableNameInBasket: 'common.ALERT.BASE.074', // 동일한 이름으로 주문 진행중인<br>자원이 있습니다.
        servicePart: 'common.ALERT.NETWORK.018', // 서비스 구분을 선택해주세요.
        serviceType: 'common.ALERT.NETWORK.019', // 서비스 유형을 선택해주세요.
        clusterType: 'common.ALERT.COMP.009', // 고사양을 입력해주세요.
        networkCate: 'common.ALERT.COMP.010', // 네트워크 조직을 선택해주세요.
        hostName: 'common.ALERT.COMP.011', // 호스트명 인덱스를 생성 해주세요.
        serviceCode: 'common.ALERT.COMP.012', // 호스트명을 확인해주세요.

        projectInfo: 'admin.PREF.selectProject', // 프로젝트를 선택해주세요.
        cluster: 'common.ALERT.NUTA.011', // 클러스터를 선택하세요.
        node: 'common.ALERT.BASE.006', // 노드를 선택하세요.
        ipam: 'common.ALERT.COMP.018', // Network IP를 선택해주세요.
        appTeam: 'common.ALERT.COMP.013', // App 운영팀을 선택해주세요.
        appTaskUser: 'common.ALERT.COMP.014', // App 업무담당자를 선택해주세요.
        serverManager: 'common.ALERT.COMP.015', // 서버담당자를 선택해주세요.
        image: 'common.ALERT.NUTA.008', // 이미지를 선택해주세요.
        spec: 'common.ALERT.COMP.016', // 사양을 선택해주세요.
        completeSpec: 'common.ALERT.COMP.061', // 사양 수정을 완료해주세요.
        externalDisk: 'common.ALERT.PROJECT.030', // Local Disk를 선택 해주세요.
        externalDiskDefault: 'common.ALERT.PROJECT.029', // Local Disk 필수 경로 (${this.diskInfo[this.vmInfo.selectImage?.osType]?.default})가 선택되지 않았습니다.
        serviceDate: 'common.ALERT.COMP.017', // 서비스 개시일을 선택 해주세요.
        chargeDate: 'common.ALERT.COMP.063', // 과금 시작일을 설정해주세요.
        loadbalance: 'common.ALERT.COMP.064', // 로드밸런스를 선택해주세요.

        windowsMinSpec: 'common.ALERT.COMP.076' // 사양을 확인해주세요.<br><br>WINDOWS의 최소 사양은<br>vCPUs: 2Core 이상, RAM: 2GB 이상 입니다.
      }

      let pass = true

      for (let i = 0; i < checkItems.length; i++) {
        const key = Object.keys(checkItems[i])[0]
        const value = checkItems[i][key]
        const flag = value === '' ||
          value === false ||
            value === null ||
            value === undefined ||
            (value && typeof value === 'object' && isEmpty(value)) ||
            (Array.isArray(value) && !value.length) ||
            (Object.keys(checkItems[i]).includes('flag') && !checkItems[i].flag)

        if (flag) { // value가 비어있을 때 alert창을 띄워줍니다. flag가 있을때.. flag 조건 추가
          if (key === 'externalDiskDefault') this.$alert(this.$t(message[key], { path: this.diskInfo[this.defaultOsType]?.default }))
          else this.$alert(this.$t(message[key]), { dangerouslyUseHTMLString: true })
          pass = false
          break
        }
      }
      return pass
    },
    /**
     * 클러스터, 노드, IP 리셋 이벤트
     */
    resetClusterNode () {
      this.vmInfo.cluster = null
      this.vmInfo.node = null
      this.vmInfo.networkIp = null
    },
    /**
     * 서비스 개시일(시간/시) 선택 이벤트
     */
    changeServiceTime (time) {
      if (!this.serviceDate.date) return this.$alert(this.$t('common.ALERT.COMP.002')) // 날짜를 먼저 선택해주세요
      const dateCopy = cloneDeep(this.serviceDate.date)
      const calDateTime = dateCopy.getTime() + Number(time) * 60 * 60 * 1000

      this.vmInfo.serviceDate = calDateTime
    },
    /**
     * 서비스 개시일(시간/분) 선택 이벤트
     */
    changeServiceMin (min) {
      if (!this.serviceDate.date) return this.$alert(this.$t('common.ALERT.COMP.002')) // 날짜를 먼저 선택해주세요

      this.vmInfo.serviceDate = this.vmInfo.serviceDate + min * 60 * 1000
    },
    setServiceDate () {
      this.vmInfo.serviceDate = this.serviceDate.date.getTime() + this.serviceDate.time * 60 * 60 * 1000 + this.serviceDate.min * 60 * 1000
    },

    /**
    /**
     * 모달창 [저장]
     */
    async save () {
      const {
        projectInfo, // 프로젝트 정보
        resourceName, // 이름
        servicePart, // 서비스 구분
        serviceType, // 서비스 유형
        clusterType, // 사양 옵션
        networkList, // 네트워크 조직
        cluster, // 클러스터
        node, // 노드
        networkIp, // IPAM
        nicIps,
        serviceCode, // 서비스 코드
        hostName,
        hostNameIdx, // 호스트 명 IDX
        appManageTeam, // APP 운영팀
        appTaskUser, // App 업무 담당자
        svManager, // 서버 담당자
        selectImage, // 이미지
        externalDisk, // externalDisk
        spec, // 사양
        roleIdx, // 역할
        roleName, // 역할 명
        chargeDate, // 과금 시작일
        // serviceDate, // 서비스 개시일
        userVmIdx,
        itsmName, // 업무 명
        loadbalance,
        installProgramList, // 설치프로그램
        note, // 비고

        // era..
        osType,
        osBit,
        osName
      } = this.vmInfo

      const unRegist = this.isUnregistered // 미등록
      const isNew = !this.data // 생성
      const specEditing = this.$refs.editableSpecRef ? this.$refs.editableSpecRef.editableMode : false

      // if (!this.data) { // 생성
      const checkValidItems = [
        { projectInfo: isNew ? [projectInfo?.company, projectInfo?.group, projectInfo?.project].every(info => info) : true }, // 관-조-프 정보
        { resourceName: resourceName?.trim() }, // 이름 - 생성 검사
        { availableNameInResource: await this.isAvailableResourceName(false) }, // 자원 명 중복 체크(생성 자원))
        { availableNameInBasket: await this.isAvailableResourceName(true) }, // 자원 명 중복 체크(장바구니/주문함/사전협의/할일(작업완료되기전))
        { servicePart: servicePart }, // 서비스 구분 - 생성 검사
        { serviceType: serviceType }, // 서비스 유형 - 생성 검사
        { highVol: isNew ? clusterType : true }, // 고사양 선택 - 생성 검사
        { networkCate: networkList }, // 네트워크 조직 - 생성 검사
        { hostName: isNew ? hostNameIdx : true }, // 인덱스 생성 - 생성 검사
        { appTeam: appManageTeam }, // App운영팀 - 전체
        { appTaskUser: appTaskUser && appTaskUser.length }, // App 업무담당자 - 전체
        { serverManager: svManager }, // 서버 담당자 - 전체
        { image: isNew || unRegist ? selectImage : true }, // 이미지 - 생성/미등록 검사
        { spec: spec }, // 사양 선택 - 전체
        { windowsMinSpec: unRegist ? (this.defaultOsType === 'WINDOWS' ? spec?.flavorCpu >= 2 && spec?.flavorRam >= 2 : true) : true }, // windows 최소 사양 - 미등록
        { completeSpec: !isNew || unRegist ? !specEditing : true }, // 사양 변경 중 - 변경/미등록 검사
        // { externalDisk: isNew ? externalDisk : true }, // Local Disk - 생성 검사
        // { externalDiskDefault: isNew ? isExternalDiskDefault : true }, // Local Disk Default - 생성 검사
        { cluster: isNew ? cluster : true }, // 클러스터 - 생성 검사
        { node: isNew ? node : true }, // 노드 - 생성 검사
        { ipam: isNew ? networkIp : true }, // IP - 생성 검사
        {
          serviceDate: isNew // 서비스 개시일 - 생성 검사
            ? this.serviceDate.date !== null && this.serviceDate.time !== null && this.serviceDate.min !== null
            : true
        },
        { chargeDate: unRegist ? chargeDate : true }, // 과금 시작일 - 미등록 검사
        { loadbalance: this.networkField === 'SDN' && (isNew || unRegist) ? loadbalance !== undefined : true } // 로드밸런스 - 생성 검사
      ]

      const checkList = (this.data?.market || this.data?.era)
        ? checkValidItems.filter(item => !('spec' in item))
        : checkValidItems
      // }
      if (!this.noEmptyContents(checkList)) return

      this.setServiceDate()
      if ((!this.data || this.isUnregistered) && +new Date() >= this.vmInfo.serviceDate) return this.$alert(this.$v('서비스 개시일은 현재시각 이후로만 설정 가능합니다.'), () => false)

      // if (!this.data) { // 생성 시
      //   // 이미 존재하는 호스트명 인덱스를 검사합니다. 인덱스 생성 후 ~ 장바구니 반영 전 사이에 해당 인덱스가 생성되는 현상 방지
      //   const beforeHostName = cloneDeep(this.hostName + this.vmInfo.hostNameIdx)
      //   this.loading.initVmData = true
      //   await this.createHostIndex()
      //   this.loading.initVmData = false
      //   if ((this.hostName + this.vmInfo.hostNameIdx) !== beforeHostName) {
      //     await this.$alert(this.$t('common.ALERT.COMP.062', { newName: this.hostName + this.vmInfo.hostNameIdx })) // 호스트명이 {newName}으로 변경되었습니다.
      //   }
      // }

      const appTaskUserList = appTaskUser.map(usr => {
        return {
          appTaskUserGroupCode: '',
          appTaskUserGroupName: usr.userGroupName,
          appTaskUserId: usr.userId,
          appTaskUserName: usr.userName
        }
      })

      const networkCate = networkList || []

      const imageData = cluster?.images ? cluster.images.filter(cl => cl.userImageIdx === selectImage.userImageIdx) : null
      const payload = Object.assign({
        userId: this.user.userId,
        userName: this.user.userName,
        userPosition: this.user.userPosition,
        groupIdx: projectInfo.group.groupIdx,
        groupName: projectInfo.group.groupName,
        orderData: {
          // ...this.vmInfo,
          ...(this.data?.era && { databaseName: resourceName }),
          ...(!this.data?.era && { computeName: resourceName }),
          servicePart,
          serviceType,
          clusterType,
          serviceCode,
          itsmName, // 업무 명
          image: imageData ? imageData[0] : null,
          servicePartName: this.servicePartOptions.find(item => item.codeVal === servicePart)?.codeName || '',
          serviceTypeName: this.serviceTypeOptions.find(item => item.codeVal === serviceType)?.codeName || '',
          hostname: this.data && hostName ? hostName : this.hostName + this.vmInfo.hostNameIdx,
          hostNameIdx: this.vmInfo.hostNameIdx,
          appManageTeam: appManageTeam.groupIdx,
          appManageTeamName: appManageTeam.groupName,
          appManageTeamCode: appManageTeam.groupCode, // ?
          appTaskUser: [...appTaskUserList],
          ipSystemManager: [...appTaskUserList],
          roleId: roleIdx,
          roleName,
          imageId: selectImage ? selectImage.userImageIdx : undefined,
          imageName: selectImage ? selectImage.osName : undefined,
          imageDescription: selectImage ? selectImage.osDesc : undefined,
          osDesc: selectImage ? selectImage.osDesc : undefined,
          osBit: selectImage ? selectImage.osBit : osBit,
          osName: selectImage ? selectImage.osName : osName,
          osType: selectImage ? selectImage.osType : osType,
          flavorCustomIdx: spec.flavorCustomIdx,
          profileId: spec.flavorIdx,
          profileName: spec.flavorName,
          vcpu: spec.flavorCpu,
          memory: spec.flavorRam,
          rootDiskSize: spec.flavorDisk || (!this.disableDiskReason && selectImage?.osRootDiskSize) || 0,
          externalDiskList: !externalDisk ? [] : externalDisk.map(d => {
            return {
              ...d,
              diskName: d.name || d.deviceBus + '.' + d.deviceIndex,
              diskSize: +d.size
            }
          }),
          companyId: projectInfo.company.groupIdx,
          companyName: projectInfo.company.groupName,
          groupId: projectInfo.group.groupIdx,
          groupName: projectInfo.group.groupName,
          networkList: [...networkCate],
          cluster,
          node,
          serviceDate: this.vmInfo.serviceDate,
          // installProgramList: !this.data?.era ? [...installPrograms] : this.vmInfo.installProgramList,
          installProgramList,
          loadbalance: loadbalance,
          note,
          projectId: projectInfo.project.projectIdx,
          projectName: projectInfo.project.projectName,
          userId: this.user.userId,
          userName: this.user.userName,
          ownerCompanyId: projectInfo.company.groupIdx, // ?
          ownerCompanyName: projectInfo.company.groupName // ?
        }
      }, {})

      if (this.data) { // 수정
        payload.orderData.updateUserId = this.user.userId
        payload.orderData.updateUserName = this.user.userName
        payload.orderData.userVmIdx = userVmIdx
        if (this.isUnregistered) {
          payload.orderData.chargeDate = chargeDate

          // 네트워크 카테고리 메타 데이터 추가 (22.03.10) ====
          payload.orderData.cateIdx = networkCate?.length ? networkCate[0].cateId : null
          payload.orderData.cateKey = networkCate?.length ? networkCate[0].cateKey : null
          payload.orderData.subnetUuid = nicIps?.length ? nicIps[0].subnetUuid : null
          payload.orderData.subnetName = nicIps?.length ? nicIps[0].subnetName : null
          payload.orderData.vlanId = nicIps?.length ? nicIps[0].vlanId : null
          payload.orderData.ipAddress = nicIps?.length ? nicIps[0].ipAddress : null
        }
      } else { // 생성
        payload.orderData.createUserId = this.user.userId
        payload.orderData.createUserName = this.user.userName
        payload.orderData.chargeDate = +new Date(Date.now())
      }

      if (!(payload.orderData?.networkList[0] && payload.orderData.networkList[0].cateKey.includes('SDN'))) delete payload.orderData.loadbalance

      console.log('=====저장 데이터: ', payload)
      if (this.data && !this.unRegistered && !this.checkIsChangedData(payload)) { // '수정'시 변경 사항이 있는지 체크합니다.
        return this.$alert(this.$t('common.ALERT.NETWORK.009')) // 변경된 사항이 없습니다.
      }
      // this.$emit('save', payload)
    },
    /**
     * '수정' 시, 바뀐 데이터가 있는지 판단합니다.
     */
    checkIsChangedData () {
      if (!this.initData) return true

      let changed = false

      const columns = this.changableDataColumns
      for (let i = 0; i < columns.length; i++) {
        if (columns[i].binding === 'installProgramList') {
          const before = this.initData.installProgramList.map(prm => prm.swIdx)
          const after = this.vmInfo.installProgramList.map(prm => prm.swIdx)
          if (!isEqual(before, after)) {
            changed = true
            break
          }
        } else {
          if (!isEqual(this.vmInfo[columns[i].binding], this.initData[columns[i].binding])) {
            changed = true
            break
          }
        }
      }
      return changed
    },
    // APP 운영팀 모달 open
    saveOperateTeam (team) {
      this.vmInfo.appManageTeam = team
      // console.log(team, '---operating Team!!!!!!')
    },
    /**
     * App업무담당자 선택 이벤트
     */
    saveTaskManager (managers) {
      this.vmInfo.selTaskManager = [...managers]
      this.vmInfo.appTaskUser = this.vmInfo.selTaskManager.map(item => {
        const result = {
          userId: item.userId,
          userName: item.userName,
          userGroupName: item.userGroupName
        }
        return result
      })
    },
    /**
     * 서버 담당자 선택시, 발생 이벤트
     */
    selectSvManager (p) {
      // console.log('selectManger: ', p)
      this.vmInfo.svManager = p
      this.vmInfo.svManager.comp = [...p.company]
      this.vmInfo.roleIdx = p.roleIdx
      this.vmInfo.roleName = p.roleName
    },

    /**
     * '클러스터 선택' 버튼 클릭 시 발생 이벤트
     */
    async clickSelectClusterNode (field) {
      if (field === 'cluster') {
        this.clusterModalView = true
      } else if (field === 'node') {
        this.nodeModalView = true
        this.setRelatedNodes()
      } else {
        this.ipModalView = true
      }
    },

    /**
     * [클러스터 설정 / 노드 설정] 모달에서 선택한 아이템을 테이블에 바인딩
     * @param {Object} data 선택한 row의 정보
     * @param {String} field 어느 영역인지
     */
    setClusterNode (data, field) {
      this.vmInfo[field] = data

      if (field === 'cluster') {
        this.vmInfo.node = null // 클러스터가 변경되면 노드 초기화
        this.vmInfo.ip = null // 클러스터가 변경되면 네트워크 IP 초기화
      }
      if (field === 'node') {
        this.vmInfo.ip = null // 노드가 변경되면 네트워크 IP 초기화
      }
    },
    /**
     * 선택 네트워크 Ip (업무에서 가져온 데이터)
     */
    setSelectedNetwork (param, cateInfo) {
      if (!cateInfo) return

      const result = JSON.parse(JSON.stringify(this.vmInfo.networkList))
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

      this.vmInfo.networkList = [...result]
      this.vmInfo.ip = param
    },
    /**
     * 기본적으로 처음에 클러스터 데이터를 가져옵니다.
     */
    async getClusters () {
      this.loading.cluster = true
      try {
        const clusters = await API.compute.getClusters()
        this.originClusters = [...clusters]
        this.clusterModalTableData = await this.setClusterTableData(clusters)

        if (this.vmInfo.clusterType) {
          this.clustersFilteredBySpec = this.clusterModalTableData.map(row => {
            this.$set(row, 'isSelectable', row.highVal === this.vmInfo.clusterType)
            return row
          })
        } else this.clustersFilteredBySpec = []
      } catch (error) {
        console.error('@@@ getClusters' + error)
        this.$alert(this.$t('common.ALERT.NUTA.009'), { // 클러스터 리스트를 가져오는동안 문제가 발생했습니다. 관리자에게 문의해주세요.
          confirmButtonText: this.$t('common.BTN.confirm')
        })
      } finally {
        this.loading.cluster = false
      }
    },
    /**
     * 클러스터 테이블을 위해 데이터를 세팅합니다.
     * @param {Array} clusters 클러스터 데이터
     */
    setClusterTableData (clusters) {
      if (!this.vmInfo?.selectImage?.userImageIdx) return []
      // 테이블 데이터 가공
      // const clustersData = clusters.map(cls => {
      const filteredByImageCls = clusters.filter(cls => {
        const images = cls.images ? [...cls.images] : []
        const imageInCls = images.find(e => e.userImageIdx === this.vmInfo.selectImage.userImageIdx) // 클러스터.images 데이터에 선택한 이미지와 동일한 이미지가 있는 클러스터만 노출
        const isCentralIdx = !(cls.centralIdx === undefined || cls.centralIdx === null) // 클러스터 중 centralIdx 정보를 가지고 있는 클러스터만 노출 (22.07.13 서버쪽 요청사항)
        if (imageInCls && isCentralIdx) return cls
      })

      const clustersData = filteredByImageCls.map((cls, idx) => {
        const vcpuIncrDecrRate = isEmpty(this.vmInfo.spec) ? undefined : (+this.vmInfo.spec.flavorCpu / cls.nonNodeCpuSum * 100).toFixed(2) // 가상화율 임계치 증감률
        const memoryIncrDecrRate = isEmpty(this.vmInfo.spec) ? undefined : (+this.vmInfo.spec.flavorRam * 1024 * 1024 * 1024 / cls.nodeMemoryCapacityInBytesSum * 100).toFixed(2) // Memory 임계치 증감률
        const diskIncrDecrRate = () => {
          if (!this.vmInfo.externalDisk?.length) return undefined
          const rootDiskSize = this.vmInfo.selectImage ? this.vmInfo.selectImage.osRootDiskSize : 0
          const externalDisksSum = this.vmInfo.externalDisk.reduce((result, item) => result + item.size, 0) // Disk 임계치 증감률

          return (+(rootDiskSize + externalDisksSum) * 1024 * 1024 * 1024 / cls.nonNodeStorageCapacityBytes * 100).toFixed(4)
        }

        const {
          clusterName,
          nodeCnt,
          vmCnt,
          storageType,
          clusterUuid,
          elementIdx,
          virtualPercent,
          images,
          subnets,
          // cpuPercent, memoryPercent, diskPercent

          // 1차, 2차 임계치
          firstCpuPercent,
          firstMemoryPercent,
          firstDiskPercent,
          secondCpuPercent,
          secondMemoryPercent,
          secondDiskPercent
        } = cls

        const ipamOnItems = subnets?.filter(sn => !!sn?.defaultGatewayIp && sn.subnetPools)

        return {
          name: clusterName,
          node: nodeCnt,
          vm: vmCnt,
          highVal: storageType, // 고사양
          virtualPercent: virtualPercent + '%', // 가상화율
          vcpuUsagePercent: cls.hypervisorCpuUsagePpm / 100, // vCPU 사용량
          hypervisorCpuUsagePpm: this.$options.filters.percent(cls.hypervisorCpuUsagePpm),
          clusterUuid,
          elementIdx,
          images: images || [],
          ipamOnCnt: ipamOnItems ? ipamOnItems.length : 0,
          // cpuPercent, // vCPU 사용량
          // memoryPercent,
          // diskPercent,
          // vcpu: { size: usageVcpu, all: cls.nodeCpuCoresSum },

          // ------------------------------------------------
          // assign: {
          //   vcpuCnt: { size: cls.vmCpuSum, all: totalVcpuCnt },
          //   memory: { size: usageMemory, all: totalMemoryGB },
          //   disk: { size: usageDiskTB, all: totalDiskTB }
          // },
          // assignPercent: {
          //   vcpuCnt: cls.vmCpuSum / totalVcpuCnt,
          //   memory: usageMemory / totalMemoryGB,
          //   disk: usageDiskTB / totalDiskTB
          // },
          //  assignPercentText: {
          //   vcpuCnt: `${cls.vmCpuSumtoFixed(0)}Core / ${totalVcpuCnt}Core`,
          //   memory: `${usageMemory}GB / ${totalMemoryGB}GB`,
          //   disk: `${usageDiskTB}TB / ${totalDiskTB}TB`
          // },
          // -------- 프로그레스 표기 100% 기준 최대 가상화율로 변경 (10.13)
          assign: {
            vcpuCnt: { size: cls.vmCpuSum, all: cls.nonNodeCpuSum },
            memory: { size: cls.vmMemSum, all: cls.nonNodeMemSum },
            disk: { size: cls.memUsagePct, all: cls.virtualPercent }
          },
          assignPercent: {
            vcpuCnt: cls.cpuUsagePct,
            memory: cls.memUsagePct,
            disk: cls.diskCapacityPct
          },
          assignPercentText: {
            vcpuCnt: `${Number(cls.vmCpuSum).toFixed(0)}Core / ${Number(cls.nonNodeCpuSum).toFixed(0)}Core`,
            memory: `${this.$options.filters.byte(cls.vmMemSum || 0)} / ${this.$options.filters.byte(cls.nonNodeMemSum || 0)}`,
            disk: `${this.$options.filters.byte(cls.vdiskCapacitySum || 0)} / ${this.$options.filters.byte(cls.nonNodeStorageCapacityBytes || 0)}`
          },
          vcpuIncrDecrRate, // vCPU 증감률
          memoryIncrDecrRate, // memory 증감률
          diskIncrDecrRate: diskIncrDecrRate(), // memory 증감률

          // 1차, 2차 임계치
          firstCpuPercent,
          firstMemoryPercent,
          firstDiskPercent,
          secondCpuPercent,
          secondMemoryPercent,
          secondDiskPercent
        }
      })

      return clustersData
    },
    /**
     * 클러스터가 선택 된 경우, 전체 클러스터 데이터에서 선택된 클러스터에 대한 uuid를 가진 노드들을 세팅합니다. (업무 쪽에서 가져왔습니당 - 이미지.네트워크 선택 영역 제거했습니다.)
     * 노드가 세팅된 경우, 그 데이터들을 기반으로 네트워크 그리드 데이터를 세팅합니다.
     * @param {Object} 선택된 클러스터 하나의 데이터
     */
    setRelatedNodes (cluster = this.vmInfo.cluster) {
      if (!cluster) this.$alert(this.$t('common.ALERT.NUTA.010')) // '클러스터를 먼저 선택해주세요.'

      this.originClusters.map(cls => {
        if (cluster.clusterUuid === cls.clusterUuid) {
          this.nodeModalTableData = cls.hosts
            ? cls.hosts.map(host => {
              return {
                ...host,
                cpuIncrDecrRate: isEmpty(this.vmInfo.spec) ? undefined : (+this.vmInfo.spec.flavorCpu / host.numCpuCores * 100).toFixed(2), // vCPU 사용량 증감률
                memoryIncrDecrRate: isEmpty(this.vmInfo.spec) ? undefined : (+this.vmInfo.spec.flavorRam / host.memoryCapacityInBytes * 100).toFixed(2) // memory 사용량 증감률

              }
            })
            : []
          // console.log(this.nodeGridData)
          this.setIpGridData(cls)
        }
      })
    },
    /**
     * 클러스터에 연결된 네트워크 정보를 네트워크 그리드에 세팅합니다. (업무쪽에서 get)
     * @param {Object} 하나의 클러스터 정보
     */
    setIpGridData (cls) {
      const subnets = cls.subnets
      const data = []

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

        // 이미 기존에 선택되어있던 네트워크가 있다면 해당 내용 텍스트들로 data 를 채워줍니다.
        // 기존에 선택되어있던 내용이 없다면 기본 데이터 || 빈 문자열입니다. (자동일때, 수동일때 조건도 포함됩니다)
        const temp = { ...this.vmInfo.networkList[0] }
        const regIp = temp?.subnetUuid === subnet?.subnetUuid // 이미 이전에 선택된 네트워크가 있는 경우 true
        const hasSelected = regIp && !isAuto // 선택된 네트워크가 있고 && 수동 IP 일때

        const defaultCustomIp = regIp ? temp.ipAddress : ''
        const defaultGateway = (hasSelected) ? temp.gateway : subnet.defaultGatewayIp
        const defaultNetmask = (hasSelected) ? temp.netmask : subnet.netmask
        const defaultDns = (hasSelected) ? temp.dns : ''
        const defaultPrefix = subnet.subnetIp ? `${subnet.subnetIp}/${subnet.prefixLength}` : '' // IP 대역 : subnetIp/prefix
        // const defaultPrefix = (hasSelected) ? temp.prefix : subnet.prefixLength

        // [직접 입력] 되었는지 여부 와 입력된 데이터 등을 설정합니다.
        // 이 라인을 주석처리하면 에러가 납니다.. disabled 여부만 설정해주세요
        const editable = (val) => {
          if (!val) return { edit: true, disabled: isAuto }
          return { edit: !val, disabled: isAuto }
        }

        const customIp = { ...editable(defaultCustomIp), disabled: false, data: defaultCustomIp }
        const defaultGatewayIp = { ...editable(defaultGateway), data: defaultGateway }
        const netmask = { ...editable(defaultNetmask), data: defaultNetmask }
        const dns = { ...editable(defaultDns), data: defaultDns }
        const prefix = { disabled: true, data: defaultPrefix }
        const activeIPAM = isAuto

        const subnetData = {
          ...copySubnet,
          customIp, // IP
          defaultGatewayIp, // Gateway
          netmask, // Netmask
          dns, // DNS
          prefix, // Prefix
          activeIPAM // IPM 활성 여부
        }

        // 자동 / 수동 할당인경우 확인할 수 있는 프로퍼티 생성
        Object.defineProperty(subnetData, 'isIPAM', { value: isAuto, writable: false })

        // 혹시 모르니까.. 서버에서 받아온 netmask 저장
        Object.defineProperty(subnetData, 'savedNetmask', { value: subnet.netmask, writable: false })

        data.push(subnetData)
      })

      this.ipModalTableData = [...data]
      // console.log('%c ========= ', 'color: #77FD33', data)
      // console.log(this.networkGridData, '==== this.networkGridData')
    },
    /**
     * 변경 > 상단 자원 기본 정보 데이터 세팅
     * @param {Object} data 수정 할 vm 정보
     */
    setResourceDefault (data) {
      let defaultInfo

      const externalDisks = data.externalDisk.map(item => {
        const value = item.name + ': ' + item.size + 'GB'
        return value
      })

      const externalDiskValue = externalDisks?.length ? externalDisks.join(', ') : '-'

      const clusterType = {
        MIXED: 'Hybrid (SSD + HDD)',
        ALL_FLASH: 'All Flash (SSD)',
        ALL_HDD: 'All HDD (HDD)'
      }[data.clusterType]

      if (this.isUnregistered) { // 미등록 자원
        defaultInfo = {
          projectInfo: data.companyName && data.groupName && data.projectName ? `${data.companyName} > ${data.groupName} > ${data.projectName}` : '-', // 관계사/조직/프로젝트
          clusterNode: data.clusterName && data.nodeName ? `${data.clusterName} > ${data.nodeName}` : '-', // 클러스터/노드
          // servicePartName: this.servicePartOptions.find(item => item.codeVal === data.servicePart)?.codeName || '', // 서비스 구분
          // serviceTypeName: this.serviceTypeOptions.find(item => item.codeVal === data.serviceType)?.codeName || '', // 서비스 유형
          // resourceName: data.computeName || data.databaseName || '-', // 자원 명
          hostName: data.hostName || '-', // 호스트 명
          // itsmName: data.itsmName || '-', // 업무 명
          clusterType,
          spec: `vCPU: ${data.vcpu || data.numVcpus}Core, Memory: ${this.$options.filters.byteToGb(data.memoryCapacityInBytes) || +data.memory}GB, RootDisk: ${data.rootDiskSize || 0}GB`, // 설정된 사양 정보
          externalDisk: externalDiskValue, // Local Disk
          nicIps: data.nicIps // IP
        }
      } else {
        const osImage = `${data.osName ? data.osName : ''}${data.osVersion ? data.osVersion : ''}${data.osBit ? data.osBit : ''}` || '-'

        // console.log('Default Data: ', data)
        defaultInfo = {
          projectInfo: data.companyName && data.groupName && data.projectName ? `${data.companyName} > ${data.groupName} > ${data.projectName}` : '-', // 관계사/조직/프로젝트
          clusterNode: data.clusterName && data.nodeName ? `${data.clusterName} > ${data.nodeName}` : '-', // 클러스터/노드
          // servicePartName: this.servicePartOptions.find(item => item.codeVal === data.servicePart)?.codeName || '', // 서비스 구분
          // serviceTypeName: this.serviceTypeOptions.find(item => item.codeVal === data.serviceType)?.codeName || '', // 서비스 유형
          // resourceName: data.computeName || data.databaseName || '-', // 자원 명
          hostName: data.hostName || '-', // 호스트 명
          // itsmName: data.itsmName || '-', // 업무 명
          // networkList: data.networkList && data.networkList.length ? data.networkList[0].cateKey : '-', // 네트워크 조직
          clusterType, // 사양 선택 정보
          spec: `vCPU: ${data.vcpu}Core, Memory: ${data.memory}GB, RootDisk: ${data.rootDiskSize || 0}GB`, // 설정된 사양 정보
          osImage, // OS 이미지
          externalDisk: externalDiskValue, // Local Disk
          nicIps: data.nicIps, // IP
          serviceDate: data.serviceDate
        }
      }

      this.fixData = defaultInfo

      this.fixDataColumns = this.originFixDataColumns.filter(col => Object.keys(defaultInfo).includes(col.binding))
      if (this.fixDataColumns.length % 2) this.fixDataColumns[this.fixDataColumns.length - 1].colspan = true
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
    /**
     * 선택한 관계사의 Prefix / ci가 존재하는지 판단
     * @param {Object} param { company: {...}, group: {...}, project: {...} }
     * @return {Boolean} prefix, ci 모두 존재하면 false, 아니면 true 반환
    */
    noCompanyPrefix (param) {
      if (!param?.company) return false
      if (param.company?.groupIdx === null) return false
      if (!this.selectedProject && (param.group || param.project)) return false
      if (this.selectedProject?.companyIdx && this.vmInfo.projectInfo?.company) return false

      const goToManageGroupPage = () => {
        this.$router.push({
          name: 'set-organization',
          query: {
            companyIdx: param.company.groupIdx
          }
        })
      }

      const resetCompany = () => {
        this.$refs.groupSelect.changeCompany(null)
      }
      // Prefix 없을 때
      if (!param.company.companyPrefix) {
        this.$confirm(
          this.$v('선택한 관계사의 Prefix를 먼저 등록해주세요.<br><br><span style="color: #d95252;">* 확인 클릭 시 등록 페이지로 이동합니다.</span>'),
          { dangerouslyUseHTMLString: true }
        )
          .then(() => goToManageGroupPage())
          .catch(() => resetCompany())
      }

      // Ci 없을 때
      if (!param.company.companyCi) {
        this.$confirm(
          this.$v('선택한 관계사의 CI명을 먼저 등록해주세요.<br><br><span style="color: #d95252;">* 확인 클릭 시 등록 페이지로 이동합니다.</span>'),
          { dangerouslyUseHTMLString: true }
        )
          .then(() => goToManageGroupPage())
          .catch(() => resetCompany())
      }
    },
    /**
     * 자원 명 중복 체크 후, 사용 가능 여부를 리턴합니다.
     */
    async isAvailableResourceName (inBasket, isDB = !!this.data?.era, isMP = !!this.data?.market) {
      const insertName = this.vmInfo.resourceName?.trim()
      if (!insertName) return

      const originResourceName = () => {
        if (isDB) return this.data.era.databaseName
        else if (isMP) return this.data.market.marketplaceName
        else return this.data?.computeName
      }
      if (this.data && (originResourceName() === insertName)) return true

      try {
        this.loading.isCheckAvailableName = true
        if (!inBasket) { // 생
          const vmList = await await API.configManage.vm.getVmList({
            projectIdx: this.vmInfo.projectInfo.project.projectIdx,
            isProgress: true
          })
          const projectResourceName = vmList ? vmList.map(item => {
            if (item.isDB) return item.era.databaseName
            else if (item.isMP) return item.market.marketplaceName
            else return item.computeName
          }) : []

          if (projectResourceName.includes(insertName)) return false
          else return true
        } else {
          // 장바구니/주문함/사전협의/할일(작업완료되기전)에 동일 자원 명 있는 지 검사 (True: 존재 o)
          const key = () => {
            if (isDB) return 'databaseName'
            else if (isMP) return 'marketplaceName'
            else return 'computeName'
          }
          const { data } = await API.order.isExistOrderedResource(
            this.vmInfo.projectInfo.project.projectIdx,
            key(),
            insertName
          )
          return !data
        }
      } catch (error) {
        console.log(error)
      } finally {
        this.loading.isCheckAvailableName = false
      }
    },
    /*
     * 서비스 개시일(날짜) 리셋
     * 서비스 개시일이 현재 시간보다 과거로 설정되어 있을 때, 시/분을 null로 설정합니다.
     */
    changeServiceDate (field) {
      if (!this.serviceDate.date) return
      const allServiceDate = this.serviceDate.date.getTime() + this.serviceDate.time * 60 * 60 * 1000 + this.serviceDate.min * 60 * 1000
      if (+new Date() >= allServiceDate) {
        this.serviceDate.min = null
        if (field === 'date') this.serviceDate.time = null
      }
    }
  },
  data () {
    return {
      treeDataLoading: false, // 조직도 트리 데이터 로딩
      groupTreeData: [],
      market: {}, // 마켓플레이스 정보
      curProject: {},
      loading: {
        initVmData: false,
        settingInitData: false,
        cluster: false,
        isGetMarket: false, // 마켓플레이스 제품 정보 조회 로딩
        isGetConfig: false, // code 데이터 조회 로딩
        isGetInstall: false, // 설치프로그램 데이터 조회 로딩
        isCreateHostNameIdx: false, // 인덱스 생성 로딩
        isCheckAvailableName: false // 자원명 중복 체크 로딩
      },
      vmInfo: { // 프로젝트 설정
        projectInfo: {
          company: null,
          group: null,
          project: null
        },
        resourceName: '', // 이름
        servicePart: '', // 서비스 구분
        serviceType: '', // 서비스 유형
        clusterType: 'MIXED', // 사양옵션
        networkList: [], // 네트워크 조직
        appManageTeam: null, // APP 운영팀
        appTaskUser: null, // App 업무 담당자
        svManager: null, // 서버 담당자
        selectImage: null, // 이미지
        spec: null, // 사양선택
        externalDisk: [], // Local Disk
        cluster: null, // 클러스터
        node: null, // 노드
        networkIp: null, // IP
        loadbalance: 'none'
      },
      initData: null,

      serviceDate: { date: null, time: 0, min: 0 }, // 서비스 개시일
      chargeDate: '', // 과금 시작일
      images: [], // 이미지 목록
      displayCatalogFlavor: [], // 노출 되는 사양 리스트
      catalogFlavor: [],
      originInstallPrograms: {}, // install 리스트 복사
      installListByOsType: {}, // OS타입에 따른 install리스트
      isDisableExternalDisk: false,

      servicePartOptions: [], // 서비스 구분 선택 옵션
      serviceTypeOptions: [], // 서비스 유형 선택 옵션
      diskSizeMax: 1000,
      diskSizeMin: 50,
      checkInstallDataList: [],

      // 업무담당자 모달 관련
      opTeamPopView: false, // APP 운영팀 모달 핸들링
      // selTeam: undefined,
      taskManPopView: false, // APP 업무 담당자 모달 핸들링
      // selTaskManager: [],
      serverManagerPopView: false, // 서버 담당자 모달
      clusterModalView: false, // 클러스터 선택 모달
      nodeModalView: false, // 노드 선택 모달
      ipModalView: false, // IP 선택 모달
      networkField: '',

      computeColumns: {
        imageColumns: [
          { binding: 'osName', header: '이미지 이름', keyPath: 'common.GRID.COMPUTE.imageName' },
          { binding: 'osDesc', header: '설명', keyPath: 'common.GRID.explain' },
          { binding: 'osBit', header: '비트', keyPath: 'admin.PREF.bit' }
        ],
        installProgramColumns: [
          { binding: 'softwareName', header: 'SW Name' },
          { binding: 'versionName', header: 'VERSION' }
        ]

      },
      // 클러스터 모달 테이블 및 컬럼
      originClusters: [], // 가공 전 origin cluster 데이터
      clusterModalTableData: [],
      clustersFilteredBySpec: [], // 선택한 사양 옵션에 따라 필터링 된 클러스터 목록
      clusterModalColumn: {
        columns: [
          { header: this.$t('common.REGCON.name'), binding: 'name', width: 150 },
          { header: 'Node', binding: 'node', width: 50, customHtml: true },
          { header: 'VM', binding: 'vm', width: 50, customHtml: true },
          { header: this.$t('common.GRID.COMPUTE.highSpec'), binding: 'highVal', width: 120, customHtml: true },
          { header: this.$t('common.GRID.NUTA.virtualRate'), binding: 'virtualPercent', width: 70, customHtml: true },
          { header: this.$t('common.GRID.DATABASE.usageCpu'), binding: 'vcpuUsagePercent', width: 120, customHtml: true },
          { header: this.$t('common.GRID.NUTA.virtualRate'), binding: 'assignPercent.vcpuCnt', customHtml: true },
          { header: 'Memory', binding: 'assignPercent.memory', customHtml: true },
          { header: 'Disk', binding: 'assignPercent.disk', customHtml: true }
        ],
        headerMergeColumns: {
          colSpan: [
            { startIdx: 6, endIdx: 8, header: '임계치(%)' }
          ],
          rowSpan: ['name', 'node', 'vm', 'highVal', 'virtualPercent', 'vcpuUsagePercent']
        }
      },

      // 노드 모달 테이블 및 컬럼
      nodeModalTableData: [],
      nodeModalColumn: [
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

      // IP 선택 모달 테이블 및 컬럼
      ipModalTableData: [],
      serviceOpenDateOptions: { // 서비스 개시일 datepicker 옵션 설정
        disabledDate (time) {
          const today = new Date().toDateString()
          return time.getTime() < new Date(today)
        }
      },
      svManager: {
        tit: undefined,
        rel: []
      },
      svManagerOptions: [], // 서버담당자 샘플..

      regex: {
        WINDOWS: /^[a-zA-Z]:\\[\\\S|*\S]?.*$/g,
        LINUX: /^(\/|([\\/][\w\s@^!#$%&-]+)+(\.[a-z]+[\\/]?)?)$/i,
        UBUNTU: /^(\/|([\\/][\w\s@^!#$%&-]+)+(\.[a-z]+[\\/]?)?)$/i,
        CENTOS: /^(\/|([\\/][\w\s@^!#$%&-]+)+(\.[a-z]+[\\/]?)?)$/i,
        RHEL: /^(\/|([\\/][\w\s@^!#$%&-]+)+(\.[a-z]+[\\/]?)?)$/i
      },

      hostName: '', // 호스트명
      defaultOsType: 'LINUX',
      // itsmName: '', // ITSM 명

      diskInfo: {
        UBUNTU: {
          default: '/app',
          defaultSize: 50,
          unauthorized: [
            '/bin',
            '/boot',
            '/dev',
            '/etc',
            '/home',
            '/lib',
            '/lib64',
            '/media',
            '/mnt',
            '/opt',
            '/proc',
            '/root',
            '/run',
            '/sbin',
            '/snap',
            '/srv',
            '/sys',
            '/tmp',
            '/usr',
            '/var'
          ]
        },
        LINUX: {
          default: '/app',
          defaultSize: 50,
          unauthorized: [
            '/bin',
            '/boot',
            '/dev',
            '/etc',
            '/home',
            '/lib',
            '/lib64',
            '/media',
            '/mnt',
            '/opt',
            '/proc',
            '/root',
            '/run',
            '/sbin',
            '/srv',
            '/sys',
            '/tmp',
            '/usr',
            '/var'
          ]
        },
        CENTOS: {
          default: '/app',
          defaultSize: 50,
          unauthorized: [
            '/bin',
            '/boot',
            '/dev',
            '/etc',
            '/home',
            '/lib',
            '/lib64',
            '/media',
            '/mnt',
            '/opt',
            '/proc',
            '/root',
            '/run',
            '/sbin',
            '/snap',
            '/srv',
            '/sys',
            '/tmp',
            '/usr',
            '/var'
          ]
        },
        RHEL: {
          default: '/app',
          defaultSize: 50,
          unauthorized: [
            '/bin',
            '/boot',
            '/dev',
            '/etc',
            '/home',
            '/lib',
            '/lib64',
            '/media',
            '/mnt',
            '/opt',
            '/proc',
            '/root',
            '/run',
            '/sbin',
            '/snap',
            '/srv',
            '/sys',
            '/tmp',
            '/usr',
            '/var'
          ]
        },
        WINDOWS: {
          default: 'D:\\',
          defaultSize: 100,
          unauthorized: [
            'A:\\',
            'B:\\',
            'C:\\'
          ]
        }
      },
      fixData: null, // 변경 > 자원 기본 정보에 뿌려질 데이터
      fixDataColumns: [],
      originFixDataColumns: [ // 변경 > 자원 기본 정보 (변경 불가능 정보) verticalTable 에 뿌려줄 columns
        { header: '관계사/조직/프로젝트', binding: 'projectInfo', keyPath: 'common.GRID.compGroupProject' },
        { header: '클러스터/노드', binding: 'clusterNode', keyPath: 'common.GRID.COMPUTE.clusterNode' },
        { header: '서비스 구분', binding: 'servicePartName', keyPath: 'common.GRID.serviceClass' },
        { header: '서비스 유형', binding: 'serviceTypeName', keyPath: 'common.GRID.serviceType' },
        { header: '자원 명', binding: 'resourceName', keyPath: 'common.GRID.resourceName' },
        { header: '호스트 명', binding: 'hostName', keyPath: 'common.GRID.hostName' },
        { header: '업무 명', binding: 'itsmName', keyPath: 'common.GRID.busiName' },
        { header: '네트워크 조직', binding: 'networkList', keyPath: 'common.GRID.COMPUTE.networkOrg' },
        { header: '사양 선택 정보', binding: 'clusterType', keyPath: 'common.GRID.selectedSpecInfo' },
        { header: '설정된 사양 정보', binding: 'spec', keyPath: 'common.GRID.settedSpecInfo' },
        { header: 'OS 이미지', binding: 'osImage', keyPath: 'common.GRID.COMPUTE.osImage' },
        { header: 'Local Disk', binding: 'externalDisk' },
        { header: 'IP', binding: 'nicIps' },
        { header: '서비스 개시일', binding: 'serviceDate', keyPath: 'common.GRID.serviceStart' }
        // { header: '설치프로그램', binding: 'installProgramList', keyPath: 'common.GRID.COMPUTE.install' }
      ],
      changableDataColumns: [
        { header: '이름', binding: 'resourceName', keyPath: 'common.MODAL.name', required: true },
        { header: '서비스 구분', binding: 'servicePart', keyPath: 'common.GRID.serviceClass', required: true },
        { header: '서비스 유형', binding: 'serviceType', keyPath: 'common.GRID.serviceType', required: true },
        { header: '사양', binding: 'spec', keyPath: 'common.GRID.spec', required: true },
        // { header: 'Local Disk', binding: 'externalDisk', required: true },
        { header: '네트워크 조직', binding: 'networkList', keyPath: 'common.GRID.COMPUTE.networkOrg', required: true },
        { header: '업무 명', binding: 'itsmName', keyPath: 'common.GRID.busiName', required: true },
        { header: 'Local Disk', binding: 'externalDisk', subTitle: this.$t('common.ALERT.COMP.071', { size: '50GB', field: 'Local Disk' }) },
        { header: 'APP운영팀', binding: 'appManageTeam', keyPath: 'common.GRID.NETWORK.appTeam', required: true },
        { header: 'APP업무담당자', binding: 'appTaskUser', keyPath: 'common.REGCON.appManager', required: true },
        { header: '비고', binding: 'note', keyPath: 'common.REGCON.remark' },
        { header: '서버담당자', binding: 'svManager', keyPath: 'common.REGCON.serverManager', required: true },
        { header: '설치프로그램', binding: 'installProgramList', keyPath: 'common.REGCON.install' },
        { binding: 'loadbalance', header: '로드밸런스 선택', keyPath: 'common.GRID.COMPUTE.lb', required: true }
      ],
      dataColumns: [
        { header: '프로젝트 선택', binding: 'projectInfo', keyPath: 'common.PLACEHOLDER.selectProject', required: true },
        { header: '이름', binding: 'resourceName', keyPath: 'common.MODAL.name', required: true },
        { header: '서비스 구분', binding: 'servicePart', keyPath: 'common.GRID.serviceClass', required: true },
        { header: '서비스 유형', binding: 'serviceType', keyPath: 'common.GRID.serviceType', required: true },
        { header: '사양 옵션', binding: 'clusterType', keyPath: 'common.REGCON.specOption', required: true },
        { header: '네트워크 조직', binding: 'networkList', keyPath: 'common.GRID.COMPUTE.networkOrg', required: true },
        { header: '호스트 명', binding: 'hostName', keyPath: 'common.GRID.hostName', required: true },
        { header: '업무 명', binding: 'itsmName', keyPath: 'common.GRID.busiName', required: true },
        { header: 'APP운영팀', binding: 'appManageTeam', keyPath: 'common.GRID.NETWORK.appTeam', required: true },
        { header: 'APP업무담당자', binding: 'appTaskUser', keyPath: 'common.REGCON.appManager', required: true },
        { header: '비고', binding: 'note', keyPath: 'common.REGCON.remark' },
        { header: '서버담당자', binding: 'svManager', keyPath: 'common.REGCON.serverManager', required: true },
        // { header: '이미지', binding: 'image', keyPath: 'common.REGCON.image', required: true },
        // { header: '사양선택', binding: 'spec', keyPath: 'common.REGCON.selectSpec', required: true },
        // { header: 'Local Disk', binding: 'externalDisk', subTitle: this.$t('common.ALERT.COMP.071', { size: '50GB', field: 'Local Disk' }) },
        // { header: '설치프로그램', binding: 'installProgramList', keyPath: 'common.REGCON.install' },
        // { header: '클러스터-노드 선택', binding: 'clusterNode', keyPath: 'common.GRID.COMPUTE.selectClusterNode', required: true },
        // { header: 'IP', binding: 'ipam', required: true },
        { header: '서비스 개시일', binding: 'serviceDate', keyPath: 'common.GRID.serviceStart', required: true },
        { binding: 'loadbalance', header: '로드밸런스 선택', keyPath: 'common.GRID.COMPUTE.lb' }
      ],

      editableSpec: [], // 편집 가능한 사양 정보
      editableSpecColumns: [ // 편집 가능한 사양 컬럼
        { header: 'vCPUs', binding: 'vcpu' },
        { header: 'RAM', binding: 'memory' },
        { header: 'DISK', binding: 'rootDisk' }
      ],

      /// ///////// 미등록 vm
      // unregisteFix: [ // 미등록 vm 변경 불가능 정보
      //   { header: '관계사/조직/프로젝트', binding: 'projectInfo', keyPath: 'common.GRID.compGroupProject' },
      //   { header: '클러스터/노드', binding: 'clusterNode', keyPath: 'common.GRID.COMPUTE.clusterNode' },
      //   { header: '서비스 구분', binding: 'servicePartName', keyPath: 'common.GRID.serviceClass' },
      //   { header: '서비스 유형', binding: 'serviceTypeName', keyPath: 'common.GRID.serviceType' },
      //   { header: '자원 명', binding: 'resourceName', keyPath: 'common.GRID.resourceName' },
      //   { header: '호스트 명', binding: 'hostName', keyPath: 'common.GRID.hostName' },
      //   { header: '업무 명', binding: 'itsmName', keyPath: 'common.GRID.busiName' },
      //   { header: '네트워크 조직', binding: 'networkList', keyPath: 'common.GRID.COMPUTE.networkOrg' },
      //   { header: '사양 선택 정보', binding: 'clusterType', keyPath: 'common.GRID.selectedSpecInfo' },
      //   { header: 'OS 이미지', binding: 'osImage', keyPath: 'common.GRID.COMPUTE.osImage' },
      //   { header: 'Local Disk', binding: 'externalDisk' },
      //   { header: 'IP', binding: 'ip', colspan: true }
      // ],
      unregisterChangable: [ // 미등록 vm 변경 가능 정보
        { header: '이름', binding: 'resourceName', keyPath: 'common.MODAL.name', required: true },
        { header: '서비스 구분', binding: 'servicePart', keyPath: 'common.GRID.serviceClass', required: true },
        { header: '서비스 유형', binding: 'serviceType', keyPath: 'common.GRID.serviceType', required: true },
        // { header: '사양 옵션', binding: 'clusterType', keyPath: 'common.REGCON.specOption', required: true },
        { header: '네트워크 조직', binding: 'networkList', keyPath: 'common.GRID.COMPUTE.networkOrg', required: true },
        { header: '업무 명', binding: 'itsmName', keyPath: 'common.GRID.busiName', required: true },
        { header: '사양 선택', binding: 'spec', keyPath: 'common.REGCON.selectSpec', required: true },
        { header: 'APP운영팀', binding: 'appManageTeam', keyPath: 'common.GRID.NETWORK.appTeam', required: true },
        { header: 'APP업무담당자', binding: 'appTaskUser', keyPath: 'common.REGCON.appManager', required: true },
        { header: '비고', binding: 'note', keyPath: 'common.REGCON.remark' },
        { header: '서버담당자', binding: 'svManager', keyPath: 'common.REGCON.serverManager', required: true },
        { header: '이미지', binding: 'image', keyPath: 'common.REGCON.image', required: true },
        { header: 'Local Disk', binding: 'externalDisk', subTitle: this.$t('common.ALERT.COMP.071', { size: '50GB', field: 'Local Disk' }) },
        { header: '설치프로그램', binding: 'installProgramList', keyPath: 'common.REGCON.install' },
        { header: '서비스 개시일', binding: 'serviceDate', keyPath: 'common.GRID.serviceStart', required: true },
        { header: '과금 시작일', binding: 'chargeDate', keyPath: 'common.GRID.billStart', required: true },
        { binding: 'loadbalance', header: '로드밸런스 선택', keyPath: 'common.GRID.COMPUTE.lb', required: true }
      ],

      setIpPools: subnetPools => {
        return subnetPools.map(pool => {
          const { startAddress, endAddress } = pool
          return { label: `${startAddress} - ${endAddress}` }
        })
      }
    }
  }
}
</script>

<style lang="scss">
  .vmware-compute-update-form {
    .register-contents {
      .contents-title {
        min-width: 145px;
      }
      .service-date-pick {
        .el-input__suffix { top: 2px; right: -5px; }
      }
    }
    #defaultInfo {
      .register-contents {
        .contents {
          color: #9D9D9D;
        }
      }
    }
    #changableInfo {
      .service-time-select {
        .el-select-dropdown { margin: 0; margin-bottom: -1px; }
      }
    }
  }
</style>

<style lang="scss" src="./ComputeUpdateForm.scss" scoped>
