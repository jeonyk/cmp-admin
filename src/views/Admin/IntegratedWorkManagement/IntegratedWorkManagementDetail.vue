<template>
  <div class="workflow-detail-wrapper">
    <set-workflow-default-info
      :data="configs"
      @save="saveConfig"
    />
    <!-- /. 공통 설정 -->

    <section class="workflow-detail">
      <article>
        <h2>{{ $v('서비스 정보') }}</h2>
        <div class="workflow-set-service">
          <div class="-scroll">
            <g-tree
              view-line
              :data="treeData"
              :selectable-all-item="false"
              @selected="selectedService"
            />
          </div>
        </div>
      </article>
      <!-- /. 서비스 정보 -->

      <i class="el-icon-d-arrow-right arrow" />

      <article>
        <h2>{{ $v('프로세스') }}</h2>
        <div class="workflow-set-flow">
          <set-work-flow-process
            v-loading="loading"
            :service="currentSVC"
            :process-items="processItems"
            @curr-process="setProcess"
          />
        </div>
      </article>
      <!-- /. 프로세스 -->

      <i class="el-icon-d-arrow-right arrow" />

      <article>
        <h2>{{ process ? process.title : $v('계획 : ') }}</h2>
        <div class="workflow-flow-detail">
          <set-work-flow-content
            v-loading="loading"
            :data="flowContents"
            @values="values => plans = values"
            @save="selectedService(service, true)"
          />
        </div>
      </article>
      <!-- /. 계획 -->
    </section>
  </div>
</template>

<script>

import API, { GTree } from '@sd-fe/cmp-core'
import SetWorkFlowContent from './SetWorkFlowContent/SetWorkFlowContent.vue'
import SetWorkFlowDefaultInfo from './SetWorkFlowContent/SetWorkFlowDefaultInfo.vue'
import SetWorkFlowProcess from './SetWorkFlowContent/SetWorkFlowProcess.vue'
import Mixins from './Mixins.script'

