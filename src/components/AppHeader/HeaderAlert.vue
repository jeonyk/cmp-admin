<template>
  <div class="alert-area">
    <!-- 패키지 타입 확인 :: {{ packageType }} -->

    <i
      v-if="isPrivate"
      :class="['image -computer', { '-empty': unregisteredCnt === 0 }]"
      slot="reference"
      @click="moveTo({ name: 'set-project-resource-operation' }, 'system_alert')"
    >
      <strong
        v-if="unregisteredCnt > 0"
        :class="['tag', { '-over': unregisteredCnt > 99 }]"
      >{{ unregisteredCnt > 99 ? '99+' : unregisteredCnt }}</strong>
    </i>
    <!-- /. 미등록 자원 (컴퓨터 아이콘) -->

    <el-popover
      placement="bottom"
      width="200"
      trigger="click"
      popper-class="header-alert-popper"
      ref="work_alert"
      v-if="packageType !== 'PL'"
      @show="e => isPrivate ? getTaskTodoList() : null"
    >
      <i
        :class="['image -bag', { '-empty': !dataLen(alertData) }]"
        slot="reference"
      >
        <strong
          v-if="dataLen(workData)"
          :class="['tag', { '-over': workData.length > 99 }]"
        >{{ dataLen(workData) }}</strong>
      </i>

      <template>
        <div
          class="alert-contents"
          v-loading="workLoading"
        >
          <error-loaded
            :view="workError"
            @refresh="getTaskTodoList"
          />

          <cmp-grid
            :item-source="workData"
            :init-custom-action="init"
            :columns="workColumns"
            :use-column-filter="false"
            paging-type="list"
            :height="450"
          >
            <template #approvalCreateTime="props">
              {{ props.row.approvalCreateTime | date('YY.MM.DD HH:mm') }}
            </template>
            <template #taskDataStatus="props">
              <span class="task-status">
                {{ props.row.taskDataStatus === 'ERROR' ? $t('common.fail'): '-' }}
              </span>
            </template>
            <template #route="props">
              <i
                class="route-to"
                @click="clickTask(props)"
              />
            </template>
          </cmp-grid>

          <a
            class="-more-btn"
            @click="more({ name: 'task-todo' }, 'work_alert')"
          >
            <!-- 더보기 -->
            {{ $t('main.DASHBOARD.more') }}
          </a>
        </div>
      </template>
    </el-popover>
    <!-- /. 업무 (가방 아이콘) -->

    <alarm-header @show="onActiveAlarmPopover" />

    <el-popover
      v-if="isPrivate && user.userPermLevel === 0 && shortlyCloud !== 'vmw'"
      placement="bottom"
      width="200"
      trigger="click"
      content="this is content, this is content, this is content"
      popper-class="header-alert-popper"
      ref="main_alert"
      @show="e => getAlertCluster()"
    >
      <i
        :class="['image -bell', { '-empty': !dataLen(alertData) }]"
        slot="reference"
      >
        <strong
          v-if="dataLen(alertData)"
          :class="['tag', { '-over': alertData.length > 99 }]"
        >{{ dataLen(alertData) }}</strong>
      </i>

      <template>
        <div
          class="alert-container"
          v-loading="alertLoading"
        >
          <div class="satus-wrapper flex-wrap -space-between">
            <el-radio-group
              v-model="type"
              class="set-type"
            >
              <el-radio-button label="Nutanix" />
              <!-- <el-radio-button
                label="CMP"
                v-if="packageType === 'ENT'"
              /> -->
              <!-- ❌ 기획 나오면 주석 제거 -->
            </el-radio-group>

            <ul class="status">
              <li>Critical</li>
              <li>Warning</li>
            </ul>
          </div>

          <article class="alert-contents">
            <error-loaded
              :view="alertError"
              @refresh="getAlertCluster"
            />

            <cmp-grid
              :item-source="alertData"
              :columns="alertColumns"
              :init-custom-action="init"
              :use-column-filter="false"
              paging-type="list"
              :height="450"
            >
              <template #lastOccurrenceTimeStamp="props">
                {{ props.row.lastOccurrenceTimeStamp | date('YY.MM.DD HH:mm') }}
              </template>
              <template #severity="props">
                <i :class="['severity', props.row.severity ? `-${formatSeverity(props.row.severity)}` : '']" />
              </template>
              <template #acknowledged="props">
                <span
                  :class="['-status', { '-done' : props.row.acknowledged }]"
                  @click="props.row.acknowledged ? null : ackAction(props.row)"
                >{{ props.row.acknowledged ? $t('config.HEADER.ack') : $t('config.HEADER.res') }}</span>
                <!-- 처리 완료 : 수행 예정 -->
              </template>
              <template #resolved="props">
                <span
                  :class="['-status', { '-done' : props.row.resolved }]"
                  @click="props.row.resolved ? null : resolveAction(props.row)"
                >{{ props.row.resolved ? $t('config.HEADER.ack') : $t('config.HEADER.res') }}</span>
                <!-- 처리 완료 : 수행 예정 -->
              </template>
            </cmp-grid>
            <!-- selectable -->

            <a
              class="-more-btn"
              @click="more({ name: 'config-alerts' }, 'main_alert')"
            >
              <!-- 더보기 -->
              {{ $t('main.DASHBOARD.more') }}
            </a>
          </article>
        </div>
      </template>
    </el-popover>
    <!-- /. Main Alert (Bell 아이콘) -->

    <el-popover
      v-if="isPrivate && user.userPermLevel === 0"
      placement="bottom"
      width="200"
      trigger="click"
      popper-class="header-alert-popper"
      ref="system_alert"
      @show="e => getSystemNotice()"
    >
      <i
        class="image -cloud"
        slot="reference"
      >
        <strong
          v-if="hasSystempError"
          class="tag"
        >!</strong>
      </i>

      <template>
        <article
          class="alert-contents"
          v-if="hasSystempError"
          v-loading="systemLoading"
        >
          <error-loaded
            :view="systemError"
            @refresh="getSystemNotice"
          />

          <cmp-grid
            :item-source="systemData"
            :columns="systemColumns"
            :init-custom-action="init"
            :use-column-filter="false"
            paging-type="list"
            :height="450"
          >
            <template #route="props">
              <i
                class="route-to"
                @click="moveTo({ name: props.row.route }, 'system_alert')"
              />
            </template>
          </cmp-grid>
        </article>

        <p
          v-else
          v-html="$t('config.Alerts.allWorking')"
        />
        <!-- 모든 시스템이 <b>정상</b> 동작하고있습니다 -->
      </template>
    </el-popover>
    <!-- /. 클라우드 (구름 아이콘) -->
  </div>
