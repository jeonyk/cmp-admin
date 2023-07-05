<!--
  * 파일명 : TaskNetwork.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-04-07
  * License By Shinsegae I&C
  * ------ 2021-04-07 Deprecated ------ *
 -->

<template>
  <div class="task-network task-resource-grid">
    <section
      class="title-area flex-wrap"
      style="justify-content: space-between;"
    >
      <div class="process-top-area">
        <span class="sub-title">Network</span>

        <view-box-cnt :type="field === 'conference' ? 'is-black' : 'is-white'">
          {{ l4TableData.length + l7TableData.length }}
        </view-box-cnt>
        <small v-if="field==='conference'">주문 정보</small>
      </div>
    </section>
    <g-tab
      :data="tabData"
      class="network-tab"
      @click="(param) => { thisPage = param.field}"
    >
      <template #header>
        <button
          v-if="editable && field === 'todo'"
          class="button"
          type="is-primary"
          @click="executeWork"
          style="margin-bottom: 10px;"
          data-html2canvas-ignore="true"
        >
          {{ $t('common.BTN.TASK.exec') }}
        </button>
      </template>

      <template #l4>
        <cmp-grid
          :item-source="l4TableData"
          :columns="columns"
          class="task-resource-grid overflow-visible-grid"
          selectable
          @selectedRow="selectL4Row"
          :init-custom-action="initL4Grid"
        >
          <template
            v-for="column in columns"
            slot-scope="props"
            :slot="column.binding"
          >
            <section :key="column.binding">
              <template v-if="Object.keys(props.row).includes('workResult') && column.binding === 'workResult'">
                <div class="cell-flex-wrap">
                  <cmp-status-tag
                    :type="props.row.workResult === true ? 'is-success' : 'is-fail'"
                    :contents="props.row.workResult === true ? '성공' : '실패'"
                  />
                  <button
                    v-if="editable && props.row.workResult === false"
                    class="button"
                    style="margin-left: 5px;"
                    @click.stop="(e) => {
                      props.row.workResult = true
                      $forceUpdate()
                    }"
                  >
                    {{ $t('common.BTN.TASK.success') }}
                  </button>
                </div>
              </template>
              <!-- /. 작업결과 -->
            </section>
          </template>

          <template #settingname="props">
            <div class="cell-flex-wrap">
              <cmp-status-tag
                type="mp"
                tooltip
                tooltip-cont="WEBTOB5-RHEL7"
                tooltip-position="top-start"
                v-if="props.row.setting.name !== ''"
              />
              {{ props.row.setting.name }}
            </div>
          </template>

          <template #serverInfoaddress="props">
            <span v-if="props.row.serverInfo.address">{{ props.row.serverInfo.address }}</span>
            <span
              v-else
              style="color: skyblue; cursor:pointer"
              @click="$router.go(-1)"
            >
              입력
            </span>
          </template>
        </cmp-grid>
      </template>

      <template #l7>
        <cmp-grid
          :item-source="l7TableData"
          :columns="columns"
          class="task-resource-grid overflow-visible-grid"
          selectable
          @selectedRow="selectL7Row"
          :init-custom-action="initL7Grid"
        >
          <template
            v-for="column in columns"
            slot-scope="props"
            :slot="column.binding"
          >
            <section :key="column.binding">
              <template v-if="Object.keys(props.row).includes('workResult') && column.binding === 'workResult'">
                <div class="cell-flex-wrap">
                  <cmp-status-tag
                    :type="props.row.workResult === true ? 'is-success' : 'is-fail'"
                    :contents="props.row.workResult === true ? '성공' : '실패'"
                  />
                  <button
                    v-if="editable && props.row.workResult === false"
                    class="button"
                    style="margin-left: 5px;"
                    @click.stop="(e) => {
                      props.row.workResult = true
                      $forceUpdate()
                    }"
                  >
                    {{ $t('common.BTN.TASK.success') }}
                  </button>
                </div>
              </template>
              <!-- /. 작업결과 -->
            </section>
          </template>

          <template #settingname="props">
            <div class="cell-flex-wrap">
              <cmp-status-tag
                type="mp"
                tooltip
                tooltip-cont="WEBTOB5-RHEL7"
                tooltip-position="top-start"
                v-if="props.row.setting.name !== ''"
              />
              {{ props.row.setting.name }}
            </div>
          </template>

          <template #serverInfoaddress="props">
            <span v-if="props.row.serverInfo.address">{{ props.row.serverInfo.address }}</span>
            <span
              v-else
              style="color: skyblue; cursor:pointer"
              @click="$router.go(-1)"
            >
              입력
            </span>
          </template>
        </cmp-grid>
      </template>
    </g-tab>

    <!-- 네트워크 상세 변경 모달 -->
    <el-dialog
      class="network-detail-modal"
      :visible.sync="detailModal.view"
      title="네트워크 정보 상세"
      width="80%"
      top="5vh"
      :before-close="beforeClose"
    >
      <section class="modal-body">
        <network-detail-group
          v-if="detailModal.data"
          :type="type"
          :data="paramData"
        />
      </section>

      <div class="big-button-area">
        <button
          class="button"
          @click="beforeClose"
        >
          취소
        </button>
        <button
          class="button"
          type="is-primary"
          @click="saveChangedDetail"
        >
          확인
        </button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import ViewBox from '@/components/ViewBoxCnt/ViewBoxCnt'