export default {
  name: 'IntegratedWorkManagementDetail',
  components: {
    'g-tree': GTree,
    'set-workflow-default-info': SetWorkFlowDefaultInfo,
    'set-work-flow-process': SetWorkFlowProcess,
    'set-work-flow-content': SetWorkFlowContent
  },
  mixins: [Mixins],
  created () {
    this.getWorkConfigs()
  },
  methods: {

    // =========================
    // ======== 공통 설정 ========
    // =========================

    /**
     * [공통설정] 저장된 설정 불러오기 및 저장
     */
    async getWorkConfigs () {
      try {
        const response = await API.work_v3.getWorkConfigs()
        this.configs = response
      } catch (error) {
        console.error('IntegratedWorkManagementDetail > getWorkConfigs', error)
      }
    },

    /**
     * [공통설정] 저장
     * @param {Object} config
     */
    async saveConfig (config) {
      try {
        // console.log(config)
        await API.work_v3.updateWorkConfigs(config)
        this.$alert(this.$t('common.ALERT.BASE.049'))
        this.getWorkConfigs() // [재호출]
      } catch (error) {
        console.error('IntegratedWorkManagementDetail > saveConfig', error)
      }
    },

    // ========================================
    // ======== 서비스정보 / 프로세스 / 계획 ========
    // ========================================

    /**
     * [서비스 정보] 선택시 발생하는 이벤트
     * 파라미터러 보낼 workflowId 가공하는 메서드
     * 워크 플로우 상세정보를 조회합니다.
     *
     *  - workflowId 형식 :: [Cloud.Type][OrderType]-[WorkflowStep]-[roleIdx]
     *  - Cloud.Type :: +, - (public, private)
     *  - OrderType :: NEW, CHANGE, DELETE, URGENT;
     *  - WorkflowStep :: REVIEW, APPROVAL1(사전협의 결재), TODO, APPROVAL2(할일, 결재), DONE
     *  - roleIdx :: number
     *  - (Ex. +new-review-10, -delete-approval2-13)
     *
     * @param {Object} service 선택한 [서비스 정보] 데이터
     * @param {Boolean} refresh 워크플로우 [저장] 시에 true
     * @return {Function}
     */
    async selectedService (service, refresh = false) {
      const { field: roleIdx, parentNode } = service

      if (!parentNode.parentNode) return

      const cloudType = { public: '+', private: '-' }[parentNode.parentNode.field]
      const orderType = parentNode.field

      // Tree 에서 [선택] 이벤트가 발생할때만 중복선택 체크 (API 여러번 호출하지 않도록)
      if (!refresh) {
        // 현재 어떤 서비스를 보고있는지 확인 ex) service_+new-1
        const currentSVC = `service_${cloudType}${orderType}-${roleIdx}`
        if (this.currentSVC === currentSVC) return // 같은 서비스 클릭시 return

        // 현재 저장된 서비스와 다른 경우만 저장
        this.currentSVC = currentSVC
        this.service = service
      }

      // ----
      // ----
      // ----

      // [긴급] 인 경우 확인
      const isUrgent = /urgent/g.test(this.service.parentNode?.field)
      const items = isUrgent ? this.rawProcessItems.filter(item => !/TODO|APPROVAL2/g.test(item.key)) : this.rawProcessItems

      const rawProcessItems = await this.setProcessContents(items, { roleIdx, cloudType, orderType })
      this.processItems = this.setProcessItems(rawProcessItems, isUrgent)
    },

    /**
     * [긴급/일반] 에 따라 호출하는 API 개수가 다르므로
     * 호출 메서드를 따로 분류했음
     * @param {Array} items
     * @param {Object} 정보
     * @return {Array} 가공한 contents 를 포함한 rawProcessItems 복사본
     */
    async setProcessContents (items, { roleIdx, cloudType, orderType }) {
      const result = JSON.parse(JSON.stringify(items))

      // [프로세스] 를 모두 가져오면 [계획] 표시 (loading 시작)
      this.loading = true
      let count = 0

      // [프로세스] 정보 전체 가져오기 (API 여러번 호출)
      for (let i = 0; i < result.length; i++) {
        const workflowStep = result[i].key.toLowerCase()
        const workflowId = `${cloudType}${orderType}-${workflowStep}-${roleIdx}`

        // [한일] 은 조회하면 에러가 나므로 따로 제외
        const doneContents = { workflowId: { workflowStep: 'DONE', roleIdx }, id: workflowId }

        const contents = (workflowStep === 'done') ? doneContents : await this.getWorkflowId(workflowId)
        if (contents) count += 1
        result[i].contents = contents
      }
      // console.log(count, result)

      // [프로세스] 을 모두 가져와서 loading 끝
      if (count === result.length) this.loading = false

      return result
    },

    /**
     * workflow 프로세스 상세 정보 호출
     * @param {String} workflowId
     */
    async getWorkflowId (workflowId) {
      try {
        const response = await API.work_v3.getWorkflowId(workflowId)
        return response
      } catch (error) {
        console.error('@@ getWorkflowId', error)
        return []
      }
    },

    /**
     * [프로세스] 목록의 조건에 맞춰 데이터를 가공합니다
     * @param {Object} items rawProcessItems 복제본
     * @param {Boolean} isUrgent isUrgent
     * @return {Array} processItems
     */
    setProcessItems (items, isUrgent) {
      const processItems = JSON.parse(JSON.stringify(items))

      // useApproval === true ? 결재사용 ON : OFF
      const setDisable = (index) => {
        const { useApproval } = processItems[index]?.contents
        return !useApproval
      }

      // [사전협의 > 결재 사용 설정] ON/OFF 에 따라, [결재1] 활성화/비활성화 결정
      processItems[1].disabled = setDisable(0)

      // [일반] 인 경우만 (할일 > 결재사용여부) 세팅
      // [할일 > 결재 사용 설정] ON/OFF 에 따라, [결재2] 활성화/비활성화 결정
      if (!isUrgent) processItems[3].disabled = setDisable(2)

      return processItems
    },

    /**
     * [프로세스] 선택 이벤트
     * @param {Object} process
     */
    setProcess (process) {
      if (!process) return
      this.process = process
      this.flowContents = JSON.parse(JSON.stringify(process.contents))
    }
  },
  data: () => ({
    loading: false,
    configs: null, // 공통 설정 데이터 저장
    currentSVC: undefined, // [서비스정보] 선택한 서비스 (String)
    service: null, // [서비스정보] 선택한 서비스 (Object)
    process: null, // 현재 보고있는 [프로세스]
    processItems: [], // [프로세스] 목록
    flowContents: null, // workflow [계획] 영역
    plans: null, // [계획] 에서 설정된 내용 확인
    rawProcessItems: [ // [프로세스] 영역 default 목록 (고정 값 - 하드코딩)
      {
        label: '사전협의',
        title: '계획 : 사전협의',
        key: 'REVIEW',
        disabled: false
      },
      {
        label: '결재',
        title: '계획 : 결재 (사전협의)',
        key: 'APPROVAL1',
        disabled: false
      },
      {
        label: '할 일',
        title: '계획 : 할 일',
        key: 'TODO',
        disabled: false
      },
      {
        label: '결재',
        title: '계획 : 결재 (할 일)',
        key: 'APPROVAL2',
        disabled: false
      },
      {
        label: '한 일',
        title: '계획 : 한일',
        key: 'DONE',
        disabled: false

      }
    ]
  })
}</script>

<style lang="scss" scoped>
.workflow-detail {
  &-wrapper { position: relative; }

  margin-top: 80px;
  display: grid;
  grid-template-columns: 380px 55px 260px 55px auto;
  grid-template-rows: 570px;
  h2 {
    color: $white;
    font-size: 16px;
    margin-bottom: 20px;
  }

  .workflow {
    &-set-service {
      box-sizing: border-box;
      height: 530px;
      background-color: $dark-navy;
      border-radius: $radius-m;
      padding: $gap-s $gap;

      .-scroll {
        overflow-y: auto;
        // height: calc(100% - 30px);
        height: 100%;
      }
    }

    &-set-flow {
      height: 530px;
      background-color: $dark-navy;
      border-radius: $radius-m;
    }

    &-flow-detail {
      height: 530px;
    }
  }

  .arrow {
    padding-top: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
