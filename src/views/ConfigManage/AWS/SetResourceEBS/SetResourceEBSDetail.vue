<!--
  * 파일명 : SetResourceEbsDetail.vue
  * 파일 기능 : 구성관리 > 자원관리 > EBS 자원 상세
  * 작성자 : 김예담
  * 최종 작성일 : 2022-01-10
  * License By Shinsegae I&C
 -->

<template>
  <div
    class="set-resource-ebs-detail"
    v-loading="loading.isGetEBSDetail"
  >
    <vertical-table
      :columns="columns"
      :data="rowData"
      type="horizontal"
    >
      <template #size>
        {{ rowData.size }} GB
      </template>

      <template #iops>
        {{ rowData.iops }}
      </template>
      <!-- IOPS -->

      <template #deleteTermination>
        <span v-if="typeof rowData.deleteTermination === 'boolean'">
          {{ String(rowData.deleteTermination).replace(/^./, str => str.toUpperCase()) }}
        </span>
        <span v-else>False</span>
      </template>
      <!-- 종료시 삭제 -->

      <template #ioState>
        {{ stateLabel[rowData.state] ? stateLabel[rowData.state].text : '-' }}
      </template>
      <!-- I/O상태 -->

      <template #autoEnabledIO>
        {{ rowData.autoEnabledIO ? $v('활성화') : $v('비활성화') }}
      </template>
      <!-- 자동 활성화된 I/O-->

      <template #volumeStatus>
        {{ rowData.volumeStatus && rowData.volumeStatus.status === 'ok' ? $v('정상') : $v('비정상') }}
      </template>
      <!-- 볼륨 상태-->

      <template #projectInfo>
        <span v-if="rowData.companyName">{{ rowData.companyName }}</span>
        <span v-if="rowData.groupName">&nbsp;>&nbsp;{{ rowData.groupName }}</span>
        <span v-if="rowData.projectName">&nbsp;>&nbsp;{{ rowData.projectName }}</span>
      </template>
      <!-- 프로젝트 위치 -->

      <template #createTime>
        <span v-if="rowData.createTime">{{ rowData.createTime | date }}</span>
        <span v-else>-</span>
      </template>

      <template #modifyTime>
        <span v-if="rowData.modifyTime">{{ rowData.modifyTime | date }}</span>
        <span v-else>-</span>
      </template>
    </vertical-table>

    <g-tab
      class="monitoring-tab"
      :data="[
        { field: 'monitoring', name: `${$v('모니터링')} ${$v('정보')}` },
      ]"
      :padding-top="20"
    >
      <template #monitoring>
        <ebs-monitoring
          v-if="rowData.projectIdx"
          :volume-id="$route.params.volumeId"
          :project-id="rowData.projectIdx"
        />
      </template>
    </g-tab>
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import ResourceMonitoring from '../ResourceMonitoring/EBSMonitoring'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'SetResourceEBSDetail',
  components: {
    'ebs-monitoring': ResourceMonitoring
  },
  async created () {
    await this.getProjectByCloudType() // 프로젝트 조회
    await this.getEBSDetail()
    this.setBreadCrumbs()
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
    async getEBSDetail (volumeId = this.$route.params.volumeId) {
      try {
        this.loading.isGetEBSDetail = true
        const response = await API.aws.getEBSDetail(volumeId)
        if (response) {
          const projectInfo = this.getProject(response?.projectIdx)
          this.rowData = {
            ...response,
            companyName: projectInfo?.companyName,
            groupName: projectInfo?.groupName,
            projectName: projectInfo?.projectName
          }
        }
        // console.log('@상세 정보: ', response)
      } catch (error) {
        console.error(error)
        Object.keys(this.rowData).forEach((i) => { this.rowData[i] = null })
        this.loading.isGetEBSDetail = false
        throw error
      } finally {
        this.loading.isGetEBSDetail = false
      }
    },
    /**
     * EBS ID를 Breadcrumbs에 추가합니다.
     */
    setBreadCrumbs (data = this.rowData) {
      if (!data) return
      this.$store.commit('common/ADD_PARAMETERS', {
        label: data.volumeId,
        path: ''
      })
    }
  },
  data: (root) => ({
    loading: {
      isGetEBSDetail: false
    },
    rowData: {
      volumeId: '',
      volumeNic: '',
      size: '',
      type: '',
      available: '',
      iops: '',
      instance: '',
      delete: '',
      ioState: '',
      activeIo: '',
      state: '',
      ioUpdateDate: 0,
      projectInfo: '',
      createTime: 0,
      updateTime: 0
    },
    columns: [
      { binding: 'volumeId', header: `${root.$v('볼륨')}ID` },
      // { binding: 'volumeNic', header: '볼륨 별칭' },
      { binding: 'size', header: root.$v('크기') },
      { binding: 'volumeType', header: root.$v('볼륨 유형') },
      { binding: 'availabilityZone', header: root.$v('가용영역') },
      { binding: 'iops', header: 'IOPS' },
      { binding: 'attachedInstanceId', header: root.$v('연결된 인스턴스') },
      { binding: 'deleteTermination', header: root.$v('종료시 삭제') },
      { binding: 'ioState', header: root.$v('I/O상태') },
      { binding: 'autoEnabledIO', header: root.$v('자동 활성화된 I/O') },
      { binding: 'volumeStatus', header: root.$v('볼륨 상태') },
      { binding: 'ioUpdateDate', header: root.$v('I/O 상태 업데이트 날짜') },
      // 22.04.25 [App 운영팀 / App 업무담당자 주석]
      // AWS 업무 운영담당자 기재 (사용자) 파트에 기획이 누락되었습니다.
      // 꼼꼼히 확인이 안되어 죄송합니다.
      // AWS 신청 자원의 경우 운영 담당자와 별개로 모든 역할의 사용자가 볼 수 있다.
      // 신청된 AWS 자원은 앱 담당자 지정항목도 없으므로, 관리자 쪽에 노출이 되지 않는다
      // { binding: 'appManageTeam', header: 'APP운영팀' },
      // { binding: 'appTaskUsers', header: 'APP운영담당자' },
      { binding: 'projectInfo', header: root.$v('프로젝트 위치') },
      { binding: 'createTime', header: root.$v('생성일') },
      { binding: 'modifyTime', header: root.$v('마지막 변경 시간') }
    ],

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
    }
  })
}
</script>

<style lang="scss" scoped>
  .monitoring-tab { margin-top: 60px; }
</style>
