<!--
  * 파일명 : NetworkDetailGroup.vue
  * 파일 기능 : L4/L7의 상세 사항을 변경/저장할 수 있는 모달데이터입니다. 외부에서 관련 정보를 받아와 내부에서 변경 > 저장 데이터 전송으로 작업이 이루어집니다.
  * 작성자 : 이경환 외 2명
  * 최종 작성일 : 2021-02-22
  * License By Shinsegae I&C
  * 2021-02-22 fix: 정보 추가 오류 수정, L4, L7 일부 정보 변경 못하게 수정
 -->

<template>
  <div
    class="network-detail-group"
  >
    <!-- {{ type }}, ===== TYPE! <br> -->
    <!-- {{ editable }} -->
    <register-contents
      class="info-contents"
      :title="$t('common.GRID.NETWORK.setInfo')"
      :required="editable"
      v-loading="isGetCode"
    >
      <div class="flex-wrap -flex-end">
        <button
          class="button"
          :type="detailData.edit ? 'is-primary' : null"
          @click="toggleEditState(detailData, !detailData.edit)"
          v-if="editable"
        >
          {{ detailData.edit ? $t('task.STATE.complete') : $t('common.TERMS.change') }}
        </button>
      </div>

      <div class="setting-info-list">
        <register-contents
          type="input"
          class="setting-info-item"
          v-for="(item, idx) in settingInfoColumn"
          :key="idx"
          :title="item.label"
          :required="detailData.edit && item.required"
        >
          <template v-if="detailData.edit">
            <div
              class="setting-radio"
              v-if="item.type === 'radio'"
            >
              <el-radio-group
                v-model="changedDetailData[item.field]"
              >
                <el-radio label="IP_ADDRESS">
                  IP
                </el-radio>
                <!-- <el-radio
                  disabled
                  label="DOMAIN"
                >
                  DOMAIN
                </el-radio> -->
              </el-radio-group>
            </div>

            <div
              class="setting-st-select"
              v-else-if="item.type === 'select'"
            >
              <div v-if="item.field === 'protocolType'">
                {{ changedDetailData[item.field] }}
              </div>
              <el-select
                v-else
                v-model="changedDetailData[item.field]"
                :popper-append-to-body="false"
                :placeholder="item.label + ' ' + $t('common.BTN.select')"
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
              v-else-if="item.field === 'ip'"
              disabled
              class="form-input"
              v-model="changedDetailData.ip"
              :placeholder="$t('common.GRID.NETWORK.selectIp')"
              @keydown.native="e => e.preventDefault()"
            />

            <el-input
              v-else-if="item.field === 'port'"
              disabled
              class="form-input"
              v-model="changedDetailData.port"
              :placeholder="$t('admin.PREF.enterPort')"
              type="number"
              :maxlength="5"
              :min="1"
              :max="65535"
              @blur="portValidAction(changedDetailData.port)"
            />

            <el-input
              v-model="changedDetailData.domain"
              v-else-if="item.field === 'domain'"
              disabled
              class="form-input"
            />

            <el-input
              v-else
              class="form-input"
              v-model="changedDetailData[item.field]"
              :placeholder="item.label + ' ' + $t('common.PLACEHOLDER.enter')"
              :disabled="item.field.endsWith('serverName')"
            />
          </template>
          <template v-else>
            <span class="form-read-only">
              {{ changedDetailData[item.field] }}
            </span>
          </template>
        </register-contents>
      </div>
    </register-contents>
    <!-- /. 설정정보 -->

    <!-- 로드밸런스 L4 -->
    <section
      v-if="type === 'l4'"
      class=""
    >
      <register-contents
        :title="$t('common.MODAL.serverInfo')"
        :required="editable"
      >
        <div class="grid-wrap">
          <network-create-table
            :disabled="!editable"
            :editable="editable"
            :info-column="loadBalance4Columns.serverInfoColumns"
            :source-data="detailData.serverInfo"
            :option-data="loadBalance4Columns.options"
            @grid-data="emitData(...arguments, 'serverInfo')"
            :ip-band-idx="detailData.ipBandIdx"
            :project-idx="detailData.projectIdx"
            sw-type="l4"
            :default-setting-data="detailData"
          />
        </div>
      </register-contents>
      <!-- /. 서버 정보 -->

      <register-contents
        :title="$t('common.MODAL.serviceInfo')"
        :required="editable"
      >
        <div class="grid-wrap">
          <network-create-table
            :disabled="!editable"
            :editable="editable"
            :info-column="loadBalance4Columns.serviceColumns"
            :source-data="detailData.serviceList"
            :option-data="loadBalance4Columns.options"
            @grid-data="emitData(...arguments, 'serviceList')"
            :port-valid="true"
            sw-type="l4"
            :default-setting-data="detailData"
            helper
          />
        </div>
      </register-contents>
      <!-- /. 서비스 정보 -->
    </section>
    <!-- /로드밸런스 L4 -->

    <!-- 로드밸런스 L7 -->
    <section
      v-if="type === 'l7'"
      class=""
    >
      <register-contents
        :title="$t('common.MODAL.serverInfo')"
        :required="editable"
      >
        <div class="grid-wrap">
          <!-- :source-data="detailData.networkL7PolicyList[0].networkL7ProjectList[0].networkL7ServerList" -->
          <network-create-table
            :disabled="!editable"
            :editable="editable"
            :info-column="loadBalance7Columns.serverInfoColumns"
            :source-data="detailData.serverInfo"
            :option-data="loadBalance7Columns.options"
            @grid-data="emitData(...arguments, 'serverInfo')"
            :ip-band-idx="detailData.ipBandIdx"
            :project-idx="detailData.projectIdx"
            sw-type="l7"
            :default-setting-data="detailData"
          />
        </div>
      </register-contents>
      <register-contents
        :title="$t('common.MODAL.serviceInfo')"
        :required="editable"
      >
        <div class="grid-wrap">
          <network-create-table
            :disabled="!editable"
            :editable="editable"
            :info-column="loadBalance7Columns.projectColumns"
            :source-data="detailData.serviceList"
            :option-data="loadBalance7Columns.options"
            @grid-data="emitData(...arguments, 'serviceList')"
            :port-valid="true"
            sw-type="l7"
            :default-setting-data="detailData"
            helper
          />
        </div>
      </register-contents>
      <register-contents
        :title="$t('common.MODAL.policyInfo')"
        :required="editable"
      >
        <div class="grid-wrap">
          <network-create-table
            :disabled="!editable"
            :editable="editable"
            :info-column="loadBalance7Columns.policyColumns"
            :source-data="detailData.policies"
            :option-data="loadBalance7Columns.options"
            @grid-data="emitData(...arguments, '_policies')"
            :ip-band-idx="detailData.ipBandIdx"
            :project-idx="detailData.projectIdx"
            :default-setting-data="detailData"
            sw-type="l7"
          />
        </div>
      </register-contents>
    </section>
  </div>
