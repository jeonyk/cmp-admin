<!--
  * 파일명 : SetResourceNLBDetail.vue
  * 파일 기능 : 구성관리 > 자원관리 > ELB 자원 상세 (NLB)
  * 작성자 : 김예담
  * 최종 작성일 : 2022-04-06
  * License By Shinsegae I&C
 -->

<template>
  <div
    class="set-resource-nlb-detail"
    v-loading="isGetELBDetail || isGetProjectInfo"
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
        <template #state>
          {{ stateLabel[rowData.state] ? stateLabel[rowData.state] : (rowData.state || '-') }}
        </template>
        <!-- 상태 -->

        <template #networkType>
          Application Load Balancer(L4)
        </template>
        <!-- 유형 -->

        <template #schema>
          {{ rowData.isPublic ? $v('외부') : $v('내부') }}
        </template>
        <!-- 스키마 -->

        <template #availabilityZoneList>
          <ul
            v-if="rowData.abZoneJson"
            style="height: auto"
          >
            <li
              v-for="zone in rowData.abZoneJson"
              :key="zone.subnetId"
            >
              {{ `${zone.zoneName} (${zone.subnetId})` }}
            </li>
          </ul>
        </template>
        <!-- 가용영역(서브넷ID) -->

        <template #loadBalancingAlgorithm>
          flow hash
        </template>
        <!-- 알고리즘: 현재 NLB 만 지원하기 때문에 하드코딩. -->

        <template #projectInfo>
          <span v-if="rowData.companyName">{{ rowData.companyName }}</span>
          <span v-if="rowData.groupName">&nbsp;>&nbsp;{{ rowData.groupName }}</span>
          <span v-if="rowData.projectName">&nbsp;>&nbsp;{{ rowData.projectName }}</span>

          <span v-if="!rowData.companyName && !rowData.groupName && !rowData.projectName">-</span>
        </template>
        <!-- 프로젝트 위치 -->

        <template #createTime>
          {{ rowData.createTime | date }}
        </template>
        <!-- 생성 시간 -->

        <template #modifyTime>
          {{ rowData.modifyTime | date }}
        </template>
        <!-- 마지막 변경 시간 -->
        <template #tagInfo>
          <resource-tag-select-edit
            :data="rowData"
            :read-only="false"
            service-type="NLB_L4"
            module="AWS"
            :project-idx="rowData.projectIdx"
            resource-key="elbArn"
          />
        </template>
      </vertical-table>
    </dashboard-panel>
    <!-- 기본 정보 -->

    <!-- { field: 'lbInfo', name: '로드밸런서 속성' }, -->
    <g-tab
      class="tab-area"
      :data="[
        { field: 'listener', name: $v('리스너') },
        { field: 'targetGroup', name: $v('대상그룹') },
      ]"
      :padding-top="20"
    >
      <template #listener>
        <dashboard-panel
          :padding-top="0"
          :title="$v('리스너')"
          small-title
        >
          <template #headerPostfix>
            <small class="reference-text">
              (<span v-html="$v('총 <strong>{n}</strong>건', {n: listenerList.length})" />)
            </small>
          </template>
          <ul
            class="flex-wrap"
            style="gap: 13px;"
          >
            <bound-card
              v-for="(listener, idx) in listenerList"
              :data="listener"
              :key="`listener_${idx}`"
              height="auto"
            >
              <template #body="props">
                <div>
                  <p>{{ $v('기본 규칙') }}</p>
                  <p>{{ props.data.actionType }}</p>
                </div>
                <div>
                  <p>{{ $v('대상 그룹') }}</p>
                  <p>{{ props.data.targetGroupName }}</p>
                </div>
                <!-- 21.05.04 보안정책/SSL인증서/ALPN 정책은 없음 -->
                <!-- <div>
                  <p>보안정책</p>
                  <p>{{ props.data.securityRule ? props.data.securityRule : '해당사항 없음' }}</p>
                </div>
                <div>
                  <p>SSL 인증서</p>
                  <p>{{ props.data.ssl ? props.data.ssl : '해당사항 없음' }}</p>
                </div>
                <div>
                  <p>ALPN 정책</p>
                  <p>{{ props.data.alpn ? props.data.alpn : '해당사항 없음' }}</p>
                </div> -->
              </template>
            </bound-card>
          </ul>
        </dashboard-panel>
      </template>
      <!-- 리스너 -->

      <template #targetGroup>
        <dashboard-panel
          style="margin-top: 20px;"
          :title="`${$v('대상그룹')} ${$v('정보')}`"
          :padding-top="0"
        >
          <ul
            class="target-group-list"
            v-if="targetGroupList.length"
          >
            <li
              class="target-group-item"
              v-for="group in targetGroupList"
              :key="group.targetGroupArn"
            >
              <g-tab
                :data="[
                  { field: 'default', name: `${rowData.elbName}_${$v('대상그룹')}: ${group.targetGroupName}` }
                ]"
                type="border-card"
                class="target-group-info-tab"
                :padding-top="0"
              >
                <target-group-state-panel :register-target="group.registerTarget" />
              </g-tab>
              <set-resource-target-group-detail :detail="group" />
            </li>
          </ul>
          <div
            class="empty-zone"
            v-else
          >
            {{ $v('연결된 대상그룹이 없습니다.') }}
          </div>
        </dashboard-panel>
      </template>
      <!-- 대상그룹 -->

      <template #lbInfo>
        <dashboard-panel
          :title="`${$v('로드밸런서')} ${$v('속성')}`"
          small-title
          :padding-top="0"
        >
          <div class="flex-wrap -network-policy">
            <register-contents
              v-for="(col, idx) in lbInfoColumns"
              :key="idx"
              :title="$t(col.keyPath) || col.header"
            >
              {{ lbInfo[col.binding] ? $v('활성') : $v('비활성') }}
            </register-contents>
          </div>
        </dashboard-panel>
      </template>
      <!-- 로드밸런서 속성 -->
    </g-tab>
  </div>
