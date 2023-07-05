<template>
  <div class="nutanix-alerts-wrapper">
    <div class="cluster-node-selection">
      <div class="set-option">
        <!-- 클러스터 -->
        <span class="tit">{{ $t('config.RACK.cluster') }}</span>
        <el-select
          v-model="selectedOpt.clusterUuid"
          @change="setClusterOpt"
        >
          <el-option
            v-for="option in clusterOptions"
            :key="option.uuid"
            :value="option.uuid"
            :label="option.label"
          />
        </el-select>
      </div>

      <div class="set-option">
        <!-- 노드 -->
        <span class="tit">{{ $t('main.DASHBOARD.node') }}</span>
        <el-select
          v-model="selectedOpt.hostUuid"
          @change="setNodeOpt"
        >
          <el-option
            v-for="option in nodeOptions"
            :key="option.uuid"
            :value="option.uuid"
            :label="option.label"
          />
        </el-select>
      </div>
    </div>
    <!-- /. 옵션 선택 영역 -->

    <div class="notice-wrap">
      <strong class="policy-notice">
        {{ $t('config.Alerts.noti') }}
        <!-- ※ Alert 보관 정책은 운영팀 내부 규칙에 의해서 결정될 예정입니다. -->
      </strong>
      <span class="standard-time">
        <!-- 기준시각 -->
        {{ $t('config.Alerts.standardTime') }} : {{ standardTime }}
        <i
          class="mdi mdi-refresh"
          @click="refreshAlert"
        />
      </span>
    </div>

    <div
      class="-contents"
      v-loading="loading"
    >
      <section class="panel-wrap">
        <alert-panel
          title="Alert"
          ref="panel1"
          :is-initial="initial"
          @severity="serAlertData"
        >
          <div class="panel-body">
            <draggable
              :list="alertDataList"
              :sort="false"
              handle=".drag-icon"
              class="list-group"
              group="alerts"
              v-bind="dragOptions"
              @start="dragging = true"
              @end="dragging = false"
            >
              <alert-contents
                v-for="(item, idx) in alertDataList"
                :key="'item_'+idx"
                :data="item"
                @click="showTicketDetail(item)"
              />
            </draggable>
          </div>
        </alert-panel>
        <!-- /. Alert -->

        <alert-panel
          title="Acknowledge"
          ref="panel2"
          :is-initial="initial"
          @severity="serAckData"
        >
          <div class="panel-body">
            <draggable
              :list="acknowledgeDataList"
              :move="blockBackStatus"
              :sort="false"
              handle=".drag-icon"
              class="list-group"
              group="alerts"
              v-bind="dragOptions"
              ghost-class="ghost"
              @start="dragging = true"
              @end="dragging = false"
              @add="moveToAcknowledge"
            >
              <alert-contents
                v-for="(item, idx) in acknowledgeDataList"
                :key="'item_'+idx"
                :data="item"
                @click="showTicketDetail(item)"
              />
            </draggable>
          </div>
        </alert-panel>
        <!-- /. Acknowledge -->

        <alert-panel
          title="Resolve"
          ref="panel3"
          :is-initial="initial"
          @severity="setResvData"
        >
          <div class="panel-body">
            <draggable
              :list="resolveDataList"
              :move="blockBackStatus"
              :sort="false"
              handle=".drag-icon"
              class="list-group"
              group="alerts"
              v-bind="dragOptions"
              @start="dragging = true"
              @end="dragging = false"
              @add="moveToResolve"
            >
              <alert-contents
                v-for="(item, idx) in resolveDataList"
                :key="'item_'+idx"
                :data="item"
                dark-mode
                @click="showTicketDetail(item)"
              />
            </draggable>
          </div>
        </alert-panel>
        <!-- /. Resolve -->
      </section>
      <!-- /. alert tickets -->

      <div
        class="error-block"
        v-if="errorBlock"
      >
        <p v-html="$t('config.Alerts.refreshAlert')" />
        <button class="refresh">
          <i class="mdi mdi-refresh" />
          {{ $t('config.Alerts.refresh') }}
          <!-- 새로고침 -->
        </button>
      </div>
      <!-- /. 오류 페이지 -->
    </div>

    <el-dialog
      :visible="ticketDetail.visible"
      :title="ticketDetail.title"
      width="880px"
      top="20vh"
      @close="hideTicketDetail"
    >
      <AlertContentsDetail
        :detail="ticketDetail"
        @close="hideTicketDetail"
        @acknowledge="updateAlertToAcknowledge"
        @resolve="updateAckToRsv"
      />
    </el-dialog>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import AlertContents from './AlertContents'
