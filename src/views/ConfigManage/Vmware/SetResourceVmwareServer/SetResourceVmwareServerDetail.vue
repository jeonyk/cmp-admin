<!--
  * 파일명 : SetResourceServerDetail.vue
  * 파일 기능 : 구성관리 > 자원관리 > Compute 상세 확인 기능
  * 작성자 : 이경환 외 3명
  * 최종 작성일 : 2021-02-19
  * License By Shinsegae I&C
  * 2021-02-19 fix: 접근불가능 페이지 접근 후 > 뒤로가기시 이동 불가능 버그 수정
 -->

<template>
  <div
    class="set-resource-server-detail"
    v-loading="loading.cluster || loading.deleteVm || loading.isGetVmMKS || loading.convertVmPower"
  >
    <section class="detail-contents">
      <dashboard-panel
        :padding-top="0"
        :title="$v('자원 정보')"
      >
        <template #header>
          <div
            class="top-control-buttons button-area -right"
            v-if="vmDetailData.vmStatus !== undefined && !(vmDetailData.deleteDate && vmDetailData.orderType === 'DELETE')"
          >
            <!-- TEST VM -->
            <el-checkbox
              v-if="!isUrgent"
              class="checkbox-testvm"
              v-model="isSwTest"
              @change="changeIsSwTest"
              :disabled="vmDetailData.vmStatus === 'PROGRESS'"
            >
              {{ $v('TEST VM 으로 사용') }}
            </el-checkbox>

            <!-- 웹 콘솔 띄우기 -->
            <el-tooltip
              v-if="!isUrgent"
              :disabled="vmDetailData.toolsStatus !== 'TOOLS_NOT_INSTALLED'
                && vmDetailData.powerState === 'POWERED_ON'"
              placement="top"
              effect="light"
            >
              <template #content>
                <span v-if="vmDetailData.powerState !== 'POWERED_ON'">
                  {{ $t('service.OVA.ALERT.002', { state: $v('웹 콘솔 띄우기'), reason: 'VM State OFF'}) }}
                </span>
                <span v-else>
                  {{ $t('service.OVA.ALERT.002', { state: $v('웹 콘솔 띄우기'), reason: 'VM Tools 설치되지 않음'}) }}
                </span>
              </template>

              <div>
                <button
                  class="button"
                  @click="openConsole"
                  :disabled="vmDetailData.toolsStatus === 'TOOLS_NOT_INSTALLED'
                    || vmDetailData.powerState !== 'POWERED_ON'"
                >
                  {{ $v('웹 콘솔 띄우기') }}
                </button>
              </div>
            </el-tooltip>

            <!-- Power ON/OFF -->
            <el-tooltip
              v-if="!isUrgent"
              :disabled="
                vmDetailData.powerState !== 'POWERED_ON'
                  && vmDetailData.toolsStatus !== 'TOOLS_NOT_INSTALLED'
              "
              placement="top"
              effect="light"
            >
              <template #content>
                <span v-if="vmDetailData.powerState === 'POWERED_ON'">
                  {{ $t('service.OVA.ALERT.002', { state: 'Export', reason: 'VM State ON'}) }}
                </span>
                <span v-if="vmDetailData.toolsStatus === 'TOOLS_NOT_INSTALLED'">
                  {{ $t('service.OVA.ALERT.002', { state: 'Export', reason: $v('VM Tools 설치되지 않음')}) }}
                </span>
              </template>

              <!-- vm 템플릿 추출 -->
              <div v-if="packageType !== 'PL' && !isUrgent">
                <button
                  class="button"
                  @click="() => modal.ova = true"
                  :disabled="
                    !!vmDetailData.deleteDate
                      || vmDetailData.powerState === 'POWERED_ON'
                      || vmDetailData.vmStatus === 'PROGRESS'
                      || vmDetailData.toolsStatus === 'TOOLS_NOT_INSTALLED'
                  "
                >
                  {{ $v('템플릿 추출') }}
                </button>
              </div>
            </el-tooltip>
            <span
              class="divider"
              v-if="packageType !== 'PL' && !isUrgent"
            />
            <!-- VM 템플릿 (OVA) export -->

            <!-- 게스트 운영체제 다시 시작 => 전원이 켜진 VM만 가능 -->
            <el-select
              v-if="!isUrgent"
              class="power-state-select"
              v-model="selectedPowerState"
              :popper-append-to-body="false"
              popper-class="power-select-popper"
              :disabled="vmDetailData.vmStatus === 'PROGRESS'
                || !!vmDetailData.deleteDate"
              @change="param => changePowerState(param)"
            >
              <el-option
                v-for="power in powerOptions"
                :key="power.value"
                :label="power.label"
                :value="power.value"
                :disabled="power.value === 'REBOOT_GUEST'
                  && (vmDetailData.vmStatus !== 'POWERED_ON'
                    || !vmToolsState.isInstalled
                    || !vmToolsState.isRuninng)"
              />
            </el-select>

            <button
              v-if="!isUrgent"
              class="button"
              type="is-primary"
              @click="modal.controlVm = true"
              :disabled="vmDetailData.vmStatus === 'PROGRESS' || !!vmDetailData.deleteDate"
            >
              {{ $v('변경') }}
            </button>

            <el-tooltip
              v-if="!isUrgent"
              :disabled="
                vmDetailData.defaultOsType !== 'WINDOWS'
              "
              placement="top"
              effect="light"
            >
              <template #content>
                <span v-if="vmDetailData.defaultOsType == 'WINDOWS'">{{ $t('service.OVA.ALERT.002', { state: 'Clone', reason: $t('service.OVA.windowResource')}) }}</span>
                <!-- <span v-else-if="vmDetailData.powerState === 'POWERED_ON'">{{ $t('service.OVA.ALERT.002', { state: 'Clone', reason: 'VM State ON'}) }}</span> -->
                <!-- <span v-else-if="!vmDetailData.imageId">
                  {{ $t('service.OVA.ALERT.002', { state: 'Clone', reason: $v('Update로 이미지 정보를 먼저 등록해주세요.') }) }}
                </span> -->
              </template>
              <div>
                <button
                  class="button"
                  type="is-primary"
                  :disabled="vmDetailData.vmStatus === 'PROGRESS'
                    || !!vmDetailData.deleteDate
                  "
                  @click="e => {
                    modal.cloneVm = true
                  }"
                >
                  <!-- || vmDetailData.powerState === 'POWERED_ON' -->
                  <!-- if (vmDetailData.powerState === 'POWERED_ON') return alert($v('전원이 종료된 자원에 대해서만<br>{state} 가능합니다.', { state: 'Clone' }))
                    else modal.cloneVm = true -->
                  {{ $v('복제') }}
                </button>
              </div>
            </el-tooltip>

            <button
              v-if="!isUrgent"
              class="button"
              type="is-primary"
              :disabled="vmDetailData.vmStatus === 'PROGRESS' || !!vmDetailData.deleteDate"
              @click="e => {
                checkHostname = ''
                if (vmDetailData.powerState === 'POWERED_ON') return alert($v('자원을 삭제하기 위해서는<br/>먼저 자원을 종료해주세요.'))
                else modal.deleteVm = true
              }"
            >
              <!-- 삭제 대기가 되는 버튼.. -->
              {{ $v('삭제') }}
            </button>

            <span
              class="divider"
              v-if="!!vmDetailData.deleteDate && !isUrgent"
            />

            <!-- 바로 삭제/삭제 취소는 긴급 여부와 상관 없이 노출(23/05/16) -->
            <template v-if="!!vmDetailData.deleteDate">
              <button
                class="button"
                type="is-anti"
                :disabled="vmDetailData.vmStatus === 'PROGRESS'"
                @click="forceDelete"
              >
                {{ $v('바로 삭제') }}
              </button>

              <button
                v-if="canDelete"
                class="button"
                type="is-primary"
                :disabled="vmDetailData.vmStatus === 'PROGRESS'"
                @click="cancelDelete"
              >
                {{ $v('삭제 취소') }}
              </button>
              <el-tooltip
                v-else
                placement="top"
                effect="light"
                style="margin-left: 10px;"
              >
                <span
                  slot="content"
                  style="white-space: nowrap;"
                >
                  {{ $v('삭제 중이거나 삭제 취소 불가능 자원입니다.') }}
                  <br>
                  <b v-if="vmDetailData.deleteDateByDayjs">{{ $v('삭제 예정일') }} : {{ vmDetailData.deleteDateByDayjs }}</b>
                  <!-- 삭제 예정일 : -->
                </span>
                <div>
                  <button
                    class="button"
                    type="is-primary"
                    :disabled="true"
                  >
                    {{ $v('삭제 취소') }}
                  </button>
                </div>
              </el-tooltip>
            </template>
          </div>
        </template>

        <vertical-table
          v-loading="!interval ? loading.isGetVcenter || loading.isGetVmRequest : false"
          :element-loading-text="loadingText"
          :columns="resourceInfoColumns"
          :data="vmDetailData"
          type="horizontal"
        >
          <template
            #deleteDate
            v-if="vmDetailData.deleteDate && isView"
          >
            <span>
              {{ deleteDate }}
            </span>
          </template>

          <template #isUrgent>
            {{ vmDetailData.isUrgent ? '긴급 자원' : '일반 자원' }}
          </template>

          <span slot="powerState">
            {{ {
              POWERED_ON: 'ON',
              POWERED_OFF: 'OFF'
            }[vmDetailData.powerState] }}
          </span>
          <!-- /.VM 상태 -->

          <template #networkList>
            <ul
              v-if="vmDetailData.networkList && vmDetailData.networkList.length > 0"
              class="align-center-wrap"
            >
              <li
                v-for="(net, netIdx) in vmDetailData.networkList"
                :key="netIdx"
              >
                {{ net.deviceName || net.name }}&nbsp;{{ net.cateKey ? `(${net.cateKey})` : '' }}
              </li>
            </ul>
            <span
              v-else
              class="empty-content"
            >-</span>
          </template>
          <!-- 네트워크 정보 (네트워크 조직) -->

          <template #esxiName>
            <div
              class="flex-wrap"
              v-if="vmDetailData.esxi"
            >
              <span>{{ vmDetailData.esxi.name }}</span>

              <span
                v-if="vmDetailData.vcenter"
                style="margin-left: 5px;"
              >({{ vmDetailData.vcenter.userConnectInfo.name }})</span>

              <el-tooltip
                :disabled="!!vmDetailData.vcenter"
                placement="top"
                effect="light"
              >
                <template #content>
                  <span v-if="!vmDetailData.vcenter">
                    {{ $v('이관 불가능 자원입니다. (vCenter 정보가 없습니다.)') }}
                  </span>
                </template>
                <div>
                  <button
                    style="margin-left: 10px;"
                    class="button"
                    type="is-primary"
                    @click="e => {
                      modal.migrateVm = true
                    }"
                    :disabled="vmDetailData.vmStatus === 'PROGRESS'"
                  >
                    <!-- if (vmDetailData.powerState !== 'POWERED_ON') alert($v('Migrate를 하기 위해서는<br>자원이 On되어있어야 합니다.'))
                  else modal.migrateVm = true -->
                    {{ $v('이관') }}
                  </button>
                </div>
              </el-tooltip>
            </div>
          </template>
          <!-- vCenter - EsXi -->

          <template #vmTools>
            <span v-if="vmToolsState.state">
              {{ vmToolsState.state + ', ' + vmToolsState.detail }}
            </span>
            <span v-else>-</span>
          </template>
          <!-- VM Tools 상태 -->

          <template #cpuCores>
            <span>{{ vmDetailData.cpuCores }} Core</span>&nbsp;
            <span class="empty-content">{{ ` ( ${$v('소켓 수')}: ${vmDetailData.socket || 1}, ${$v('소켓당 코어 수')}: ${vmDetailData.cpuCores / (vmDetailData.socket || 1)} )` }}</span>
          </template>

          <template #memory>
            <span>{{ vmDetailData.memory | byte }}</span>
          </template>

          <template #rootDiskSize>
            <span class="align-center-wrap">
              {{ vmDetailData.rootDiskSize? vmDetailData.rootDiskSize : 0 }}&nbsp;GB
            </span>
          </template>

          <template #osName>
            <div
              v-if="vmDetailData.osName"
              class="flex-wrap after-data os-wrap align-center-wrap"
            >
              <set-os-icon :os-name="vmDetailData.osName" />
              <span v-if="vmDetailData.osBit">({{ vmDetailData.osBit }})</span>
            </div>
            <!-- <set-os-icon
              v-if="vmDetailData.osName"
              :os-name="vmDetailData.era ?
                `${vmDetailData.osName ? vmDetailData.osName : ''}${vmDetailData.osVersion ? ' / ' + vmDetailData.osVersion : ''}`
                : `${vmDetailData.osName ? vmDetailData.osName : ''}${vmDetailData.osBit ? ' / ' + vmDetailData.osBit : ''}`"
            /> -->
            <span
              v-else
              class="empty-content"
            >-</span>
            <div class="os-list-wrap">
              <register-contents
                title="OS Bit"
                :title-width-px="100"
              >
                <div
                  v-if="vmDetailData.osName"
                  class="flex-wrap after-data"
                >
                  <span v-if="vmDetailData.osBit">{{ vmDetailData.osBit }}</span>
                </div>
                <span
                  v-else
                  class="empty-content"
                >-</span>
              </register-contents>
              <register-contents
                title="OS Type"
                :title-width-px="100"
              >
                <div
                  v-if="vmDetailData.osName"
                  class="flex-wrap after-data"
                >
                  <span v-if="vmDetailData.osType">{{ vmDetailData.osType }}</span>
                </div>
                <span
                  v-else
                  class="empty-content"
                >-</span>
              </register-contents>
            </div>
          </template>

          <template #scsiControllerList>
            <ul v-if="vmDetailData.scsiControllerList && vmDetailData.scsiControllerList.length">
              <li
                v-for="(controller, cIdx) in vmDetailData.scsiControllerList"
                :key="`controller_${cIdx}`"
              >
                {{ `${$v('SCSI 컨트롤러')} ${controller.busNumber}` }}
              </li>
            </ul>
            <span
              v-else
              class="empty-content"
            >-</span>
          </template>
          <!-- 컨트롤러 -->

          <template #externalDiskList>
            <ul v-if="vmDetailData.externalDiskList && vmDetailData.externalDiskList.length">
              <li
                v-for="(disk,diskIdx) in vmDetailData.externalDiskList"
                :key="diskIdx"
              >
                <vmware-disk-info-item
                  :disk-info="disk"
                  :storage-policy-options="storagePolicyOptions"
                />
              </li>
            </ul>
            <span
              v-else
              class="empty-content"
            >-</span>
          </template>

          <template #installProgramList>
            <div
              v-for="(pkg,pkgIdx) in vmDetailData.installProgramList"
              :key="pkgIdx"
            >
              {{ pkg.name }} {{ pkg.version }}
            </div>
          </template>

          <template #licenseList>
            <div class="license-list-wrap">
              <register-contents
                title="자산"
                :title-width-px="100"
              >
                <ul
                  class="flex-wrap license-list"
                  v-if="licenseList.isAssets.length"
                >
                  <li
                    v-for="sw in licenseList.isAssets"
                    :key="`swLicense_${sw.swIdx}`"
                  >
                    {{ sw.name }}
                  </li>
                </ul>
                <span
                  v-else
                  class="empty-content"
                >-</span>
              </register-contents>
              <register-contents
                title="비자산"
                :title-width-px="100"
              >
                <ul
                  class="flex-wrap license-list"
                  v-if="licenseList.notAssets.length"
                >
                  <li
                    v-for="sw in licenseList.notAssets"
                    :key="`swLicense_${sw.swIdx}`"
                  >
                    {{ sw.name }}
                  </li>
                </ul>
                <span
                  v-else
                  class="empty-content"
                >-</span>
              </register-contents>
            </div>
          </template>

          <template #manageGroup>
            <span
              v-if="vmDetailData.manageGroupName"
              class="align-center-wrap"
            >{{ vmDetailData.manageGroupName }}</span>
            <span
              v-else
              class="empty-content"
            >-</span>
          </template>
          <!-- 운영그룹 -->

          <template #createAccount>
            <span v-if="vmDetailData.createUserId">
              {{ vmDetailData.createUserName }}&nbsp;
              ({{ vmDetailData.createUserId | maskingName }})
            </span>
            <span
              v-else
              class="empty-content"
            >-</span>
          </template>

          <template #updateAccount>
            <span v-if="vmDetailData.updateUserId">
              {{ vmDetailData.updateUserName }}&nbsp;
              ({{ vmDetailData.updateUserId | maskingName }})
            </span>
            <span
              v-else
              class="empty-content"
            >-</span>
          </template>

          <template #projectInfo>
            <span v-if="vmDetailData.companyName">{{ vmDetailData.companyName }}</span>
            <span v-if="vmDetailData.groupName">&nbsp;>&nbsp;{{ vmDetailData.groupName }}</span>
            <span v-if="vmDetailData.projectName">&nbsp;>&nbsp;{{ vmDetailData.projectName }}</span>
          </template>
          <!-- 프로젝트 위치 -->

          <template #projectOwnerInfo>
            <span class="account-name">
              {{ vmDetailData.projectOwnerInfo }}
            </span>
          </template>
          <!-- 프로젝트 소유자 -->

          <template #createTime>
            {{ vmDetailData.createTime | date }}
          </template>

          <template #updateTime>
            {{ vmDetailData.updateTime | date }}
          </template>

          <template #chargeDate>
            <span v-if="vmDetailData.chargeDate">{{ vmDetailData.chargeDate | date('YYYY.MM.DD HH:mm') }}</span>
            <span
              v-else
              class="empty-content"
            >-</span>
          </template>

          <template #customFee>
            {{ vmDetailData.customFee || '-' }}
          </template>

          <template #serviceDate>
            <span v-if="vmDetailData.serviceDate">{{ vmDetailData.serviceDate | date('YYYY.MM.DD HH:mm') }}</span>
            <span
              v-else
              class="empty-content"
            >-</span>
          </template>

          <template #note>
            <div
              v-if="vmDetailData.note"
              style="white-space: pre-wrap;"
            >
              {{ vmDetailData.note }}
            </div>
            <span
              v-else
              class="empty-content"
            >-</span>
          </template>
          <template #tagInfo>
            <resource-tag-select-edit
              :data="vmDetailData"
              :read-only="false"
              service-type="VM"
              module="VMWARE"
              :project-idx="projectIdx"
              resource-key="userVmIdx"
            />
          </template>
        </vertical-table>
      </dashboard-panel>
    </section>
    <!-- 자원 정보 -->

    <g-tab
      :data="detailTabs"
      class="detail-tabs"
      :padding-top="0"
    >
      <template #manage>
        <dashboard-panel
          :padding-top="0"
        >
          <meta-data-form
            style="margin-top: 10px;"
            :form-data="metaInfoArr"
            use-update-btns
            read-only
            @save-info="saveMetaInfo"
            ref="metaDataFormRef"
          />
          <!-- :origin-form-data="vmMetadataForm" -->
        </dashboard-panel>
      </template>

      <template #monitor>
        <vm-monitoring>
          <vmware-monitoring-chart
            :user-vm-idx="id"
            :vm-name="vmDetailData.name"
          />
        </vm-monitoring>
      </template>

      <!-- <template #logging>
        <vm-log-info-list :host-name="vmDetailData.hostname" />
      </template> -->
    </g-tab>

    <!-- 모달 -->
    <!-- 자원 생성/수정 -->
    <el-dialog
      :visible.sync="modal.controlVm"
      :title="`${$v('자원 변경')}`"
      :before-close="beforeCloseModal"
      width="1200px"
      top="5vh"
      @close="modal.controlVm = false"
    >
      <VMwareComputeUpdateForm
        v-if="modal.controlVm"
        v-loading="loading.updateVm"
        @close="modal.controlVm = false"
        @save="confirmUpdate"
        :data="updateVmData"
        :project-idx="updateVmData && updateVmData.userInfo
          ? updateVmData.userInfo.projectIdx
          : undefined"
        :user-info="user"
        in-admin
      />
    </el-dialog>

    <!-- 자원 복사 -->
    <el-dialog
      :visible.sync="modal.cloneVm"
      :title="$t('common.TERMS.resourceClone')"
      :before-close="beforeCloseModal"
      width="1100px"
      top="5vh"
      @close="modal.cloneVm = false"
      class="vm-control-modal"
      v-loading="loading.cloneVm"
    >
      <clone-vmware-vm
        v-if="modal.cloneVm"
        :vm-data="vmDetailData"
        @save="confirmClone"
        @close="modal.cloneVm = false"
      />
    </el-dialog>

    <!-- 자원 이관 -->
    <el-dialog
      :visible.sync="modal.migrateVm"
      :title="$t('common.TERMS.resourceMigration')"
      :before-close="beforeCloseModal"
      width="1200px"
      top="5vh"
      @close="modal.migrateVm = false"
    >
      <migrate-vmware-vm
        v-if="modal.migrateVm"
        :vm-data="vmDetailData"
        @save="confirmMigrate"
        @close="modal.migrateVm = false"
      />
    </el-dialog>

    <!-- 자원 삭제 -> 호스명 동일 입력 확인 모달 -->
    <el-dialog
      :visible.sync="modal.deleteVm"
      width="350px"
      @close="modal.deleteVm = false"
      class="pass-name-form"
      v-loading="loading.deleteVm"
    >
      <span
        class="name-form-noti"
        v-html="$v('<b>{hostname}</b>을 삭제하시겠습니까?<br>호스트 명을 동일하게 입력해주세요.', {hostname: vmDetailData.name})"
      />
      <!-- {hostname}을 삭제하시겠습니까?<br>호스트 명을 동일하게 입력해주세요. -->

      <el-input
        v-model="checkHostname"
        :placeholder="$v('호스트 명을 입력하세요.')"
        @keyup.native.enter="e => {
          if(vmDetailData.name !== checkHostname) return
          confirmDelete()
        }"
      />
      <small
        class="-reference"
        v-if="!checkHostname"
      >*&nbsp;{{ $v('호스트 명을 입력하세요.') }}</small>
      <!-- 호스트 명을 입력하세요. -->

      <small
        class="-reference"
        v-else-if="vmDetailData.name !== checkHostname"
      >*&nbsp;{{ $v('호스트 명이 올바르지 않습니다.') }}</small>

      <div class="convert-urgent-form">
        <toggle-is-urgent-checkbox
          v-model="deleteIsUrgent"
          :action-name="$v('자원 삭제')"
        />
      </div>

      <div class="modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="modal.deleteVm = false"
        >
          {{ $v('취소') }}
        </button>
        <button
          class="button -modal-button"
          @click="confirmDelete()"
          type="is-primary"
          :disabled="vmDetailData.name !== checkHostname"
        >
          {{ $v('확인') }}
        </button>
      </div>
    </el-dialog>

    <!-- 템플릿 Export -->
    <template-export-modal
      :active="modal.ova"
      :vm-info="vmDetailData"
      @close="modal.ova = false"
    />

    <wmks-sdk-console
      v-if="modal.console"
      :active="modal.console"
      :hostname="this.vmDetailData.name"
      :host="mks.host"
      :port="mks.port"
      :ticket="mks.ticket"
      @close="modal.console = false"
    />
  </div>
