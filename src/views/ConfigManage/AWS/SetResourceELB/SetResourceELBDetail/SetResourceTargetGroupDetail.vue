<!--
  * 파일명 : SetResourceTargetGroupDetail.vue
  * 파일 기능 : 구성관리 > 자원관리 > ELB > 대상그룹 상세
  * 작성자 : 김예담
  * 최종 작성일 : 2022-04-06
  * License By Shinsegae I&C
 -->

<template>
  <div v-loading="isGetELBDetail || isGetProjectInfo || isGetELBList">
    <dashboard-panel
      style="margin-top: 20px;"
      :title="$v('기본 정보')"
      small-title
      :padding-top="0"
    >
      <vertical-table
        :columns="detail ? defaultInfoColumnsInNlb : defaultInfoColumns"
        :data="defaultInfo"
        type="horizontal"
      >
        <template #state>
          {{ stateLabels[defaultInfo.state] || '-' }}
        </template>
        <!-- 상태 -->

        <template #targetType>
          {{ targetTypes[defaultInfo.targetType] || '-' }}
        </template>
        <!-- 대상 유형 -->

        <template #port>
          {{ defaultInfo.port }}
        </template>
        <!-- 포트 -->

        <template #linkedLoadBalancer>
          <div
            v-if="defaultInfo.loadBalancerArns && defaultInfo.loadBalancerArns.length"
          >
            <p
              v-for="arn in defaultInfo.loadBalancerArns"
              :key="arn"
            >
              {{ getELBNameFromArn(arn) }}
            </p>
          </div>
          <span v-else>-</span>
        </template>
        <!-- 연결된 로드밸런서 -->

        <template #projectInfo>
          <span v-if="defaultInfo.companyName">{{ defaultInfo.companyName }}</span>
          <span v-if="defaultInfo.groupName">&nbsp;>&nbsp;{{ defaultInfo.groupName }}</span>
          <span v-if="defaultInfo.projectName">&nbsp;>&nbsp;{{ defaultInfo.projectName }}</span>

          <span v-if="!defaultInfo.companyName && !defaultInfo.groupName && !defaultInfo.projectName">-</span>
        </template>
        <!-- 프로젝트 위치 -->

        <template #createTime>
          <span v-if="defaultInfo.createTime">{{ defaultInfo.createTime | date }}</span>
          <span v-else>-</span>
        </template>
        <!-- 생성 시간 -->

        <template #modifyTime>
          <span v-if="defaultInfo.modifyTime">{{ defaultInfo.modifyTime | date }}</span>
          <span v-else>-</span>
        </template>
        <!-- 마지막 변경 시간 -->

        <template #listener>
          <span>{{ defaultInfo.title }}</span>
        </template>
        <!-- 연결 리스너 -->
        <template #tagInfo>
          <resource-tag-select-edit
            :data="defaultInfo"
            :read-only="false"
            service-type="TARGET_GROUP"
            module="AWS"
            :project-idx="defaultInfo.projectIdx"
            resource-key="targetGroupArn"
          />
        </template>
      </vertical-table>
    </dashboard-panel>
    <!-- 기본정보 -->

    <dashboard-panel
      v-if="!detail"
      :padding-top="0"
      style="margin-top: 20px;"
      :title="`${$v('대상그룹')} ${$v('정보')}`"
    >
      <div class="target-group-state">
        <target-group-state-panel :register-target="targetList" />
      </div>
    </dashboard-panel>
    <!-- 대상그룹정보 -->

    <dashboard-panel
      style="margin-top: 20px;"
      :title="$v('등록대상')"
      small-title
      foldable
    >
      <template #headerPostfix>
        <small class="reference-text">
          (<span v-html="$v('총 <strong>{n}</strong>건', {n: targetList ? targetList.length : 0})" />)
        </small>
      </template>
      <instance-row-card
        v-for="(target, index) in targetList"
        :key="`target_${index}`"
        :state="target.state"
        :data="target"
        :title="target.instanceName"
        :columns="[
          {header: $v('포트'), binding: 'targetPort'},
          {header: $v('가용영역'), binding: 'availabilityZone'},
          {header: `${$v('상태 확인')} ${$v('상세')}`, binding: 'reason'}
        ]"
      />
    </dashboard-panel>
    <!-- 등록대상 -->

    <dashboard-panel
      style="margin-top: 20px;"
      :title="$v('상태 확인')"
      small-title
      foldable
    >
      <vertical-table
        :columns="confirmStateColumns"
        :data="confirmStateData"
        type="horizontal"
      >
        <template #healthyThresholdCount>
          {{ confirmStateData.healthyThresholdCount || 0 }} {{ $v('연속 상태 확인 성공 횟수') }}
        </template>

        <!-- 정상 임계값 -->
        <template #abnormalThreshold>
          {{ confirmStateData.abnormalThreshold || 0 }} {{ $v('연속 상태 확인 실패 횟수') }}
        </template>
        <!-- 비정상 임계값 -->

        <template #healthCheckTimeoutSeconds>
          {{ confirmStateData.healthCheckTimeoutSeconds || 0 }} {{ $v('초') }}
        </template>
        <!-- 시간 초과 -->

        <template #healthCheckIntervalSeconds>
          {{ confirmStateData.healthCheckIntervalSeconds || 0 }} {{ $v('초') }}
        </template>
      <!-- 간격 -->
      </vertical-table>
    </dashboard-panel>
    <!-- 상태확인 -->

    <!-- <dashboard-panel
      style="margin-top: 20px;"
      title="분배"
      small-title
      foldable
    >
      <vertical-table
        :columns="distColumns"
        :data="distData"
        type="horizontal"
      >
        <span slot="cancelAndDisconnect">{{ distData.cancelAndDisconnect ? '활성' : '비활성' }}</span>
        <span slot="fix">{{ distData.fix ? '활성' : '비활성' }}</span>
        <span slot="proxyProtocol">{{ distData.proxyProtocol ? '활성' : '비활성' }}</span>
        <span slot="clientIpAddress">{{ distData.clientIpAddress ? '활성' : '비활성' }}</span>
      </vertical-table>
    </dashboard-panel> -->
    <!-- 분배 -->
  </div>