</template>

<script>
import API, { NetworkCreateTable } from '@sd-fe/cmp-core'

export default {
  name: 'NetworkDetailGroup',
  components: {
    NetworkCreateTable
  },
  props: {
    data: {
      type: Object,
      default: () => {}
    },
    type: { // l4 / l7을 구분합니다
      type: String,
      default: null
    },
    editable: {
      type: Boolean,
      default: true
    }
  },

  created () {
    this.detailData = JSON.parse(JSON.stringify(this.data))
    this.changedDetailData = JSON.parse(JSON.stringify(this.detailData))
    this.networkTypeCheck(this.type)
    this.setSwitchOptions()
  },
  methods: {
    networkTypeCheck (nType = this.type) {
      // 설정 데이터 바인딩 조정
      if (nType === 'l4') {
        const columns = this.settingInfoColumn.filter(col => col.field !== 'domain')
        this.settingInfoColumn = columns
        this.settingInfoColumn[0].field = 'vrserverName'
        this.loadBalance4Columns.options.protocolType = [{ label: this.detailData.protocolType }]
      } else if (nType === 'l7') {
        this.settingInfoColumn[0].field = 'csVrserverName'
        this.detailData.policies = [...this.detailData._policies]
        this.loadBalance7Columns.options.protocolType = [{ label: this.detailData.protocolType }]
        this.setL7PjNames(this.updateGridData, 'serviceList')
      }
    },
    /**
     * 스위치 code 조회해서 select의 options를 세팅합니다.
     */
    async setSwitchOptions () {
      const protocolTemp = await this.getCodeList({ codeType: 'SWITCH_PROTOCOL' }) // 프로토콜
      const methodTemp = await this.getCodeList({ codeType: 'SWITCH_ALGORITHM' }) // 방식

      const selectableCols = this.settingInfoColumn.filter(col => col.selectOptions)
      selectableCols.forEach(col => {
        if (col.field === 'protocolType') col.selectOptions = protocolTemp
        else if (col.field === 'method') col.selectOptions = methodTemp
      })
    },
    /**
     * 편집상태 토글
     * @param {Array, Object} item 편집 상태 토글 대상
     * @param {Boolean} state 편집 상태
     */
    toggleEditState (item, state) {
      // console.log('%c toggleEditState', 'color: #9AFFE7')
      if (Array.isArray(item)) item = item.map(child => { child.edit = state })
      else item.edit = state

      // 설정정보 저장시
      if (!this.detailData.edit) this.setChangedData(this.changedDetailData)
      this.$forceUpdate()
    },
    emitData (data, key) {
      this.updateGridData[key] = data.filter(row => !row.newRow)
      this.detailData[key] = data // 서비스 정보 데이터 맵핑에 필요한 서버 정보 데이터를 업데이트
      this.setSvcServerName(key)
    },
    setSvcServerName (key) {
      /**
       * @param {Object} updateData this.updateGridData
       * @param {String} key key값을 가지고 updateData에서 해당 값을 가져옵니다
       * 그리드 update가 안된 경우에는 기본적으로 this.detailData[key에서 가져옵니다.]
       */
      const getSvrNames = (updateData = this.updateGridData, key) => {
        const uData = updateData[key] ? updateData[key] : this.detailData[key]
        // null과 undefined가 존재하면 걸러서 반환합니다.
        return uData?.map(svr => svr.serverName).filter(v => v !== null && v !== undefined) // 서버정보 > 서버명
      }

      const svrNames = getSvrNames(this.updateGridData, 'serverInfo')
      const svcNames = getSvrNames(this.updateGridData, 'serviceList')

      // 자동으로 하위 options를 바인딩해줍니다.
      if (this.type === 'l4') {
        this.loadBalance4Columns.options.serverName = this.getMatchSvrNameList(svrNames, svcNames, key).unoverlapNames
      } else if (this.type === 'l7') {
        this.loadBalance7Columns.options.serverName = this.getMatchSvrNameList(svrNames, svcNames, key).unoverlapNames
        this.setL7PjNames(this.updateGridData, 'serviceList')
      }

      for (const key in this.updateGridData) this.changedDetailData[key] = this.updateGridData[key]

      this.setChangedData(this.changedDetailData)
      this.$forceUpdate()
    },
    /**
     * @param {Array} svrNames - 서버정보(서버명) 배열
     * @param {Array} svcNames - 프로젝트 정보(서버명) 배열
     * 서버정보(서버명) - 프로젝트정보(서버명) 이 중복되는 경우를 제외한 결과를 반환합니다
     */
    getMatchSvrNameList (svrNames, svcNames, key) {
      const unoverlapNames = []
      const overlapNames = []
      const allSvrNames = Array.from(new Set(svrNames.concat(svcNames))) // 중복없는 모든 서버명 ip 모음

      // 나중에 리스트가 텅 빈경우도 처리 필요..(사용자 참고~)
      svrNames.forEach(svrName => {
        const some = svcNames.some(svcName => svrName === svcName)
        if (!some) unoverlapNames.push({ label: svrName })
        else overlapNames.push(svrName)
      })

      // const copyDetail = { ...this.detailData }
      // const uData = this.updateGridData
      // const serviceList = uData.serviceList ? [...uData.serviceList] : [...copyDetail.serviceList]

      // [프로젝트 정보] row 변경만 할 때
      // this.updateGridData.serviceList = serviceList.map(project => {
      //   project.serviceName = `svc_${project.serverName}_${project.port}`
      //   return project
      // })

      this.removeUnmatchedRow(overlapNames, allSvrNames, key)

      return { unoverlapNames, overlapNames }
    },
    /**
    * [서버 정보]에 맵핑되는 주소가 없는경우 [서비스 정보]의 row를 <삭제>합니다
    * @param { Array } overlapNames 중복되는 ip들 모음
    * @param { Array } allIps 모든 ip들 중복없이 모음
    * @param { String } key 변경된 그리드 종류
    */
    removeUnmatchedRow (overlapNames, allIps, key) {
      // 중복되지 않는 ip 리스트를 저장합니다.
      const copyDetail = { ...this.detailData }

      const result = []
      allIps.forEach(ip => overlapNames.indexOf(ip) === -1 ? result.push(ip) : null)

      const uData = this.updateGridData
      const serviceList = uData.serviceList ? [...uData.serviceList] : copyDetail.serviceList
      const policies = uData._policies ? [...uData._policies] : copyDetail.policies

      const setPolicies = () => {
        // [서비스 정보 > 서비스 명] 변경시 [정책 정보 > 서비스 명] 자동 삭제
        if (this.type === 'l7' && this.updateGridData) {
          const serviceNames = this.updateGridData?.serviceList?.map(svc => svc.serviceName)
          this.updateGridData._policies = policies.filter(policy => {
            const svcList = policy.policy_serviceList
            if (svcList && serviceNames) {
              return svcList.every(name => serviceNames.includes(name))
            } else return true
          })
          this.detailData.policies = this.updateGridData?._policies
        }
      }

      // [서비스 정보]가 변경될 때 하단의 정책정보를 업데이트합니다.
      if (key === 'serviceList') return setPolicies()
      // [정책 정보]가 변경될때는 아무것도 하지 않습니다.
      if (key === '_policies') return

      // [서버정보 > 서버명] 변경시 [서비스 정보 > 서버명] 자동 삭제
      result.forEach(ip => {
        this.updateGridData.serviceList = serviceList.filter((project, idx) => project.serverName !== ip)
        this.detailData.serviceList = this.updateGridData.serviceList
      })

      return setPolicies()
    },
    /**
     * @param {Object} updateData this.updateGridData
     * @param {String} key key값을 가지고 updateData에서 해당 값을 가져옵니다
     * 프로젝트 정보(프로젝트명) 리스트를 가지고 배열을 만들어 옵션을 생성합니다.
     */
    setL7PjNames (updateData = this.updateGridData, key) {
      // 프로젝트명 바인딩
      const uData = updateData[key] ? updateData[key] : this.detailData[key]
      const serviceLists = uData.map(info => { return { label: info.serviceName } })
      this.loadBalance7Columns.options.policy_serviceList = serviceLists
    },
    // 그리드 변경 / 설정정보 변경이 있을때마다 emit 합니다.
    setChangedData (data = this.changedDetailData) {
      // console.log('%c setChangedData', 'color: #EAFF9A')
      this.$emit('changed-data', data)
    },
    /**
     * 포트일 경우, 1~65535만 가능
     */
    portValidAction (value) {
      if (value < 1 || value > 65535) {
        this.$alert(this.$t('common.ALERT.SECURITY.018'), '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          dangerouslyUseHTMLString: true
        })
        this.$nextTick(function () {
          this.changedDetailData.port = ''
        })
      }
    },
    /**
     * Code 데이터 조회
     */
    async getCodeList (params) {
      try {
        this.isGetCode = true

        const response = await API.config.getCodeList(params)

        if (response) {
          return response.map(code => {
            return {
              name: code.codeName,
              field: code.codeVal
            }
          })
        }
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.alert(message, () => false)
        this.isGetCode = false
      } finally {
        this.isGetCode = false
      }
    }
  },
  data () {
    return {
      isGetCode: false, // 로딩: code 조회
      isCreateLbName: false, // 로딩: 로드밸런스명 생성
      serverData: [],
      projectsData: [],
      detailData: {},
      updateGridData: {},
      changedDetailData: {},
      ipBandIdx: 0,
      settingInfoColumn: [
        { field: 'vrserverName', label: this.$t('common.REGCON.name') },
        { field: 'ipAddressType', label: this.$t('common.GRID.type'), type: 'radio' },
        { field: 'domain', label: this.$t('admin.ORG.domain'), required: true },
        { field: 'ip', label: this.$t('common.GRID.NETWORK.virtualIp') },
        { field: 'port', label: this.$t('common.GRID.NETWORK.port') },
        { field: 'protocolType', label: this.$t('common.MODAL.protocol'), type: 'select', selectOptions: [] },
        { field: 'method', label: this.$t('common.GRID.NETWORK.system'), type: 'select', required: true, selectOptions: [] },
        { field: 'comment', label: this.$t('common.MODAL.explain') }
        // { field: 'directionType', label: '망 구분', type: 'select', selectOptions: [{ name: '외부', field: 'out' }, { name: '내부', field: 'in' }] },
        // { field: 'serviceType', label: '서비스', type: 'select', selectOptions: [{ name: 'WAS', field: 'was' }, { name: 'WEB', field: 'web' }] }
      ],

      // 로드밸런스 4
      loadBalance4Columns: {
        serverInfoColumns: [
          { binding: 'serverName', header: this.$t('common.GRID.NETWORK.serverName'), sorting: false, customHtml: true, autoName: true },
          { binding: 'serverType', header: this.$t('common.GRID.type'), sorting: false, customHtml: true, radio: true, defaultValue: 'IP' },
          { binding: 'hostName', header: this.$t('common.REGCON.hostName'), sorting: false, customHtml: true, host: true },
          { binding: 'ip', header: this.$t('common.GRID.addr'), sorting: false, customHtml: true, ip: true }
        ],
        serviceColumns: [
          { binding: 'serviceName', header: this.$t('common.GRID.serviceName'), sorting: false, customHtml: true, autoName: true },
          { binding: 'port', header: this.$t('common.GRID.NETWORK.port'), sorting: false, customHtml: true, number: true },
          { binding: 'protocolType', header: this.$t('common.GRID.STORAGE.protocol'), sorting: false, customHtml: true, select: true },
          { binding: 'serverName', header: this.$t('common.GRID.NETWORK.serverName'), sorting: false, customHtml: true, select: true }
        ],
        options: {
          protocolType: [],
          serverName: []
          // protocolType: [{ label: 'TCP' }, { label: 'HTTP' }],
          // serverName: [{ label: 'DestType1' }, { label: 'DestType2' }, { label: 'DestType3' }, { label: 'DestType4' }]
        }
      },

      // 로드밸런스 7
      loadBalance7Columns: {
        serverInfoColumns: [
          { binding: 'serverName', header: this.$t('common.GRID.NETWORK.serverName'), sorting: false, customHtml: true, autoName: true },
          { binding: 'serverType', header: this.$t('common.GRID.type'), sorting: false, customHtml: true, radio: true, defaultValue: 'IP' },
          { binding: 'hostName', header: this.$t('common.GRID.hostName'), sorting: false, customHtml: true, host: true },
          { binding: 'ip', header: this.$t('common.GRID.addr'), sorting: false, customHtml: true, ip: true }
        ],
        projectColumns: [
          { binding: 'serviceName', header: this.$t('common.GRID.serviceName'), sorting: false, customHtml: true, autoName: true },
          { binding: 'port', header: this.$t('common.GRID.NETWORK.port'), sorting: false, customHtml: true, number: true },
          { binding: 'protocolType', header: this.$t('common.GRID.STORAGE.protocol'), sorting: false, customHtml: true, select: true },
          { binding: 'serverName', header: this.$t('common.GRID.NETWORK.serverName'), sorting: false, customHtml: true, select: true }
        ],
        policyColumns: [
          { binding: 'policyName', header: this.$t('common.GRID.NETWORK.policyName'), sorting: false, customHtml: true, autoName: true },
          { binding: 'targetIp', header: this.$t('common.GRID.NETWORK.targetIp'), sorting: false, customHtml: true },
          { binding: 'expression', header: this.$t('common.GRID.NETWORK.pattern'), sorting: false, customHtml: true },
          { binding: 'policy_serviceList', header: this.$t('common.GRID.serviceName'), sorting: false, customHtml: true, limitedTags: true }
        ],
        options: {
          protocolType: [],
          serviceName: [],
          policy_serviceList: []
          // protocolType: [{ label: 'HTTP' }, { label: 'TCP' }],
          // serverName: []
          // projectName: [{ label: 'StartType1' }, { label: 'StartType2' }, { label: 'StartType3' }, { label: 'StartType4' }],
          // protocol: [{ label: 'StartType1' }, { label: 'StartType2' }, { label: 'StartType3' }, { label: 'StartType4' }],
          // serverName: [{ label: 'DestType1' }, { label: 'DestType2' }, { label: 'DestType3' }, { label: 'DestType4' }]
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.network-detail-group {
  height: 70vh;
  overflow-y: auto;
  border-top: 1px solid $border-color;
  .info-contents {
    // & + .info-contents {margin-top: 50px;}

    .-flex-end {
      display: flex;
      justify-content: flex-end;
    }
    .setting-info-list {
      margin-top: $gap-s;
      // border-top: 1px solid $border-color;
    }
  }
  .sub-title { margin-bottom: 0; }

  .ip-popup-background { // ip 팝업
    position: fixed;
    top: 0; left: 0;
    bottom: 0; right: 0;
    z-index: 5;

    &::before {
      content: '';
      background-color: rgba(0,0,0,.5);
      width: 100%; height: 100%;
      display: block;
    }
  }
}

.setting-info-item {
  .setting-st-select {
    width: 200px;
  }
  .form-read-only {
    height: 29px;
  }
}
</style>

<style lang="scss">
.network-detail-group {
  .setting-radio {
    .el-radio-group {
      .el-radio__label {
        margin-right: $gap;
      }
      .el-radio {
          &.is-checked {
          > .el-radio__label {
            color: $color-lightgrey !important;
          }
        }
      }
    }
  }
  .el-input.form-input {
    .el-input__inner {border: 1px solid $input-stroke;}
  }
}

// .grid-wrap {
//   border: 1px solid red;
//   // width: 100%;
//   // div[wj-part=root] {
//   //   overflow: hidden !important;
//   // }
// }
</style>