</template>
<script>
import axios from 'axios'
import { mapGetters, mapActions, mapState } from 'vuex'
import { isEmpty, uniqBy, cloneDeep } from 'lodash'
import API, { ResourceTagSelectEdit, VerticalTable, DashboardPanel, SetOSIcon, joinExternalDiskList, VMwareMonitoringChart, MonitoringContainer, VMwareComputeUpdateForm, MetaDataForm, VMwareDiskInfoItem, vmwareToolsStatus, ToggleIsUrgentCheckbox } from '@sd-fe/cmp-core'

import Dayjs from 'dayjs'

import CloneVmwareVm from './CloneVmwareVm/CloneVmwareVm'
import MigrateVmwareVm from './MigrateVmwareVm/MigrateVmwareVm'
import TemplateExportModal from './VMwareComponents/TemplateExportModal'
import WmksSdkConsole from '@/components/VMware/VMKS/WmksSdkConsole.vue'

import VMwareServerControlMixins from './VMwareServerControl.mixins.js'
export default {
  name: 'SetResourceVmwareServerDetail',
  mixins: [VMwareServerControlMixins],
  components: {
    'set-os-icon': SetOSIcon,
    'vertical-table': VerticalTable,
    'dashboard-panel': DashboardPanel,
    VMwareComputeUpdateForm,
    CloneVmwareVm,
    MigrateVmwareVm,
    TemplateExportModal,
    'vm-monitoring': MonitoringContainer,
    'vmware-monitoring-chart': VMwareMonitoringChart,
    MetaDataForm,
    'vmware-disk-info-item': VMwareDiskInfoItem,
    ResourceTagSelectEdit,
    WmksSdkConsole,
    ToggleIsUrgentCheckbox
  },
  async created () {
    this.id = this.$route.params.userVmIdx
    this.cancelToken = axios.CancelToken.source()

    await this.getProjectByCloudType() // 프로젝트 조회

    await this.getStoragePolicyProfile()
    await this.init()
    this.setTabs()
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      breadcrumbs: state => state.common.breadcrumbs,
      packageType: state => state.auth.packageType,
      vmMetadataForm: state => state.metadata.VMWARE.VM
    }),
    ...mapGetters({
      getProject: 'project/getProject'
    }),
    canDelete () {
      if (this.vmDetailData.deleteDate) {
        return this.vmDetailData.deleteDate && this.isBefore && this.isView
      } else {
        return false
      }
    },
    deleteDate () {
      if (this.vmDetailData.deleteDate) {
        return Dayjs(this.vmDetailData.deleteDate).format('YYYY.MM.DD')
      } else {
        return ''
      }
    },
    // 미등록 자원인지?
    isUnregistered () {
      return (this.vmDetailData?.chargeDate === undefined)
    },
    isUrgent () { // 긴급 자원 여부
      return !!this.vmDetailData.isUrgent
    }
  },
  watch: {
    'vmDetailData.vmStatus': {
      immediate: true,
      deep: true,
      handler (val) {
        const isProgressing = (val === 'PROGRESS' || val === undefined)

        const isLastBreadcrumbsHasStatus = Object.keys(this.breadcrumbs[this.breadcrumbs.length - 1]).includes('resourceStatus') // breadcrumbs 마지막 요소가 'resourceStatus' key를 가지고 있는지?

        if (isLastBreadcrumbsHasStatus) {
          this.$store.commit('common/MOD_LAST_PARAMETERS', {
            label: this.vmDetailData.name,
            path: '',
            resourceStatus: {
              POWERED_ON: 'ON',
              POWERED_OFF: 'OFF',
              PROGRESS: 'PROGRESS'
            }[isProgressing ? 'PROGRESS' : this.vmDetailData.powerState]
          })
        }
      }
    },
    'loading.convertVmPower': {
      handler (val) {
        if (val) {
          this.vmDetailData.vmStatus = 'PROGRESS'
        }
      }
    },
    'modal.deleteVm' (val) {
      if (val) this.deleteIsUrgent = true
    }
  },
  beforeDestroy () {
    this.clearGetVmInterval()
    this.cancelToken.cancel()
  },
  methods: {
    ...mapActions({
      getProjectByCloudType: 'project/getProjectByCloudType'
    }),
    /**
     * TEST VM 전환 (뉴타닉스쪽과 동일)
     */
    async changeIsSwTest (val) {
      try {
        const confirmCode = val ? '006' : '007'
        const alertCode = val ? '069' : '070'
        const confirmMessage = this.$t(`common.CONFIRM.COMP.${confirmCode}`)
        const alertMessage = this.$t(`common.ALERT.COMP.${alertCode}`)
        clearInterval(this.interval)
        this.$confirm(confirmMessage)
          .then(() => {
            const payload = {
              isSwTest: !this.vmDetailData.isSwTest,
              updateUserId: this.user.userId,
              updateUserName: this.user.userName,
              userVmIdx: this.id
            }
            API.vmware.vm.updateVmSwTest(payload)
          }).then(() => {
            this.isSwTest = val
            this.$alert(alertMessage).then(() => {
              this.init()
            })
          }).catch(() => {
            this.isSwTest = this.vmDetailData.isSwTest
            this.init()
            return false
          })
      } catch (error) {
        this.$alert(this.$t('common.ALERT.COMP.068'), {
        }).then(() => {
          this.isSwTest = this.vmDetailData.isSwTest
          this.init()
        })
      }
    },
    async init () {
      await Promise.all([
        this.getVmwareVmDetail()
      ]).then(() => {
        this.getVmInterval()
        if (this.vmDetailData) {
          this.getMetaInfo()
          this.setVmToolsStatus(this.vmDetailData)
          this.setDeleteDate()
        }
      }).catch((err) => {
        console.log(err)
        this.goToList()

        return false
      })
    },
    /**
     * deleteDate 세팅
     */
    setDeleteDate () {
      if (!this.vmDetailData?.deleteDate) return
      const today = Dayjs().format('YYYY.MM.DD')
      const delDate = Dayjs(this.vmDetailData.deleteDate).format('YYYY.MM.DD')
      this.isBefore = Dayjs(today).isBefore(delDate)
      this.isView = true

      if (this.vmDetailData?.deleteDate &&
      this.isBefore &&
      this.resourceInfoColumns[0].binding !== 'deleteDate') {
        this.resourceInfoColumns.unshift({ binding: 'deleteDate', header: this.$v('삭제 예정일'), colspan: true })
      }
    },
    /**
     * 호스트명을 Breadcrumbs에 추가합니다. (조건: Breadcrumbs 마지막 label 이 hostname과 다를 경우)
     */
    setBreadCrumbsHostName (data) {
      if (!data) return
      this.$store.commit('common/ADD_PARAMETERS', {
        label: data.resourceName,
        path: '',
        resourceStatus: {
          POWERED_ON: 'ON',
          POWERED_OFF: 'OFF',
          PROGRESS: 'PROGRESS'
        }[data.vmStatus]
      })
    },
    /**
     * [바로 삭제]
     */
    forceDelete () {
      this.$confirm(this.$v('자원을 바로 삭제하시겠습니까?'))
        .then(async () => {
          const params = {
            indexType: 'userVmIdx',
            userResourceIdx: this.vmDetailData.userVmIdx,
            userId: this.user.userId,
            userName: this.user.userName
          }
          const result = await this.forceDeleteResource(params)
          if (result) this.goToList()
        }).catch(() => false)
    },
    /**
     * [삭제 취소]
     */
    cancelDelete () {
      this.$confirm(this.$v('삭제 예정인 자원입니다. 삭제를 취소하시겠습니까?'), { dangerouslyUseHTMLString: true })
        .then(async () => {
          const idxType = 'userVmIdx'

          const params = {
            indexType: idxType,
            userResourceIdx: this.vmDetailData[idxType],
            userId: this.user.userId,
            userName: this.user.userName
          }
          const res = await API.work_v3.cancelDelete(params)
          if (res) {
            this.$alert(this.$v('삭제 요청이 취소되었습니다.'), () => false)
            this.resourceInfoColumns.shift()
            this.isView = false
          }

          this.init()
        }).catch(() => false)
    },
    /**
     * powerState 전환 이벤트
     * @param {String} state 전환 할 상태
     */
    async changePowerState (state) {
      const result = await this.confirmConvertPower([{ ...this.vmDetailData }], state)
      if (!result) this.selectedPowerState = this.vmDetailData.powerState
      else {
        await this.init()
      }
    },
    async getVmwareVmDetail () {
      try {
        this.loading.isGetVmRequest = true
        this.resData = {}
        let data = {}
        data = await API.vmware.vm.getVmwareVmDetail(this.id, this.cancelToken)
        console.log('vmw @data:', this.id, data)

        if (!data) throw new Error()

        const isLastBreadcrumbsHasStatus = Object.keys(this.breadcrumbs[this.breadcrumbs.length - 1]).includes('resourceStatus') // breadcrumbs 마지막 요소가 'resourceStatus' key를 가지고 있는지?
        if (!isLastBreadcrumbsHasStatus) this.setBreadCrumbsHostName(data)
        this.isSwTest = data.userInfo?.isSwTest || false
        this.projectIdx = data.userInfo?.projectIdx

        this.updateVmData = {
          ...data,
          beforeData: cloneDeep(data)
        }
        this.vmDetailData = await this.settingResourceData(data)

        await API.billing.getCustomFee({
          // await axios.get(`${config.url}/api/cmp/v1/billing/custom/fee`, {
          // params: {
          resourceType: 'compute',
          resourceUuid: data.vmUuid
          // }
        }).then((res) => {
          this.vmDetailData.customFee = Array.isArray(res.data) &&
            res.data.map((itm) => {
              return `${itm.serviceName} ${itm.resourceAmount} ${itm.chargeUnit}`
            }).join(', ')
          this.updateVmData.customSpecList = res.data
          this.vmDetailData.customSpecList = res.data
        })

        // console.log('VM vmDetailData:', this.vmDetailData)

        // 메타데이터 동기화 -> 메타데이터 편집 중이 아닐 때만

        // console.log('🔮 가공 후 ::', this.vmDetailData)
      } catch (error) {
        throw new Error(error)
      } finally {
        this.loading.isGetVmRequest = false
      }
    },
    async getMetaInfo (data = this.updateVmData) {
      try {
        this.loading.isUpdateMetaInfo = true
        if (this.isMetaDataFormEditing()) return

        const meta = this.vmDetailData.userVmIdx
          ? await this.getVmwareVmMetaInfo()
          : (data?.userInfo?.metaInfo ? JSON.parse(data?.userInfo.metaInfo) : null)
        this.updateVmData.metaInfo = meta ? JSON.stringify(meta) : ''
        this.vmDetailData.metaInfo = meta ? JSON.stringify(meta) : ''
        this.metaInfoArr = await this.settingMetaDataArr(meta)
      } catch (error) {
        console.error(error)
      } finally {
        this.loading.isUpdateMetaInfo = false
      }
    },

    // 자원정보 세팅
    async  settingResourceData (vm) {
      if (!vm) return
      const {
        userInfo,
        hostInfo,
        hostUuid,
        memorySize,
        diskList,
        scsiControllerList,
        powerState,
        networkAdapterList,
        hostname,
        name
      } = vm

      const vmStatus = ['START', 'RUNNING'].includes(userInfo?.status) ? 'PROGRESS' : powerState // VM 상태

      // Local Disk
      // **루트 디스크 => controllerKey = 1000이고 unitNumber = 0 인 디스크
      const rootDisk = diskList?.find(disk => disk.controllerKey === 1000 && disk.unitNumber === 0)
      const rootDiskSize = rootDisk
        ? rootDisk?.capacityB
          ? this.$options.filters.byteToGb(rootDisk.capacityB)
          : rootDisk?.size || 0
        : 0

      // 루트 디스크를 포함하지 않은 디스크
      const allDisks = joinExternalDiskList(diskList, userInfo?.externalDiskList, scsiControllerList)
      const disks = allDisks?.filter(disk => !(disk.controllerKey === 1000 && disk.unitNumber === 0))

      // vCenter 정보
      const vcenter = await this.getVcenterList({ hostUuid: hostUuid })

      // 네트워크 카테고리 => networkAdapterList / userInfo.networkList 비교 (unitNumber)
      const networkList = []
      if (networkAdapterList?.length && userInfo?.networkList?.length) {
        const userNetworks = userInfo.networkList

        // 네트워크 카테고리 정보는 최신 데이터여야 한다.. ㄷㄷ
        const userNetworkIdxList = userNetworks?.map(net => net.cateIdx) || []
        const currentCateData = await API.network.getNetworkCategory({ idxList: userNetworkIdxList.join(',') })
        const netUserNetworks = userNetworks.map(net => {
          const findedNewData = currentCateData.find(item => item.cateIdx === net.cateIdx)
          return {
            ...net,
            ...findedNewData
          }
        })

        networkAdapterList.forEach(net => {
          const sameNetwork = netUserNetworks.find(item => net.unitNumber === item.unitNumber)
          if (sameNetwork) {
            const { cateKey, cateIdx, cateName } = sameNetwork
            networkList.push({
              ...net,
              cateKey,
              cateIdx,
              cateName
            })
          }
        })
      }

      // 설치프로그램
      let installProgramList = []
      if (userInfo?.installProgramList?.length) {
        const versionIdList = userInfo.installProgramList.map(sw => sw.versionId)

        const installData = await API.sw.getUsableInstallList({ versionIdList: versionIdList.join(',') })

        installProgramList = uniqBy(installData, 'versionId')
      }

      // 프로젝트 정보
      let projectInfo
      if (userInfo?.projectIdx) {
        const findProject = await API.iam.getProject({ projectIdx: userInfo.projectIdx })
        projectInfo = findProject[0]
      }

      // S/W 라이선스 정보
      let licenseList = []
      if (userInfo?.licenseList) {
        const swIdxList = userInfo?.licenseList.map(item => item.swIdx)
        const swList = await API.metering.getSWLicense() || []

        licenseList = swList.filter(sw => swIdxList.includes(sw.swIdx))

        // 자산/비자산 구분
        this.licenseList.isAssets = licenseList.filter(license => !!license.isAssets)
        this.licenseList.notAssets = licenseList.filter(license => !license.isAssets)
      }

      // 계정 정보
      let createUserName, updateUserName
      if (userInfo?.createUserId) createUserName = await this.getUserName(userInfo.createUserId)
      if (userInfo?.updateUserId) updateUserName = await this.getUserName(userInfo.updateUserId)

      // 운영정보
      let manageGroupName
      if (userInfo?.manageGroupIdx) {
        const { data: findManageGorupInfo } = await API.billing.getOperationGroup({
          moduleType: 'VMWARE',
          operatingGroupIdx: userInfo.manageGroupIdx
        })
        if (findManageGorupInfo?.length) manageGroupName = findManageGorupInfo[0].operatingGroupName
      }

      // console.log('🔮 userInfo: ', userInfo)
      // console.log('🔮 meta: ', meta)
      // console.log('🔮 projectInfo: ', projectInfo)

      const settingData = {
        ...vm,
        esxi: hostInfo,
        hostUuid,
        name: name || hostname, // 호스트명
        userVmIdx: userInfo?.userVmIdx,
        memorySizeGB: this.$options.filters.MB(memorySize),
        externalDiskList: disks,
        externalDiskTotalSize: disks?.length
          ? disks.reduce((a, b) => a + b.size, 0)
          : 0,
        externalDiskTotalCount: disks?.length || 0,
        rootDiskSize,
        networkList,
        installProgramList,
        datastoreName: this.$options.filters.textBetween(vm?.vmPathName, '[', ']'), // datastore 이름: vmPathName의 '[', ']' 사이에 있는 이름

        vmStatus,
        vcenter: vcenter?.length ? vcenter[0] : null,
        isSwTest: userInfo?.isSwTest,

        osType: userInfo?.image?.osType,
        osName: userInfo?.image?.userImageName,
        osBit: userInfo?.image?.osBit,

        licenseList: licenseList,

        companyName: projectInfo?.companyName,
        groupName: projectInfo?.groupName,
        groupIdx: projectInfo?.groupIdx,
        projectName: projectInfo?.projectName,
        projectIdx: projectInfo?.projectIdx,
        projectOwnerInfo: projectInfo?.projectOwner?.userName && projectInfo.projectOwner?.userId ? `${projectInfo.projectOwner?.userName} (${this.$options.filters.maskingName(projectInfo.projectOwner?.userId)})` : '', // 프로젝트 소유자
        createUserId: userInfo?.createUserId,
        updateUserId: userInfo?.updateUserId,
        createUserName,
        updateUserName,
        createTime: userInfo?.createTime,
        updateTime: userInfo?.updateTime,
        chargeDate: userInfo?.chargeDate,
        deleteDate: userInfo?.deleteDate,
        isUrgent: userInfo?.isUrgent,
        deleteDateByDayjs: userInfo?.deleteDate ? Dayjs(userInfo?.deleteDate).format('YYYY.MM.DD') : undefined,

        manageGroupName
      }

      this.powerState = settingData.powerState
      this.selectedPowerState = settingData.powerState

      return settingData
    },

    // 메타데이터 정보 세팅
    settingMetaDataArr (data) {
      const metaData = (this.vmMetadataForm || []).map(meta => {
        const info = data && data[meta.key]
          ? data[meta.key]
          : ''
        return {
          ...meta,
          data: info || meta.data
        }
      })
      // if (this.vmDetailData.tags) metaData.push({ title: '자원 태그', key: 'tags', data: this.vmDetailData.tags })
      return metaData
    },
    // VM Tools 정보를 세팅합니다.
    setVmToolsStatus (vm) {
      const {
        state,
        detail,
        isInstalled,
        isRuninng
      } = vmwareToolsStatus(vm)

      this.vmToolsState = { state, detail, isInstalled, isRuninng }
    },
    /**
     * userId로 유저 정보를 조회합니다. (사용자 > 관리자)
     */
    async getUserName (userId) {
      try {
        const infoUser = await API.iam.getUserInfo({ isAdmin: false, userId })
        if (infoUser.length) return infoUser[0].userName
        else {
          const infoAdmin = await API.iam.getUserInfo({ isAdmin: true, userId })
          if (infoAdmin?.length) return infoAdmin[0].userName
        }
      } catch (error) {
        console.error(this.$v('사용자 조회에 문제가 발생했습니다') + ': ', error)
      }
    },
    /**
     * VM 수정 시, '저장'
     */
    confirmUpdate (savedData) {
      const { beforePrice, groupIdx, groupName, isUrgent, price, projectIdx } = savedData

      const payload = {
        beforePrice,
        groupIdx,
        groupName,
        isUrgent,
        price,
        projectIdx,
        requestData: savedData,
        service: 'VM',
        userId: this.user.userId,
        userName: this.user.userName
      }

      const message = this.$v('자원을 수정하시겠습니까?')
      this.$confirm(message).then(async () => {
        const result = await this.updateVmwareVm(payload)
        if (result) this.modal.controlVm = false
      }).catch(() => false)
    },
    /**
     * VM '삭제' -> API 찌르기 전 데이터 가공
     */
    async confirmDelete (data = this.vmDetailData) {
      const {
        hostUuid,
        userVmIdx,
        vmUuid,

        groupIdx,
        groupName,
        projectIdx,
        beforePrice,
        price
      } = data

      const requestData = {
        isUrgent: !!this.deleteIsUrgent,
        reqUserId: this.user.userId,
        hostUuid,
        userVmIdx,
        vmUuid
      }

      const payload = {
        beforePrice: beforePrice || 0,
        groupIdx,
        groupName,
        projectIdx,
        isUrgent: !!this.deleteIsUrgent,
        price: price || 0,
        service: 'VM',
        userId: this.user.userId,
        userName: this.user.userName,
        requestData
      }

      await this.deleteVm(payload) // VM 삭제

      this.modal.deleteVm = false
    },
    /**
     * VM Migrate 데이터 가공 이벤트
     */
    async confirmMigrate ({ vmData, destNode }) {
      const requestData = {
        migrationDatastoreId: destNode?.datastoreList
          ? destNode.datastoreList[0].datastoreId
          : undefined,
        migrationHostUuid: destNode.hostUuid,
        reqUserId: this.user.userId,
        userVmIdx: vmData.userVmIdx,
        vmUuid: vmData.vmUuid,
        resourceName: vmData.resourceName
      }

      const { beforePrice, groupIdx, groupName, isUrgent, price, projectIdx } = vmData
      const payload = {
        beforePrice,
        groupIdx,
        groupName,
        isUrgent,
        price,
        projectIdx,
        requestData,
        service: 'VM',
        userId: this.user.userId,
        userName: this.user.userName
      }
      await this.migrateVm(payload)
    },
    /**
     * VM Clone 데이터 가공 이벤트
     * @param {Object} param { vmData: origin vm 정보, cloneVms: 클론 vm 정보 }
     */
    async confirmClone ({ vmData, cloneVms }) {
      this.$confirm(this.$v('자원을 복제하시겠습니까?')).then(async () => {
        // this.$alert(this.$t('common.ALERT.COMP.039'), { dangerouslyUseHTMLString: true }) // 입력하지 않은 데이터는<br>기존 자원 정보 데이터로 대체됩니다.
        const result = await this.cloneVm(vmData.userVmIdx, { vmData, cloneVms })
        if (result) this.modal.cloneVm = false
      }).catch(() => false)
    },

    gridRefresh (grid = this.grid) {
      if (!grid) return
      const cv = grid.collectionView
      if (!cv) return
      cv.refresh()
    },

    routeTo (to) {
      this.$router.push(to)
    },
    alert (message, callback) {
      this.$alert(message, '알림', {
        callback: callback,
        dangerouslyUseHTMLString: true
      })
    },
    isEmpty (value) {
      return isEmpty(value)
    },
    goToList () {
      this.cancelToken.cancel()
      this.clearGetVmInterval()
      return this.routeTo({ name: 'set-resource-server-list-vmw' })
    },

    // ========== [vmware] ===========
    /**
     * vCenter 조회
     */
    async getVcenterList (params) {
      try {
        this.loading.isGetVcenter = true
        const data = await API.vmware.vcenter.getVcenterList({
          ...params,
          isManage: true
        })
        return data || null
      } catch (error) {
        console.error(error)
        // return this.$alert('vCenter 조회에 문제가 발생했습니다.')
      } finally {
        this.loading.isGetVcenter = false
      }
    },
    /**
   * API: VM 스토리지 정책을 조회합니다.
   */
    async getStoragePolicyProfile (params) {
      try {
        this.loading.isGetStoragePolicy = true
        const response = await API.vmware.vm.getStoragePolicyProfile(params)

        const options = uniqBy(response, 'profileId') || []

        const defaultPolicy = { name: 'Datastore Default', profileId: null }

        this.storagePolicyOptions = [{ ...defaultPolicy }, ...options]
      } catch (error) {
        console.error(error)
        this.$alert('VM 스토리지 정책 조회에 문제가 발생했습니다.', () => false)
      } finally {
        this.loading.isGetStoragePolicy = false
      }
    },
    /**
   * API: 메타 정보를 조회 합니다. (기생성 자원의 경우)
   */
    async getVmwareVmMetaInfo () {
      try {
        this.loading.isGetMetaInfo = true

        const payload = {
          userVmIdx: this.vmDetailData.userVmIdx
        }

        return await API.vmware.vm.getVmwareVmMetaInfo(payload)
      } catch (error) {
        console.error(error)
        // this.$alert(this.$v('운영 정보 조회를 실패했습니다.'), () => false)
      } finally {
        this.loading.isGetMetaInfo = false
      }
    },
    /**
   * API: 메타 정보를 업데이트 합니다.
   */
    async saveMetaInfo (params) {
      try {
        this.loading.isUpdateMetaInfo = true

        const payload = {
          metaInfo: JSON.stringify(params),
          reqUserId: this.user.userId,
          resourceIdx: this.id
        }

        const result = await API.vmware.vm.updateVmwareVmMetaInfo(payload)

        if (result) {
          this.init()
          this.$alert(this.$v('운영 정보 업데이트를 성공했습니다.'), () => false)
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('운영 정보 업데이트를 실패했습니다.'), () => false)
      } finally {
        this.loading.isUpdateMetaInfo = false
      }
    },
    /**
     * API: VM MKS 조회
     */
    async getVmwareVmMKS (userVmIdx = this.id) {
      if (!userVmIdx) return
      try {
        this.loading.isGetVmMKS = true

        const result = await API.vmware.vm.getVmwareVmMKS(userVmIdx)

        if (result) return result
      } catch (error) {
        console.error(error)
        this.$alert(this.$v('VM MKS 조회를 실패했습니다.'), () => false)
      } finally {
        this.loading.isGetVmMKS = false
      }
    },
    setTabs () {
      const initTabs = [{ field: 'manage', name: this.$v('운영 정보'), active: true }]

      initTabs.push(
        { field: 'monitor', name: this.$v('모니터링 정보'), active: false }
      )

      // if (this.packageType === 'ENT') {
      //   const loggingTab = initTabs.find(tab => tab.field === 'logging')
      //   if (!loggingTab) initTabs.push({ field: 'logging', name: this.$v('로그 정보'), active: false })
      // }

      this.detailTabs = initTabs
    },
    // 메타데이터 폼 업데이트 중인지?
    isMetaDataFormEditing () {
      const ref = this.$refs?.metaDataFormRef

      return ref?.activeEdit
    },
    /**
     * vm 웹 콘솔 띄우기
     */
    async openConsole () {
      const info = await this.getVmwareVmMKS()
      if (info) {
        const { ticket, host, port } = info
        this.mks = { ticket, host, port }
        this.modal.console = true
      }
    }

  },
  data (root) {
    return {
      id: null,
      cancelToken: null, // axios cancel 토큰
      mks: {
        host: null,
        port: null,
        ticket: ''
      },

      detailTabs: [],
      isBefore: false,
      isView: true,
      projectIdx: null,
      companyInfo: undefined,
      interval: null, // powerState 전환 시, vm 데이터 조회 interval
      loadingText: '', // 로딩 시, 노출 텍스트 (생성 시 표기를 위함)
      isSwTest: false,
      vmDetailData: {},
      vmToolsState: {
        state: '',
        detail: '',
        isInstalled: '',
        isRuninng: ''
      },
      metaInfoArr: [],
      resData: {},
      loading: {
        isGetVmRequest: false,
        isGetVcenter: false, // vCenter 정보 조회
        createVm: false,
        deleteVm: false,
        cluster: false, // 클러스터 정보
        isGetStoragePolicy: false, // 스토리지 정책 조회
        isGetMetaInfo: false,
        isUpdateMetaInfo: false, // 메타 정보 업데이트
        isGetVmMKS: false
      },
      storagePolicyOptions: [],
      updateVmData: null, // 업데이트 할 vm정보 (create일 때 null)
      resourceInfoColumns: [
        { header: root.$v('긴급 처리 여부'), binding: 'isUrgent' },
        { binding: 'powerState', header: 'VM 상태', keyPath: 'common.GRID.CLUSTER.vmState' },
        { binding: 'name', header: '호스트 명', keyPath: 'common.REGCON.hostName' },

        { binding: 'vmTools', header: root.$v('VM Tools 상태') },
        { binding: 'esxiName', header: 'ESXi (vCenter)' },
        { binding: 'datastoreName', header: '데이터스토어' },
        { binding: 'networkList', header: root.$v('네트워크 (네트워크 조직)') },
        { binding: 'cpuCores', header: 'vCPU' },
        { binding: 'memorySizeGB', header: 'Memory' },
        { binding: 'rootDiskSize', header: 'RootDisk' },
        { binding: 'scsiControllerList', header: '컨트롤러' },
        { binding: 'externalDiskList', header: 'Local Disk' },
        { binding: 'osName', header: root.$v('이미지') + '(OS)' },
        { binding: 'installProgramList', header: '설치 프로그램', keyPath: 'common.GRID.COMPUTE.install' },
        { binding: 'licenseList', header: root.$v('SW 라이선스') },
        { binding: 'manageGroup', header: root.$v('운영그룹') },
        { binding: 'projectInfo', header: '프로젝트 위치', keyPath: 'common.REGCON.projectLocation' },
        { binding: 'projectOwnerInfo', header: '프로젝트 소유자', keyPath: 'common.REGCON.projectOwner' },
        { binding: 'createAccount', header: '자원 생성 계정', keyPath: 'common.REGCON.createAccount' },
        { binding: 'updateAccount', header: '마지막 수정 계정', keyPath: 'common.REGCON.updateAccount' },
        { binding: 'createTime', header: '자원 생성일', keyPath: 'common.REGCON.createTime' },
        { binding: 'updateTime', header: '최근 수정일', keyPath: 'common.REGCON.updateTime' },
        { binding: 'chargeDate', header: '과금시작일', keyPath: 'common.GRID.billStart' },
        { binding: 'customFee', header: root.$v('Custom 요금') },
        { binding: 'tagInfo', header: this.$v('자원 태그'), colspan: true }
      ],

      rowData: {},

      powerState: '', // 버튼 영역 > 파워 상태 선택
      deleteIsUrgent: true,
      licenseList: { // 라이선스 (자산/비자산)
        isAssets: [],
        notAssets: []
      },

      modal: {
        controlVm: false,
        cloneVm: false, // vm 복제
        migrateVm: false, // vm 이관
        deleteVm: false, // vm 삭제 시, 호스트명 확인 모달
        ova: false,
        console: false
      },
      checkHostname: '', // 삭제 시, 입력하는 호스트명의 값

      // IP 선택 모달 테이블 및 컬럼
      ipModalTableData: [],
      initSelectedIp: null // 초기 선택 IP
    }
  }
}
</script>
<style lang="scss" scoped>
  .set-resource-server-detail {
    position: relative;
    > .button-area {
      position: absolute;
      top: 12px;
      right: 0;
      z-index: 1;
    }
    .detail-contents {
      position: relative;
      & + .detail-contents { margin-top: 20px; }
    }
    .product-info {
      & + .product-info{
        margin-top: 20px;
      }
    }
    .top-control-buttons {
      gap: $gap-s;
      .divider { margin: 5px 0; }
      .button + .button {
        margin-left: 0;
      }
    }
  }

  .detail-tabs {
    margin-top: 60px;
  }

  .license-list-wrap {
    border-top: 1px solid $common-border;
    ul.license-list {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 2px;
      > li:not(:last-child) {
        &:after { content: ','; }
      }
    }
  }

  .empty-content { color: $input-placeholder; }

  .os-wrap {
    padding-bottom: 10px !important;

    .set-os-type {
      margin-right: 5px;
    }
  }
  .os-list-wrap {
    border-top: 1px solid $common-border !important;
  }
  .empty-content { color: $input-placeholder; }