</template>

<script>
import ErrorLoaded from './ErrorLoaded.vue'
import API, { AlarmHeader } from '@sd-fe/cmp-core'
import * as wjCore from '@grapecity/wijmo'
import { mapState, mapGetters } from 'vuex'
import Dayjs from 'dayjs'

export default {
  name: 'HeaderAlert',
  components: { ErrorLoaded, AlarmHeader },
  async mounted () {
    // if (this.isPrivate) this.actionForPrivate()
    // else this.actionForPublic()
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      packageType: state => state.auth.packageType
    }),
    ...mapGetters({
      cloudType: 'cloud/getCloudType',
      shortlyCloud: 'cloud/getShortlyCloud'
    }),
    isPrivate () {
      return this.cloudType === 'private'
    }
  },
  methods: {
    /**
     * 다른 Popover 강제 Close
     */
    onActiveAlarmPopover () {
      const targetRefs = ['main_alert', 'system_alert', 'work_alert']

      targetRefs.forEach(ref => {
        if (this.$refs[ref]) {
          this.$refs[ref].showPopper = false
        }
      })
    },
    clickTask (props) {
      if (this.isPrivate) this.moveTo({ name: 'todo-detail', params: { id: props.row.orderNo } }, 'work_alert')
      else this.moveTo({ name: 'todo-aws-detail', params: { id: props.row.orderNo } }, 'work_alert')
    },
    async actionForPrivate () {
      // 미등록자원
      this.unregisteredCnt = (this.packageType === 'PL') ? 0 : await this.getAllUnregistersSrc()

      // 전체 API 리스트 호출 (업무, alert, 시스템 현황)
      // if (this.packageType !== 'PL') await this.getTaskTodoList() // 🟨 (v2 API) 404 에러 발생
      if (this.user && this.user.userPermLevel === 0) {
        this.getAlertCluster()
        this.getSystemNotice()
      }
    },
    async actionForPublic () {
      // if (this.packageType !== 'PL') await this.getTaskTodoList() // 🟨 (v2 API) 404 에러 발생
    },
    init (grid) {
      grid.columnHeaders.rows.defaultSize = 32

      if (grid) {
        const successExp = /성공|Success/gi
        const ingExp = /동기화 중|Synchronizing/gi
        grid.formatItem.addHandler((s, e) => {
          const value = e.panel.getCellData(e.row, e.col)

          wjCore.toggleClass(e.cell, 'task-status-success', successExp.test(value), true)
          wjCore.toggleClass(e.cell, 'task-status-ing', ingExp.test(value), true)
        })
      }
    },
    more (to, ref) {
      this.$router.push(to)
      return this.$refs[ref].doClose()
    },
    moveTo (to, close) {
      this.$router.push(to)
      return this.$refs[close].doClose()
    },
    /**
     * 미등록 자원 조회
     */
    async getAllUnregistersSrc () {
      try {
        this.loading = true

        const vmLen = await this.getResult(API.compute.getUnregistersVms()) // Compute
        const svrServerLen = await this.getResult(API.network.getUnregistersVrserver()) // L4
        const csvrServerLen = await this.getResult(API.network.getUnregistersCsvrserver()) // L7
        const groupLen = await this.getResult(API.network.getUnregistersgroup()) // 보안그룹
        const volGroup = await this.getResult(API.compute.getUnregistersVolumeGroups()) // Volumn Group

        // console.log(vmLen, svrServerLen, csvrServerLen, groupLen, volGroup)
        return vmLen + svrServerLen + csvrServerLen + groupLen + volGroup
      } catch (error) {
      } finally {
        this.loading = false
      }
    },
    async getResult (api) {
      try {
        const resp = await api
        return resp.length
      } catch (error) {
        console.error(error)
        // const message = (error.response && error.response.data) ? error.response.data.message : error.message

        // this.$alert(message, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
        return 0
      }
    },
    /**
     * Work 리스트 호출
     */
    async getTaskTodoList () {
      try {
        this.workLoading = true
        const roleUpperList = this.userInfo?.userPermUpperRoleList?.map(item => item.roleUpper)?.join(',')
        const response = await API.work.getTaskTodoList({ roleUpper: roleUpperList })
        const cloudType = this.isPrivate ? 'PRIVATE' : 'PUBLIC'
        const filteredData = response.filter(data => data.cloudType === cloudType).map(data => ({
          ...data,
          workType: data.taskTodoRoleList?.[0]?.taskDataList?.[0]?.workType
        }))
        const rawData = filteredData.filter(resp => resp.isError && resp.workType !== 'AWS_PROJECT')
        this.workData = rawData.sort((resp1, resp2) => {
          const r1Tile = resp1.approvalCreateTime
          const r2Tile = resp2.approvalCreateTime

          if (r1Tile < r2Tile) return 1
          if (r1Tile > r2Tile) return -1
          else return 0
        })

        this.workError = false
      } catch (error) {
        this.workData = this.emptyData()
        this.workError = true
      } finally {
        this.workLoading = false
      }
    },
    /**
     * Alert 리스트 호출
     */
    async getAlertCluster () {
      try {
        this.alertLoading = true
        const response = await API.compute.getAlertCluster({ severityList: ['CRITICAL', 'WARNING'] })

        if (response.length) {
          // 전체 클러스터에서 모든 alert data 를 가져옴
          let data = []
          for (let i = 0; i < response.length; i++) {
            const resp = response[i]
            data = data.concat(resp.data)
          }

          // params 로 ack/resoved 걸러내지 않은 이유 ? acked || resoved 둘중 하나라도 없는 경우 모두 포함해야해서...
          const filteredData = data.filter(item => !item.acknowledged || !item.resolved)
          this.alertData = filteredData.map(item => {
            const { contextTypes, contextValues } = item
            let message = item.message // message 세팅

            contextTypes.forEach((type, index) => {
              const regex = new RegExp(type)
              if (regex.test(message)) message = message.replace('{' + type + '}', contextValues[index])
            })

            return { ...item, message }
          })
          this.alertError = false
        }
      } catch (error) {
        this.alertData = this.emptyData()
        this.alertError = true
      } finally {
        this.alertLoading = false
      }
    },
    /**
     * [Alert > Acknowledge] 로 수행했을 저장 및 새로 불러오기
     * @param {Object} ticket Alert 티켓 정보
     */
    async ackAction (ticket) {
      const { originatingClusterUuid, alertId } = ticket
      const param = { clusterUuid: originatingClusterUuid, alertId }

      // 업데이트한 사용자 정보
      const payload = {
        acknowledgeUserId: this.user.userId,
        acknowledgeUserName: this.user.userName,
        alertId,
        clusterUuid: originatingClusterUuid,
        resolveUserId: undefined,
        resolveUserName: undefined
      }

      try {
        this.alertLoading = true

        // console.log(param, payload, '-----ack')
        const response = await API.compute.updateAlertToAcknowledge(param, payload)

        // alert-panel 에 설정된 조건에 맞게 데이터 세팅
        if (response.successful === true) return this.getAlertCluster()
      } catch (error) {
        this.alertError = true
        console.error('@ Alert - updateAlertToAcknowledge: ', error)
      } finally {
        this.alertLoading = true
        this.alertError = false
      }
    },
    /**
     * [Acknowledge > Resolve] 수행시킨 결과
     * @param {Object} payload { clusterUuid, alertId, userInfo }
     */
    async resolveAction (ticket) {
      const { originatingClusterUuid, alertId } = ticket
      const param = { clusterUuid: originatingClusterUuid, alertId }

      const userInfo = ticket.userInfo !== null ? ticket.userInfo : {
        acknowledgeUserId: this.user.userId,
        acknowledgeUserName: this.user.userName,
        alertId,
        clusterUuid: originatingClusterUuid,
        resolveUserId: this.user.userId,
        resolveUserName: this.user.userName
      }

      const { acknowledgeUserId, acknowledgeUserName } = userInfo

      // // 업데이트한 사용자 정보
      const payload = {
        acknowledgeUserId,
        acknowledgeUserName,
        alertId,
        clusterUuid: originatingClusterUuid,
        resolveUserId: this.user.userId,
        resolveUserName: this.user.userName
      }

      try {
        this.alertLoading = true

        // console.log(param, payload, '-----resolve')
        const response = await API.compute.updateAckToRsv(param, payload)

        if (response.successful === true) return this.getAlertCluster()
      } catch (error) {
        this.alertError = true
        console.error('@ Alert - updateAckToRsv : ', error)
      } finally {
        this.alertLoading = true
        this.alertError = false
      }
    },
    /**
     * 시스템 연동 리스트 호출
     */
    async getSystemNotice () {
      try {
        this.systemLoading = true
        const centralList = await this.settingCentralData()
        const elementList = await this.settingElementData()
        const eraList = await this.settingEraData()

        const equipList = await this.settingEquipNetworkData()
        const hrJdbc = await this.settingJdbc()
        // const itsm = await this.settingItsm() // 이제 ITSM 호출 X

        this.systemData = centralList.concat(elementList, eraList, equipList, hrJdbc)

        // system에 에러가 있는지 확인
        this.hasSystempError = false
        for (let i = 0; i < this.systemData.length; i++) {
          const status = this.systemData[i].status
          if (status === 0 || status === 1) {
            // console.log('실패건 있음!')
            // console.log(this.systemData[i])
            this.hasSystempError = true
            break
          }
        }

        this.systemError = false
      } catch (error) {
        this.systemData = this.emptyData()
        this.systemError = true
        this.hasSystempError = true
        console.error('@ getSystemNotice : ', error)
      } finally {
        this.systemLoading = false
      }
    },
    async settingCentralData () {
      const centralList = await API.compute.getCentralList()
      const occurSys = 'PRISM Central'
      const route = 'nutanix-central'

      return this.setNutanixFormat(centralList, occurSys, route)
    },
    async settingElementData () {
      const elementList = await API.compute.getElementList()
      const occurSys = 'Element'
      const route = 'nutanix-element'

      return this.setNutanixFormat(elementList, occurSys, route)
    },
    setNutanixFormat (data, occurSys, route) {
      return data.map(element => {
        const { jobs } = element

        let biggestUpdateTime = null
        let jobType = null
        let checkSyncStatus = 2

        if (jobs) {
          jobs.forEach(job => {
            // job 들 중, 가장 최근 updateTime / jobType 을 저장합니다.
            if (biggestUpdateTime === null || biggestUpdateTime < job.updateTime) {
              biggestUpdateTime = job.updateTime
              jobType = job.jobType
            }
            if (job.apiRunTime < 1) checkSyncStatus = 1
          })

          const comparison = jobs.filter(job => job.jobType === jobType)
          const apiIsSuccess = comparison.every(job => job.apiIsSuccess) ? 2 : 0 // true :: 성공, false :: 실패
          checkSyncStatus = (checkSyncStatus === 1) ? 1 : apiIsSuccess // 동기화중 :: 동기화 성공/실패

          const successTime = new Date(Dayjs(element.connectSuccessTime).add(-9, 'hour').add(this.intervalMin, 'minute').format()).getTime()
          const isSync = new Date().getTime() < successTime ? 1 : checkSyncStatus

          const time = Dayjs(biggestUpdateTime).format('YY.MM.DD HH:mm')
          const reason = this.syncMessage[isSync]

          // 오류가 있는 경우에만 데이터를 보여줍니다.
          // { updateTime: 마지막 업데이트 시간, status: 상태, reason: 동기화 메시지, occur: 발생한 위치 }
          return { updateTime: time, status: isSync, reason, occurSys, route }
        } else {
          return { updateTime: '-', status: 2, reason: '-', occurSys, route }
        }
      })
    },
    async settingEraData () {
      const eraList = await API.database.getEraConfigs()
      const occurSys = 'Era'
      const route = 'nutanix-era'

      return eraList.map(era => {
        let isSync = 2 // 성공
        let biggestUpdateTime = null

        if (era.syncInfos) {
          era.syncInfos.forEach(job => {
            const sync = job.syncStatus
            if (sync === 'ING') isSync = 1 // 동기화중
            if (!sync || sync === 'FAIL') isSync = 0 // 실패

            if (biggestUpdateTime === null || biggestUpdateTime < job.syncEndTime) {
              biggestUpdateTime = job.syncEndTime
            }
          })
        }

        const updateTime = Dayjs(biggestUpdateTime).format('YY.MM.DD HH:mm')
        const reason = this.syncMessage[isSync]

        // 오류가 있는 경우에만 데이터를 보여줍니다.
        // { updateTime: 마지막 업데이트 시간, status: 상태, reason: 사유, occur: 발생한 위치 }
        return { updateTime, status: isSync, reason, occurSys, route }
      })
      // this.systemData = [...this.emptyData]
      // this.systemError = true
    },
    async settingEquipNetworkData () {
      const equipList = await API.network.getEquipNetworks()
      const route = 'network-equip'

      return equipList.map(equip => {
        const { lastSyncTime, isSync, netType } = equip

        // 다른데이터와 일치시키기 위해 사용합니다
        const setSync = { '-1': 1, 0: 0, 1: 2 }[isSync]
        const reason = this.syncMessage[setSync]
        const updateTime = Dayjs(lastSyncTime).format('YY.MM.DD HH:mm')

        // 오류가 있는 경우에만 데이터를 보여줍니다.
        // { updateTime: 마지막 업데이트 시간, status: 상태, reason: 사유, occur: 발생한 위치 }
        return { updateTime, status: setSync, reason, occurSys: netType, route }
      })
    },
    async settingJdbc () {
      const hrJdbc = await API.config.getHrJdbc(0)
      const occurSys = 'JDBC'
      const route = 'jdbc'

      return hrJdbc.map(info => {
        const { syncStatus, syncFailMessage, isActive, updateTime } = info

        // syncStatus = 동기화 상태 :: 0 실패, 1 동기화중, 2 성공
        // syncFailMessage :: 동기화 실패 사유
        // isActive = 연결 상태 :: true 성공(2), fail 실패(0)

        const active = isActive ? 2 : 0

        let reason = this.syncMessage['2'] // 성공

        // 연결 실패인 경우
        // 연결 || 동기화 둘중 하나실패 시 실패
        if (active !== 2) reason = this.connectionMessage['0'] // 연결 실패
        // 동기화 실패/동기화중인 경우
        else if (syncStatus !== 2) reason = reason = syncFailMessage || this.syncMessage[syncStatus]

        const time = Dayjs(updateTime).format('YY.MM.DD HH:mm')

        // 오류가 있는 경우에만 데이터를 보여줍니다.
        // { updateTime: 마지막 업데이트 시간, status: 상태, reason: 사유, occur: 발생한 위치 }
        return { updateTime: time, status, reason, occurSys, route }
      })
    },
    async settingItsm () {
      const hrItsm = await API.config.getHrItsm(0)
      const occurSys = 'ITSM'
      const route = 'org-itsm'

      return hrItsm.map(info => {
        const { isActive, updateTime } = info
        const time = Dayjs(updateTime).format('YY.MM.DD HH:mm')
        // isActive = 연결 상태 :: true 성공, false 실패
        const status = isActive ? 2 : 0

        // 오류가 있는 경우에만 데이터를 보여줍니다.
        // { updateTime: 마지막 업데이트 시간, status: 상태, reason: 사유, occur: 발생한 위치 }
        return { updateTime: time, status, reason: this.connectionMessage[status], occurSys, route }
      })
    }
  },
  data () {
    return {
      type: 'Nutanix',
      time: null,
      dataLen (data) {
        return data.length > 99 ? '99+' : data.length
      },
      workColumns: [
        { header: this.$t('config.Alerts.timeOfOccurrence'), binding: 'approvalCreateTime', width: '', sorting: false, customHtml: true }, // 발생시간
        { header: this.$t('admin.NOTI.state'), binding: 'taskDataStatus', width: '', sorting: false, customHtml: true, cssClass: 'task-status-fail' }, // 상태
        { header: this.$t('common.TERMS.rel'), binding: 'ownerCompanyName', width: '', sorting: false, customHtml: true }, // 관계사
        { header: this.$t('common.TERMS.group'), binding: 'groupName', width: '', sorting: false, customHtml: true }, // 조직
        { header: ' ', binding: 'route', width: 50, sorting: false, customHtml: true }
      ],
      alertColumns: [
        { header: this.$t('config.Alerts.classification'), binding: 'severity', width: 50, sorting: false, customHtml: true }, // 분류
        { header: this.$t('config.Alerts.timeOfOccurrence'), binding: 'lastOccurrenceTimeStamp', width: '', sorting: false, customHtml: true }, // 발생시간
        { header: this.$t('config.Alerts.alertContent'), binding: 'message', width: '', sorting: false, align: 'left' }, // Alert 내용
        { header: 'Acknowledge', binding: 'acknowledged', width: 80, sorting: false, customHtml: true }, // Acknowledge
        { header: 'Resolve', binding: 'resolved', width: 80, sorting: false, customHtml: true } // Resolve
      ],
      systemColumns: [
        { header: this.$t('config.Alerts.timeOfOccurrence'), binding: 'updateTime', width: 150, sorting: false, customHtml: true }, // 발생시간
        { header: this.$t('config.Alerts.reason'), binding: 'reason', width: 120, sorting: false, cssClass: 'task-status-fail' }, // 사유
        { header: this.$t('config.Alerts.generationSystem'), binding: 'occurSys', width: '', sorting: false, customHtml: true }, // Acknowledge
        { header: ' ', binding: 'route', width: 50, sorting: false, customHtml: true } // Resolve
      ],
      alertData: [],
      workData: [],
      systemData: [],
      unregisteredCnt: 0,
      emptyData () {
        const data = []
        const today = Dayjs(new Date()).format('YY.MM.DD hh:mm')
        const tempData = {
          approvalCreateTime: today,
          taskDataStatus: 'ERROR',
          ownerCompanyName: '신세계I&C',
          groupName: '데이터센터팀',
          severity: 'critical',
          lastOccurrenceTimeStamp: today,
          acknowledged: false,
          resolved: false,
          message: 'Message',
          updateTime: today,
          status: 0,
          reason: 'Reason',
          occurSys: 'Occur System',
          route: '-'
        }
        for (let i = 0; i < 10; i++) data.push(tempData)
        return data
      },
      alertError: false,
      workError: false,
      systemError: false,
      alertLoading: false,
      workLoading: false,
      systemLoading: false,
      formatSeverity (severity) {
        return severity?.toLowerCase().replace('k', '')
      },
      syncMessage: {
        0: this.$t('config.Alerts.syncFail'), // 동기화 실패
        1: this.$t('common.syncing'), // 동기화중
        2: this.$t('common.success') // 성공
      },
      connectionMessage: {
        0: this.$t('config.Alerts.connectFail'), // 연결 실패
        2: this.$t('common.success') // 성공
      },
      hasSystempError: false
    }
  }
}
</script>

