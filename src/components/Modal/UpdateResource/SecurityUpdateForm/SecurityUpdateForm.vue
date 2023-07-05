<!--
  * 파일명 : SecurityUpdateForm.vue
  * 파일 기능 : 보안그룹(Security) 자원 이관 시, 정보 수정 form
  * 작성자 : 김예담
  * 최종 작성일 : 2021-02-24
  * License By Shinsegae I&C
  * 2021-02-24 fix: 보안그룹 > 경유지 정보 있을 때만 노출, 할 일에서 경유지 정보가 없을 때, 작업 실행 불가능하게 처리
 -->

<template>
  <section class="security-update-form">
    <register-contents
      class="info-contents"
      :title="$t('common.GRID.NETWORK.setInfo')"
      :required="editable"
    >
      <div class="flex-wrap -flex-end">
        <button
          class="button"
          @click="toggleEditState(detailData, !detailData.edit)"
          v-if="setDisabled[1]"
        >
          {{ detailData.edit ? $t('task.STATE.complete') : $t('common.BTN.change') }}
        </button>
      </div>
      <div class="setting-info-list">
        <register-contents
          type="input"
          class="setting-info-item"
          v-for="(item, idx) in settingInfoColumn"
          :key="idx"
          :title="$t(item.keyPath) || item.label"
        >
          <template v-if="detailData.edit">
            <div
              class="setting-radio"
              v-if="item.type === 'radio'"
            >
              <el-radio-group
                v-model="changedDetailData[item.field]"
              >
                <el-radio label="IP">
                  IP
                </el-radio>
                <el-radio label="DOMAIN">
                  DOMAIN
                </el-radio>
              </el-radio-group>
            </div>

            <div v-if="item.type === 'date'">
              <el-date-picker
                v-model="changedDetailData[item.field]"
                type="date"
                size="mini"
                :clearable="false"
                :placeholder="`${item.label} ${$t('common.BTN.select')}`"
                format="yyyy.MM.dd"
                value-format="yyyy/MM/dd"
                :picker-options="svcOpenDtOpt"
                @change="changeDate('start')"
              />
            </div>

            <div
              class="setting-st-select"
              v-else-if="item.type === 'select'"
            >
              <el-select
                v-model="changedDetailData[item.field]"
                :popper-append-to-body="false"
                :placeholder="`${item.label} ${$t('common.BTN.select')}`"
              >
                <el-option
                  v-for="(option, index) in item.selectOptions"
                  :key="option.name + index"
                  :value="option.name"
                  :label="option.name"
                />
              </el-select>
            </div>

            <el-input
              v-else
              v-model="changedDetailData[item.field]"
              :placeholder="`${item.label} ${$t('common.PLACEHOLDER.enter')}`"
              disabled
            />
          </template>

          <template v-else>
            <span v-if="item.field === 'startTime' || item.field === 'endTime'">
              {{ changedDetailData[item.field] | dateSimple }}
            </span>
            <span v-else> {{ changedDetailData[item.field] }}</span>
          </template>
        </register-contents>
      </div>
    </register-contents>
    <!-- /. 설정정보 -->
    <!-- 보안그룹 -->
    <register-contents
      :title="$t('common.GRID.NETWORK.originInfo')"
      :required="editable"
    >
      <div class="grid-wrap">
        <network-create-table
          :disabled="setDisabled[0]"
          :editable="editable"
          :info-column="securityColumns.startColumns"
          :source-data="detailData.startAddr"
          :option-data="options.sourceOptions"
          @grid-data="(param) => {
            const data = param.filter(row => !row.newRow)
            emitData(data, 'startAddr')
            $nextTick(function(){
              setRoadPayload()
            })
          }"
          :project-idx="detailData.projectIdx"
          :ip-category-idx="startNetwork.net"
          v-loading="isGetNetworkCate"
          ref="startAddressGridRef"
        >
          <template #prefix>
            <div class="select-net-form">
              <span>{{ $t('config.IP.band') }}:&ensp;</span>
              <template v-if="setDisabled[1]">
                <el-select
                  v-model="startNetwork.cate"
                  :popper-append-to-body="true"
                  :placeholder="$t('config.IP.band')"
                >
                  <el-option
                    v-for="option in networkOptions"
                    :key="option.ipCategoryIdx"
                    :label="option.codeName"
                    :value="option.ipCategoryIdx"
                  />
                </el-select>
                <el-select
                  v-model="startNetwork.net"
                  :popper-append-to-body="true"
                  :placeholder="$t('admin.PREF.networkClass')"
                >
                  <el-option
                    v-for="option in startNetOptions"
                    :key="option.ipCategoryIdx"
                    :label="option.codeName"
                    :value="option.ipCategoryIdx"
                  />
                </el-select>
              </template>
              <span v-else>{{ getCateCodeName(startNetwork.cate, networkOptions) + ' / ' + getCateCodeName(startNetwork.net, startNetOptions) }}</span>
            </div>
          </template>
        </network-create-table>
      </div>
    </register-contents>
    <!-- 출발지 정보 -->

    <register-contents
      :title="$t('common.GRID.NETWORK.destInfo')"
      :required="editable"
    >
      <div class="grid-wrap">
        <network-create-table
          :disabled="setDisabled[0]"
          :editable="editable"
          :info-column="securityColumns.destColumns"
          :source-data="detailData.destAddr"
          :option-data="options.destOptions"
          @grid-data="(param) => {
            const data = param.filter(row => !row.newRow)
            emitData(data, 'destAddr')
            $nextTick(function(){
              setRoadPayload()
            })
          }"
          :project-idx="detailData.projectIdx"
          :ip-category-idx="destNetwork.net"
          v-loading="isGetNetworkCate"
          ref="destAddressGridRef"
        >
          <template #prefix>
            <div class="select-net-form">
              <span>{{ $t('config.IP.band') }}:&ensp;</span>
              <template v-if="setDisabled[1]">
                <el-select
                  v-model="destNetwork.cate"
                  :popper-append-to-body="true"
                  :placeholder="$t('config.IP.band')"
                >
                  <el-option
                    v-for="option in networkOptions"
                    :key="option.ipCategoryIdx"
                    :label="option.codeName"
                    :value="option.ipCategoryIdx"
                  />
                </el-select>
                <el-select
                  v-model="destNetwork.net"
                  :popper-append-to-body="true"
                  :placeholder="$t('admin.PREF.networkClass')"
                >
                  <el-option
                    v-for="option in destNetOptions"
                    :key="option.ipCategoryIdx"
                    :label="option.codeName"
                    :value="option.ipCategoryIdx"
                  />
                </el-select>
              </template>
              <span v-else>{{ getCateCodeName(destNetwork.cate, networkOptions) + ' / ' + getCateCodeName(destNetwork.net, destNetOptions) }}</span>
            </div>
          </template>
        </network-create-table>
      </div>
    </register-contents>
    <!-- 목적지 정보 -->

    <register-contents
      :title="$t('common.MODAL.serviceInfo')"
      :required="editable"
    >
      <div class="grid-wrap">
        <network-create-table
          :disabled="setDisabled[0]"
          :editable="editable"
          :info-column="securityColumns.projectColumns"
          :source-data="detailData.groupPorts"
          :option-data="options.projectOptions"
          @grid-data="(param) => {
            const data = param.filter(row => !row.newRow)
            emitData(data, 'groupPorts')
            $nextTick(function(){
              setRoadPayload()
            })
          }"
          :port-valid="true"
        />
      </div>
    </register-contents>
    <!-- 서비스 정보 -->
    <!-- /. 보안그룹 -->

    <register-contents
      :title="$t('common.GRID.NETWORK.stopoverInfo')"
      v-loading="isRoadInfo"
      :required="editable"
    >
      <span
        class="empty-data"
        v-if="isEmptyStartIp || isEmptyDestIp"
      >
        {{ $t('common.PLACEHOLDER.needVmInfo') }}
      </span>
      <template v-else>
        <security-detail-path
          v-if="roadDetailData.length"
          :data.sync="roadDetailData"
          :editable="editable"
          :order-info="orderInfo"
          :project-idx="detailData.projectIdx"
        />
        <span
          class="empty-data"
          v-else
        >
          {{ $t('common.PLACEHOLDER.stopoverInfo') }}
        </span>
      </template>
    </register-contents>
    <!-- 경유지 정보 -->
  </section>
