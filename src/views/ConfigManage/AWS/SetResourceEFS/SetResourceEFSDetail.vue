<!--
  * 파일명 : SetResourceEFSDetail.vue
  * 파일 기능 : 구성관리 > 자원관리 > EFS 자원 상세
  * 작성자 : 김예담
  * 최종 작성일 : 2022-04-06
  * License By Shinsegae I&C
 -->

<template>
  <div
    class="set-resource-efs-detail"
    v-loading="isGetEFSDetail"
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
        <template #isRegion="{ row }">
          {{ row.isRegion ? 'Region' : 'One Zone' }}&nbsp;{{ $v('모드') }}
        </template>
        <!-- 적용 범위 -->

        <template #availabilityZoneList>
          <ul
            v-if="rowData.efsMountTargetDtoList && rowData.efsMountTargetDtoList.length"
            style="height: auto"
          >
            <li
              v-for="zone in rowData.efsMountTargetDtoList"
              :key="zone.subnetId"
            >
              {{ zone.availabilityZone }}
            </li>
          </ul>
          <p v-else>
            -
          </p>
        </template>

        <template #performanceMode="{ row }">
          <span class="align-center-wrap">{{ performanceMode[row.performanceMode] || '-' }}</span>
        </template>
        <!-- 성능 모드  -->

        <template #throughputMode="{ row }">
          {{ throughputModeLabel[row.throughputMode] || '-' }}
        </template>
        <!-- 처리량 모드 -->

        <template #size>
          {{ ((rowData.size || 0) / 1024).toLocaleString() }} KiB
        </template>
        <!-- 전체 사용량 -->

        <template #sizeStandard>
          {{ ((rowData.sizeStandard || 0) / 1024).toLocaleString() }} KiB
        </template>
        <!-- 주 사용 용량 -->

        <template #sizeIa>
          {{ rowData.sizeIa }} GiB
        </template>
        <!-- IA 용량 -->

        <template #transitionToIa>
          <span v-if="!isEmpty(rowData.transitionToIa)">마지막 액세스로부터 {{ rowData.transitionToIa }}일 경과</span>
          <span v-else>{{ $v('없음') }}</span>
        </template>
        <!-- IA로 전환 -->

        <template #transitionToPrimaryStorageClass>
          <span v-if="!isEmpty(rowData.transitionToPrimaryStorageClass)">첫 액세스로부터 {{ rowData.transitionToPrimaryStorageClass }}일</span>
          <span v-else>{{ $v('없음') }}</span>
        </template>
        <!-- IA 외부로의 전환 -->

        <template #accessPointCnt>
          {{ rowData.accessPointCnt || 0 }}&nbsp;{{ $v('개') }}
        </template>
        <!-- 액세스 포인트 수 -->

        <template #projectInfo>
          <span v-if="rowData.companyName">{{ rowData.companyName }}</span>
          <span v-if="rowData.groupName">&nbsp;>&nbsp;{{ rowData.groupName }}</span>
          <span v-if="rowData.projectName">&nbsp;>&nbsp;{{ rowData.projectName }}</span>
        </template>
        <!-- 프로젝트 위치 -->

        <template #lifeCycleState>
          {{ stateLabel[rowData.lifeCycleState] ? stateLabel[rowData.lifeCycleState].text : '-' }}
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
        <!-- 마지막 변경 시간 -->
        <template #tagInfo>
          <resource-tag-select-edit
            :data="rowData"
            :read-only="false"
            service-type="EFS"
            module="AWS"
            :project-idx="rowData.projectIdx"
            resource-key="fileSystemId"
          />
        </template>
      </vertical-table>
    </dashboard-panel>
    <!-- 기본 정보 -->

    <g-tab
      class="tab-area"
      :data="[
        { field: 'accessPoint', name: $v('액세스 포인트')},
        { field: 'security', name: $v('보안 정책') }
      ]"
      :padding-top="20"
      @click="changeTab"
    >
      <template #accessPoint>
        <dashboard-panel
          v-if="accessPointData.length"
          :padding-top="0"
          :title="$v('루트 디바이스')"
          small-title
        >
          <cmp-grid
            :item-source="accessPointData"
            :columns="accessPointColumns"
          >
            <template #lifeCycleState="{ row }">
              {{ row.lifeCycleState === 'available' ? $v('사용 가능') : $v('사용 불가능') }}
            </template>
          </cmp-grid>
        </dashboard-panel>
        <div
          class="empty-zone"
          v-else
        >
          {{ $v('{info} 정보가 없습니다.', {info: $v('액세스 포인트')}) }}
        </div>
      </template>
      <!-- 액세스 포인트 -->

      <template #security>
        <dashboard-panel
          v-loading="isGetRegions"
          :title="$v('적용된 파일 시스템 정책')"
          foldable
          small-title
          :padding-top="0"
        >
          <vertical-table
            :columns="fileSystemColumns"
            :data="fileSystemInfo"
            type="horizontal"
            :title-width-px="300"
          >
            <span slot="rootAccess">{{ fileSystemInfo.rootAccess ? 'Allow' : 'Deny' }}</span>
            <span slot="anonymousAccess">{{ fileSystemInfo.anonymousAccess ? 'Allow' : 'Deny' }}</span>
            <span slot="readOnlyAccess">{{ fileSystemInfo.readOnlyAccess ? 'Allow' : 'Deny' }}</span>
            <span slot="allClientEncryption">{{ fileSystemInfo.allClientEncryption ? 'Allow' : 'Deny' }}</span>
          </vertical-table>
        </dashboard-panel>
        <!-- 적용된 파일 시스템 정책 -->

        <dashboard-panel
          style="margin-top: 20px;"
          :title="`${$v('네트워크')} ${$v('정책')}`"
          foldable
          small-title
          :padding-top="0"
        >
          <template #headerPostfix>
            <small class="reference-text">({{ $v('영역') }} <strong>{{ rowData.efsMountTargetDtoList.length }}</strong>{{ $v('개') }})</small>
          </template>

          <div
            v-for="target in rowData.efsMountTargetDtoList"
            :key="target.mountTargetId"
          >
            <dashboard-panel
              :title="target.availabilityZone"
              foldable
              small-title
            >
              <section class="policy-info-wrap">
                <div class="flex-wrap -network-policy">
                  <register-contents
                    v-for="(col, idx) in networkPolicyColumns"
                    :key="idx"
                    :title="$t(col.keyPath) || col.header"
                  >
                    {{ target[col.binding] }}
                  </register-contents>
                </div>

                <dashboard-panel
                  :padding-top="0"
                  title=""
                  small-title
                >
                  <article
                    class="security-article"
                    v-for="security in target.securityInfos"
                    :key="security.id"
                    v-loading="isGetSecurityGroupDetail"
                  >
                    <h5>
                      <span class="security-article-title">
                        {{ `${$v('보안 그룹')} ID: ${security.groupId}` }}
                      </span>
                    </h5>

                    <dashboard-panel
                      :title="$v('인바운드 규칙')"
                      foldable
                      small-title
                    >
                      <template #headerPostfix>
                        <small
                          class="reference-text"
                          v-html="$v('총 <strong>{n}</strong>건', {n: security.inBounds ? security.inBounds.length : 0})"
                        />
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
                          <!-- <template #body="props">
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
                          </template> -->
                        </bound-card>
                      </ul>
                    </dashboard-panel>

                    <dashboard-panel
                      style="margin-top: 10px;"
                      :title="$v('아웃바운드 규칙')"
                      foldable
                      small-title
                    >
                      <template #headerPostfix>
                        <small
                          class="reference-text"
                          v-html="$v('총 <strong>{n}</strong>건', {n: security.outBounds ? security.outBounds.length : 0})"
                        />
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
              </section>
            </dashboard-panel>
          </div>
        </dashboard-panel>
        <!-- 네트워크 정책 -->
      </template>
      <!-- 보안 그룹 정보 -->
    </g-tab>
  </div>