</template>

<script>
import API, { ResourceTagSelectEdit, VerticalTable, DashboardPanel } from '@sd-fe/cmp-core'
import TargetGroupStatePanel from './TargetGroupStatePanel.vue'
import InstanceRowCard from '@/components/NetworkAws/InstanceRowCard.vue'

export default {
  name: 'SetResourceTargetGroupDetail',
  components: {
    ResourceTagSelectEdit,
    VerticalTable,
    DashboardPanel,
    TargetGroupStatePanel,
    InstanceRowCard
  },
  props: {
    targetGroupArn: {
      type: String,
      default: ''
    },
    detail: {
      type: Object,
      default: null
    }
  },
  async created () {
    await this.getTargetgroupDetail()
    await this.getELBList()
  },
  methods: {
    /**
     * API: 대상그룹 상세 조회
     */
    async getTargetgroupDetail (targetGroupArn = this.$route.params.targetGroupArn || this.arn) {
      try {
        this.isGetELBDetail = true

        let detailData
        if (!this.detail) {
          const { data } = await API.aws.getTargetGroupDetail({ targetGroupArn })

          detailData = data

          // breadcrumbs
          this.setBreadcrumbs(detailData.targetGroupName)
        } else detailData = this.detail

        if (detailData) {
          // 기본 정보
          this.defaultInfo = await this.setTargetgroupInfo(detailData)

          // 등록 대상 세팅
          if (detailData.registerTarget) this.targetList = [...detailData.registerTarget]

          // 상태 확인
          this.confirmStateData = this.setConfirmStateInfo(detailData)
        }
      } catch (error) {
        console.error(error)
        // const message = (error.response?.data) ? error.response.data.message : error.message
        Object.keys(this.defaultInfo).forEach((i) => { this.defaultInfo[i] = null })
        this.isGetELBDetail = false
        throw error
      } finally {
        this.isGetELBDetail = false
      }
    },
    setBreadcrumbs (label) {
      if (!label) return
      this.$store.commit('common/ADD_PARAMETERS', {
        label,
        path: ''
      })
    },
    /**
     * API: 프로젝트 정보 조회
     * @param {Number} projectIdx
     */
    async getProject (projectIdx) {
      if (isNaN(projectIdx)) return
      try {
        this.isGetProjectInfo = true
        const data = await API.iam.getProject({ projectIdx })
        return data
      } catch (error) {
        console.error(error)
        return this.$alert(this.$v('프로젝트 정보 조회에 문제가 발생했습니다.'), () => false)
      } finally {
        this.isGetProjectInfo = false
      }
    },
    /**
     * API: ELB 목록 조회
     */
    async getELBList () {
      try {
        this.isGetELBList = true
        const { data: nlbList } = await API.aws.getNLB()
        this.ELBList = [...nlbList]
      } catch (error) {
        console.error(error)
        return this.$alert(this.$v('프로젝트 정보 조회에 문제가 발생했습니다.'), () => false)
      } finally {
        this.isGetELBList = false
      }
    },
    /**
     * ELB arn을 입력하면 해당 자원의 로드밸런서 이름을 반환합니다.
     * @param {String} arn 연결된 로드밸런서의 Arn
     * @return {String} name 로드밸런서 이름
     */
    getELBNameFromArn (arn) {
      if (!arn) return
      const lb = this.ELBList.find(item => item.elbArn === arn)
      return lb ? lb.elbName : null
    },
    /**
     * 대상그룹 기본정보 세팅
     */
    async setTargetgroupInfo (info) {
      const data = { ...info }
      // 프로젝트 정보
      if (data.projectIdx) {
        const projectInfo = await this.getProject(data.projectIdx)

        data.companyName = projectInfo?.length ? projectInfo[0]?.companyName : ''
        data.groupName = projectInfo?.length ? projectInfo[0]?.groupName : ''
        data.projectName = projectInfo?.length ? projectInfo[0]?.projectName : ''
      }

      return data
    },
    /**
     * 대상그룹 상태확인 데이터 세팅
     */
    setConfirmStateInfo (info) {
      const {
        healthCheckIntervalSeconds,
        healthCheckPath,
        healthCheckPort,
        healthCheckProtocol,
        healthCheckTimeoutSeconds,
        healthyThresholdCount,
        unhealthyThresholdCount
      } = info

      return {
        healthCheckIntervalSeconds,
        healthCheckPath,
        healthCheckPort,
        healthCheckProtocol,
        healthCheckTimeoutSeconds,
        healthyThresholdCount,
        successCode: '200',
        abnormalThreshold: String(unhealthyThresholdCount || '-')
      }
    }
  },
  data: (root) => ({
    isGetELBDetail: false,
    isGetProjectInfo: false,
    isGetELBList: false,

    ELBList: [], // ELB 목록

    // 기본 정보
    defaultInfoColumns: [
      { binding: 'targetGroupName', header: `${root.$v('대상그룹')} ${root.$v('이름')}` },
      { binding: 'state', header: root.$v('상태') },
      { binding: 'targetType', header: root.$v('대상유형') },
      { binding: 'vpcId', header: 'VPC ID' },
      { binding: 'protocol', header: root.$v('프로토콜') },
      { binding: 'port', header: root.$v('포트') },
      { binding: 'targetGroupArn', header: 'ARN' },
      { binding: 'linkedLoadBalancer', header: root.$v('연결된 로드밸런서') },
      { binding: 'loadBalancingAlgorithm', header: root.$v('알고리즘') },
      { binding: 'projectInfo', header: root.$v('프로젝트 위치') },
      { binding: 'createTime', header: root.$v('생성 시간'), customHtml: true },
      { binding: 'modifyTime', header: root.$v('마지막 변경 시간'), customHtml: true },
      { binding: 'tagInfo', header: root.$v('자원 태그'), colspan: true }
    ],
    defaultInfoColumnsInNlb: [
      { binding: 'targetGroupName', header: `${root.$v('대상그룹')} ${root.$v('이름')}` },
      { binding: 'targetType', header: root.$v('대상유형') },
      { binding: 'vpcId', header: 'VPC ID' },
      { binding: 'protocol', header: root.$v('프로토콜') },
      { binding: 'port', header: root.$v('포트') },
      { binding: 'protocolVersion', header: `${root.$v('프로토콜')} ${root.$v('버전')}` },
      { binding: 'targetGroupArn', header: 'ARN' },
      { binding: 'listener', header: root.$v('연결 리스너'), customHtml: true }
    ],
    defaultInfo: {
      targetType: 'Instance',
      vpcId: 'vpc-6fc1b007',
      protocol: '',
      port: '',
      protocolVersion: 'HTTP1',
      arn: '',
      listener: ['TCP:80', 'TCP:81', 'TCP:82', 'TLS:65545']
    },
    targetTypes: {
      instance: root.$v('인스턴스'),
      ip: 'IP'
    },
    envType: {
      STG: root.$v('스테이징'),
      DEV: root.$v('개발'),
      PRD: root.$v('운영')
    },
    stateLabels: {
      pending: root.$v('진행 중'),
      running: root.$v('실행 중'),
      undefined: root.$v('실행 중'),
      'shutting-down': root.$v('대기'),
      terminated: root.$v('사용 가능'),
      stopping: root.$v('종료 중'),
      stopped: root.$v('정지')
    },

    // 등록대상
    targetList: [],

    // 상태 확인
    confirmStateColumns: [
      { binding: 'healthCheckProtocol', header: root.$v('프로토콜') }, //
      { binding: 'healthCheckPath', header: root.$v('경로') }, //
      { binding: 'healthCheckPort', header: root.$v('포트') }, //
      { binding: 'healthyThresholdCount', header: root.$v('정상 임계값') },
      { binding: 'abnormalThreshold', header: root.$v('비정상 임계값') },
      { binding: 'healthCheckTimeoutSeconds', header: root.$v('시간 초과') }, //
      { binding: 'healthCheckIntervalSeconds', header: root.$v('간격'), colspan: true } //
      // { binding: 'successCode', header: '성공코드' }
    ],
    confirmStateData: {
      protocol: '',
      road: '',
      port: '',
      normalThreshold: '',
      abnormalThreshold: '',
      over: '',
      timeGap: '',
      successCode: ''
    },

    // 분배
    distColumns: [
      { binding: 'algorithm', header: root.$v('알고리즘') },
      { binding: 'cancelTime', header: root.$v('경로') },
      { binding: 'cancelAndDisconnect', header: root.$v('등록 취소시 연결 종료') },
      { binding: 'fix', header: root.$v('고정') },
      { binding: 'proxyProtocol', header: `${root.$v('프록시 프로토콜')} v2` },
      { binding: 'clientIpAddress', header: root.$v('클라이언트 IP 주소 보존') }
    ],
    distData: {
      algorithm: '',
      cancelTime: '',
      cancelAndDisconnect: false,
      fix: false,
      proxyProtocol: true,
      clientIpAddress: true
    }
  })
}
</script>

<style scoped lang="scss">
small.reference-text { margin-left: 5px; font-size: 12px; color: $input-placeholder; }

.target-group-state {
  border: 1px solid $border-color;
  border-radius: $radius;
}
</style>
