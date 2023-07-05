<!--
  * 파일명 : SetResourceEbsDetail.vue
  * 파일 기능 : 구성관리 > 자원관리 > EC2 자원 상세
  * 작성자 : 김예담
  * 최종 작성일 : 2022-01-20
  * License By Shinsegae I&C
 -->

<template>
  <div
    class="set-resource-ec2-detail"
    v-loading="isGetEC2Detail || isGetRegions"
  >
    <dashboard-panel
      :padding-top="0"
      :title="$t('bill.basicInfo')"
      small-title
    >
      <vertical-table
        :columns="columns"
        :data="rowData"
        type="horizontal"
      >
        <template #vcpu>
          {{ rowData.vcpu }} Core
        </template>

        <template #memory>
          {{ rowData.memory }} MB
        </template>

        <template #disks>
          <p
            v-for="(disk, idx) in rowData.disks"
            :key="'disk_' + idx"
          >
            {{ disk }}&nbsp;GB
          </p>
        </template>
        <!-- 디스크 -->

        <template #projectInfo>
          <span v-if="rowData.companyName">{{ rowData.companyName }}</span>
          <span v-if="rowData.groupName">&nbsp;>&nbsp;{{ rowData.groupName }}</span>
          <span v-if="rowData.projectName">&nbsp;>&nbsp;{{ rowData.projectName }}</span>
        </template>
        <!-- 프로젝트 위치 -->

        <template #state>
          {{ stateLabel[rowData.state] || '-' }}
        </template>
        <!-- 상태 -->

        <template #createTime>
          <span v-if="rowData.createTime">{{ rowData.createTime | date }}</span>
          <span v-else>-</span>
        </template>
        <!-- 생성 시간 -->

        <template #modifyTime>
          <span v-if="rowData.modifyTime">{{ rowData.modifyTime | date }}</span>
          <span v-else>-</span>
        </template>
        <template #tagInfo>
          <resource-tag-select-edit
            :data="rowData"
            :read-only="false"
            service-type="EC2"
            module="AWS"
            :project-idx="rowData.projectIdx"
            resource-key="instanceId"
          />
        </template>
        <!-- 마지막 변경 시간 -->
      </vertical-table>
    </dashboard-panel>
    <!-- 기본 정보 -->

    <g-tab
      class="monitoring-tab"
      :data="[
        { field: 'ebs', name: `EBS ${$v('정보')}` },
        { field: 'monitoring', name: `${$v('모니터링')} ${$v('정보')}`},
        { field: 'vpc', name: `VPC ${$v('정보')}` },
        { field: 'subnet', name: `${$v('서브넷')} ${$v('정보')}` },
        { field: 'security', name: `${$v('보안 그룹')} ${$v('정보')}` },
      ]"
      :padding-top="20"
      @click="changeTab"
    >
      <!-- { field: 'monitoring', name: '모니터링 정보' }, -->
      <template #ebs>
        <dashboard-panel
          :padding-top="0"
          :title="$v('루트 디바이스')"
          small-title
        >
          <div class="flex-wrap -root-device">
            <register-contents
              v-for="(col, idx) in detailColumns.rootDevice"
              :key="idx"
              :title="$t(col.keyPath) || col.header"
            >
              {{ rootDeviceInfo[col.binding] }}
            </register-contents>
          </div>

          <dashboard-panel
            style="margin-top: 20px;"
            :title="$v('연결된 블록 디바이스')"
            foldable
            small-title
            v-loading="isGetEBSDetail"
          >
            <template #headerPostfix>
              <small class="reference-text">(<span v-html="$v('총 <strong>{n}</strong>건', {n: rootDeviceInfo.devices.length})" />)</small>
            </template>

            <ul
              class="flex-wrap"
              style="gap: 13px;"
            >
              <bound-card
                v-for="device in rootDeviceInfo.devices"
                :data="device"
                :key="device.id"
                height="auto"
              >
                <template #title>
                  <div
                    class="flex-wrap"
                    style="justify-content: space-between;"
                  >
                    <h2>{{ device.attachedInstanceId }}</h2>
                    <a
                      class="mdi mdi-open-in-new"
                      @click="e=> {
                        activeEbsInfo = device
                        activeVolumeInfoModal = true
                      }"
                    />
                  </div>
                </template>
                <template #body="props">
                  <div>
                    <p>{{ $v('용량') }}</p>
                    <span>{{ props.data.size }} GB</span>
                  </div>
                  <div>
                    <p>{{ $v('블록유형') }}</p>
                    <span>{{ props.data.volumeType }}</span>
                  </div>
                  <div>
                    <p>IOPS</p>
                    <span>{{ props.data.iops }}</span>
                  </div>
                  <div>
                    <p>{{ $v('처리량') }}</p>
                    <span>{{ props.data.throughput ? props.data.throughput : $v('해당사항 없음') }}</span>
                  </div>
                </template>
              </bound-card>
            </ul>
          </dashboard-panel>
        </dashboard-panel>
      </template>
      <!-- EBS 정보 -->

      <template #monitoring>
        <ec2-monitoring
          v-if="rowData.projectIdx"
          :instance-id="$route.params.instanceId"
          :project-id="rowData.projectIdx"
        />
        <div
          class="empty-zone"
          v-else
        >
          {{ $v('{info} 정보가 없습니다.', { info: $v('모니터링') }) }}
        </div>
      </template>
      <!-- 모니터링 정보 -->

      <template #vpc>
        <dashboard-panel
          v-if="!isEmpty(vpcInfo)"
          :padding-top="0"
          :title="`VPC ${$v('기본 정보')}`"
          small-title
        >
          <vertical-table
            v-loading="isGetVPCDetail"
            :columns="detailColumns.vpcInfo"
            :data="vpcInfo"
            type="horizontal"
          >
            <span slot="associateSubnetCount">{{ $v('{n}개', { n: vpcInfo.associateSubnetCount}) }}</span>
            <!-- 서브넷 개수 -->

            <template #state>
              {{ stateLabel[vpcInfo.state] || '-' }}
            </template>
            <!-- 상태 -->

            <span slot="environment">{{ vpcInfo.environment ?
              { STG: $v('스테이징'),
                DEV: $v('개발'),
                PRD: $v('운영') }[vpcInfo.environment]
              : '-' }}</span>
            <!-- 서브넷 개수 -->
          </vertical-table>
        </dashboard-panel>

        <div
          class="empty-zone"
          v-else
        >
          {{ $v('{info} 정보가 없습니다.', { info: 'VPC' }) }}
        </div>
      </template>
      <!-- VPC 정보 -->

      <template #subnet>
        <dashboard-panel
          v-if="!isEmpty(subnetInfo)"
          :padding-top="0"
          :title="`${$v('서브넷')} ${$v('기본 정보')}`"
          small-title
        >
          <vertical-table
            v-loading="isGetSubnetDetail"
            :columns="detailColumns.subnetInfo"
            :data="subnetInfo"
            type="horizontal"
          >
            <span slot="isPublic">{{ subnetInfo.isPublic ? 'Public' : 'Private' }}</span>
            <!-- 서브넷 분류 -->

            <span slot="availableIpAddressCount">{{ subnetInfo.availableIpAddressCount }}</span>
            <!-- 사용 가능 IP 수 -->

            <span slot="createTime">{{ subnetInfo.createTime }}</span>

            <span slot="routeTableId">{{ subnetInfo.associateRouteTableJson ? subnetInfo.associateRouteTableJson.routeTableId : '' }}</span>
            <!-- 라우팅 테이블 -->
          </vertical-table>
        </dashboard-panel>
        <div
          class="empty-zone"
          v-else
        >
          {{ $v('{info} 정보가 없습니다.', { info: $v('서브넷') }) }}
        </div>
      </template>
      <!-- 서브넷 정보 -->

      <template #security>
        <dashboard-panel
          :padding-top="0"
          :title="$v('보안 그룹') + ' ' + $v('정보')"
          small-title
        >
          <article
            class="security-article"
            v-for="security in securityInfos"
            :key="security.id"
            v-loading="isGetSecurityGroupDetail"
          >
            <h5>
              <span class="security-article-title">
                {{ $v('보안 그룹') }}&nbsp;ID :&nbsp;{{ security.groupId }}
              </span>
            </h5>

            <dashboard-panel
              :title="$v('인바운드 규칙')"
              foldable
              small-title
            >
              <template #headerPostfix>
                <small class="reference-text">
                  (<span v-html="$v('총 <strong>{n}</strong>건', {n: security.inBounds.length})" />)
                </small>
              </template>

              <ul class="card-wrapper">
                <bound-card
                  v-for="(inbound,index) in security.inBounds"
                  :data="inbound"
                  :key="inbound.id + index"
                />
              </ul>
            </dashboard-panel>

            <dashboard-panel
              style="margin-top: 20px;"
              :title="$v('아웃바운드 규칙')"
              foldable
              small-title
            >
              <template #headerPostfix>
                <small class="reference-text">
                  (<span v-html="$v('총 <strong>{n}</strong>건', {n: security.outBounds.length})" />)
                </small>
              </template>

              <ul class="card-wrapper">
                <bound-card
                  v-for="(outbound, index) in security.outBounds"
                  :data="outbound"
                  :key="outbound.id + index"
                />
              </ul>
            </dashboard-panel>
          </article>
        </dashboard-panel>
      </template>
      <!-- 보안 그룹 정보 -->
    </g-tab>

    <el-dialog
      :title="`${$v('볼륨')} ${$v('정보')}`"
      :visible.sync="activeVolumeInfoModal"
      width="1020px"
      top="35vh"
    >
      <vertical-table
        v-if="activeVolumeInfoModal"
        :columns="ebsInfoModalColumns"
        :data="activeEbsInfo"
        type="horizontal"
      >
        <template #size>
          {{ activeEbsInfo.size }} GB
        </template>

        <template #iops>
          {{ activeEbsInfo.iops }}
        </template>
        <!-- IOPS -->

        <template #deleteTermination>
          <span v-if="typeof activeEbsInfo.deleteTermination === 'boolean'">
            {{ String(activeEbsInfo.deleteTermination).replace(/^./, str => str.toUpperCase()) }}
          </span>
          <span v-else>False</span>
        </template>
        <!-- 종료시 삭제 -->

        <template #ioState>
          {{ stateLabel[activeEbsInfo.state] ? stateLabel[activeEbsInfo.state] : '-' }}
        </template>
        <!-- I/O상태 -->

        <template #autoEnabledIO>
          {{ activeEbsInfo.autoEnabledIO ? $v('활성화') : $v('비활성화') }}
        </template>
        <!-- 자동 활성화된 I/O-->

        <template #volumeStatus>
          {{ activeEbsInfo.volumeStatus && activeEbsInfo.volumeStatus.status === 'ok' ? $v('정상') : $v('비정상') }}
        </template>
        <!-- 볼륨 상태-->

        <template #createTime>
          <span v-if="activeEbsInfo.createTime">{{ activeEbsInfo.createTime | date }}</span>
          <span v-else>-</span>
        </template>
        <!-- 생성 시간 -->

        <template #modifyTime>
          <span v-if="activeEbsInfo.modifyTime">{{ activeEbsInfo.modifyTime | date }}</span>
          <span v-else>-</span>
        </template>
        <!-- 마지막 변경 시간 -->
      </vertical-table>
      <div class="modal-footer modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="activeVolumeInfoModal = false"
        >
          <!-- 닫기 -->
          {{ $t('common.BTN.close') }}
        </button>
      </div>
    </el-dialog>
    <!-- 볼륨 정보 모달 -->
  </div>