import AlertPanel from './AlertPanel'
import AlertContentsDetail from './AlertContentsDetail'
import API from '@sd-fe/cmp-core'
import Dayjs from 'dayjs'
import { mapState } from 'vuex'

export default {
  components: {
    AlertPanel,
    AlertContents,
    AlertContentsDetail,
    draggable
  },
  name: 'NutanixAlerts',
  mounted  () {
    this.setTotalData(['CRITICAL', 'WARNING'], this.selectedOpt)
    this.getClusterOptions()
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  methods: {
    /**
     * 전체 데이터가 모두 바뀔때 사용하는 메서드
     * 각 panel 의 critical / warning 을 기본값으로 만들어줍니다.
     * 참고 :: Cluster 와 hosts 가 개별로 가지는 alert 가 있을 수 있습니다. => 총 갯수가 다를 수 있음
     * @param {Object | undefined} severity critical / warning 상태 설정
     * @param {Object} opt 선택된 (클러스터 / 노드) 옵션
     */
    async setTotalData (severity, opt = this.selectedOpt) {
      // 초기화를 의도한 경우, API 가 두번 호출되지 않도록 설정합니다.
      this.initial = true

      // 외부에서 리프레시 인 경우 내부 패널들 severity 설정 (기본값 모두 true)
      if (!severity) {
        for (let i = 1; i <= 3; i++) {
          const panel = this.$refs[`panel${i}`]
          panel.critical = true
          panel.warning = true
        }
      }

      // 나중에 갯수 관련 이슈 - 느려짐 해결 필요! 🟡
      await this.serAlertData(severity, opt)
      await this.serAckData(severity, opt)
      await this.setResvData(severity, opt)

      this.initial = false
    },

    /**
     * Alert 데이터 설정
     * @param {Object | undefined} severity critical / warning 상태 설정
     * @param {Object} opt 선택된 (클러스터 / 노드) 옵션
     */
    async serAlertData (severity, opt = this.selectedOpt) {
      // console.log(severity, '==== Alert')
      const condition = { severityList: severity, ...opt, acknowledged: false, resolved: false }

      this.alertDataList = []
      const data = await this.getAlertCluster(condition)
      if (data) {
        const result = this.sortTicket(data, 'lastOccurrenceTimeStamp')
        this.alertDataList = result
      }
    },
    /**
     * Acknowledge 데이터 설정
     * @param {Object | undefined} severity critical / warning 상태 설정
     * @param {Object} opt 선택된 (클러스터 / 노드) 옵션
     */
    async serAckData (severity, opt = this.selectedOpt) {
      // console.log(severity, '==== Ack')
      const condition = { severityList: severity, ...opt, acknowledged: true, resolved: false }

      this.acknowledgeDataList = []
      const data = await this.getAlertCluster(condition)
      if (data) {
        const result = this.sortTicket(data, 'acknowledgedTimeStamp')
        this.acknowledgeDataList = result
      }
    },
    /**
     * Resolve 데이터 설정
     * @param {Object | undefined} severity critical / warning 상태 설정
     * @param {Object} opt 선택된 (클러스터 / 노드) 옵션
     */
    async setResvData (severity, opt = this.selectedOpt) {
      // console.log(severity, '==== Resv')
      const condition = { severityList: severity, ...opt, acknowledged: true, resolved: true }

      this.resolveDataList = []
      const data = await this.getAlertCluster(condition)
      if (data) {
        const result = this.sortTicket(data, 'resolvedTimeStamp')
        this.resolveDataList = result
      }
    },
    /**
     * alert 데이터를 불러옵니다.
     */
    async getAlertCluster (params) {
      try {
        this.loading = true
        // 기획서에선 Prism Central 인데, 문제가 있어 cluster 로 사용하게됨
        const response = await API.compute.getAlertCluster(params)
        this.standardTime = Dayjs(new Date()).format('YYYY.MM.DD HH:mm')

        if (response && response.length) {
          this.errorBlock = false

          // 전체 클러스터에서 모든 alert data 를 가져옴
          let data = []
          for (let i = 0; i < response.length; i++) {
            const resp = response[i]
            data = data.concat(resp.data)
          }
          return data
        }
      } catch (error) {
        console.error('@@ Alert - getAlertCluster : ', error)
        this.errorBlock = true
      } finally {
        this.loading = false
      }
    },

    // ================
    // ==== 업데이트 ====
    // ================

    /**
     * Acknowledge/Resolve => Alert 로 이동할 수 없도록 차단
     */
    blockBackStatus (event) {
      const groups = document.querySelectorAll('.list-group')
      const target = event.to
      const acknowledge = (event.from === groups[1]) && (target === groups[0])
      const resolve = (event.from === groups[2]) && (target === groups[0] || target === groups[1])

      if (acknowledge || resolve) return false
    },
    /**
     * 티켓을 [Alert > Acknowledge] 로 이동(추가)했을경우 발생하는 이벤트
     */
    async moveToAcknowledge (event) {
      const newIdx = event.newIndex
      const newTarget = this.acknowledgeDataList[newIdx]
      const { alertId, originatingClusterUuid, userInfo } = newTarget

      // console.log('To Ack', newTarget)
      const payload = { clusterUuid: originatingClusterUuid, alertId, userInfo }
      return this.updateAlertToAcknowledge(payload)
    },
    /**
     * 티켓을 [Acknowledge > Resolve] 로 이동(추가)했을경우 발생하는 이벤트
     */
    moveToResolve (event) {
      const newIdx = event.newIndex
      const newTarget = this.resolveDataList[newIdx]
      const { alertId, originatingClusterUuid } = newTarget

      // null 인 경우 ?? alert => resv 로 바로 이동하는경우
      const userInfo = newTarget.userInfo !== null ? newTarget.userInfo : {
        acknowledgeUserId: this.user.userId,
        acknowledgeUserName: this.user.userName,
        alertId,
        clusterUuid: originatingClusterUuid,
        resolveUserId: this.user.userId,
        resolveUserName: this.user.userName
      }

      // console.log('To Resolve', newTarget)
      const payload = { clusterUuid: originatingClusterUuid, alertId, userInfo }
      return this.updateAckToRsv(payload)
    },

    /**
     * [Alert > Acknowledge] 로 이동(추가)했을경우 저장
     * @param {Object} payload { clusterUuid, alertId, userInfo }
     */
    async updateAlertToAcknowledge ({ clusterUuid, alertId, userInfo }) {
      const param = { clusterUuid, alertId }

      // 업데이트한 사용자 정보
      const payload = {
        acknowledgeUserId: this.user.userId,
        acknowledgeUserName: this.user.userName,
        alertId,
        clusterUuid,
        resolveUserId: undefined,
        resolveUserName: undefined
      }

      try {
        // console.log(param, payload, '-----ack')
        const response = await API.compute.updateAlertToAcknowledge(param, payload)

        // alert-panel 에 설정된 조건에 맞게 데이터 세팅
        if (response.successful === true) return this.remainSeverityCondition()
      } catch (error) {
        console.error('@ Alert - updateAlertToAcknowledge: ', error)
      }
    },
    /**
     * [Acknowledge > Resolve] 로 이동(추가)했을경우 저장
     * @param {Object} payload { clusterUuid, alertId, userInfo }
     */
    async updateAckToRsv ({ clusterUuid, alertId, userInfo }) {
      const param = { clusterUuid, alertId }
      const { acknowledgeUserId, acknowledgeUserName } = userInfo

      // 업데이트한 사용자 정보
      const payload = {
        acknowledgeUserId,
        acknowledgeUserName,
        alertId,
        clusterUuid,
        resolveUserId: this.user.userId,
        resolveUserName: this.user.userName
      }

      try {
        // console.log(param, payload, '-----resolve')
        const response = await API.compute.updateAckToRsv(param, payload)

        // alert-panel 에 설정된 조건에 맞게 데이터 세팅
        if (response.successful === true) return this.remainSeverityCondition()
      } catch (error) {
        console.error('@ Alert - updateAckToRsv : ', error)
      }
    },
    remainSeverityCondition () {
      for (let i = 1; i <= 3; i++) {
        const panel = this.$refs[`panel${i}`]
        panel.emitSevereity()
      }
    },
    /**
     * Alert 상세 모달 팝업
     */
    showTicketDetail (item) {
      // console.log(item, '--- showTicket')
      this.ticketDetail = {
        visible: true,
        title: item?.alertTitle,
        data: item
      }
    },
    hideTicketDetail () {
      this.ticketDetail = {
        visible: false,
        title: undefined,
        data: null
      }
    },
    /**
     * [클러스터 / 노드 옵션] 설정
     */
    async getClusterOptions () {
      try {
        const response = await API.compute.getElementData()

        // 클러스터 옵션
        const clusterOptions = response.map(cls => {
          const { clusterName, clusterUuid, hosts } = cls

          // 노드 옵션
          const nodes = hosts.map(node => {
            const { hostUuid, nodeName } = node
            return { label: nodeName, uuid: hostUuid }
          })
          return { label: clusterName, uuid: clusterUuid, nodes }
        })

        this.clusterOptions = [...clusterOptions]
      } catch (error) {

      } finally {
      }
    },
    /**
     * cluster 옵션 선택시 발생하는 이벤트 > node 리스트 옵션 설정
     */
    setClusterOpt (clusterUuid) {
      const selectedCls = this.clusterOptions?.filter(cls => cls.uuid === clusterUuid)[0]
      this.nodeVal = undefined
      this.nodeOptions = selectedCls.nodes
      this.selectedOpt = { clusterUuid, hostUuid: undefined }
      return this.setTotalData(undefined, this.selectedOpt)
    },
    /**
     * Node 옵션 선택시 발생하는 이벤트
     */
    setNodeOpt (hostUuid) {
      this.selectedOpt = { ...this.selectedOpt, hostUuid }
      return this.setTotalData(undefined, this.selectedOpt)
    },
    /**
     * 기준시각 업데이트
     */
    refreshAlert () {
      this.selectedOpt = {}
      this.nodeOptions = []
      return this.setTotalData(undefined, this.selectedOpt)
    }
  },
  data () {
    return {
      loading: false,
      errorBlock: false,
      initial: false,
      standardTime: undefined,
      clusterOptions: [],
      nodeOptions: [],
      selectedOpt: {},
      alertDataList: [], // alert
      acknowledgeDataList: [], // acknowledge
      resolveDataList: [], // resolve
      dragging: false,
      dragOptions: {
        animation: 200,
        group: 'alerts',
        disabled: false,
        ghostClass: 'ghost'
      },
      ticketDetail: {
        visible: false,
        title: undefined,
        data: null
      },
      sortTicket (data, key) {
        const filterInfo = data.filter(item => item.severity !== 'kInfo')

        // 시간순으로 정렬
        const sortedData = filterInfo?.sort((a, b) => {
          const timeA = a[key]
          const timeB = b[key]
          if (timeA > timeB) return -1
          else if (timeA < timeB) return 1
          else return 0
        })

        const format = (date) => date ? Dayjs(new Date(date)).format('YY.MM.DD HH:mm') : undefined
        const options = (id) => this.$options.filters.maskingName(id)

        // date 형식 가공
        return sortedData?.map((item, idx) => {
          const {
            severity, lastOccurrenceTimeStamp,
            acknowledgedTimeStamp,
            resolvedTimeStamp,
            entityTypes,
            createdTimeStamp, userInfo,
            contextTypes, contextValues
          } = item

          let message = item.message
          let alertTitle = item.alertTitle
          contextTypes.forEach((type, index) => {
            const regex = new RegExp(type)
            if (regex.test(alertTitle)) alertTitle = alertTitle.replace('{' + type + '}', contextValues[index])
            if (regex.test(message)) message = message.replace('{' + type + '}', contextValues[index])
          })

          // 이름 세팅
          const setAckName = (name, id) => name + '(' + options(id) + ')'

          const result = {
            ...item,
            message,
            alertTitle,
            // _ :: 내부에서 사용한다는 의미
            _severity: severity.toLowerCase().replace('k', ''),
            _createdTime: format(createdTimeStamp),
            _lastOccuredTime: format(lastOccurrenceTimeStamp),
            _alertTime: format(lastOccurrenceTimeStamp), // Alert 티켓
            _ackTime: format(acknowledgedTimeStamp), // Acknowledge 티켓
            _reslvTime: format(resolvedTimeStamp), // Resolve 티켓
            _entityTypes: entityTypes.join(','), // 발생 위치
            _ackedUser: userInfo && userInfo.acknowledgeUserName ? setAckName(userInfo.acknowledgeUserName, userInfo.acknowledgeUserId) : '-', // CMP 내 수행 예정자 (이름)
            _reslvedUser: userInfo && userInfo.resolveUserName ? setAckName(userInfo.resolveUserName, userInfo.resolveUserId) : '-' // CMP 내 처리 완료자 (이름)
          }

          return result
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.nutanix-alerts-wrapper {
  .cluster-node-selection {
    display: flex;
    align-items: center;

    .set-option {
      display: flex;
      align-items: center;
      .tit {
        display: inline-block;
        margin-right: 12px;
      }
      .el-select {
        width: 210px;
        margin-right: 40px;
      }
    }
  }

  .notice-wrap {
    margin-top: 40px;
    .policy-notice {
      display: block;
      color: $main-red;
      font-size: 13px;
      line-height: 19px;
      font-weight: normal;
      margin-bottom: $gap-s;
    }

    .standard-time {
      color: $input-placeholder;
      font-size: 13px;
      display: flex;
      align-items: center;

      .mdi {
        cursor: pointer;
        display: inline-block;
        margin-left: 5px;
        transform: rotate(-90deg);
        transition: transform .5s ease;

        &:hover {
          transform: rotate(90deg);
        }
      }
    }
  }

  .-contents {
    position: relative;
    .panel-wrap {
      margin-top: 25px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      column-gap: $gap;
      box-sizing: border-box;

      .panel-body {
        height: inherit;
        padding: 0 $gap;
        margin: $gap $gap-s;
        height: 650px;
        box-sizing: border-box;
        overflow-y: auto;

        > div:last-child { margin: 0; }
      }
    }

    .error-block {
      position: absolute;
      width: 100%; height: 100%;
      top: 0; left: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;

      p {
        text-align: center;
        font-weight: bold;
        font-size: 22px;
        line-height: 34px;
      }

      .refresh {
        i {
          font-size: 13px;
          transform: rotate(-90deg);
          display: block;
          margin-right: 5px;
          font-weight: 300;
        }
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid $input-placeholder;
        background: none;
        width: 130px;
        height: 42px;
        line-height: 40px;
        color: $white;
        border-radius: $radius-s;
        margin-top: $gap-m;
        cursor: pointer;
      }
    }
  }

  .flip-list-move {
    transition: transform 0.5s;
  }

  .ghost {
    opacity: 0.5;
  }
  .list-group {
    min-height: 100%;
  }

}
</style>
