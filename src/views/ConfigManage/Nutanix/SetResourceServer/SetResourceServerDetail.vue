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
    v-loading="loading.cluster || loading.deleteVm || loading.getCentralList"
  >
    <section class="detail-contents">
      <dashboard-panel
        :padding-top="0"
        :title="$t('common.GRID.resInfo')"
      >
        <template #header>
          <div
            class="button-area -right"
            v-if="vmDetailData.vmStatus !== undefined && !(vmDetailData.deleteDate && vmDetailData.orderType === 'DELETE')"
          >
            <!-- TEST VM -->
            <el-checkbox
              v-if="!isUrgent"
              class="checkbox-testvm"
              v-model="isSwTest"
              @change="changeIsSwTest"
              :disabled="vmDetailData.vmStatus === 'START'"
            >
              {{ $v('TEST VM 으로 사용') }}
            </el-checkbox>

            <!-- VM템플릿 Export -->
            <el-tooltip
              v-if="!isUrgent"
              :disabled="
                vmDetailData.exportableOVA
                  &&vmDetailData.defaultOsSystem !== 'WINDOWS'
                  && vmDetailData.powerState !== 'ON'
                  && (vmDetailData.era || vmDetailData.market ? true : !!vmDetailData.imageId)
              "
              placement="top"
              effect="light"
            >
              <template #content>
                <span v-if="!vmDetailData.exportableOVA">
                  <!-- VM Template 기능을 사용할 수 있는 클러스터가 없습니다. -->
                  {{ $t('service.OVA.ALERT.002', { state: 'Export', reason: $t('service.OVA.centralIsNotSupportOVA') }) }}
                </span>
                <span v-else-if="vmDetailData.defaultOsSystem == 'WINDOWS'">{{ $t('service.OVA.ALERT.002', { state: 'Export', reason: $t('service.OVA.windowResource')}) }}</span>
                <span v-else-if="vmDetailData.powerState === 'ON'">
                  {{ $t('service.OVA.ALERT.002', { state: 'Export', reason: 'VM State ON'}) }}
                </span>
                <span v-else-if="!vmDetailData.imageId">
                  <!-- Update로 이미지 정보를 먼저 등록해주세요. -->
                  {{ $t('service.OVA.ALERT.002', { state: 'Export', reason: $t('service.OVA.notImageInfo') }) }}
                </span>
              </template>

              <div v-if="packageType !== 'PL'">
                <button
                  class="button"
                  @click="() => modal.ova = true"
                  :disabled="
                    !vmDetailData.exportableOVA
                      || vmDetailData.deleteDate
                      || vmDetailData.defaultOsSystem === 'WINDOWS'
                      || vmDetailData.powerState === 'ON'
                      || vmDetailData.vmStatus === 'START'
                      || (vmDetailData.era || vmDetailData.market ? false : !vmDetailData.imageId)
                  "
                >
                  {{ $v('템플릿 추출') }}
                </button>
              </div>
            </el-tooltip>

            <span
              class="divider"
              v-if="!isUrgent && packageType !== 'PL'"
            />

            <!-- POWER ON/OFF -->
            <template v-if="!isUrgent">
              <button
                v-if="vmDetailData.powerState !== 'ON'"
                class="button"
                type="is-primary"
                style="margin-right: 10px;"
                @click="changePowerState('ON')"
                :disabled="vmDetailData.vmStatus === 'START' || !!vmDetailData.deleteDate"
              >
                Power On
              </button>
              <el-select
                v-else
                class="power-state-select"
                v-model="selectedPowerState"
                placeholder="OFF"
                :popper-append-to-body="false"
                popper-class="power-select-popper"
                :disabled="vmDetailData.vmStatus === 'START' || !!vmDetailData.deleteDate"
                @change="param => changePowerState(param)"
              >
                <el-option
                  v-for="power in powerOptions"
                  :key="power.value"
                  :label="power.label"
                  :value="power.value"
                />
              </el-select>
            </template>

            <!-- 변경 -->
            <el-tooltip
              v-if="!isUrgent"
              :disabled="!(vmDetailData.era && !vmDetailData.chargeDate)"
              placement="top"
              effect="light"
            >
              <div
                slot="content"
                v-html="$v('해당 자원 update는<br>구성관리 > Database 페이지에서 가능합니다.')"
              />
              <span>
                <button
                  class="button"
                  type="is-primary"
                  :disabled="vmDetailData.vmStatus === 'START'
                    || !!vmDetailData.deleteDate
                    || vmDetailData.era && !vmDetailData.chargeDate"
                  @click="modal.controlVm = true"
                >
                  {{ $v('변경') }}
                </button>
              </span>
            </el-tooltip>

            <!-- 복제 -->
            <el-tooltip
              v-if="!isUrgent"
              :disabled="vmDetailData.defaultOsSystem !== 'WINDOWS'
                && vmDetailData.powerState !== 'ON'
                && (vmDetailData.era || vmDetailData.market ? true : !!vmDetailData.imageId)"
              placement="top"
              effect="light"
            >
              <template #content>
                <span v-if="vmDetailData.defaultOsSystem == 'WINDOWS'">{{ $t('service.OVA.ALERT.002', { state: $v('복제'), reason: $t('service.OVA.windowResource')}) }}</span>
                <span v-else-if="vmDetailData.powerState === 'ON'">{{ $t('service.OVA.ALERT.002', { state: $v('복제'), reason: 'VM State ON'}) }}</span>
                <span v-else-if="!vmDetailData.era && !vmDetailData.market && !vmDetailData.imageId">
                  <!-- Update로 이미지 정보를 먼저 등록해주세요. -->
                  {{ $t('service.OVA.ALERT.002', { state: $v('복제'), reason: $t('service.OVA.notImageInfo') }) }}
                </span>
              </template>
              <div style="margin: 0 10px;">
                <!-- Clone 불가능: OS타입이 WINDOWS 입니다. -->
                <!-- Clone 불가능: subnet 초과 -->
                <button
                  class="button"
                  type="is-primary"
                  :disabled="vmDetailData.vmStatus === 'START'
                    || vmDetailData.powerState === 'ON'
                    || vmDetailData.era
                    || vmDetailData.market
                    || !!vmDetailData.deleteDate
                    || vmDetailData.defaultOsSystem === 'WINDOWS'
                    || !vmDetailData.imageId"
                  @click="e => {
                    if (vmDetailData.powerState === 'ON') return alert($t('common.ALERT.COMP.033', { state: 'Clone' })) // 전원이 종료된 자원에 대해서만<br>Clone 가능합니다.
                    else activeClone()
                  }"
                >
                  {{ $t('common.BTN.clone') }}
                <!-- 복제 -->
                </button>
              </div>
            </el-tooltip>

            <!-- 삭제 -->
            <el-tooltip
              v-if="!isUrgent"
              :disabled="vmDetailData.powerState !== 'ON'"
              placement="top"
              effect="light"
            >
              <template #content>
                <span v-if="vmDetailData.powerState === 'ON'">{{ $v('VM State ON') }}</span>
              </template>
              <div>
                <button
                  class="button"
                  type="is-primary"
                  :disabled="vmDetailData.vmStatus === 'START' || vmDetailData.deleteDate || vmDetailData.powerState === 'ON'"
                  @click="e => {
                    checkHostname = ''
                    if (vmDetailData.powerState === 'ON') return alert($t('common.ALERT.COMP.035')) // 자원을 삭제하기 위해서는<br>먼저 자원을 종료해주세요.
                    else modal.deleteVm = true
                  }"
                >
                  {{ $t('삭제') }}
                </button>
              </div>
            </el-tooltip>

            <span
              class="divider"
              v-if="!isUrgent && vmDetailData.deleteDate"
            />

            <!-- 바로 삭제/삭제 취소는 긴급 여부와 상관 없이 노출(23/05/16) -->
            <template v-if="vmDetailData.deleteDate">
              <button
                class="button"
                type="is-anti"
                :disabled="vmDetailData.vmStatus === 'START'"
                @click="forceDelete"
              >
                {{ $t('바로 삭제') }}
              </button>

              <button
                v-if="canDelete"
                class="button"
                type="is-primary"
                :disabled="vmDetailData.vmStatus === 'START'"
                @click="cancelDelete"
              >
                {{ $v('삭제 취소') }}
              </button>
              <el-tooltip
                v-else
                placement="top"
                effect="light"
              >
                <span
                  slot="content"
                  style="white-space: nowrap;"
                >
                  {{ $v('삭제 중이거나 삭제 취소 불가능 자원입니다.') }}
                  <br>
                  <b v-if="vmDetailData.deleteDateByDayjs">{{ $v('삭제 예정일') }} : {{ vmDetailData.deleteDateByDayjs }}</b>
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

        <marketplace-info
          :loading="!interval ? loading.isGetMarket || loading.isGetVmRequest : false"
          v-if="!isEmpty(vmDetailData.market)"
          class="marketplace-info"
          :data.sync="market"
          for-compute
        />

        <vertical-table
          v-loading="!interval ? loading.isGetMarket || loading.isGetVmRequest : false"
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

          <template #hostname>
            <div class="flex-wrap align-center-wrap">
              <cmp-status-tag
                v-if="vmDetailData.market || vmDetailData.era"
                style="margin-right: 5px;"
                type="mp"
                :contents="vmDetailData.market ? 'MP' : 'DB'"
              />
              {{ vmDetailData.hostname }}
            </div>
          </template>
          <!-- /.호스트명 -->

          <template #networkList>
            <span v-if="vmDetailData.networkList && vmDetailData.networkList.length > 0">
              <div
                v-for="(net, netIdx) in vmDetailData.networkList"
                :key="netIdx"
              >
                {{ net.cateKey }}
              </div>
            </span>
            <span v-else-if="vmDetailData.nics && vmDetailData.nics.length > 0">
              <div
                v-for="(net, netIdx) in vmDetailData.nics"
                :key="netIdx"
              >
                {{ net.cateKey }}
              </div>
            </span>
            <span
              v-else
              class="empty-content"
            >-</span>
          </template>

          <template #clusterName>
            <span class="align-center-wrap">{{ vmDetailData.clusterName }}</span>
          </template>

          <template #nodeName>
            <div
              class="flex-wrap"
              v-if="vmDetailData.nodeName && vmDetailData.powerState === 'ON'"
            >
              {{ vmDetailData.nodeName }}
              <button
                v-if="!isUrgent"
                style="margin-left: 10px;"
                class="button"
                type="is-primary"
                :disabled="vmDetailData.vmStatus === 'START'"
                @click="e => {
                  if (vmDetailData.powerState !== 'ON') alert($t('common.ALERT.COMP.034')) // Migrate를 하기 위해서는<br>자원이 On되어있어야 합니다.
                  else modal.migrateVm = true
                }"
              >
                {{ $v('이관') }}
              </button>
            </div>
            <span
              v-else
              class="empty-content"
            >-</span>
          </template>

          <template #vcpu>
            <span>{{ vmDetailData.vcpu }} Core</span>&nbsp;
            <span class="empty-content">{{ ` ( 소켓 수: ${vmDetailData.socket || 1}, 소켓당 코어 수: ${vmDetailData.vcpu / (vmDetailData.socket || 1)} )` }}</span>
          </template>

          <template #memory>
            <span>{{ vmDetailData.memory |byte }}</span>
          </template>

          <template #rootDiskSize>
            <span
              class="align-center-wrap"
              :class="{ 'empty-content': !vmDetailData.rootDiskSize }"
            >
              {{ vmDetailData.rootDiskSize? vmDetailData.rootDiskSize + ' GB' : '-' }}
            </span>
          </template>

          <template #osInfo>
            <div
              v-if="vmDetailData.osName"
              class="flex-wrap after-data os-wrap"
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
                  <span v-if="vmDetailData.osPlatform">{{ vmDetailData.osPlatform }}</span>
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

          <template #externalDiskList>
            <div v-if="vmDetailData.externalDiskList && vmDetailData.externalDiskList.length">
              <ul
                v-for="(disk,diskIdx) in vmDetailData.externalDiskList"
                :key="diskIdx"
              >
                <li>
                  <span>{{ disk.diskName ? disk.diskName : disk.deviceBus +'.'+ disk.deviceIndex }}&nbsp;{{ disk.diskSize }} GB </span>
                </li>
              </ul>
            </div>
            <span
              v-else
              class="empty-content"
            >-</span>
          </template>

          <template #nicIps>
            <div
              v-if="vmDetailData.nicIps && vmDetailData.nicIps.length > 0"
            >
              <ul
                v-for="(ip,nicdx) in vmDetailData.nicIps"
                :key="nicdx"
              >
                <li>{{ ip.ipAddress || ip.nicIp }}</li>
              </ul>
            </div>
            <span
              v-else
              class="empty-content"
            >-</span>
          </template>

          <template #installProgramList>
            <ul class="align-center-wrap">
              <li
                v-for="(pkg,pkgIdx) in vmDetailData.installProgramList"
                :key="pkgIdx"
              >
                {{ pkg.name }} {{ pkg.version }}
              </li>
            </ul>
          </template>

          <template #licenseList>
            <div class="license-list-wrap">
              <register-contents
                :title="$v('자산')"
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
                :title="$v('비자산')"
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
            <span v-if="vmDetailData.manageGroupName">{{ vmDetailData.manageGroupName }}</span>
            <span v-else>-</span>
          </template>
          <!-- 운영그룹 -->

          <template #projectOwnerInfo>
            <span class="account-name">
              {{ vmDetailData.projectOwnerInfo }}
            </span>
          </template>

          <template #createAccount>
            <span class="account-name">
              {{ vmDetailData.createAccount || '-' }}
            </span>
          </template>

          <template #updateAccount>
            <span class="account-name">
              {{ vmDetailData.updateAccount || '-' }}
            </span>
          </template>

          <template #chargeDate>
            <span v-if="vmDetailData.chargeDate">{{ vmDetailData.chargeDate | date('YYYY.MM.DD HH:mm') }}</span>
            <span
              v-else
              class="empty-content"
            >-</span>
          </template>

          <template #serviceDate>
            <span v-if="vmDetailData.serviceDate">{{ vmDetailData.serviceDate | date('YYYY.MM.DD HH:mm') }}</span>
            <span
              v-else
              class="empty-content"
            >-</span>
          </template>

          <template #customFee>
            {{ vmDetailData.customFee || '-' }}
          </template>

          <template #script>
            <cloud-init-simple :script="vmDetailData.script" />
          </template>
          <template #tagInfo>
            <resource-tag-select-edit
              :data="vmDetailData"
              :read-only="false"
              service-type="COMPUTE"
              module="NUTANIX"
              :project-idx="updateVmData
                ? updateVmData.projectIdx: undefined"
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
        <section
          class="detail-contents"
        >
          <dashboard-panel
            :padding-top="0"
          >
            <meta-data-form
              v-loading="loading.isGetMetaInfo||loading.isUpdateMetaInfo"
              :origin-form-data="allMetaInfoArr"
              :form-data="metaInfoArr"
              use-update-btns
              read-only
              @save-info="saveMetaInfo"
              ref="metaDataFormRef"
            />
          </dashboard-panel>
          <!-- 운영 정보 -->
        </section>
      </template>

      <template #monitor>
        <vm-monitoring>
          <monitoring-chart :vm-idx="id" />
        </vm-monitoring>
      </template>

      <template #logging>
        <vm-log-info-list :host-name="vmDetailData.hostname" />
      </template>
    </g-tab>

    <!-- 모달 -->
    <!-- 자원 생성/수정 -->
    <el-dialog
      :visible.sync="modal.controlVm"
      :title="`${$v('자원 변경')}`"
      :before-close="beforeCloseModal"
      width="1300px"
      top="5vh"
      @close="modal.controlVm = false"
    >
      <nx-compute-update-form
        v-if="modal.controlVm"
        v-loading="loading.updateVm"
        :data="updateVmData"
        :project-idx="updateVmData
          ? updateVmData.projectIdx
          : undefined"
        :user-info="user"
        @close="modal.controlVm = false"
        @save="confirmUpdate"
        in-admin
        :height="(updateVmData && updateVmData.market) ? 'calc(70vh - 186px)' : '70vh'"
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
      <clone-vm
        v-if="modal.cloneVm"
        :vm-data="vmDetailData"
        :is-ipam="cloneItemIsIpam"
        @save="confirmClone"
        @close="modal.cloneVm = false"
      />
    </el-dialog>

    <!-- 자원 이관 -->
    <el-dialog
      :visible.sync="modal.migrateVm"
      :title="$t('common.TERMS.resourceMigration')"
      :before-close="beforeCloseModal"
      width="1100px"
      top="5vh"
      @close="modal.migrateVm = false"
    >
      <migrate-vm
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
        v-html="$v('<b>{hostname}</b>을 삭제하시겠습니까?<br>호스트 명을 동일하게 입력해주세요.', {hostname: vmDetailData.hostname})"
      />

      <el-input
        v-model="checkHostname"
        :placeholder="$v('호스트 명을 입력하세요.')"
        @keyup.native.enter="e => {
          if(vmDetailData.hostname !== checkHostname) return
          confirmDelete()
        }"
      />
      <small
        class="-reference"
        v-if="!checkHostname"
      >*&nbsp;{{ $v('호스트 명을 입력하세요.') }}</small>

      <small
        class="-reference"
        v-else-if="vmDetailData.hostname !== checkHostname"
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
          :disabled="vmDetailData.hostname !== checkHostname"
        >
          {{ $v('삭제') }}
        </button>
      </div>
    </el-dialog>

    <!-- IP 선택 모달 -->
    <el-dialog
      :title="'Network IP ' + $v('선택')"
      :visible.sync="modal.selectIp"
      :before-close="beforeCloseModal"
      width="1100px"
      top="7vh"
      @close="modal.selectIp = false"
    >
      <select-network-ip-grid
        :grid-data="ipModalTableData"
        :init-selected="null"
        @cancel="modal.selectIp = false"
        @save="params => {
          setSelectedNetwork(params, vmInfo.networkList[0])
        }"
      />
    </el-dialog>

    <!-- OVA Export -->
    <el-dialog
      :title="$t('config.VM.createVmTemplate')"
      width="800px"
      :visible.sync="modal.ova"
      @close="ovaName = ''"
    >
      <div class="ova-export">
        <register-contents
          :title="$t('service.OVA.templateName')"
          type="input"
          required
        >
          <el-input
            :disabled="loading.exportOVA"
            :placeholder="$v('VM 템플릿명')"
            v-model="ovaName"
            maxlength="64"
            show-word-limit
          />
        </register-contents>
      </div>
      <section class="modal-button-area">
        <button
          class="button"
          type="is-anti"
          @click="() => modal.ova = false"
          :disabled="loading.exportOVA"
        >
          {{ $v('취소') }}
        </button>
        <button
          class="button"
          type="is-primary"
          @click="exportOVA"
          :disabled="loading.exportOVA"
          v-loading="loading.exportOVA"
        >
          {{ $v('생성') }}
        </button>
      </section>
    </el-dialog>
  </div>