</template>

<script>
import API, { ResourceTagSelectEdit, VerticalTable, DashboardPanel } from '@sd-fe/cmp-core'
import EC2Monitoring from '../ResourceMonitoring/EC2Monitoring'

import { cloneDeep, isEmpty } from 'lodash'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'SetResourceEC2Detail',
  components: {
    ResourceTagSelectEdit,
    VerticalTable,
    'ec2-monitoring': EC2Monitoring,
    DashboardPanel
  },
  async created () {
    await this.getProjectByCloudType() // 프로젝트 조회
    await this.getRegionsPriorities() // 리전 조회

    await Promise.all([
      this.getEC2Detail()
    ]).then(async () => {
      await this.getEBSInfo()
      await this.setDefaultInfoDisks()
    })
  },
  computed: {
    ...mapGetters({
      getProject: 'project/getProject'
    })
  },
  methods: {
    ...mapActions({
      getProjectByCloudType: 'project/getProjectByCloudType'
    }),
    async getEC2Detail (instanceId = this.$route.params.instanceId) {
      try {
        this.isGetEC2Detail = true
        const response = await API.aws.getEC2Detail(instanceId)
        if (response) {
          this.rowData = response

          if (this.rowData.instanceId) this.setBreadcrumbs(this.rowData.instanceId)

          let projectInfo
          if (response.projectIdx) {
            projectInfo = this.getProject(response.projectIdx)
            this.rowData.companyName = projectInfo?.companyName
            this.rowData.groupName = projectInfo?.groupName
            this.rowData.projectName = projectInfo?.projectName
          }

          // 리전
          if (response.regionName) {
            const regionInfo = this.zoneList.find(zone => zone.regionName === response.regionName)
            this.rowData.regionDisplayName = regionInfo?.displayName || ''
          }

          this.rootDeviceInfo = {
            rootDeviceName: response.rootDeviceName,
            rootDeviceType: response.rootDeviceType,
            ebsOptimize: 'EBS', // 확인 필요 => EBS 최적화 정보?
            devices: []

          }
        }
      } catch (error) {
        console.error(error)
        // const message = (error.response?.data) ? error.response.data.message : error.message
        Object.keys(this.rowData).forEach((i) => { this.rowData[i] = null })
        this.isGetEC2Detail = false
        throw error
      } finally {
        this.isGetEC2Detail = false
      }
    },
    /**
     * API: 리전 조회
     */
    async getRegionsPriorities () {
      try {
        this.isGetRegions = true
        const { data } = await API.aws.getRegionsPriorities()
        if (!data) return

        this.zoneList = [...data]
      } catch (error) {
        console.error(error)
        this.zoneList = []
        throw error
      } finally {
        this.isGetRegions = false
      }
    },
    setBreadcrumbs (label) {
      this.$store.commit('common/ADD_PARAMETERS', {
        label,
        path: ''
      })
    },
    /*
     * 기본 정보 > 디스크 정보를 설정합니다.
     */
    setDefaultInfoDisks () {
      if (this.rootDeviceInfo.devices?.length) {
        this.rowData = {
          ...this.rowData,
          disks: cloneDeep(this.rootDeviceInfo.devices.map(d => d.size))
        }
      }
    },
    /*
     * 탭 전환 이벤트
     */
    changeTab (tab) {
      const field = tab.field
      switch (field) {
        case 'ebs':
          this.getEBSInfo()
          break

        case 'vpc':
          this.getVpcInfo()
          break

        case 'subnet':
          this.getSubnetInfo()
          break

        case 'security':
          this.getSecurityGroupInfo()
          break
      }
    },
    /*
     * # EBS 리스트 정보 조회
     */
    async getEBSInfo (instanceId = this.$route.params.instanceId) {
      try {
        this.isGetEBSDetail = true
        const response = await API.aws.getEBSList({ attachedInstanceId: instanceId })
        if (response) {
          const ebsList = response
          this.rootDeviceInfo.devices = ebsList.map(item => {
            let projectInfo, companyName, groupName, projectName
            if (item.projectIdx) {
              projectInfo = this.getProject(item.projectIdx)
              companyName = projectInfo?.companyName
              groupName = projectInfo?.groupName
              projectName = projectInfo?.projectName
            }
            return {
              ...item,
              id: item.attachedDevice,
              projectInfo: (companyName && groupName && projectName)
                ? `${companyName} > ${groupName} > ${projectName}`
                : '-'
            }
          })
        }
      } catch (error) {
        console.error(error)
        this.isGetEBSDetail = false
        throw error
      } finally {
        this.isGetEBSDetail = false
      }
    },
    /**
     * # vpc 정보 조회
     */
    async getVpcInfo (vpcId = this.rowData.vpcId) {
      try {
        this.isGetVPCDetail = true
        const { data } = await API.aws.getVpcDetail(vpcId)
        if (data) {
          let regionDisplayName = data.regionName || '-'

          if (data.regionName) {
            const regionInfo = this.zoneList.find(zone => zone.regionName === data.regionName)
            regionDisplayName = regionInfo?.displayName || ''
          }

          this.vpcInfo = {
            ...data,
            regionDisplayName,
            createTime: this.$options.filters.date(data.createTime)
          }
        }
      } catch (error) {
        console.error(error)
        this.isGetVPCDetail = false
        throw error
      } finally {
        this.isGetVPCDetail = false
      }
    },
    /**
     * # Subnet 정보 조회
     */
    async getSubnetInfo (subnetId = this.rowData.subnetId) {
      try {
        this.isGetSubnetDetail = true
        const { data } = await API.aws.getSubnetDetail(subnetId)
        if (data) {
          this.subnetInfo = {
            ...data,
            createTime: this.$options.filters.date(data.createTime)
          }
          this.subnetInfo.subnetRange = `${data.startIp} ~ ${data.endIp}`
        }
      } catch (error) {
        console.error(error)
        this.isGetSubnetDetail = false
        throw error
      } finally {
        this.isGetSubnetDetail = false
      }
    },
    /**
     * # 보안그룹 정보 조회
     */
    async getSecurityGroupInfo (instanceId = this.rowData.instanceId) {
      try {
        this.isGetSecurityGroupDetail = true
        const response = await API.aws.getInstanceSgDetail(instanceId)
        if (response) {
          this.securityInfos = response.map(sg => {
            const rules = sg.securityGroupRuleDtoList.map(rule => {
              return {
                ...rule,
                // title: rule.ruleId,
                id: rule.ruleId,
                title: rule.ruleType,
                desc: rule.ruleDescription,
                isEgress: rule.isEgress
              }
            })
            return {
              ...sg,
              inBounds: rules.filter(item => !item.isEgress),
              outBounds: rules.filter(item => item.isEgress)
            }
          })
        }
      } catch (error) {
        console.error(error)
        this.isGetSecurityGroupDetail = false
        throw error
      } finally {
        this.isGetSecurityGroupDetail = false
      }
    },
    isEmpty (value) {
      if (!value) return true
      return isEmpty(value)
    }
  },

  data: (root) => ({
    id: '',
    projectId: null,
    isGetEBSDetail: false,
    isGetEC2Detail: false,
    isGetRegions: false,
    isGetVPCDetail: false,
    isGetSubnetDetail: false,
    isGetSecurityGroupDetail: false,

    activeVolumeInfoModal: false, // 볼륨 정보 모달 active
    activeEbsInfo: {}, // 볼륨 정보 모달 데이터
    zoneList: [], // 리전 리스트
    rowData: {
      instanceId: '',
      instanceName: '',
      ip: '',
      status: '',
      amiId: '',
      architecture: '',
      instanceType: '',
      vcpu: '',
      memory: '',
      disk: '',
      monitoring: '',
      regionDisplayName: '',
      available: null,
      companyName: '',
      groupName: '',
      projectName: '',
      updateTime: 0
    },
    rootDeviceInfo: { rootDeviceName: '/dev/xvda', rootDeviceType: 'EBS', ebsOptimize: 'EBS', devices: [] }, // EBS 정보 > 루트 디바이스
    vpcInfo: {}, // VPC 정보
    subnetInfo: {},
    securityInfos: [
      {
        id: 'sg-03f3238f58c88b228',
        inBounds: [],
        outBounds: []
      }
    ],
    stateLabel: {
      error: root.$v('오류'),
      'in-use': root.$v('실행 중'),
      undefined: root.$v('실행 중'),
      'shutting-down': root.$v('대기'),
      creating: root.$v('진행 중'),
      'in-use-optimizing': root.$v('진행 중'),
      'available-modifying': root.$v('진행 중'),
      available: root.$v('사용 가능'),
      stopped: root.$v('정지'),
      stopping: root.$v('종류 중'),
      deleting: root.$v('삭제'),
      running: root.$v('실행 중'),
      pending: root.$v('진행 중'),
      terminated: root.$v('사용 가능')
    },

    // ======== columns
    columns: [
      { binding: 'instanceId', header: root.$v('인스턴스 ID') },
      { binding: 'instanceName', header: root.$v('인스턴스 명') },
      { binding: 'publicIp', header: 'public IP' },
      { binding: 'privateIp', header: 'private IP' },
      { binding: 'availabilityZone', header: root.$v('가용영역') },
      { binding: 'regionDisplayName', header: root.$v('리전') },
      { binding: 'amiId', header: 'AMI ID' },
      { binding: 'architecture', header: 'Architecture' },
      { binding: 'instanceType', header: root.$v('인스턴스 유형') },
      { binding: 'vcpu', header: root.$v('vCPU') },
      { binding: 'memory', header: root.$v('메모리') },
      { binding: 'disks', header: root.$v('디스크') },
      { binding: 'networkPerformance', header: `${root.$v('네트워크')} ${root.$v('성능')}` },
      { binding: 'networkInterfaceId', header: `${root.$v('네트워크 인터페이스')} ID` },
      { binding: 'projectInfo', header: root.$v('프로젝트 위치'), customHtml: true },
      { binding: 'state', header: root.$v('상태') },
      // 22.04.25 [App 운영팀 / App 업무담당자 주석]
      // AWS 업무 운영담당자 기재 (사용자) 파트에 기획이 누락되었습니다.
      // 꼼꼼히 확인이 안되어 죄송합니다.
      // AWS 신청 자원의 경우 운영 담당자와 별개로 모든 역할의 사용자가 볼 수 있다.
      // 신청된 AWS 자원은 앱 담당자 지정항목도 없으므로, 관리자 쪽에 노출이 되지 않는다
      // { binding: 'appManageTeamName', header: 'App 운영팀', keyPath: 'common.GRID.NETWORK.appTeam' },
      // { binding: 'appTaskUser', header: 'APP 업무담당자', keyPath: 'common.REGCON.appManager' },

      { binding: 'createTime', header: root.$v('생성 시간'), customHtml: true },
      { binding: 'modifyTime', header: root.$v('마지막 변경 시간'), customHtml: true },
      { binding: 'tagInfo', header: '자원 태그', colspan: true }
    ],
    detailColumns: {
      rootDevice: [
        { binding: 'rootDeviceName', header: root.$v('루트 디바이스 명') },
        { binding: 'rootDeviceType', header: root.$v('루트 디바이스 타입') },
        { binding: 'ebsOptimize', header: `EBS ${root.$v('최적화')}` }
      ],
      vpcInfo: [
        { binding: 'vpcId', header: 'VPC ID' },
        // { binding: 'vpcName', header: `VPC ${root.$v('별칭')}` }, // 확인 필요 (정보 없음)
        { binding: 'regionDisplayName', header: `Region ${root.$v('정보')}` },
        { binding: 'associateSubnetCount', header: root.$v('서브넷 개수') },
        { binding: 'environment', header: root.$v('VPC망 분류') }, // 확인 필요
        { binding: 'cidrBlock', header: root.$v('VPC 대역') },
        { binding: 'networkAclId', header: root.$v('네트워크 ACL') },
        { binding: 'state', header: root.$v('VPC 연결상태') },
        { binding: 'createTime', header: root.$v('생성일') }
      ],
      subnetInfo: [
        { binding: 'subnetId', header: `${root.$v('서브넷')} ID` },
        // { binding: 'subnetName', header: root.$v('서브넷 별칭') }, // 확인 필요 (정보 없음)
        { binding: 'availabilityZone', header: root.$v('가용영역') },
        { binding: 'isPublic', header: root.$v('서브넷 분류') },
        { binding: 'subnetRange', header: root.$v('서브넷 대역') },
        { binding: 'availableIpAddressCount', header: root.$v('사용 가능 IP 수') },
        { binding: 'vpcId', header: `${root.$v('연결된 VPC')} ID` },
        { binding: 'networkAclId', header: root.$v('네트워크 ACL') },
        { binding: 'routeTableId', header: root.$v('라우팅 테이블') },
        { binding: 'createTime', header: root.$v('생성일'), colspan: true }
      ]
    },
    ebsInfoModalColumns: [
      { binding: 'volumeId', header: `${root.$v('볼륨')}ID` },
      // { binding: 'volumeNic', header: root.$v('볼륨 별칭') },
      { binding: 'size', header: root.$v('크기') },
      { binding: 'volumeType', header: `${root.$v('볼륨')} ${root.$v('유형')} ` },
      { binding: 'availabilityZone', header: root.$v('가용영역') },
      { binding: 'iops', header: 'IOPS', customHtml: true },
      { binding: 'attachedInstanceId', header: root.$v('연결된 인스턴스') },
      { binding: 'deleteTermination', header: root.$v('종료시 삭제') },
      { binding: 'ioState', header: root.$v('I/O상태') },
      { binding: 'autoEnabledIO', header: root.$v('자동 활성화된 I/O') },
      { binding: 'volumeStatus', header: `${root.$v('상태')} ${root.$v('상태')}`, customHtml: true },
      { binding: 'ioUpdateDate', header: root.$v('I/O 상태 업데이트 날짜') },
      // { binding: 'appManageTeam', header: root.$v('APP운영팀') },
      // { binding: 'appTaskUsers', header: root.$v('APP운영담당자') },
      { binding: 'projectInfo', header: root.$v('프로젝트 위치') },
      { binding: 'createTime', header: root.$v('생성일') },
      { binding: 'modifyTime', header: root.$v('마지막 변경 시간') }
    ]

  })
}
</script>

<style lang="scss" scoped>
  .monitoring-tab { margin-top: 60px; }
  .card-wrapper {
    display:flex;
    gap:20px;
    flex-direction: row;
    flex-wrap:wrap;
  }
  .security-article {
    &-title {
      padding: 0 $gap-s;
      border: 1px solid $purple;
      border-radius: 3px;
      color: $purple;
      font-size: 13px;
      line-height: 27px;
    }
  }
  small.reference-text { margin-left: 5px; font-size: 12px; color: $input-placeholder; }
</style>

<style lang="scss">
.-root-device {
  width: 100%;
  border-top: 1px solid $purple-gray;
  .register-contents {
    flex: 1 1 auto;
    // max-width: 470px !important;
  }
}

.flex-wrap {
  flex-wrap : wrap;
}
</style>