<style lang="scss" scoped>
  .alert-area {
    display: flex;
    align-items: center;

    .image {
      width: 25px;
      height: 25px;
      position: relative;
      margin-right: $gap-m;
      cursor: pointer;
      display: block;
      color: $white;

      &.-empty { margin-right: $gap;}

      &.-computer { background: url('../../assets/images/dashboard/computer.svg') no-repeat center; }
      &.-bag { background: url('../../assets/images/dashboard/bag.svg') no-repeat center; }
      &.-bell { background: url('../../assets/images/dashboard/bell.svg') no-repeat center; }

      &.-cloud {
        background: url('../../assets/images/dashboard/cloud.svg') no-repeat;
        width: 36px;
        margin-right: 20px;
        .tag {
          width: 15px;
          left: 25px;
        }
      }
    }

    .tag {
      font-style: normal;
      position: absolute;
      top: 0; left: 15px;
      min-width: 15px;
      max-width: 20px;
      letter-spacing: -5%;
      line-height: 15px;
      text-align: center;
      display: block;
      border: 2px solid #141425;
      background-color: $main-red;
      border-radius: 25px;
      font-size: 8px;
      color: $white;

      &.-over { width: 20px; }
    }
  }

  .header-alert-popper {
    .satus-wrapper {
      align-items: center;
      margin-bottom: 15px;

      .set-type {
        height: 15px;
      }
      .status {
        display: flex;
        line-height: 15px;

        li {
          margin-left: 20px;
          padding-left: 20px;
          position: relative;
          font-size: 12px;
          &::before {
            position: absolute;
            content: '';
            width: $gap-s; height: $gap-s;
            border-radius: 50%;
            top: 3px; left: 0;
          }
          &:first-child { &::before { background-color: $main-red; } }
          &:last-child { &::before { background-color: $yellow; } }
        }
      }
    }

    .alert-contents {
      width: 460px;
      position: relative;

      .-status {
        color: $main-red;
      }

      .route-to {
        border-top: 2px solid $input-placeholder;
        border-right: 2px solid $input-placeholder;
        display: block;
        width: 8px;
        height: 8px;
        transform: rotate(45deg);
        cursor: pointer;
      }

      .severity {
        display: block;
        width: 10px;
        height: 10px;
        border-radius: 50%;

        &.-critical { background-color: $main-red; }
        &.-warning { background-color: $yellow; }
      }

      .-status {
        color: #999;
        cursor: pointer;
        &.-done { color: $main-red; cursor: inherit }
      }

      .-more-btn {
        display: block;
        text-align: center;
        text-decoration: underline;
        color: $primary;
        font-size: 15px;
        line-height: 15px;
        margin-top: 15px;
      }
    }
  }