import NetworkDetailGroup from './NetworkDetailGroup'

export default {
  name: 'TaskNetwork',
  components: {
    'view-box-cnt': ViewBox,
    'network-detail-group': NetworkDetailGroup
  },
  props: {
    editable: {
      type: Boolean,
      default: true
    },
    field: {
      type: String,
      default: ''
    }
  },
  created () {
    // this.setColumns()
    this.columns = this.setColumns_V3(this.columns)
    this.l4TableData = JSON.parse(JSON.stringify(this.l4GridData))
    this.l7TableData = JSON.parse(JSON.stringify(this.l7GridData))
  },
  watch: {
    l4GridData (newVal) {
      this.l4TableData = JSON.parse(JSON.stringify(newVal))
    },
    l7GridData (newVal) {
      this.l7TableData = JSON.parse(JSON.stringify(newVal))
    }
  },
  methods: {
    initL4Grid (grid) {
      this.l4grid = grid
    },
    initL7Grid (grid) {
      this.l7grid = grid
    },
    /**
     * 한 일, 할 일 일 때, 작업실행 관련 칼럼을 추가합니다.
     */
    setColumns () {
      const executeCol =
        { header: '작업 상태', binding: 'workResult', customHtml: true, width: 200 }
      if (this.field === 'todo' || this.field === 'done') this.columns.push(executeCol)
    },
    selectL4Row (rowData) {
      // console.log(rowData, '---seelctedrow')
      this.rowData = rowData
      this.type = 'l4'

      if (this.rowData) {
        // if (rowData) this.paramData = Object.assign(this.rowData.dataItem, { edit: false })
        this.paramData = Object.assign(this.rowData.dataItem, { edit: false })

        this.detailModal = {
          view: !!this.rowData,
          data: this.paramData
        }
      }
    },
    selectL7Row (rowData) {
      // console.log(rowData, '---seelctedrow')
      this.rowData = rowData
      this.type = 'l7'

      if (this.rowData) {
        // if (rowData) this.paramData = Object.assign(this.rowData.dataItem, { edit: false })
        this.paramData = Object.assign(this.rowData.dataItem, { edit: false })

        // console.log(this.paramData, 'param')
        this.detailModal = {
          view: !!this.rowData,
          data: this.paramData
        }
      }
    },
    beforeClose () {
      this.$confirm(this.$t('common.CONFIRM.BASE.007'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => this.closeModal())
        .catch(() => false)
    },
    closeModal () {
      this.rowData = null
      this.paramData = null
      this.detailModal = {
        view: false,
        data: null
      }
      this.gridRefresh(this.l4grid)
      this.gridRefresh(this.l7grid)
    },
    gridRefresh (grid) {
      const cv = grid.collectionView
      cv.refresh()
    },
    saveChangedDetail () {
      this.$confirm(this.$t('common.CONFIRM.BASE.006'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.closeModal()
        // request...
      }).catch(() => false)
    },
    stateDesc (state = undefined) {
      return {
        wait: '대기',
        delay: '지연',
        undefined: '미등록',
        ing: '처리중',
        confirm: '확인',
        fail: '실패',
        new: '신규'
      }[state]
    },
    /**
     * [작업 실행]
     */
    executeWork () {
      if (this.thisPage === 'l4') {
        this.l4GridData = this.l4GridData.map(item => {
          return {
            ...item,
            workResult: true
          }
        })
      } else {
        this.l7GridData = this.l7GridData.map(item => {
          return {
            ...item,
            workResult: true
          }
        })
      }
      this.$forceUpdate()
    }
  },
  data () {
    return {
      isEditing: false,
      tableData: [],
      detailModal: {
        view: false,
        data: null
      },
      paramData: null,
      rowData: null,
      thisPage: 'l4', // 현재 보고있는 텝..
      // 네트워크 영역 샘플 데이터 및 헤더
      // L4
      columns: [
        { header: '로드 밸런스명', binding: 'setting.name', customHtml: true },
        { header: '가상IP', binding: 'setting.virtualIp' },
        { header: '포트', binding: 'setting.port' },
        { header: '프로토콜', binding: 'setting.protocol' },
        { header: '방식', binding: 'setting.method' },
        { header: '설명', binding: 'setting.desc' }
        // { header: '작업 결과', binding: 'workResult', customHtml: true }
      ],
      l4GridData: [
        {
          setting: { name: '로드밸런스1', type: 'IP', virtualIp: '192.168.123.123', port: 80, protocol: 'HTTP', method: 'ROUNDROBIN', desc: '설명....1', net: '망망,,', service: 'serviceservcie..' },
          projectInfo: [
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' }
          ],
          serverInfo: [
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' }
          ],
          workResult: false,
          quantity: 2,
          payment: 10000
        },
        {
          setting: { name: '로드밸런스2', type: 'IP', virtualIp: '192.168.123.123', port: 8080, protocol: 'TCP', method: 'HHH', desc: '설명....2', net: '망망,,', service: 'serviceservcie..' },
          projectInfo: [
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' }
          ],
          serverInfo: [
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' }
          ],
          workResult: true,
          quantity: 2,
          payment: 10000
        },
        {
          setting: { name: '로드밸런스3', type: 'IP', virtualIp: '192.168.123.123', port: 1009, protocol: 'HTTP', method: 'TTTT', desc: '설명....3', net: '망망,,', service: 'serviceservcie..' },
          projectInfo: [
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' }
          ],
          serverInfo: [
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' }
          ],
          workResult: false,
          quantity: 2,
          payment: 10000
        },
        {
          setting: { name: '로드밸런스1', type: 'IP', virtualIp: '192.168.123.123', port: 80, protocol: 'HTTP', method: 'ROUNDROBIN', desc: '설명....1', net: '망망,,', service: 'serviceservcie..' },
          projectInfo: [
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' }
          ],
          serverInfo: [
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' }
          ],
          workResult: false,
          quantity: 2,
          payment: 10000
        },
        {
          setting: { name: '로드밸런스2', type: 'IP', virtualIp: '192.168.123.123', port: 8080, protocol: 'TCP', method: 'HHH', desc: '설명....2' },
          projectInfo: [
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' }
          ],
          serverInfo: [
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' }
          ],
          workResult: true,
          quantity: 2,
          payment: 10000
        },
        {
          setting: { name: '로드밸런스3', type: 'IP', virtualIp: '192.168.123.123', port: 1009, protocol: 'HTTP', method: 'TTTT', desc: '설명....3' },
          projectInfo: [
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' }
          ],
          serverInfo: [
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' }
          ],
          workResult: false,
          quantity: 2,
          payment: 10000
        },
        {
          setting: { name: '로드밸런스1', type: 'IP', virtualIp: '192.168.123.123', port: 80, protocol: 'HTTP', method: 'ROUNDROBIN', desc: '설명....1' },
          projectInfo: [
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' }
          ],
          serverInfo: [
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' }
          ],
          workResult: false,
          quantity: 2,
          payment: 10000
        },
        {
          setting: { name: '로드밸런스2', type: 'IP', virtualIp: '192.168.123.123', port: 8080, protocol: 'TCP', method: 'HHH', desc: '설명....2' },
          projectInfo: [
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' }
          ],
          serverInfo: [
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' }
          ],
          workResult: true,
          quantity: 2,
          payment: 10000
        },
        {
          setting: { name: '로드밸런스3', type: 'IP', virtualIp: '192.168.123.123', port: 1009, protocol: 'HTTP', method: 'TTTT', desc: '설명....3' },
          projectInfo: [
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' },
            { name: '프로젝트 1', port: 70, protocol: 'HTTP', serverName: '서버 1', desc: '설명...' }
          ],
          serverInfo: [
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' },
            { name: '서버 1', type: 'IP', address: '10.10.10.10', desc: '설명....' }
          ],
          workResult: false,
          quantity: 2,
          payment: 10000
        }
      ],
      l7GridData: [
        {
          setting: { name: '로드밸런스1', type: 'IP', virtualIp: '192.168.123.123', port: 80, protocol: 'HTTP', method: 'ROUNDROBIN', desc: '설명....1', net: '망망,,', service: 'serviceservcie..' },
          policyData: [
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] },
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] },
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] }
          ],
          projectData: [
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' }
          ],
          serverData: [{ protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }, { protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }, { protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }],
          workResult: false,
          quantity: 2,
          payment: 10000
        },
        {
          setting: { name: 'asdfasdf', type: 'IP', virtualIp: '192.168.123.123', port: 8080, protocol: 'TCP', method: 'HHH', desc: '설명....2', net: '망망,,', service: 'serviceservcie..' },
          policyData: [
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] },
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] },
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] }
          ],
          projectData: [
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' }
          ],
          serverData: [{ protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }, { protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }, { protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }],
          workResult: true,
          quantity: 2,
          payment: 10000
        },
        {
          setting: { name: 'asdfasfd', type: 'IP', virtualIp: '192.168.123.123', port: 1009, protocol: 'HTTP', method: 'TTTT', desc: '설명....3', net: '망망,,', service: 'serviceservcie..' },
          policyData: [
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] },
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] },
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] }
          ],
          projectData: [
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' }
          ],
          serverData: [{ protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }, { protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }, { protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }],
          workResult: false,
          quantity: 2,
          payment: 10000
        },
        {
          setting: { name: '로드werqr23r밸런스1', type: 'IP', virtualIp: '192.168.123.123', port: 80, protocol: 'HTTP', method: 'ROUNDROBIN', desc: '설명....1', net: '망망,,', service: 'serviceservcie..' },
          policyData: [
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] },
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] },
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] }
          ],
          projectData: [
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' }
          ],
          serverData: [{ protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }, { protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }, { protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }],
          workResult: false,
          quantity: 2,
          payment: 10000
        },
        {
          setting: { name: 'asdfsdaf', type: 'IP', virtualIp: '192.168.123.123', port: 8080, protocol: 'TCP', method: 'HHH', desc: '설명....2' },
          policyData: [
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] },
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] },
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] }
          ],
          projectData: [
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' }
          ],
          serverData: [{ protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }, { protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }, { protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }],
          workResult: true,
          quantity: 2,
          payment: 10000
        },
        {
          setting: { name: 'asdfsadf', type: 'IP', virtualIp: '192.168.123.123', port: 1009, protocol: 'HTTP', method: 'TTTT', desc: '설명....3' },
          policyData: [
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] },
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] },
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] }
          ],
          projectData: [
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' }
          ],
          serverData: [{ protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }, { protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }, { protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }],
          workResult: false,
          quantity: 2,
          payment: 10000
        },
        {
          setting: { name: 'asdfasdf', type: 'IP', virtualIp: '192.168.123.123', port: 80, protocol: 'HTTP', method: 'ROUNDROBIN', desc: '설명....1' },
          policyData: [
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] },
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] },
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] }
          ],
          projectData: [
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' }
          ],
          serverData: [{ protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }, { protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }, { protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }],
          workResult: false,
          quantity: 2,
          payment: 10000
        },
        {
          setting: { name: '로드밸런스2', type: 'IP', virtualIp: '192.168.123.123', port: 8080, protocol: 'TCP', method: 'HHH', desc: '설명....2' },
          policyData: [
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] },
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] },
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] }
          ],
          projectData: [
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' }
          ],
          serverData: [{ protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }, { protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }, { protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }],
          workResult: true,
          quantity: 2,
          payment: 10000
        },
        {
          setting: { name: '로드밸런스3', type: 'IP', virtualIp: '192.168.123.123', port: 1009, protocol: 'HTTP', method: 'TTTT', desc: '설명....3' },
          policyData: [
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] },
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] },
            { policyName: '정책명 1', pattern: 'abcdefghijklmnop', projectName: ['프로젝트 1', '프로젝트 2', '프로젝트 3'] }
          ],
          projectData: [
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' },
            { name: '프로젝트명 1', port: '포트', protocol: '프로토콜..', serverName: '서버네임' }
          ],
          serverData: [{ protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }, { protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }, { protocol: 'protoc', name: 'asdfasfdf', ip: '10.0.0.1', desc: 'TEST' }],
          workResult: false,
          quantity: 2,
          payment: 10000
        }
      ],

      // 탭 데이터
      tabData: [
        { isActive: true, field: 'l4', name: '로드 밸런스(L4)' },
        { field: 'l7', name: '로드 밸런스(L7)' }
      ]
    }
  }
}
</script>
<style lang="scss">
  .task-network {
    .network-tab {
      > .tab-contents-area {
        padding-top: $gap;
      }
    }
  }
</style>
