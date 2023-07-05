<!--
  * 파일명 : SetResourceALBDetail.vue
  * 파일 기능 : 구성관리 > 자원관리 > ELB 자원 상세
  * 작성자 : 김예담
  * 최종 작성일 : 2022-04-06
  * License By Shinsegae I&C
 -->

<template>
  <div
    class="set-resource-alb-detail"
    v-loading="isGetELBDetail"
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
          {{ stateLabel[rowData.state] ? stateLabel[rowData.state].text : '-' }}
        </template>
        <!-- 상태 -->

        <!-- <template #appTaskUser>
          <span v-if="rowData.appTaskUser && rowData.appTaskUser.length > 0">
            <el-tag
              v-for="(task,taskIdx) in rowData.appTaskUser"
              :key="taskIdx"
            >
              {{ task.userName }}({{ task.userId | maskingName }})
            </el-tag>
          </span>
          <span v-else>-</span>
        </template> -->
        <!-- APP 업무담당자 -->

        <template #createDate>
          {{ rowData.createDate | date }}
        </template>
        <!-- 생성 시간 -->

        <template #modifyDate>
          {{ rowData.modifyDate | date }}
        </template>
        <!-- 마지막 변경 시간 -->
      </vertical-table>
    </dashboard-panel>
    <!-- 기본 정보 -->

    <g-tab
      class="tab-area"
      :data="[
        { field: 'listener', name: '리스너' },
        { field: 'targetGroup', name: '대상 그룹' },
        { field: 'securityGroup', name: '보안 그룹' },
        { field: 'lbInfo', name: '로드밸런서 속성' },
      ]"
      :padding-top="20"
      @click="changeTab"
    >
      <template #listener>
        <dashboard-panel
          :padding-top="0"
          title="리스너"
          small-title
        >
          <template #headerPostfix>
            <small class="reference-text">(총 <strong>1</strong>개)</small>
          </template>
          <ul
            class="flex-wrap"
            style="gap: 13px;"
          >
            <bound-card
              v-for="listener in listenerList"
              :data="listener"
              :key="listener.id"
              height="auto"
            >
              <template #body="props">
                <div>
                  <p>{{ $v('기본 규칙') }}</p>
                  <p>{{ props.data.defaultRule }}</p>
                </div>
                <div>
                  <p>{{ $v('대상그룹') }}</p>
                  <p>{{ props.data.targetGroup }}</p>
                </div>
                <div>
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
                </div>
              </template>
            </bound-card>
          </ul>
        </dashboard-panel>
      </template>
      <!-- 리스너 -->

      <template #targetGroup>
        <dashboard-panel
          title="대상그룹정보"
          foldable
          small-title
          :padding-top="0"
        >
          <g-tab
            :data="targetGroups"
            type="border-card"
            :padding-top="20"
          >
            <template
              v-for="(data, idx) in targetGroups"
              v-slot:[data.field]
            >
              <ul
                class="state-list"
                :key="idx"
              >
                <li
                  v-for="(value, name) in targetGroupStateCount"
                  :key="name"
                >
                  <span
                    class="state-title"
                    :class="name"
                  >{{ {total: '대상개수', normal: '정상', issue: '이슈', notUsing: '미사용', reset: '초기화', deleting: '해제중'}[name] }}</span>
                  <span class="state-value">{{ value }}</span>
                </li>
              </ul>
              <!-- summary -->
            </template>
          </g-tab>

          <set-resource-target-group-detail />
        </dashboard-panel>
      </template>
      <!-- 대상그룹 -->

      <template #securityGroup>
        <dashboard-panel
          :padding-top="0"
          title="보안 그룹 정보"
          small-title
        >
          <article
            class="security-article"
            v-for="security in securityInfos"
            :key="security.id"
          >
            <h5>
              <span class="security-article-title">
                보안 그룹 ID :&nbsp;{{ security.groupId }}
              </span>
            </h5>

            <dashboard-panel
              title="인바운드 규칙"
              foldable
              small-title
            >
              <template #headerPostfix>
                <small class="reference-text">(총 <strong>{{ security.inBounds.length }}</strong>개)</small>
              </template>

              <ul
                class="flex-wrap"
                style="gap: 13px;"
              >
                <bound-card
                  v-for="inbound in security.inBounds"
                  :data="inbound"
                  :key="inbound.id"
                >
                  <template #body="props">
                    <div>
                      <p>소스</p>
                      <span>{{ props.data.ipv4Ranges }}</span>
                    </div>
                    <div>
                      <p>포트</p>
                      <span>{{ props.data.toPort }}</span>
                    </div>
                    <div>
                      <p>통신방법</p>
                      <span>{{ props.data.protocol }}</span>
                    </div>
                  </template>
                </bound-card>
              </ul>
            </dashboard-panel>

            <dashboard-panel
              style="margin-top: 20px;"
              title="아웃바운드 규칙"
              foldable
              small-title
            >
              <template #headerPostfix>
                <small class="reference-text">(총 <strong>{{ security.outBounds.length }}</strong>개)</small>
              </template>

              <ul
                class="flex-wrap"
                style="gap: 13px;"
              >
                <bound-card
                  v-for="inbound in security.outBounds"
                  :data="inbound"
                  :key="inbound.id"
                />
              </ul>
            </dashboard-panel>
          </article>
        </dashboard-panel>
      </template>
      <!-- 보안그룹 -->

      <template #lbInfo>
        <dashboard-panel
          title="로드밸런서 속성"
          small-title
          :padding-top="0"
        >
          <div class="flex-wrap -network-policy">
            <register-contents
              v-for="(col, idx) in lbInfoColumns"
              :key="idx"
              :title="$t(col.keyPath) || col.header"
            >
              {{ lbInfo[col.binding] ? '활성' : '비활성' }}
            </register-contents>
          </div>
        </dashboard-panel>
      </template>
      <!-- 로드밸런서 속성 -->
    </g-tab>
  </div>