</style>

<style lang="scss">
.set-resource-server-detail {
  .button-area {
    &.el-loading-parent--relative {
      .el-loading-mask { z-index: 1; }
      .el-loading-spinner {
        position: relative;
        top: auto;
        margin-top: 0;
        .el-icon-loading {
          position: absolute;
          left: 300px;
          margin-top: 2px;
          transform: translateX(-50%);
        }
        .el-loading-text { margin-top: 7px; }
      }
    }
  }
  .checkbox-testvm {
    line-height: 32px;
    vertical-align: middle !important;
  }
  .power-state-select { // Power Off 영역
      width: 160px;
      > .el-input {
        &.el-input--suffix {
          > .el-input__inner {
              &:focus {
              background-color: darken($primary, 5%);
              color: $white;
            }
          }
        }
        &.is-focus {
          > .el-input__inner {
            background-color: darken($primary, 5%);
            color: $white;
              &:focus {
              color: $white;
              background-color: darken($primary, 5%);
            }
          }
        }
        > .el-input__inner {
          padding: 5px 10px 5px 15px;
          min-width: 30px;
          background-color: $primary;
          border: 1px solid $primary;
          font-size: 12px;
          text-align: left;
          color: $white;
          &::placeholder {
            color: $white;
          }
        }
        > .el-input__suffix {
          display: flex;
          align-items: center;
          right: 0;
          color: $white;
        }
      }
      .el-input.is-disabled {
        > .el-input__inner {
          background-color: $main-gray;
          border-color: $main-gray;
          opacity: .5;
          color:$color-grey;
          &:hover {
            background-color: $main-gray;
            border-color: $main-gray;
          }
        }
      }
    }

    // 카테고리 모달
    .el-popper.power-select-popper {
      padding-top: 5px;
      width: 160px;
      border-radius: $radius-s;
      background-color: transparent;
      border: none;
      > .el-scrollbar {
        > .el-select-dropdown__wrap.el-scrollbar__wrap {
          padding: 0;
          .el-select-dropdown__list {
            padding: 5px 0;
            > .el-select-dropdown__item {
              padding: 0 $gap-s;
              text-align: left;
              font-size: 12px;
            }
          }
        }
      }
    }
}
</style>