</template>
<script>
import axios from 'axios'
import { mapGetters, mapState } from 'vuex'
import { isEmpty, uniqBy, cloneDeep } from 'lodash'
import MarketplaceInfo from '@/components/MarketplaceInfo/MarketplaceInfo'
import API, { ResourceTagSelectEdit, VerticalTable, DashboardPanel, SetOSIcon, MonitoringContainer, MonitoringChart, NXComputeUpdateForm, MetaDataForm, CloudInitSimple, ToggleIsUrgentCheckbox } from '@sd-fe/cmp-core'
import Dayjs from 'dayjs'

import CloneVm from './CloneVm/CloneVm'
import MigrateVm from './MigrateVm/MigrateVm'
import SelectNetworkIpGrid from '@/components/Modal/UpdateResource/ComputeUpdateForm/SelectNetworkIpGrid/SelectNetworkIpGrid'

import SetResourceServerMixins from './SetResourceServer.mixins.js'
import VmLogInfoList from './VmLogInfoList'

export default {
  name: 'SetResourceServerDetail',
  mixins: [SetResourceServerMixins],
  components: {
    VerticalTable,
    'dashboard-panel': DashboardPanel,
    'marketplace-info': MarketplaceInfo,
    'set-os-icon': SetOSIcon,
    'nx-compute-update-form': NXComputeUpdateForm,
    CloneVm,
    MigrateVm,
    SelectNetworkIpGrid,
    'vm-monitoring': MonitoringContainer,
    MonitoringChart,
    VmLogInfoList,
    MetaDataForm,
    'cloud-init-simple': CloudInitSimple,
    ResourceTagSelectEdit,
    ToggleIsUrgentCheckbox
  },
  async created () {
    this.id = this.$route.params.userVmIdx
    this.cancelToken = axios.CancelToken.source()

    await this.init()

    this.setTabs()

    if (this.vmDetailData?.bpUuid) {
      await this.getProduct(this.vmDetailData.bpUuid)
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      breadcrumbs: state => state.common.breadcrumbs,
      packageType: state => state.auth.packageType,
      computeMetadataForm: state => state.metadata.NUTANIX.COMPUTE,
      marketMetadataForm: state => state.metadata.NUTANIX.MARKET,
      databaseMetadataForm: state => state.metadata.NUTANIX.DATABASE
    }),
    ...mapGetters(['user', 'packageType']),
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

    isUrgent () { // 긴급 자원 여부
      return !!this.vmDetailData.isUrgent
    }
  },
  watch: {
    'vmDetailData.vmStatus': {
      immediate: true,
      deep: true,
      handler (val) {
        const isProgressing = (val === 'START' || val === undefined)

        const isLastBreadcrumbsHasStatus = Object.keys(this.breadcrumbs[this.breadcrumbs.length - 1]).includes('resourceStatus') // breadcrumbs 마지막 요소가 'resourceStatus' key를 가지고 있는지?

        if (isLastBreadcrumbsHasStatus) {
          this.$store.commit('common/MOD_LAST_PARAMETERS', {
            label: this.vmDetailData.hostname,
            path: '',
            resourceType: this.vmDetailData.era ? 'DB' : this.vmDetailData.market ? 'MP' : '',
            resourceStatus: {
              ON: 'ON',
              ACPI_SHUTDOWN: 'OFF',
              OFF: 'OFF',
              PROGRESS: 'PROGRESS'
            }[isProgressing ? 'PROGRESS' : this.vmDetailData.powerState]
          })
        }
      }
    },
    'modal.deleteVm' () {
      this.deleteIsUrgent = true
    }
  },
  beforeDestroy () {
    this.clearGetVmInterval()
    this.cancelToken.cancel()
  },
  methods: {
    async exportOVA () {
      if (!this.ovaName) return this.$alert(this.$v('템플릿 명을 입력해주세요.'), () => false)

      try {
        this.loading.exportOVA = true

        const data = this.vmDetailData

        const reqObj = {
          beforePrice: data?.beforePrice || 0,
          groupIdx: this.user.userGroup,
          groupName: this.user.userGroupName,
          isUrgent: !!data?.isUrgent, // 긴급 여부(긴급 = true, 일반 = false)
          price: data?.price || 0,
          projectIdx: data.projectIdx,
          requestData: {
            name: this.ovaName
          }, // 기존 orderData
          service: 'NX_VM_TEMPLATE',
          // ...(data?.market && { service: 'MARKET' }),
          // ...(data?.era && { service: 'DATABASE' }),
          userId: this.user.userId,
          userName: this.user.userName
        }
        const result = await API.work_v3.exportNxOVA(data.vmUuid, reqObj)
        if (result) this.$alert(this.$v('성공적으로 VM 템플릿을 Export하였습니다.'), () => false)
        this.modal.ova = false
      } catch (error) {
        console.log(error)
        this.$alert(this.$v('VM 템플릿 Export 실패하였습니다.'), () => false)
      } finally {
        this.loading.exportOVA = false
      }
    },
    async changeIsSwTest (val) {
      try {
        const confirmCode = val ? '006' : '007'
        const alertCode = val ? '069' : '070'
        const confirmMessage = this.$t(`common.CONFIRM.COMP.${confirmCode}`)
        const alertMessage = this.$t(`common.ALERT.COMP.${alertCode}`)
        clearInterval(this.interval)
        this.$confirm(confirmMessage, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel')
        }).then(() => {
          const payload = {
            isSwTest: !this.vmDetailData.isSwTest,
            updateUserId: this.user.userId,
            updateUserName: this.user.userName,
            userVmIdx: this.id
          }
          API.compute.updateComputeOnlyIsSwTest(payload)
        }).then(() => {
          this.isSwTest = val
          this.$alert(alertMessage).then(() => {
            this.restartGetInterval()
          })
        }).catch(() => {
          this.isSwTest = this.vmDetailData.isSwTest
          this.restartGetInterval()
          return false
        })
      } catch (error) {
        this.$alert(this.$t('common.ALERT.COMP.068'), {
          confirmButtonText: this.$t('common.BTN.confirm')
        }).then(() => {
          this.isSwTest = this.vmDetailData.isSwTest
          this.restartGetInterval()
        })
      }
    },
    restartGetInterval () {
      if (this.$route.name === 'set-resource-server-detail') { this.init() }
    },
    async init () {
      await Promise.all([
        this.getVm()
      ]).then(() => {
        this.getVmInterval()
        this.getMetaInfo()

        if (this.vmDetailData) {
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
        this.resourceInfoColumns.unshift({ binding: 'deleteDate', header: '삭제 예정일', colspan: true, keyPath: 'common.GRID.deleteDate' })
      }
    },
    /**
     * 호스트명을 Breadcrumbs에 추가합니다. (조건: Breadcrumbs 마지막 label 이 hostname과 다를 경우)
     */
    setBreadCrumbsHostName (data) {
      if (!data) return
      this.$store.commit('common/ADD_PARAMETERS', {
        label: data.hostname,
        path: '',
        resourceType: data.era ? 'DB' : data.market ? 'MP' : '',
        resourceStatus: {
          ON: 'ON',
          ACPI_SHUTDOWN: 'OFF',
          OFF: 'OFF',
          PROGRESS: 'PROGRESS'
        }[data.vmStatus === 'START' ? 'PROGRESS' : data.powerState]
      })
    },
    /**
     * [바로 삭제]
     */
    forceDelete () {
      this.$confirm(this.$v('자원을 바로 삭제하시겠습니까?'))
        .then(async () => {
          const idxType = this.vmDetailData.userDbIdx ? 'userDbIdx' : 'userVmIdx'
          const params = {
            indexType: idxType,
            userResourceIdx: this.vmDetailData[idxType],
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
          const idxType = this.vmDetailData.userDbIdx ? 'userDbIdx' : 'userVmIdx'

          const params = {
            indexType: idxType,
            userResourceIdx: this.vmDetailData[idxType],
            userId: this.user.userId,
            userName: this.user.userName
          }
          // const payload = {
          //   groupIdx: this.user.userGroup,
          //   groupName: this.user.userGroupName,
          //   projectIdx: this.vmDetailData.projectIdx,
          //   service: 'COMPUTE',
          //   ...(this.vmDetailData?.market && { service: 'MARKET' }),
          //   ...(this.vmDetailData?.era && { service: 'DATABASE' }),
          //   userId: this.user.userId,
          //   userName: this.user.userName
          // }

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
      if (!result) {
        this.selectedPowerState = this.vmDetailData.powerState === 'ON'
          ? null
          : this.vmDetailData.powerState
      } else this.init()
    },
    initRowData () {
      this.rowData = { genaral: {} }
    },
    generalSetting (data) {
      const genaral = {}
      genaral.name = data.name
      genaral.clusterName = data.clusterName
      genaral.vmName = data.vmName
      genaral.hostName = data.hostName
      genaral.vmDesc = data.vmDesc
      genaral.itsmName = data.itsmName
      return genaral
    },
    diskSetting (data) {
      const disks = []
      if (data.disks) {
        for (let j = 0; j < data.disks.length; j++) {
          // console.log(data.disks[j].deviceType != null)
          if (data.disks[j].deviceType != null) {
            disks.push(data.disks[j])
          }
        }
      }
      return disks
    },
    async getProduct (uuid) {
      try {
        this.loading.isGetMarket = true
        this.market = {}
        const data = await API.market.getProduct(uuid)
        this.market = await this.setMpInfoData(data)
        // console.log('MARKET: ', this.market)
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.market = {}
        this.$alert(message)
        throw error
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
      findObj.osInfo = `${response.bpImg?.osType} ${response.bpImg?.osName} ${response.bpImg?.osBit}`
      return { ...response, ...findObj }
    },
    async getProjectInfo (projectIdx) {
      try {
        if (projectIdx) {
          const result = await API.iam.getProject({ projectIdx: projectIdx })
          if (!result) return
          const {
            companyPrefix,
            companyCi,
            companyCode,
            companyName,
            companyIdx,
            groupName,
            groupIdx
          } = result[0]

          const projectInfo = {
            company: {
              companyPrefix,
              companyCi,
              companyCode,
              groupName: companyName,
              groupIdx: companyIdx
            },
            group: {
              groupName, groupIdx
            },
            project: {
              ...result[0]
            }
          }
          return projectInfo
        }
      } catch (error) {
        console.error('프로젝트 조회에 문제가 발생했습니다.', error)
      }
    },
    async getTargetModel (projectInfo) {
      try {
        const response = await API.billing.getApplyModelGroup()

        let appliedModel = {}
        let allModel = []
        const commonModel = response.models.find(model => model.type === 2)
        const standardModel = response.models.find(model => model.type === 1)

        // 공통 프로젝트
        if (projectInfo?.project?.inCommon) {
          appliedModel = commonModel || standardModel
        } else {
          // 관계사별 과금모델에 포함안된 관계사 -> 표준 과금모델
          // 관계사별 과금모델에 포함된 관계사 -> 관계사 과금모델
          const groupIdx = projectInfo?.company ? projectInfo.company.groupIdx : undefined

          const affModel = response.models.find(model => model.type === 3)
          if (affModel) {
            let targetModel
            if (groupIdx) targetModel = affModel.models.find(model => model.companyId === groupIdx)

            appliedModel = targetModel || standardModel
          } else {
            appliedModel = standardModel
          }
        }
        allModel = appliedModel?.options || []
        return { appliedModel, allModel }
      } catch (error) {
        throw new Error(error)
      }
    },
    async getVm () {
      try {
        this.loading.isGetVmRequest = true
        this.resData = {}
        let data = {}
        data = await API.compute.getVm(this.id, { isProgress: true }, this.cancelToken)
        console.log('nx @data:', this.id, data)

        if (!data) throw new Error()

        const isLastBreadcrumbsHasStatus = Object.keys(this.breadcrumbs[this.breadcrumbs.length - 1]).includes('resourceStatus') // breadcrumbs 마지막 요소가 'resourceStatus' key를 가지고 있는지?
        if (!isLastBreadcrumbsHasStatus) this.setBreadCrumbsHostName(data)
        this.isSwTest = data.isSwTest
        this.projectIdx = data.projectIdx

        if (data.market) {
          const marketKeys = Object.keys(data.market.reqInfo)
          marketKeys.forEach(key => {
            if (!data[key]) data[key] = data.market.reqInfo[key]
          })
          data.marketplaceName = data.market.marketplaceName
          data.bpUuid = data.market.application.bpUuid
          data.userAppIdx = data.market.userAppIdx
        }
        if (data.era) {
          const eraKeys = Object.keys(data.era.reqInfo)
          eraKeys.forEach(key => {
            if (!data[key]) data[key] = data.era.reqInfo[key]
          })
          data.databaseName = data.era.databaseName
        }

        // 네트워크 카테고리
        if (data.nics) {
          data.networkList = []
          const idxList = []
          for (let i = 0; i < data.nics.length; i++) {
            if (data.nics[i].cateIdx || data.nics[i].cateId) {
              idxList.push(data.nics[i].cateIdx || data.nics[i].cateId)
            }
          }
          if (idxList?.length) {
            const networkList = await API.network.getNetworkCategory({ idxList: idxList.join(',') })
            const net = []
            if (networkList) {
              for (let i = 0; i < networkList.length; i++) {
                const cateInfo = networkList[i]
                cateInfo.cateIdx = cateInfo.cateIdx || cateInfo.cateId || cateInfo.ipCategoryIdx
                cateInfo.cateName = cateInfo.cateName || cateInfo.codeValue
                for (let j = 0; j < data.nics.length; j++) {
                  if (cateInfo.cateIdx === (data.nics[j].cateIdx || data.nics[j].cateId)) {
                    net.push({
                      ...data.nics[j],
                      cateId: cateInfo.cateIdx,
                      cateKey: cateInfo.cateKey,
                      cateName: cateInfo.cateName,
                      cateCode: cateInfo.cateCode,
                      nicIp: cateInfo.nicIp
                    })
                    break
                  }
                }
              }
            }
            data.networkList = net
          }
        }

        // Local Disk
        let rootDiskSize = data.rootDiskSize
        if (data.disks) {
          data.externalDiskList = []
          for (let i = 0; i < data.disks.length; i++) {
            const disk = data.disks[i]
            if (disk.isCdrom ||
          disk.deviceType === 'CDROM' ||
          disk.deviceBus === 'IDE') continue

            if ((disk.deviceIndex === 0 || disk.diskIndex === 0) && disk.deviceBus === 'SCSI') {
              rootDiskSize = this.$options.filters.byteToGb(disk.vmDiskSize)
            } else {
              const diskSize = disk.vmDiskSize ? this.$options.filters.byteToGb(disk.vmDiskSize) : 0

              data.externalDiskList.push({
                ...disk,
                diskName: disk.diskName,
                name: disk.diskName || disk.name || (disk.deviceBus + '.' + disk.deviceIndex),
                diskSize,
                size: diskSize,
                data: `${diskSize} GB`,
                deviceIndex: !isNaN(disk.deviceIndex)
                  ? disk.deviceIndex
                  : !isNaN(disk.diskIndex) ? disk.diskIndex : 0
              })
            }
          }
        }

        // Root Disk Size
        data.rootDiskSize = rootDiskSize || 0

        // vCPU, 메모리
        data.vcpu = data.numVcpus || (data.vcpu * (data?.socket || 1)) // (numVcpus: vcpu 전체 코어 수, vcpu: soket 당 코어 수)
        data.memory = data.memory || this.$options.filters.byteToGb(data.memoryCapacityInBytes || 0)

        this.updateVmData = {
          ...data,
          beforeData: cloneDeep(data)
        }
        const vmCoreInfo = await this.settingDetailData(data)
        const vmSubCoreInfo = await this.settingSubData(data)
        // console.log('NX vmDetailData:', vmCoreInfo, vmSubCoreInfo)
        this.vmDetailData = { ...vmCoreInfo, ...vmSubCoreInfo }

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

        console.log('detailData', this.vmDetailData, this.updateVmData)
      } catch (error) {
        throw new Error(error)
      } finally {
        this.loading.isGetVmRequest = false
      }
    },
    async getMetaInfo (data = this.vmDetailData) {
      try {
        this.loading.isUpdateMetaInfo = true
        // 메타데이터 동기화 -> 메타데이터 편집 중이 아닐 때만
        if (this.isMetaDataFormEditing()) return

        const metadataFormName = () => {
          if (this.resource?.era) return 'databaseMetadataForm'
          else if (this.resource?.market) return 'marketMetadataForm'
          else return 'computeMetadataForm'
        }
        this.allMetaInfoArr = this[metadataFormName()]

        const meta = (this.vmDetailData.userDbIdx || this.vmDetailData.userVmIdx)
          ? await this.getNxResourceMetaInfo()
          : (data?.metaInfo ? JSON.parse(data.metaInfo) : null)
        this.updateVmData.metaInfo = JSON.stringify(meta)
        this.vmDetailData.metaInfo = JSON.stringify(meta)

        this.metaInfoArr = await this.settingMetaDataArr(meta)
      } catch (error) {
        console.error(error)
      } finally {
        this.loading.isUpdateMetaInfo = false
      }
    },

    // 자원정보 세팅
    async  settingDetailData (resData) {
      this.powerState = resData.powerState
      const settingData = { ...resData }

      if (resData.osSystem) settingData.defaultOsSystem = ['WINDOWS', 'LINUX', 'UBUNTU', 'CENTOS', 'RHEL'].find(os => resData.osSystem.includes(os))

      settingData.computeName = resData.computeName || resData.databaseName || settingData.marketplaceName
      settingData.hostname = resData.vmName || resData.hostname
      this.selectedPowerState = resData.powerState === 'ON' ? '' : resData.powerState

      settingData.exportableOVA = false

      // VM 작업 상태 (Progress...)
      if (resData.market?.status) settingData.vmStatus = resData.market.status
      if (resData.era?.status) settingData.vmStatus = resData.era.status

      if (resData.nicIps?.length) {
        settingData.nicIps = uniqBy(resData.nicIps, 'ipAddress')
      }

      // 설치프로그램
      if (resData?.installProgramList?.length) {
        try {
          const versionIdList = resData.installProgramList.map(sw => sw.versionId)

          const installData = await API.sw.getUsableInstallList({ versionIdList: versionIdList.join(',') })

          settingData.installProgramList = uniqBy(installData, 'versionId')
        } catch (error) {
          console.error(error)
        }
      }

      // S/W 라이선스
      try {
        if (resData?.licenseList) {
          const swIdxList = resData?.licenseList.map(item => item.swIdx)
          const swList = await API.metering.getSWLicense() || []

          const licenseList = swList.filter(sw => swIdxList.includes(sw.swIdx))

          settingData.licenseList = licenseList

          // 자산/비자산 구분
          this.licenseList.isAssets = licenseList.filter(license => !!license.isAssets)
          this.licenseList.notAssets = licenseList.filter(license => !license.isAssets)
        }
      } catch (error) {
        console.error(error)
      }

      if (resData.deleteDate) {
        settingData.deleteDateByDayjs = Dayjs(resData.deleteDate).format('YYYY.MM.DD')
      }

      // vm이 OVA Export 가능한 central에 속해있는지? 가능 여부 settintData.exportableOVA에 담음
      if (Object.hasOwn(resData, 'elementIdx')) {
        // vm이 속한 central
        let vmCentral

        for (let i = 0; i < this.nxCentrals.length; i++) {
          const vmCluster = this.nxCentrals[i]?.elements?.find(el => el.elementIdx === resData.elementIdx)
          if (vmCluster) {
            vmCentral = this.nxCentrals[i]
            break
          }
        }

        settingData.exportableOVA = !!vmCentral?.isSupportOva
      }

      settingData.imageUuid = resData.imageUuid

      // 운영정보
      let manageGroupName
      if (settingData?.manageGroupIdx) {
        const { data: findManageGorupInfo } = await API.billing.getOperationGroup({
          moduleType: 'NX',
          operatingGroupIdx: settingData.manageGroupIdx
        })
        if (findManageGorupInfo?.length) manageGroupName = findManageGorupInfo[0].operatingGroupName
      }
      settingData.manageGroupName = manageGroupName

      return settingData
    },

    // 운영정보세팅
    async settingSubData (resData) {
      let subData = {}

      try {
        const data = await API.iam.getProject({ projectIdx: this.projectIdx })
        this.companyInfo = data[0]
      } catch (error) {
        console.error(error)
      }

      subData = Object.assign({
        projectInfo: resData.companyName + ' > ' + resData.groupName + ' > ' + resData.projectName, // 프로젝트 위치

        projectOwnerInfo: this.companyInfo.projectOwner?.userName && this.companyInfo.projectOwner?.userId ? `${this.companyInfo.projectOwner?.userName}(${this.$options.filters.maskingName(this.companyInfo.projectOwner?.userId)})` : '', // 프로젝트 소유자
        companyName: this.companyInfo.companyName || '', // 관계사 명
        note: resData.note, // 비고
        serviceDate: resData.serviceDate, // 서비스 개시일
        chargeDate: resData.chargeDate ? resData.chargeDate : null, // 과금 시작일

        createAccount: resData.createUserId && resData.createUserName ? `${resData.createUserName}(${this.$options.filters.maskingName(resData.createUserId)})` : '', // 자원 생성 계정
        updateAccount: resData.updateUserId && resData.updateUserName ? `${resData.updateUserName}(${this.$options.filters.maskingName(resData.updateUserId)})` : '', // 마지막 수정 계정
        createTime: this.$options.filters.date(resData.createTime, 'YYYY.MM.DD HH:mm'), // 자원 생성일
        updateTime: this.$options.filters.date(resData.updateTime, 'YYYY.MM.DD HH:mm') // 최근 수정일
      }, {})
      return subData
    },
    async getCodeList (params) {
      try {
        return await API.config.getCodeList(params)
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.alert(message, () => false)
      } finally {
      }
    },
    /**
     * VM 수정 시, '저장'
     */
    confirmUpdate (saveData) {
      const {
        beforePrice,
        isUrgent,
        price,
        ...rest
      } = saveData

      const payload = {
        beforePrice,
        groupIdx: saveData.groupId,
        groupName: saveData.groupName,
        isUrgent: !!isUrgent, // 긴급 여부(긴급 = true, 일반 = false)
        price,
        projectIdx: saveData.projectId,
        requestData: rest, // 기존 orderData
        service: 'COMPUTE',
        ...(saveData?.market && { service: 'MARKET' }),
        ...(saveData?.era && { service: 'DATABASE' }),
        userId: this.user.userId,
        userName: this.user.userName
      }

      const message = this.$t('common.CONFIRM.PROJECT.022') // '자원을 수정하시겠습니까?'
      this.$confirm(message).then(async () => {
        const result = await this.updateVm(payload)
        if (result) this.modal.controlVm = false
      }).catch(() => false)
    },
    /**
     * VM '삭제' -> API 찌르기 전 데이터 가공
     */
    async confirmDelete (data = this.vmDetailData) {
      const {
        era,
        market,
        hostname,
        // userAppIdx, // MP 자원일 때, 필수값
        userDbIdx, orderNo, // DB 자원일 때, 필수값
        userVmIdx, // MP/DB 자원 아닌 vm 일 때, 필수값

        groupIdx,
        groupName,
        projectIdx,
        beforePrice,
        price

        // 긴급으로 인해 추가
        // ...rest

      } = data

      let requestData
      if (era) { // DB 자원 삭제
        requestData = {
          userDbIdx,
          orderNo,
          hostname
        }
      } else {
        // else if (market) requestData = { userAppIdx, userVmIdx, hostname } // MP 자원 삭제
        requestData = {
          userVmIdx,
          hostname
          // ...rest
        }
      } // MP/DB 자원 아닌 vm 삭제

      const payload = {
        beforePrice: beforePrice || 0,
        groupIdx,
        groupName,
        projectIdx,
        isUrgent: !!this.deleteIsUrgent,
        price: price || 0,
        service: 'COMPUTE',
        ...(market && { service: 'MARKET' }),
        ...(era && { service: 'DATABASE' }),
        userId: this.user.userId,
        userName: this.user.userName,
        requestData
      }

      console.log('삭제: ', payload.requestData)

      if (era) await this.deleteVmDb(userDbIdx, payload) // DB 자원 삭제
      else if (market) await this.deleteVmMp(payload) // MP 자원 삭제
      else await this.deleteVm(payload) // VM 삭제

      this.modal.deleteVm = false
    },
    /**
     * VM Migrate 데이터 가공 이벤트
     */
    async confirmMigrate (param) {
      const requestData = {
        userVmIdx: param.vmData.userVmIdx,
        vmUuid: param.vmData.vmUuid,
        computeName: param.vmData.computeName,
        hostUuid: param.destNode.hostUuid,
        nodeName: param.destNode.nodeName,
        updateUserId: this.user.userId,
        updateUserName: this.user.userName
      }
      const payload = {
        beforePrice: param.vmData?.beforePrice || 0,
        groupIdx: param.vmData.groupIdx,
        groupName: param.vmData.groupName,
        isUrgent: param.vmData.isUrgent || false, // 긴급 여부(긴급 = true, 일반 = false)
        price: param.vmData.price || 0,
        projectIdx: param.vmData.projectIdx,
        service: 'COMPUTE',
        ...(param.vmData?.market && { service: 'MARKET' }),
        ...(param.vmData?.era && { service: 'DATABASE' }),
        userId: this.user.userId,
        userName: this.user.userName,
        requestData
      }
      await this.migrateVm(payload)
    },
    /**
     * VM Clone 데이터 가공 이벤트
     */
    async confirmClone ({ vmData, cloneVms }) {
      this.$confirm(this.$v('자원을 복제하시겠습니까?')).then(async () => {
        // this.$alert(this.$t('common.ALERT.COMP.039'), { dangerouslyUseHTMLString: true }) // 입력하지 않은 데이터는<br>기존 자원 정보 데이터로 대체됩니다.
        const result = await this.cloneVm(vmData.userVmIdx, cloneVms)
        if (result) this.modal.cloneVm = false
      }).catch(() => false)
    },

    /**
   * [클론] 발생 이벤트
   */
    async activeClone () {
      const isIpam = await this.checkIsIpam(this.vmDetailData)
      this.cloneItemIsIpam = isIpam

      if (!isIpam) {
        // this.$alert(this.$t('common.ALERT.COMP.043'), { // 해당 자원은 Static IP를 사용하고 있어,<br>Clone 후 각 자원 별로 뉴타닉스 Prism 내의<br>Web Clone 을 통해 접속 후<br>개별 Static IP 수정이 필요합니다.
        //   dangerouslyUseHTMLString: true,
        //   callback: () => { this.modal.cloneVm = true }
        // })
        this.modal.cloneVm = true
      } else this.modal.cloneVm = true
    },
    gridRefresh (grid = this.grid) {
      if (!grid) return
      const cv = grid.collectionView
      if (!cv) return
      cv.refresh()
    },
    /**
     * 선택한 vm이 IPAM을 통해 만들어진 VM인지 체크합니다.
     * @return {Boolean} true: IPAM / false: Static한 IP
     */
    async checkIsIpam (vm) {
      const clusters = await this.getClusters()
      const clsSubnets = clusters.find(cls => cls.clusterUuid === vm.clusterUuid)?.subnets
      if (!clsSubnets) return true
      const subnet = vm.nics?.length ? clsSubnets.find(sb => sb.subnetUuid === vm.nics[0]?.subnetUuid) : null
      const isIpam = subnet ? !!subnet.subnetPools : false

      return isIpam
    },
    /**
     * 클러스터 데이터를 가져옵니다.
     */
    async getClusters () {
      try {
        this.loading.cluster = true
        const clusters = await API.compute.getClusters()
        return clusters
      } catch (error) {
        this.$alert(this.$t('common.ALERT.NUTA.009'), {
          confirmButtonText: this.$t('common.BTN.confirm')
        })
        throw error
      } finally {
        this.loading.cluster = false
      }
    },
    /**
     * 선택 네트워크 = this.selectedNetwork
     */
    setSelectedNetwork (param) {
      const data = param ? param._data : null
      this.selectedIp = data
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
      return this.routeTo({ name: 'set-resource-server' })
    },
    // 메타데이터 정보 세팅
    settingMetaDataArr (data = {}) {
      try {
        const metaData = this.allMetaInfoArr.map(meta => {
          const info = data && data[meta.key]
            ? data[meta.key]
            : ''

          return {
            ...meta,
            data: info || meta.data
          }
        })
        return metaData
      } catch (error) {
        console.error(error)
      }
    },
    /**
   * API: 메타 정보를 조회 합니다. (기생성 자원의 경우)
   * @param {Array<string>} metaInfoKeyList 조회할 메타데이터 키
   */
    async getNxResourceMetaInfo () {
      try {
        this.loading.isGetMetaInfo = true

        // const metaInfoKeyList = this.allMetaInfoArr.filter(item => item.isShownUser)
        // .map(info => info.key)

        const payload = {
          // metaInfoKeyList: [],
          resourceType: 'COMPUTE',
          ...(this.vmDetailData?.market && { resourceType: 'MARKET' }),
          ...(this.vmDetailData?.era && { resourceType: 'DATABASE' }),
          resourceId: this.vmDetailData.userDbIdx || this.vmDetailData.userVmIdx
        }

        return await API.compute.getNxResourceMetaInfo(payload)
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
          userMetaInfo: JSON.stringify(params),
          resourceType: 'COMPUTE',
          ...(this.vmDetailData?.market && { resourceType: 'MARKET' }),
          ...(this.vmDetailData?.era && { resourceType: 'DATABASE' }),
          resourceId: this.vmDetailData.userDbIdx || this.vmDetailData.userVmIdx
        }

        const result = await API.compute.updateNxResourceMetaInfo(payload)

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
    setTabs () {
      const initTabs = [{ field: 'manage', name: this.$v('운영 정보'), active: true }]

      initTabs.push(
        { field: 'monitor', name: this.$v('모니터링 정보'), active: false }
      )

      if (this.packageType === 'ENT') {
        const loggingTab = initTabs.find(tab => tab.field === 'logging')
        if (!loggingTab) initTabs.push({ field: 'logging', name: this.$v('로그 정보'), active: false })
      }

      this.detailTabs = initTabs
    },
    // 메타데이터 폼 업데이트 중인지?
    isMetaDataFormEditing () {
      const ref = this.$refs?.metaDataFormRef

      return ref?.activeEdit
    }
  },
  data (root) {
    return {
      detailTabs: [],
      ovaName: '',
      cancelToken: null, // axios cancel 토큰
      isBefore: false,
      isView: true,
      projectIdx: null,
      companyInfo: undefined,
      loadingText: '', // 로딩 시, 노출 텍스트 (생성 시 표기를 위함)
      isSwTest: false,
      vmDetailData: {},
      metaInfoArr: [],
      allMetaInfoArr: [], // 현재 폼 정보
      market: {},
      resData: {},
      loading: {
        isGetVmRequest: false,
        isGetMarket: false, // 마켓플레이스 제품 정보 조회
        isGetMetaInfo: false,
        isUpdateMetaInfo: false,
        createVm: false,
        deleteVm: false,
        cluster: false, // 클러스터 정보
        exportOVA: false
      },
      id: null,
      updateVmData: null, // 업데이트 할 vm정보 (create일 때 null)
      resourceInfoColumns: [
        { header: root.$v('긴급 처리 여부'), binding: 'isUrgent' },
        { binding: 'powerState', header: root.$v('VM 상태') },
        { binding: 'networkList', header: root.$v('네트워크 조직') },
        { binding: 'clusterName', header: root.$v('클러스터') },
        { binding: 'nodeName', header: root.$v('노드') },
        { binding: 'hostname', header: root.$v('호스트 명') },
        { binding: 'vcpu', header: 'vCPU' },
        { binding: 'memory', header: 'Memory' },
        { binding: 'rootDiskSize', header: 'RootDisk' },
        { binding: 'externalDiskList', header: 'ExternalDisk' },
        { binding: 'osInfo', header: root.$v('이미지') + '(OS)' },
        { binding: 'nicIps', header: 'IP' },
        { binding: 'installProgramList', header: root.$v('설치프로그램') },
        { binding: 'licenseList', header: root.$v('S/W 라이선스') },
        { binding: 'manageGroup', header: root.$v('운영그룹') },
        { binding: 'projectInfo', header: root.$v('프로젝트 위치') },
        { binding: 'projectOwnerInfo', header: '프로젝트 소유자', keyPath: 'common.REGCON.projectOwner' },
        { binding: 'createAccount', header: root.$v('자원 생성 계정') },
        { binding: 'updateAccount', header: root.$v('마지막 수정 계정') },
        { binding: 'createTime', header: root.$v('자원 생성일') },
        { binding: 'updateTime', header: root.$v('최근 수정일') },
        { binding: 'chargeDate', header: root.$v('과금 시작일') },
        { binding: 'customFee', header: root.$v('Custom 요금'), colspan: true },
        { binding: 'script', header: 'Cloud Init Script', colspan: true },
        { binding: 'tagInfo', header: root.$v('자원 태그'), colspan: true }
      ],

      manageInfoColumns: [
        { binding: 'companyName', header: root.$v('신청 대상') },
        { binding: 'projectInfo', header: root.$v('프로젝트 위치') },
        { binding: 'roleId', header: root.$v('서버 담당자') },
        { binding: 'projectOwnerInfo', header: '프로젝트 소유자', keyPath: 'common.REGCON.projectOwner' },
        { binding: 'appTaskUser', header: root.$v('APP 업무 담당자') },
        { binding: 'appManageTeamName', header: root.$v('APP 운영팀') },
        { binding: 'displayServiceType', header: root.$v('서비스 유형') },
        { binding: 'displayServicePart', header: root.$v('서비스 구분') },
        { binding: 'createAccount', header: root.$v('자원 생성 계정') },
        { binding: 'updateAccount', header: root.$v('마지막 수정 계정') },
        { binding: 'createTime', header: root.$v('자원 생성일') },
        { binding: 'updateTime', header: root.$v('최근 수정일') },
        { binding: 'chargeDate', header: root.$v('과금 시작일') },
        { binding: 'serviceDate', header: root.$v('서비스 개시일') },
        { binding: 'note', header: root.$v('비고'), colspan: true }
      ],
      rowData: {},

      powerState: '', // 버튼 영역 > 파워 상태 선택
      deleteIsUrgent: true, // 삭제 > 긴급 여부

      modal: {
        controlVm: false,
        cloneVm: false, // vm 복제
        migrateVm: false, // vm 이관
        deleteVm: false, // vm 삭제 시, 호스트명 확인 모달
        selectIp: false,
        ova: false
      },
      checkHostname: '', // 삭제 시, 입력하는 호스트명의 값
      licenseList: { // 라이선스 (자산/비자산)
        isAssets: [],
        notAssets: []
      },

      // IP 선택 모달 테이블 및 컬럼
      ipModalTableData: [],
      initSelectedIp: null, // 초기 선택 IP
      cloneItemIsIpam: true // 클론하는 vm이 IPAM 자원인지?
    }
  }
}
</script>
<style lang="scss" scoped>
  .ova-export {
    .register-contents {
      &::v-deep .contents-title {
        min-width: 130px;
        width: 130px;
      }
    }
    .el-input::v-deep .el-input__inner { padding: 0 55px 0 15px; }
  }

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
      .console-button {
        position: absolute;
        top: 10px;
        right: 0;
      }
      & + .detail-contents { margin-top: 20px; }
    }
    .product-info {
      & + .product-info{
        margin-top: 20px;
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
    margin-right: 20px;
  }
  .power-state-select { // Power Off 영역
      width: 120px;
      margin-right: $gap-s;
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

    .el-popper.power-select-popper {
      padding-top: 5px;
      width: 120px;
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