</template>

<script>
import { VerticalTable, DashboardPanel } from '@sd-fe/cmp-core'
import SetResourceTargetGroupDetail from './SetResourceTargetGroupDetail.vue'
import { isEmpty } from 'lodash'

export default {
  name: 'SetResourceALBDetail',
  components: {
    VerticalTable,
    DashboardPanel,
    SetResourceTargetGroupDetail
  },
  async created () {
    // await this.getELBDetail()
  },
  methods: {
    // async getELBDetail (instanceId = this.$route.params.instanceId) {
    //   try {
    //     this.isGetELBDetail = true
    //     const response = await API.aws.getELBDetail(instanceId)
    //     if (response) {
    //     }

    //     console.log('@상세 정보: ', response)
    //   } catch (error) {
    //     console.error(error)
    //     // const message = (error.response?.data) ? error.response.data.message : error.message
    //     Object.keys(this.rowData).forEach((i) => { this.rowData[i] = null })
    //     this.isGetELBDetail = false
    //     throw error
    //   } finally {
    //     this.isGetELBDetail = false
    //   }
    // },
    setBreadcrumbs (label) {
      this.$store.commit('common/ADD_PARAMETERS', {
        label,
        path: ''
      })
    },
    /**
     * 탭 전환 이벤트
     */
    changeTab (tab) {
      // const field = tab.field
      // switch (field) {
      //   case 'accessPoint':
      //     this.getEBSInfo()
      //     break

      //   case 'security':
      //     this.getSecurityGroupInfo()
      //     break
      // }
    },
    isEmpty (value) {
      if (!value) return true
      return isEmpty(value)
    }
  },

  data: () => ({
    isGetELBDetail: false,

    rowData: {
      lbName: '로드밸런스_01',
      state: 'available',
      type: 'Application Load Balancer(L7)',
      schema: '내부용',
      vpcId: 'vpc-a18b5543cd12ef',
      dnsName: 'jhtest-nlb-8cc21dc22c072f54.elb.ap-northeast-2.amazonaws.com',
      apn: 'arn:aws:elasticloadbalancing:ap-northeast-2:614356117211:loadbalancer/net/jhtest-nlb/8cc21dc22c072f54',
      availabilityZone: 'ap-northeast-2a',
      argorithm: '라운드 로빈 (대상그룹1)',
      projectName: '신세계I&C - IDC사업팀 - CMP 프로젝트',
      appManageTeamName: '',
      appTaskUser: '',
      createDate: +new Date(),
      modifyDate: +new Date()
    },

    stateLabel: {
      error: {
        text: '오류',
        tag: 'error'
      },
      'in-use': {
        text: '실행 중',
        tag: 'using'
      },
      pending: {
        text: '대기',
        tag: 'pending'
      },
      creating: {
        text: '진행 중',
        tag: 'loading'
      },
      'in-use-optimizing': {
        text: '진행 중',
        tag: 'loading'
      },
      'available-modifying': {
        text: '진행 중',
        tag: 'loading'
      },
      available: {
        text: '사용 가능',
        tag: 'available'
      },
      stopped: {
        text: '정지',
        tag: 'stop'
      },
      deleting: {
        text: '삭제',
        tag: 'undefined'
      }
    },

    columns: [
      { binding: 'lbName', header: '로드밸런서 이름' },
      { binding: 'state', header: '상태' },
      { binding: 'type', header: '유형' },
      { binding: 'schema', header: '스키마' },
      { binding: 'vpcId', header: 'VPC ID' },
      { binding: 'dnsName', header: 'DNS 이름' },
      { binding: 'apn', header: 'APN' },
      { binding: 'availabilityZone', header: '가용영역(서브넷ID)' },
      { binding: 'argorithm', header: '알고리즘' },
      { binding: 'projectName', header: '프로젝트 위치' },
      // 22.04.25 [App 운영팀 / App 업무담당자 주석]
      // AWS 업무 운영담당자 기재 (사용자) 파트에 기획이 누락되었습니다.
      // 꼼꼼히 확인이 안되어 죄송합니다.
      // AWS 신청 자원의 경우 운영 담당자와 별개로 모든 역할의 사용자가 볼 수 있다.
      // 신청된 AWS 자원은 앱 담당자 지정항목도 없으므로, 관리자 쪽에 노출이 되지 않는다
      // { binding: 'appManageTeamName', header: 'App 운영팀', keyPath: 'common.GRID.NETWORK.appTeam' },
      // { binding: 'appTaskUser', header: 'APP 업무담당자', keyPath: 'common.REGCON.appManager' },
      { binding: 'createDate', header: '생성 시간' },
      { binding: 'modifyDate', header: '마지막 변경 시간' }
    ],

    // ========= 리스너
    listenerList: [{
      title: 'TCP : 80',
      defaultRule: 'Forward',
      targetGroup: 'target_1',
      securityRule: '',
      ssl: '',
      alpn: ''
    }],

    // ======== 타겟그룹
    targetGroups: [
      { field: 'target_1', name: 'Target group_1' }
    ],
    targetGroupStateCount: {
      total: 5,
      normal: 1,
      issue: 1,
      notUsing: 3,
      reset: 0,
      deleting: 0
    },

    // ======== 보안 정책 (임시)
    securityInfos: [{
      projectIdx: 123,
      groupId: 'sg-044e09c27d463140a',
      groupName: 'Bastion Host SG',
      description: 'Bastion Host Default SG',
      vpcId: 'vpc-04bfc65fbaea079f2',
      securityGroupRuleDtoList: [{
        projectIdx: 123,
        ruleId: 'sgr-018f0296e2d0d8a7d',
        groupId: 'sg-044e09c27d463140a',
        groupName: 'Bastion Host SG',
        ruleDescription: 'SSH Inbound Rule',
        isEgress: false,
        ruleType: 'SSH',
        fromPort: 22,
        toPort: 22,
        protocol: 'tcp',
        prefixListId: null,
        ipv4Ranges: '0.0.0.0/0',
        userGroupIdPairs: null,
        createDate: '2022-03-24T10:30:18',
        modifyDate: '2022-03-24T10:30:51'
      }, {
        projectIdx: 123,
        ruleId: 'sgr-0a6e6feb402806986',
        groupId: 'sg-044e09c27d463140a',
        groupName: 'Bastion Host SG',
        ruleDescription: null,
        isEgress: false,
        ruleType: '모든 트래픽',
        fromPort: -1,
        toPort: -1,
        protocol: '-1',
        prefixListId: null,
        ipv4Ranges: '0.0.0.0/0',
        userGroupIdPairs: null,
        createDate: '2022-03-24T10:30:17',
        modifyDate: '2022-03-24T10:30:51'
      }],
      createDate: '2022-03-24T10:30:18',
      modifyDate: '2022-03-24T10:30:51',
      inBounds: [{
        projectIdx: 123,
        ruleId: 'sgr-018f0296e2d0d8a7d',
        groupId: 'sg-044e09c27d463140a',
        groupName: 'Bastion Host SG',
        ruleDescription: 'SSH Inbound Rule',
        isEgress: false,
        ruleType: 'SSH',
        fromPort: 22,
        toPort: 22,
        protocol: 'tcp',
        prefixListId: null,
        ipv4Ranges: '0.0.0.0/0',
        userGroupIdPairs: null,
        createDate: '2022-03-24T10:30:18',
        modifyDate: '2022-03-24T10:30:51',
        id: 'sgr-018f0296e2d0d8a7d',
        title: 'SSH',
        desc: 'SSH Inbound Rule'
      }, {
        projectIdx: 123,
        ruleId: 'sgr-0a6e6feb402806986',
        groupId: 'sg-044e09c27d463140a',
        groupName: 'Bastion Host SG',
        ruleDescription: null,
        isEgress: false,
        ruleType: '모든 트래픽',
        fromPort: -1,
        toPort: -1,
        protocol: '-1',
        prefixListId: null,
        ipv4Ranges: '0.0.0.0/0',
        userGroupIdPairs: null,
        createDate: '2022-03-24T10:30:17',
        modifyDate: '2022-03-24T10:30:51',
        id: 'sgr-0a6e6feb402806986',
        title: '모든 트래픽',
        desc: null
      }],
      outBounds: []
    }],

    // ========= 로드밸런서 속성
    lbInfo: {
      preventRemove: false,
      interSectionLb: 'us-northeast--sa2',
      accessLog: false
    },
    lbInfoColumns: [
      { binding: 'preventRemove', header: '가용영역' },
      { binding: 'interSectionLb', header: '교차 영역 로드 밸런싱' },
      { binding: 'accessLog', header: '액세스 로그' }
    ]
  })
}
</script>

<style lang="scss" scoped>
  .tab-area { margin-top: 60px; }
  .state-list {
    display: flex;
    justify-content: center;
    margin-bottom: $gap;
    > li {
      display: flex;
      gap: 15px;
      padding: 0 50px;
      line-height: 20px;
      & + li {
        border-left: 2px solid $border2A;
      }
    }
    .state-title {
      &.normal { color: $sea-blue; }
      &.issue { color: $main-red; }
    }
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
.-network-policy {
  width: 100%;
  border-top: 1px solid $purple-gray;
  .register-contents {
    flex: 1 1 auto;
    // max-width: 470px !important;
  }
}
</style>