</style>

<style lang="scss">
.el-popover {
  &.header-alert-popper {
    top: 65px !important;
    padding: $gap-m;

    .wj-header.wj-cell {
      background-color: $primary;
      border-bottom: none;
      border-right: none;
      line-height: 32px;
      font-weight: normal;
      font-size: 12px;
    }

    .wj-cells {
      .wj-cell {
        border-bottom: 1px solid #E0E0E0;
        color: $text-black;
        font-size: 12px;
        padding: 0 4px;

        > div {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        &.task-status-fail { color: $main-red; }
        &.task-status-ing { color: $yellow; }
        &.task-status-success { color: $success; }
      }
      // hover 컬러
      .wj-row:hover .wj-cell{
        background: none;
        // &.selected-row {
        //   // background: $white !important;
        //   // color: $color-black !important;
        // }
      }
    }

    .cmp-grid-wrapper {
        *::-webkit-scrollbar { width: 6px; height: 6px; background-color: #FAFAFA; }
        *::-webkit-scrollbar-track { background-color: #FAFAFA; }
        *::-webkit-scrollbar-thumb { background-color: #D3D3D3; }
        *::-webkit-scrollbar-corner { background-color: transparent; }
        *::-webkit-resizer {
          display: none;
        }
    }
  }

  .el-radio-group {
    .el-radio-button {
      height: 15px;
      .el-radio-button__inner {
        line-height: 15px;
        background-color: transparent;
        padding: 0;
        margin-right: 15px;
        border: none !important;
        color: #999;
        height: auto;
        font-weight: 300;
        letter-spacing: -0.5%;

        &:hover { color: $primary }
      }

      &.is-active {
        .el-radio-button__inner {
          background-color: transparent;
          color: $primary;
          border: none;
          box-shadow: none;
          font-weight: 500;

          &:hover { color: $primary !important }
        }
      }

    }
  }

}
</style>