</template>

<script>
import API, { NetworkCreateTable } from '@sd-fe/cmp-core'
import SecurityDetailPath from './SecurityDetailPath'
import Dayjs from 'dayjs'

import { uniq, cloneDeep } from 'lodash'
export default {
  name: 'SecurityUpdateForm',
  props: {
    data: {
      type: Object,
      default: () => {}
    },
    editable: {
      type: Boolean,
      default: true
    },
    orderInfo: { // 주문 정보
      type: Object,
      default: null
    },
    dataIncludeDetail: { // 보안그룹 자원 상세 정보가 prop의 data에 함께 담겨있는지? 아니라면 상세 API 를 찔러야 함
      type: Boolean,
      default: false
    }
  },
  components: {
    NetworkCreateTable,
    'security-detail-path': SecurityDetailPath
  },
  async created () {
    await this.init()

    const allCate = await this.getNetworkCategory()
    this.networkOptions = await this.setNetOptions(allCate) // 출발지/목적지 정보 > 대역 선택 옵션
  },
  computed: {
    isEmptyStartIp () { // 출발지 정보에 ip없는 정보가 한 개라도 있는지 여부
      if (this.changedDetailData?.startAddr && this.changedDetailData.startAddr.some(item => !item.edit && (!item.value || item.value === '-'))) return true
      else return false
    },
    isEmptyDestIp () { // 출발지 정보에 ip없는 정보가 한 개라도 있는지 여부
      if (this.changedDetailData?.destAddr && this.changedDetailData.destAddr.some(item => !item.edit && (!item.value || item.value === '-'))) return true
      else return false
    },
    startNetworkCopy () {
      return cloneDeep(this.startNetwork)
    },
    destNetworkCopy () {
      return cloneDeep(this.destNetwork)
    },
    setDisabled () {
      // 보안그룹 [삭제] 자원인지 판단 (삭제 자원은 경유지 등록이 필수이기 때문에 L4/L7 과 다르게 editable 을 내부에서 조절)
      // [삭제] 일때는 (삭제자원 && editable 둘다 확인) : (생성/변경일땐 editable 만 확인)
      const isDelete = this.changedDetailData.meta?.orderType === 'DELETE'
      const result0 = isDelete ? (!this.editable || isDelete) : (!this.editable)
      const result1 = isDelete ? (this.editable && !isDelete) : (this.editable)

      // 반대라서 ㅠ 0과 1로 따로 분리했음
      // 0 -> [변경/추가] 버튼 :: (disabled = true) 여야 disabled 되는경우 (true : 숨김, false, 노출)
      // 1 -> [대역] 설정 영역 :: (v-if = false) 숨김처리 disabled 되는경우 (true : 노출, false, 숨김)

      return { 0: result0, 1: result1, isDelete }
    }
  },
  watch: {
    detailData (newVal) {
      this.changedDetailData = cloneDeep(newVal)
    },
    'startNetwork.cate': { // 출발지 대역 변경시, 망 옵션 리스트 설정
      immediate: true,
      async handler (newVal, oldVal) {
        this.startNetwork.net = null
        this.startNetOptions = newVal ? await this.getNetworkCategory({ upperCategoryIdx: newVal }) : []
      }
    },
    'destNetwork.cate': { // 목적지 대역 변경시, 망 옵션 리스트 설정
      immediate: true,
      async handler (newVal) {
        this.destNetwork.net = null
        this.destNetOptions = newVal ? await this.getNetworkCategory({ upperCategoryIdx: newVal }) : []
      }
    },
    startNetworkCopy: {
      deep: true,
      handler (newVal, oldVal) {
        if (oldVal.net &&
          newVal !== oldVal &&
          newVal !== this.startNetwork &&
          !this.startAddrFlag
        ) this.resetGridInfo('start', oldVal)

        if (oldVal.cate !== newVal.cate || oldVal.net !== newVal.net) this.startAddrFlag = false
      }
    },
    destNetworkCopy: {
      deep: true,
      handler (newVal, oldVal) {
        if (
          oldVal.net &&
          newVal !== oldVal &&
          newVal !== this.destNetwork &&
          !this.destAddrFlag
        ) this.resetGridInfo('dest', oldVal)
        if (oldVal.cate !== newVal.cate || oldVal.net !== newVal.net) this.destAddrFlag = false
      }
    }
  },
  methods: {
    async init () {
      this.detailData = JSON.parse(JSON.stringify(this.data))
      if (!this.dataIncludeDetail) await this.getSecurityDetail(this.data.securityGroupIdx)

      if (this.detailData.groupAddresses?.length) {
        const getAddress = (name) => this.detailData.groupAddresses.filter(data => data?.addressDirection === name)
        this.detailData.startAddr = getAddress('START')
        this.detailData.destAddr = getAddress('DESTINATION')
      }

      if (this.detailData.addrCateIdxInfo) this.setAddrCateIdx(this.detailData.addrCateIdxInfo) // 출발지-목적지 대역,망 설정

      console.log('@@@@this.detailData', this.detailData)
      this.changedDetailData = cloneDeep(this.detailData)

      await this.setRoadPayload()
    },
    /**
     * 출발지, 목적지의 대역 정보 세팅
     */
    setAddrCateIdx (info) {
      this.startNetwork.cate = info.start.cate
      this.destNetwork.cate = info.dest.cate
      this.$nextTick(function () {
        this.startNetwork.net = info.start.net
        this.destNetwork.net = info.dest.net
      })
    },
    /**
     * 보안 그룹 상세 데이터
     */
    async getSecurityDetail (securityGroupIdx) {
      try {
        if (securityGroupIdx === undefined) return

        const result = await API.network.getPolicyGroup(securityGroupIdx)

        this.detailData = cloneDeep(result)
      } catch (error) {
        console.error(error)
      } finally {
      }
    },
    /**
     * [설정 정보] 편집상태 토글
     * @param {Array, Object} item 편집 상태 토글 대상
     * @param {Boolean} state 편집 상태
     */
    toggleEditState (item, state) {
      if (Array.isArray(item)) item = item.map(child => { child.edit = state })
      else item.edit = state

      if (!this.detailData.edit) {
        this.setChangedData(this.changedDetailData)
        this.setRoadPayload()
      }
      this.$forceUpdate()
    },
    /**
     * emit데이터 세팅
     * @param {Object} data 변화되는 데이터
     * @param {String} type 변화되는 데이터의 key.('startAddr', 'destAddr', 'groupPorts', 'policies')
     */
    emitData (data, type) {
      console.log('%c Security => update grid가 변경됐어요!', 'color: #CDFF9A')
      this.updateGridData[type] = [...data]

      const setDir = (addr) => {
        return this.updateGridData[type].map(data => {
          return {
            ...data,
            addressDirection: addr
          }
        })
      }

      if (type === 'startAddr') this.updateGridData[type] = setDir('START')
      else if (type === 'destAddr') this.updateGridData[type] = setDir('DESTINATION')

      if (type === 'startAddr' || type === 'destAddr') {
        this.updateGridData.addrCateIdxInfo = {
          start: this.startNetwork,
          dest: this.destNetwork
        }
      }

      for (const key in this.updateGridData) this.changedDetailData[key] = this.updateGridData[key]
      this.setChangedData(this.changedDetailData)
    },
    // 그리드 변경 / 설정정보 변경이 있을때마다 emit 합니다.
    setChangedData (data = this.changedDetailData) {
      // console.log('%c setChangedData', 'color: #EAFF9A')
      // console.log(data)
      if (data.endTime) data.expireDate = Dayjs(data.endTime).format('YY/MM/DD') // comment 담아주기 위함
      if (data.policies?.length) data.roadIdx = data.policies[0].roadIdx
      data.isEditing = this.detailData.edit

      this.$emit('changed-data', data)
    },
    /**
     * 경유지 데이터 조회 위해 payload 세팅
     * @param {Object} data 편집 후 security 디테일 데이터
     * @param {Object} orderInfo 주문 정보
     */
    async setRoadPayload (
      data = this.changedDetailData,
      orderInfo = this.orderInfo
    ) {
      if (!data || !orderInfo) return

      this.roadDetailData = []

      const start = data.startAddr ? data.startAddr.filter(item => !item.edit && item?.addressDirection === 'START') : []
      const dest = data.destAddr ? data?.destAddr.filter(item => !item.edit && item?.addressDirection === 'DESTINATION') : []
      const groupPorts = data?.groupPorts.filter(item => !item.edit)

      if (!start.length || !dest.length || !groupPorts.length) return

      const payload = { // 추후 변경 가능성 있음
        taskSendIdx: '10000',
        securityGroupIdx: data.securityGroupIdx,
        projectIdx: data.projectIdx,
        securityGroupName: data.securityGroupName,
        startTime: data.startTime,
        endTime: data.endTime,
        comment: data.comment,
        groupAddresses: [...start, ...dest],
        groupPorts: groupPorts,
        meta: {
          orderDataIdx: orderInfo.orderIdx,
          orderNo: orderInfo.orderNo,
          orderType: orderInfo.orderType,
          workType: 'SECURITY',
          userId: orderInfo.userId,
          userName: orderInfo.userName
        },
        workResult: {},
        // checked: true,
        index: 0
      }

      await this.getRoadInfo(payload)
    },
    /**
     * 경유지 정보 조회
     */
    async getRoadInfo (payload = this.roadPayload) {
      try {
        this.isRoadInfo = true

        const response = await API.network.createPolicy(payload)

        let emitPolicyData

        if (!response || !response.policies) emitPolicyData = []
        else {
          this.roadDetailData = this.setRoadInfoForEmit(response.policies)

          emitPolicyData = this.roadDetailData.map(row => {
            return {
              vdomId: row.vdomId,
              policyName: row.policyName,
              nat: row.originPolicyData.nat,
              scheduleName: row.schedule.scheduleName,
              srcintf: row.originPolicyData.srcintf,
              dstintf: row.originPolicyData.dstintf,
              srcaddr: row.originPolicyData.srcaddr,
              dstaddr: row.originPolicyData.dstaddr,
              srv: row.originPolicyData.srv,
              ipPools: row.originPolicyData.ipPools ? row.originPolicyData.ipPools : [],

              virtualIps: row.virtualIps?.length ? row.virtualIps : [],
              schedule: row.schedule,
              poolInfo: row.poolInfo?.length ? row.poolInfo : [],
              roadIdx: row.roadIdx,
              policyRoadDetails: row
            }
          })
        }
        this.emitData(emitPolicyData, 'policies')
        // }
      } catch (error) {
        console.error(error)
        this.roadDetailData = []
        this.isRoadInfo = false
        this.$alert(error, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
      } finally {
        this.isRoadInfo = false
      }
    },
    /**
     * 조회한 policies 내부 policyRoadDetails 정보를 경유지 그리드에 맞게 세팅합니다.
     * @param {Object} policies 경유지 정보 조회시, policies에 담겨오는 정책 정보
     * @return {Array} 매핑된 경유지 상세 정보
     */
    setRoadInfoForEmit (policies) {
      const policyRoadDetails = policies.map(policy => {
        return {
          ...policy.policyRoadDetails,
          vdomId: policy.vdomId, // 경유지 고유 키 값
          policyName: policy.policyName, // 경유지 고유 키 값
          originPolicyData: { // 작업 실행 emit 데이터에 필요함
            nat: policy.nat,
            vdomId: policy.vdomId,
            srv: policy.srv,
            srcintf: policy.srcintf,
            dstintf: policy.dstintf,
            srcaddr: policy.srcaddr,
            dstaddr: policy.dstaddr,
            ipPools: policy.ipPools ? policy.ipPools : []
          }

        }
      })
      if (!policyRoadDetails?.length) return

      const uniqByIdPolicy = uniq(policyRoadDetails, 'vdomId') // policyRoadDetails 중복 경유지 제거

      const mappedRoadDetail = uniqByIdPolicy.map(detail => {
        const obj = detail
        for (let i = 0; i < policies.length; i++) {
          if (detail.vdomId === policies[i].vdomId) {
            obj.virtualIps = policies[i].virtualIps
            obj.schedule = policies[i].schedule
          }
        }
        return obj
      })

      return mappedRoadDetail
    },
    // ~~~~~~~~~~~ 대역/망 설정 ~~~~~~~~~~~~
    /**
     * 네트워크 카테고리 조회 (대역/망 설정시 필요)
     */
    async getNetworkCategory (param) {
      try {
        this.isGetNetworkCate = true
        const categories = await API.network.getNetworkCategory(param)
        if (categories) return categories
        return categories
      } catch (error) {
        console.error('Error;Get NetworkCategory List: ', error)
      } finally {
        this.isGetNetworkCate = false
      }
    },
    /**
     * 대역 / 망 옵션 설정
     */
    setNetOptions (list) {
      const datacenterIdxs = list.filter(cate => !cate.upperCategoryIdx) // 데이터센터 cateIdx
        .map(item => item.ipCategoryIdx)
      const bands = list.filter(cate => datacenterIdxs.includes(cate.upperCategoryIdx))
      return bands
    },
    /**
     * ipCategoryIdx로 codeName 리턴
     */
    getCateCodeName (ipCategoryIdx, options) {
      if (!ipCategoryIdx || !options?.length) return ''
      const cate = options.find(cate => cate.ipCategoryIdx === ipCategoryIdx)
      return cate ? cate.codeName : ''
    },
    /**
     * 출발지/목적지의 네트워크 카테고리 변경 시, 정보 삭제할건지?
     */
    resetGridInfo (field, origin) {
      const fieldName = field === 'start' ? 'common.GRID.NETWORK.origin' : 'common.GRID.NETWORK.dest' // 출발지 : 목적지
      this.$confirm(this.$t('common.ALERT.SECURITY.055', { info: this.$t(fieldName) }), { // 설정 대역 변경시,<br>{info}가 모두 초기화 됩니다.<br> <br>계속하시겠습니까?
        dangerouslyUseHTMLString: true
      }).then(() => {
        if (field === 'start') {
          this.detailData.startAddr = []
          this.emitData(this.detailData.startAddr, 'startAddr')
        } else {
          this.detailData.destAddr = []
          this.emitData(this.detailData.destAddr, 'destAddr')
        }

        // gridData와 직접 연동된 정보가 아니라서 초기화 되지 않는 정보 강제 초기화 (hostName, IP)
        const ref = this.$refs[`${field}AddressGridRef`]
        if (ref) {
          ref.savedIpData = undefined
          ref.savedHostData = undefined
        }
        this.$forceUpdate()
      }).catch(() => {
        if (field === 'start') {
          this.startNetwork.cate = origin.cate
          this.$nextTick(function () {
            this.startNetwork.net = origin.net
            this.startAddrFlag = true
          })
        } else {
          this.destNetwork.cate = origin.cate
          this.$nextTick(function () {
            this.destNetwork.net = origin.net
            this.destAddrFlag = true
          })
        }
      })
    },
    changeDate () {
      const startT = this.changedDetailData.startTime
      const startTimeData = new Date(startT).getTime()

      const endT = this.changedDetailData.endTime
      const endTimeData = new Date(endT).getTime()

      if (endTimeData < startTimeData) {
        this.$alert(this.$t('common.ALERT.SECURITY.038'))
        this.changedDetailData.endTime = ''
      }

      this.setChangedData(this.changedDetailData)
    }

  },
  data () {
    return {
      isGetNetworkCate: false, // 네트워크 카테고리 조회 로딩
      isRoadInfo: false, // 경유지 정보 조회 로딩
      roadDetailData: [], // 경유지 정보
      detailData: {},
      updateGridData: {}, // emit ㄷㅔ이터
      changedDetailData: {},
      settingInfoColumn: [
        { field: 'startTime', label: '시작일', type: 'date', keyPath: 'common.MODAL.startDate' },
        { field: 'endTime', label: '만료일', type: 'date', keyPath: 'common.MODAL.expireDate' },
        { field: 'securityGroupName', label: '이름', keyPath: 'common.MODAL.name' }
        // { field: 'comment', label: '설명', keyPath: 'common.MODAL.explain' } 주석 요청
      ],
      // 보안그룹
      securityColumns: {
        startColumns: [
          { binding: 'addressType', header: this.$t('common.GRID.type'), sorting: false, customHtml: true, select: true, required: true }, // 타입
          { binding: 'hostName', header: 'hostName', sorting: false, customHtml: true, host: true, required: true },
          { binding: 'value', header: 'IP', sorting: false, customHtml: true, ip: true, required: true },
          { binding: 'comment', header: '설명', sorting: false, customHtml: true, keyPath: 'common.MODAL.explain', notRequired: true }
        ],
        destColumns: [
          { binding: 'addressType', header: this.$t('common.GRID.type'), sorting: false, customHtml: true, select: true, required: true }, // 타입
          { binding: 'hostName', header: 'hostName', sorting: false, customHtml: true, host: true, required: true },
          { binding: 'value', header: 'IP', sorting: false, customHtml: true, ip: true, required: true },
          { binding: 'comment', header: '설명', sorting: false, customHtml: true, keyPath: 'common.MODAL.explain', notRequired: true }
        ],
        projectColumns: [
          { binding: 'port', header: this.$t('common.MODAL.port'), sorting: false, customHtml: true, number: true, required: true }, // 포트
          { binding: 'portType', header: this.$t('common.MODAL.protocol'), sorting: false, customHtml: true, select: true, required: true }, // 프로토콜
          { binding: 'comment', header: '설명', sorting: false, customHtml: true, keyPath: 'common.MODAL.explain', notRequired: true }
        ]
      },
      options: {
        sourceOptions: {
          addressType: [{ label: 'Subnet' }]
        },
        destOptions: {
          addressType: [{ label: 'Subnet' }]
        },
        projectOptions: {
          portType: [{ label: 'TCP' }, { label: 'UDP' }, { label: 'SCTP' }]
        }
      },

      networkOptions: [], // 대역 옵션
      startNetOptions: [], // 출발지 대역 망 옵션
      destNetOptions: [], // 목적지 대역 망 옵션
      startNetwork: {
        cate: null,
        net: null
      },
      destNetwork: {
        cate: null,
        net: null
      },
      startAddrFlag: false, // 출발지 대역 변경 시, 출발지 정보 전체 삭제 alert 1회만 호출하기 위한 flag
      destAddrFlag: false, // 목적지 대역 변경 시, 목적지 정보 전체 삭제 alert 1회만 호출하기 위한 flag
      svcOpenDtOpt: {
        disabledDate (time) {
          const today = new Date().toDateString()
          return time.getTime() < new Date(today)
        }
      }
    }
  }
}
</script>

<style lang="scss">
.security-update-form {
  border-top: 1px solid $border-color;
  .info-contents {
    .-flex-end {
      display: flex;
      justify-content: flex-end;
    }
    .setting-info-list {
      margin-top: $gap-s;
    }
  }
  .sub-title { margin-bottom: 0; }
  .new-path-wrapper {
    position: fixed;
    z-index: 10;
    &:before {
      content: '';
      position: fixed;
      top: 0; left: 0; bottom: 0; right: 0;
      z-index: 2;
      background-color: rgba(0,0,0,.5);
    }
    .-body {
      flex: 2 1 auto;
      position: fixed;
      overflow-y: auto;
      width: 1000px;
      max-height: 700px;
      border: 1px solid $dark-slate;
      background: $background-color;
      border-radius: $radius;
      padding: $gap-m;
      box-sizing: border-box;
      top: 10vh; left: calc(50% - 500px);
      z-index: 2;
    }
  }
  .setting-info-item {
    .setting-st-select {
      width: 200px;
    }
  }

  .select-net-form {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 5px;
    .el-select {
      width: 120px !important;
      .el-input > input {
        border: 1px solid $input-stroke !important;
      }
    }
  }
}

</style>

<style lang="scss">
.setting-radio {
  .el-radio-group {
    .el-radio__label {
      margin-right: $gap;
    }
  }
}

.grid-wrap {
  div[wj-part=root] {
    overflow: hidden !important;
  }
}
</style>