</template>

<script>
import API, { ResourceTagSelectEdit, VerticalTable, DashboardPanel } from '@sd-fe/cmp-core'
import { isEmpty } from 'lodash'

export default {
  name: 'SetResourceEFSDetail',
  components: {
    ResourceTagSelectEdit,
    VerticalTable,
    DashboardPanel
  },
  async created () {
    await this.getEFSDetail()
    // await this.getRegionsPriorities() // 리전 조회
  },
  methods: {
    /**
     * API: EFS 상세 조회
     * @param {String} fileSystemId
     */
    async getEFSDetail (fileSystemId = this.$route.params.fileSystemId) {
      try {
        this.isGetEFSDetail = true
        const { data: response } = await API.aws.getEFSDetailAdm(fileSystemId)
        if (response) {
          this.rowData = await this.setEFSInfo(response)
          this.setBreadcrumbs(response.fileSystemName)
        }
      } catch (error) {
        console.error(error)
        // const message = (error.response?.data) ? error.response.data.message : error.message
        Object.keys(this.rowData).forEach((i) => { this.rowData[i] = null })
        this.isGetEFSDetail = false
        throw error
      } finally {
        this.isGetEFSDetail = false
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

        this.regionList = [...data]
      } catch (error) {
        console.error(error)
        this.regionList = []
        throw error
      } finally {
        this.isGetRegions = false
      }
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
     * # 보안그룹 정보 조회
     */
    async getSecurityGroupDetail (groupId) {
      try {
        this.isGetSecurityGroupDetail = true
        const response = await API.aws.getDetailSecurityGroup(groupId)
        if (!response?.data) return

        const rules = response.data?.securityGroupRuleDtoList?.map(rule => {
          return {
            ...rule,
            id: rule.ruleId,
            title: rule.ruleType,
            desc: rule.ruleDescription,
            isEgress: rule.isEgress
          }
        })

        const data = {
          ...response.data,
          inBounds: rules.filter(item => !item.isEgress),
          outBounds: rules.filter(item => item.isEgress)
        }
        return data
      } catch (error) {
        console.error(error)
        this.isGetSecurityGroupDetail = false
        throw error
      } finally {
        this.isGetSecurityGroupDetail = false
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
     * EFS 상세 데이터 세팅
     */
    async setEFSInfo (efsInfo) {
      const data = { ...efsInfo }
      // 프로젝트 정보
      if (data.projectIdx) {
        const projectInfo = await this.getProject(data.projectIdx)

        data.companyName = projectInfo?.length ? projectInfo[0]?.companyName : ''
        data.groupName = projectInfo?.length ? projectInfo[0]?.groupName : ''
        data.projectName = projectInfo?.length ? projectInfo[0]?.projectName : ''
      }

      // 액세스 포인트 수
      data.accessPointCnt = data.accessPoints ? data.accessPoints.length : 0

      if (data.accessPoints) this.accessPointData = data.accessPoints

      // 파일 시스템 정책
      if (data.policy) {
        const policyData = JSON.parse(data.policy)

        if (policyData.Statement?.length) {
          const action = policyData?.Statement[0]?.Action
          const secureTransport = policyData?.Statement[1]?.Condition?.Bool['aws:SecureTransport'] === false

          this.fileSystemInfo = {
            rootAccess: !action?.includes('elasticfilesystem:ClientRootAccess'),
            anonymousAccess: !action?.includes('elasticfilesystem:ClientWrite'),
            readOnlyAccess: !action?.includes('elasticfilesystem:ClientMount'),
            allClientEncryption: !!secureTransport
          }
        }
      }

      // 파일 시스템 정책 참고
      // * elasticfilesystem:ClientMount => 읽기 전용 액세스 제공
      // * elasticfilesystem:ClientWrite => 쓰기 권한 제공
      // * elasticfilesystem:ClientRootAccess => 루트 사용자의 사용을 제공

      // 1. 루트 액세스 금지 => Statement[0] > Action > elasticfilesystem:ClientRootAccess가 없음
      // 2. 읽기 전용 액세스 적용 => Statement[0] > Action > elasticfilesystem:ClientWrite 없음
      // 3. 익명 액세스 금지 => Statement[0] > Action > elasticfilesystem:ClientMount 없음
      // 4. 모든 클라이언트에 대해 전송 중 암호화 적용 => Statement[1] > Condition > Boole['aws.SecureTransport'] = false

      return data
    },
    /**
     * 탭 전환 이벤트
     */
    async changeTab (tab) {
      const field = tab.field
      if (field === 'accessPoint') return

      const setTargetGroupPromise = this.rowData.efsMountTargetDtoList.map(async instance => {
        const sgInfoPromise = instance.securityGroupIdsJson.map(async (id) => {
          return {
            ...await this.getSecurityGroupDetail(id)
          }
        })

        return {
          ...instance,
          securityInfos: await Promise.all(sgInfoPromise)
        }
      })

      this.rowData.efsMountTargetDtoList = await Promise.all(setTargetGroupPromise)
    },
    isEmpty (value) {
      if (!value) return true
      return isEmpty(value)
    }
  },

  data: (root) => ({
    isGetEFSDetail: false,
    isGetProjectInfo: false,
    isGetRegions: false,
    isGetSecurityGroupDetail: false,

    networkPolicy: {},
    regionList: [], // 리전 목록

    rowData: {
      fileSystemId: '',
      fileSystemName: '',
      isRegion: '',
      vpcId: '',
      regionName: '',
      performanceMode: '',
      throughputMode: '',
      activeMonitoring: '',
      size: '',
      sizeStandard: '',
      sizeIa: '',
      transitionToIa: '',
      transitionToPrimaryStorageClass: '',
      accessPointCnt: '',
      projectName: '',
      state: '',
      appManageTeamName: '',
      appTaskUser: '',
      createTime: '',
      modifyTime: '',
      efsMountTargetDtoList: []
    },
    stateLabel: {
      error: {
        text: root.$v('오류'),
        tag: 'error'
      },
      'in-use': {
        text: root.$v('실행 중'),
        tag: 'using'
      },
      undefined: {
        text: root.$v('실행 중'),
        tag: 'using'
      },
      pending: {
        text: root.$v('대기'),
        tag: 'pending'
      },
      creating: {
        text: root.$v('진행 중'),
        tag: 'loading'
      },
      'in-use-optimizing': {
        text: root.$v('진행 중'),
        tag: 'loading'
      },
      'available-modifying': {
        text: root.$v('진행 중'),
        tag: 'loading'
      },
      available: {
        text: root.$v('사용 가능'),
        tag: 'available'
      },
      stopped: {
        text: root.$v('정지'),
        tag: 'stop'
      },
      deleting: {
        text: root.$v('삭제'),
        tag: 'undefined'
      }
    },
    performanceMode: { // 성능 모드
      generalPurpose: root.$v('범용 모드'),
      maxIO: root.$v('최대 I/O 모드')
    },
    throughputModeLabel: { // 처리량 모드
      bursting: root.$v('버스트 모드'),
      provisioning: root.$v('프로비저닝')
    },

    columns: [
      { binding: 'fileSystemId', header: 'EFS ID' }, //
      { binding: 'fileSystemName', header: `EFS ${root.$v('이름')}` }, //
      { binding: 'isRegion', header: root.$v('적용 범위') }, //
      { binding: 'vpcId', header: root.$v('연결된 VPC ID') }, //
      { binding: 'availabilityZoneList', header: root.$v('선택된 가용영역') },
      { binding: 'performanceMode', header: root.$v('성능 모드') }, //
      { binding: 'throughputMode', header: root.$v('처리량 모드') }, //
      // 22.04.26 [세부 모니터링 주석] : 지원하지 않는 기능
      // { binding: 'activeMonitoring', header: root.$v('세부 모니터링') },
      { binding: 'size', header: `${root.$v('전체')} ${root.$v('사용량')}` }, //
      { binding: 'sizeStandard', header: root.$v('주 사용 용량') }, //
      { binding: 'sizeIa', header: `IA ${root.$v('용량')}` }, //
      { binding: 'transitionToIa', header: root.$v('IA로 전환') },
      { binding: 'transitionToPrimaryStorageClass', header: root.$v('IA 외부로 전환') },
      { binding: 'accessPointCnt', header: root.$v('엑세스 포인트 수') },
      { binding: 'projectInfo', header: root.$v('프로젝트 위치') },
      { binding: 'lifeCycleState', header: root.$v('상태') }, //
      // 22.04.25 [App 운영팀 / App 업무담당자 주석]
      // AWS 업무 운영담당자 기재 (사용자) 파트에 기획이 누락되었습니다.
      // 꼼꼼히 확인이 안되어 죄송합니다.
      // AWS 신청 자원의 경우 운영 담당자와 별개로 모든 역할의 사용자가 볼 수 있다.
      // 신청된 AWS 자원은 앱 담당자 지정항목도 없으므로, 관리자 쪽에 노출이 되지 않는다
      // { binding: 'appManageTeamName', header: root.$v('App 운영팀', keyPath: 'common.GRID.NETWORK.appTeam' },
      // { binding: 'appTaskUser', header: root.$v('APP 업무담당자', keyPath: 'common.REGCON.appManager' },
      { binding: 'createTime', header: root.$v('생성 시간') },
      { binding: 'modifyTime', header: root.$v('마지막 변경 시간'), colspan: true },
      { binding: 'tagInfo', header: root.$v('자원 태그'), colspan: true }
    ],

    // ======== 액세스 포인트
    accessPointData: [],
    accessPointColumns: [
      { binding: 'name', header: root.$v('이름') },
      { binding: 'accessPointId', header: 'Access Point ID' },
      { binding: 'rootDirectory.path', header: root.$v('경로') },
      { binding: 'lifeCycleState', header: root.$v('상태'), customHtml: true }
    ],

    // ======== 보안 정책 (임시)
    securityInfos: [],

    // 적용된 파일 시스템 정책
    fileSystemColumns: [
      { binding: 'rootAccess', header: root.$v('기본적으로 루트 액세스 금지') },
      { binding: 'anonymousAccess', header: root.$v('익명 액세스 금지') },
      { binding: 'readOnlyAccess', header: root.$v('기본적으로 읽기 전용 액세스 제공') },
      { binding: 'allClientEncryption', header: root.$v('모든 클라이언트에 대해 전송 중 암호화 적용') }
    ],
    fileSystemInfo: {
      rootAccess: false,
      anonymousAccess: false,
      readOnlyAccess: false,
      allClientEncryption: false
    },

    // 네트워크 정책
    networkPolicyInfo: {
      name: 'us-northeast--sa2',
      availabilityZone: 'us-northeast--sa2',
      subnetId: 'sub-1a594eb15c89794f',
      ip: '10.123.3.15'
    },
    networkPolicyColumns: [
      { binding: 'availabilityZone', header: root.$v('가용영역') },
      { binding: 'subnetId', header: `${root.$v('서브넷')} ID` },
      { binding: 'ipAddress', header: 'IP' }
    ]

  })
}
</script>

<style lang="scss" scoped>
  .tab-area { margin-top: 60px; }
  .security-article {
    margin-top: $gap-m;
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
  .policy-info-wrap { padding: 0 $gap; }
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