</template>

<script>
import API, { ResourceTagSelectEdit, VerticalTable, DashboardPanel } from '@sd-fe/cmp-core'
import TargetGroupStatePanel from './TargetGroupStatePanel.vue'
import SetResourceTargetGroupDetail from './SetResourceTargetGroupDetail.vue'
import { isEmpty } from 'lodash'

export default {
  name: 'SetResourceNLBDetail',
  components: {
    ResourceTagSelectEdit,
    VerticalTable,
    DashboardPanel,
    TargetGroupStatePanel,
    SetResourceTargetGroupDetail
  },
  props: {
    elbArn: {
      type: String,
      default: ''
    }
  },
  async created () {
    await this.getELBDetail()
  },
  methods: {
    async getELBDetail (elbArn = this.elbArn) {
      try {
        this.isGetELBDetail = true
        const { data } = await API.aws.getELBDetail({ elbArn })
        if (data) {
          // console.log('@상세 정보: ', data)
          // 기본 정보
          this.rowData = await this.setNLBInfo(data)
          this.setBreadcrumbs(data.elbName)

          // 리스너, 대상그룹
          this.listenerList = await this.setListenerInfo([...data.registerListener])
        }
      } catch (error) {
        console.error(error)
        Object.keys(this.rowData).forEach((i) => { this.rowData[i] = null })
        this.isGetELBDetail = false
        throw error
      } finally {
        this.isGetELBDetail = false
      }
    },
    setBreadcrumbs (label) {
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
     * API: 대상그룹 상세 조회
     */
    async getTargetgroupDetail (targetGroupArn) {
      if (!targetGroupArn) return

      try {
        const { data } = await API.aws.getTargetGroupDetail({ targetGroupArn })
        if (data) return data
      } catch (error) {
        console.error(error)
        this.targetGroupList = []
      }
    },
    /**
     * 상세 데이터 세팅
     */
    async setNLBInfo (info) {
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
     * 리스너 정보 세팅
     * 리스너:대상그룹 = 1:1 (원래는 1:N 이지만, CMP에서는 1:1)
     */
    async setListenerInfo (data) {
      if (!data?.length) return []

      // const getTargetGroupInfo = async (targetGroupArn) => await this.getTargetgroupDetail({ targetGroupArn })

      const getTargetPromise = data.map(async ls => {
        const { data } = await API.aws.getTargetGroupDetail({ targetGroupArn: ls.targetGroupArn })

        let obj = {
          title: `${ls.protocol}:${ls.port}`,
          actionType: ls.actionType
        }

        if (data) {
          obj = {
            ...obj,
            ...data
          }
        }

        return obj
      })
      this.targetGroupList = await Promise.all(getTargetPromise)

      return this.targetGroupList
    },
    isEmpty (value) {
      if (!value) return true
      return isEmpty(value)
    }
  },

  data: (root) => ({
    isGetELBDetail: false,
    isGetProjectInfo: false,

    rowData: {
      elbName: '',
      state: '',
      networkType: 'Application Load Balancer(L4)',
      schema: '',
      vpcId: '',
      dnsName: '',
      elbArn: '',
      availabilityZone: '',
      loadBalancingAlgorithm: '',
      projectName: '',
      appManageTeamName: '',
      appTaskUser: '',
      createTime: null,
      modifyTime: null
    },

    stateLabel: {
      provisioning: root.$v('진행 중'),
      active: root.$v('사용 가능'),
      active_impaired: root.$v('정지'),
      failed: root.$v('장애')
    },

    columns: [
      { binding: 'elbName', header: `${root.$v('로드밸런서')} ${root.$v('이름')}` },
      { binding: 'state', header: root.$v('상태') },
      { binding: 'networkType', header: root.$v('유형') },
      { binding: 'schema', header: root.$v('스키마') },
      { binding: 'vpcId', header: 'VPC ID' },
      { binding: 'dnsName', header: `DNS ${root.$v('이름')}` },
      { binding: 'elbArn', header: 'ARN' },
      { binding: 'availabilityZoneList', header: `${root.$v('가용영역')}(${root.$v('서브넷')}ID)` },
      { binding: 'loadBalancingAlgorithm', header: root.$v('알고리즘') },
      { binding: 'projectInfo', header: root.$v('프로젝트 위치') },
      // 22.04.25 [App 운영팀 / App 업무담당자 주석]
      // AWS 업무 운영담당자 기재 (사용자) 파트에 기획이 누락되었습니다.
      // 꼼꼼히 확인이 안되어 죄송합니다.
      // AWS 신청 자원의 경우 운영 담당자와 별개로 모든 역할의 사용자가 볼 수 있다.
      // 신청된 AWS 자원은 앱 담당자 지정항목도 없으므로, 관리자 쪽에 노출이 되지 않는다
      // { binding: 'appManageTeamName', header: root.$v('App 운영팀', keyPath: 'common.GRID.NETWORK.appTeam' },
      // { binding: 'appTaskUser', header: root.$v('APP 업무담당자', keyPath: 'common.REGCON.appManager' },
      { binding: 'createTime', header: root.$v('생성 시간') },
      { binding: 'modifyTime', header: root.$v('마지막 변경 시간') },
      { binding: 'tagInfo', header: root.$v('자원 태그'), colspan: true }
    ],

    // ======== 리스너
    listenerList: [{
      title: 'TCP : 80',
      defaultRule: 'Forward',
      targetGroupName: 'target_1'
    }],

    // ======== 대상그룹
    targetGroupList: [],

    // 적용된 파일 시스템 정책
    fileSystemColumns: [
      { binding: 'rootAccess', header: root.$v('기본적으로 루트 액세스 금지') },
      { binding: 'anonymousAccess', header: root.$v('익명 액세스 금지') },
      { binding: 'readOnlyAccess', header: root.$v('기본적으로 읽기 전용 액세스 금지') },
      { binding: 'allClientEncryption', header: root.$v('모든 클라이언트에 대해 전송 중 암호화 적용') }
    ],
    fileSystemInfo: {
      rootAccess: 'Allow',
      anonymousAccess: 'Allow',
      readOnlyAccess: 'Deny',
      allClientEncryption: 'Allow'
    },

    // 네트워크 정책
    lbInfo: {
      preventRemove: false,
      interSectionLb: 'us-northeast--sa2',
      accessLog: false
    },
    lbInfoColumns: [
      { binding: 'preventRemove', header: root.$v('가용영역') },
      { binding: 'interSectionLb', header: root.$v('교차 영역 로드 밸런싱') },
      { binding: 'accessLog', header: root.$v('액세스 로그') }
    ]

  })
}
</script>

<style lang="scss" scoped>
  .tab-area { margin-top: 60px; }
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
  .target-group-item {
    & + .target-group-item {
      padding-top: 50px;
      margin-top: 30px;
      border-top: 1px dashed #3d435e;
    }
  }
  small.reference-text { margin-left: 5px; font-size: 12px; color: $input-placeholder; }
</style>

<style lang="scss">
.-network-policy {
  width: 100%;
  border-top: 1px solid $purple-gray;
  .register-contents {
    flex: 1 1 auto;
  }
}

.target-group-info-tab {
  li.tab { cursor: default !important; }
}
</style>
