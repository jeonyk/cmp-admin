<!--
  * 파일명 : ConfigNetworkRoutingDetail.vue
  * 파일 기능 : 경유지 관리 상세 조회 및 관리(항목 추가, 변경, 삭제)
  * 작성자 : 정재은 외 3명
  * 최종 작성일 : 2021-01-15
  * License By Shinsegae I&C
  * 2021-01-15 Update: lodash 사용방식 변경
 -->

<template>
  <dashboard-panel
    class="config-network-routing-detail body-panel -right"
    :title="detailInfo? detailInfo.roadName: 'roadName 없음.'"
    :padding-top="0"
  >
    <template #headerPrefix>
      <button
        class="button -prev-button"
        type="is-icon"
        style="margin-right: 10px;"
        @click="$router.go(-1)"
        v-if="detailIdx === undefined"
      >
        <i
          class="mdi mdi-chevron-left"
          size="is-large"
        />
      </button>
    </template>
    <section
      class="prev-data-info"
      v-loading="loading.isAllRoad"
    >
      <vertical-table
        :columns="roadDetailColumns"
        :data="detailInfo"
        type="horizontal"
      >
        <template #srcCompanyIdx>
          <span>{{ detailInfo ? getCompanyName(Number(detailInfo.srcCompanyIdx)) : '-' }}</span>
        </template>
        <template #dstCompanyIdx>
          <span>{{ detailInfo ? getCompanyName(Number(detailInfo.dstCompanyIdx)) : '-' }}</span>
        </template>
      </vertical-table>
    </section>
    <!-- 경유지 상세 -->

    <section
      class="prev-data-detail"
      v-loading="loading.isRoadDetail"
    >
      <div class="table-top-wrap">
        <total-count
          class="total-count-wrap"
          :total-count="gridTotalCnt"
        />

        <div
          class="button-area -right"
          v-if="detailIdx === undefined"
        >
          <div class="button-area">
            <!-- 항목 추가 -->
            <button
              class="button"
              type="is-primary"
              @click="applyUpdateItem()"
            >
              {{ $t('common.TERMS.itemAdd') }}
            </button>

            <!-- 변경 -->
            <button
              class="button"
              :disabled="!selectedRow"
              @click="applyUpdateItem(selectedRow._data)"
            >
              {{ $t('common.BTN.change') }}
            </button>

            <!-- 삭제 -->
            <button
              class="button"
              type="is-anti"
              @click="applyRemove"
              :disabled="!selectedRow"
            >
              {{ $t('common.BTN.delete') }}
            </button>
          </div>
        </div>
      </div>

      <div class="table-area">
        <cmp-grid
          class="network-routing-grid"
          :header-merge="headerMergeColumns"
          :columns="policyColumns"
          :item-source="detailTableData"
          :selectable="detailIdx === undefined"
          @selectedRow="row => { selectedRow = row }"
          @total-count="cnt => gridTotalCnt = cnt"
        />
      </div>
    </section>
    <!-- 경유지 정책 -->

    <!-- 모달 -->
    <!-- 항목 생성/수정 모달 -->
    <el-dialog
      :title="modalTitle"
      :visible.sync="newItemModal"
      class="new-item-modal"
      width="600px"
      @close="newItemModal = false"
    >
      <section
        class="modal-body"
        style="border-top: 1px solid #3D435E"
      >
        <register-contents
          :title="$t('admin.PREF.routingName')"
          required
        >
          <el-input
            :placeholder="$t('common.ALERT.NETWORK.005')"
            v-model="updateItem.routeName"
            ref="routeNameInput"
          />
        </register-contents>
        <!-- path.라우팅 명 -->

        <register-contents
          :title="$t('admin.PREF.srcNetworkClass')"
          required
        >
          <el-select
            v-model="updateItem.srcIntf"
            :placeholder="$t('common.ALERT.SECURITY.030')"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in netOptions"
              :key="item.field"
              :label="item.field"
              :value="item.field"
            />
          </el-select>
        </register-contents>
        <!-- path.SRC 망 구분 -->

        <register-contents
          :title="$t('admin.PREF.dstNetworkClass')"
          required
        >
          <el-select
            v-model="updateItem.dstIntf"
            :placeholder="$t('common.ALERT.SECURITY.022')"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in netOptions"
              :key="item.field"
              :label="item.field"
              :value="item.field"
            />
          </el-select>
        </register-contents>
        <!-- path.DST 망 구분 -->

        <register-contents
          title="SRC"
          required
        >
          <el-select
            v-model="updateItem.srcIpType"
            :placeholder="$t('admin.PREF.enterSrc')"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in policyOptions"
              :key="item.field"
              :label="item.field"
              :value="item.field"
            />
          </el-select>
        </register-contents>
        <!-- 정책.SRC -->

        <register-contents
          title="DST"
          required
        >
          <el-select
            v-model="updateItem.dstIpType"
            :placeholder="$t('admin.PREF.enterDst')"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in policyOptions"
              :key="item.field"
              :label="item.field"
              :value="item.field"
            />
          </el-select>
        </register-contents>
        <!-- 정책.DST -->

        <register-contents
          title="NAT"
          required
        >
          <el-select
            v-model="updateItem.nat"
            :placeholder="$t('admin.PREF.enterNat')"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in natOptions"
              :key="item.field"
              :label="item.field"
              :value="item.field"
            />
          </el-select>
        </register-contents>
        <!-- 정책.NAT -->
      </section>

      <div class="modal-footer modal-button-area">
        <!-- 취소 -->
        <button
          class="button -modal-button"
          type="is-anti"
          @click="cancelSave"
        >
          {{ $t('common.BTN.cancel') }}
        </button>

        <!-- 확인 -->
        <button
          class="button -modal-button"
          @click="confirmUpdateRoad"
          type="is-primary"
        >
          {{ $t('common.BTN.confirm') }}
        </button>
      </div>
    </el-dialog>
  </dashboard-panel>
</template>

<script>
import API, { DashboardPanel, VerticalTable } from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'

export default {
  name: 'ConfigNetworkRoutingDetail',
  components: {
    'dashboard-panel': DashboardPanel,
    VerticalTable
  },
  props: {
    detailIdx: {
      type: Number,
      default: undefined
    }
  },
  computed: {
    modalTitle () {
      if (this.updateItem.roadDetailIdx !== undefined) return this.$t('admin.PREF.changeItem')
      else return this.$t('common.TERMS.itemAdd')
    }
  },
  async created () {
    if (this.detailIdx === undefined) this.roadIdx = Number(this.$route.params.roadIdx)
    else this.roadIdx = this.detailIdx
    this.init()
  },
  methods: {
    async init () {
      await this.getGroupList({ groupUpper: 0 })
      await this.getPolicyRoads()
    },
    /**
     * 전체 관계사 조회
     */
    async getGroupList (param) {
      const response = await API.iam.getGroupList(param)
      if (!response) return

      // 관계사만 담아줌..
      const result = response.map(item => {
        return {
          label: item.groupName,
          field: item.groupIdx
        }
      })

      this.companyOptions = result
    },
    /**
     * 경유지 전체 조회
     */
    async getPolicyRoads () {
      try {
        this.loading.isAllRoad = true
        const response = await API.network.getPolicyRoads()
        if (!response || !this.roadIdx) {
          this.$alert(this.$t('common.PLACEHOLDER.stopoverInfo'))
          return this.$emit('error')
        }
        const allRoads = [...response]

        this.detailInfo = allRoads.find(item => item.roadIdx === this.roadIdx)

        if (this.detailIdx === undefined) {
          this.$store.commit('common/ADD_PARAMETERS', {
            label: this.detailInfo.roadName,
            path: ''
          })
        }

        await this.getPolicyRoadDetails()
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.projectTreeData = []
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
        this.loading.isAllRoad = false
        throw error
      } finally {
        this.loading.isAllRoad = false
      }
    },
    /**
     * 선택한 경유지에 대한 상세 정보
     */
    async getPolicyRoadDetails () {
      try {
        this.loading.isRoadDetail = true
        const response = await API.network.getPolicyRoadDetails(this.roadIdx)
        if (!response) return

        const data = response.map(policy => policy) // roadDetailIdx로 sorting (04.20)
          .sort((policy1, policy2) => policy1?.roadDetailIdx - policy2?.roadDetailIdx)

        this.detailTableData = data
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.projectTreeData = []
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
        this.loading.isRoadDetail = false
        throw error
      } finally {
        this.loading.isRoadDetail = false
        this.selectedRow = null
      }
    },
    /**
     * 정책 생성
     */
    async createPolicyRoadDetail (roadDetail) {
      try {
        const result = await API.network.createPolicyRoadDetail(roadDetail)

        if (result && !result.errorCode) {
          this.$alert(this.$t('common.ALERT.BASE.032')) // 등록 성공하였습니다.
          this.newItemModal = false
        } else if (result.errorCode === 'NET5002') {
          this.$alert(this.$t('common.ALERT.SECURITY.049')) // 동일한 라우트명이 존재합니다.
          this.$nextTick(function () { this.$refs.routeNameInput.focus() })
        } else {
          this.$alert(this.$t('common.ALERT.PROJECT.015')) // 생성 실패
          // this.$alert(this.$t('common.ALERT.BASE.032')) // 등록 성공하였습니다.
          this.newItemModal = false
        }
      } catch (error) {
        this.$alert(error, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm')
        })
      } finally {
        await this.getPolicyRoadDetails()
      }
    },
    /**
     * 정책 수정
     */
    async updatePolicyRoadDetail (roadIdx, routeName, roadDetail) {
      try {
        const result = await API.network.updatePolicyRoadDetail(roadIdx, routeName, roadDetail)

        if (result && !result.errorCode) {
          this.$alert(this.$t('common.ALERT.BASE.043')) // 수정되었습니다.
          this.newItemModal = false
        } else if (result.errorCode === 'NET5002') {
          this.$alert(this.$t('common.ALERT.SECURITY.049')) // 동일한 라우트명이 존재합니다.
          this.$nextTick(function () { this.$refs.routeNameInput.focus() })
        } else {
          this.$alert(this.$t('common.ALERT.BASE.044')) // 실패했습니다.
          // this.$alert(this.$t('common.ALERT.BASE.032')) // 생성 완료
          this.newItemModal = false
        }
      } catch (error) {
        this.$alert(error, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm')
        })
      } finally {
        await this.getPolicyRoadDetails()
      }
    },
    /**
     * 정책 삭제
     */
    async deletePolicyRoadDetail (roadIdx, routeName) {
      try {
        const result = await API.network.deletePolicyRoadDetail(roadIdx, routeName)
        if (result) {
          this.$alert(this.$t('common.ALERT.BASE.039'), '알림', {
            confirmButtonText: this.$t('common.BTN.confirm')
          })
        } else return this.$alert(this.$t('common.ALERT.BASE.038')) // 삭제 실패
      } catch (error) {
        this.$alert(error, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
      } finally {
        this.selectedRow = null
        await this.getPolicyRoadDetails()
      }
    },
    /**
     * companyIdx로 companyName 반환합니다.
     * @param {Number} idx companyIdx
     */
    getCompanyName (idx) {
      const company = this.companyOptions.find(p => p.field === idx)
      if (company !== undefined) {
        return company.label
      }
    },
    /**
     * 템플릿 편집 -> 편집 전 데이터를 this.initData에 담아주고,
     * 업데이트 아이템을 세팅해줍니다. (생성/수정 구분을 위함)
     */
    applyUpdateItem (item) {
      this.updateItem = this.setUpdateItem(item)
      this.newItemModal = true
    },
    /**
     * 업데이트 아이템 세팅
     * @return {Object} [변경]을 누르면 체크된 친구가 updateItem, [항목 추가]를 누르면 새로운 데이터 세팅
     */
    setUpdateItem (data) {
      if (data) { // 수정
        const copiedData = cloneDeep(data)
        this.updateItem = copiedData
        return this.updateItem
      } else { // 생성
        const newTemp = {
          roadIdx: this.roadIdx,
          routeName: '',
          srcIntf: '',
          dstIntf: '',
          srcIpType: '',
          dstIpType: '',
          nat: ''
        }
        return newTemp
      }
    },
    /**
     * [삭제] 버튼을 눌렀을 때, 선택한 row 삭제합니다.
     */
    applyRemove () {
      this.$confirm(this.$t('common.CONFIRM.BASE.008'), '삭제', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        await this.deletePolicyRoadDetail(this.roadIdx, this.selectedRow._data.routeName)
      }).catch(() => false)
    },
    /**
     * 경유지-정책 생성/수정 모달에서 [확인]을 눌렀을 때 해당 로우 저장
     */
    confirmUpdateRoad () {
      if (this.validUpdateRoad()) return

      this.$confirm(this.$t('common.CONFIRM.BASE.001'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.saveUpdatePolicy(this.updateItem)
      }).catch(() => {
        return false
      })
    },
    /**
     * 경유지-정책 생성/수정 모달에서 [취소] 버튼을 눌렀을 때 발생하는 이벤트
     */
    cancelSave () {
      this.saveUpdatePolicy(null)
      this.newItemModal = false
    },
    /**
     * 변경 모달 -> [확인]/[취소] -> 저장
     * @param {Object} updateItem emit으로 전달 받은 업데이트 된 템플릿 아이템, 없을 때 (저장 안하고 취소 눌렀을 때) 편집 전 상태로 돌려줍니다.
     */
    saveUpdatePolicy (updateRow) {
      if (!updateRow) return

      if (updateRow.roadDetailIdx === undefined) this.createPolicyRoadDetail(updateRow) // 아이템 생성일 때
      else this.updatePolicyRoadDetail(updateRow.roadIdx, this.selectedRow._data.routeName, updateRow) // 아이템 변경일 때
    },
    /**
     * 경유지-정책 생성/수정 모달 validation
     * @return true: 필수값이 모두 채워져 있어서 생성 가능.
     */
    validUpdateRoad () {
      const validItems = ['routeName', 'srcIntf', 'dstIntf', 'srcIpType', 'dstIpType', 'nat']

      const validMessage = {
        routeName: 'common.ALERT.NETWORK.005', // 라우팅 명을 입력해주세요.
        srcIntf: 'common.ALERT.SECURITY.030', // SRC망 구분을 선택해주세요.
        dstIntf: 'common.ALERT.SECURITY.022', // DST망 구분을 선택해주세요.
        srcIpType: 'common.ALERT.SECURITY.031', // SRC를 선택해주세요.
        dstIpType: 'common.ALERT.SECURITY.023', // DST를 선택해주세요.
        nat: 'common.ALERT.SECURITY.029' // NAT을 선택해주세요.
      }

      let pass = validItems.some(cate => {
        if (typeof this.updateItem[cate] === 'string'
          ? !this.updateItem[cate]?.trim()
          : !this.updateItem[cate]
        ) {
          this.$alert(this.$t(validMessage[cate]))
          return !this.updateItem[cate].trim()
        }
      })

      if (this.specialRegex.test(this.updateItem.routeName)) {
        pass = false
        return this.$alert('라우팅명에 - , _ 를 제외한 특수문자는<br>사용할 수 없습니다', { dangerouslyUseHTMLString: true })
      }

      return pass
    }
  },
  data () {
    return {
      loading: {
        isAllRoad: false,
        isRoadDetail: false
      },
      specialRegex: /[{}[\]/?,.:;|)*~`!^/+┼<>@#$%&'"\\(=]/,
      roadIdx: '', // route로 넘어오는 roadIdx
      companyOptions: [], // 관계사 목록
      selectedRow: null, // 선택한 정책
      gridTotalCnt: 0, // 정책 그리드 갯수
      newItemModal: false, // 정책 생성 모달 Active
      initData: null,
      updateItem: {
        roadDetailIdx: undefined,
        roadIdx: '',
        routeName: '',
        srcIntf: '',
        dstIntf: '',
        srcIpType: '',
        dstIpType: '',
        nat: ''
      },
      detailTableData: [],
      roadDetailColumns: [ // 경유지 상세 항목
        { header: '경유지명', binding: 'roadName', keyPath: 'admin.PREF.stopover' },
        { header: '출발지 관계사', binding: 'srcCompanyIdx', keyPath: 'admin.PREF.originAff' },
        { header: '출발지 타입', binding: 'srcRoadType', keyPath: 'admin.PREF.originType' },
        { header: '목적지 관계사', binding: 'dstCompanyIdx', keyPath: 'admin.PREF.destAff' },
        { header: '목적지 타입', binding: 'dstRoadType', keyPath: 'admin.PREF.destType' },
        { header: '설명', binding: 'comment', keyPath: 'admin.PREF.explain' }
      ],
      detailInfo: null, // 경유지 상세 정보
      headerMergeColumns: {
        colSpan: [
          { startIdx: 0, endIdx: 2, header: '경유지', keyPath: 'common.GRID.NETWORK.stopover' },
          { startIdx: 3, endIdx: 5, header: '정책', keyPath: 'admin.PREF.policy' }
        ]
      },

      policyColumns: [ // 정책 리스트 칼럼
        { header: '라우팅명', binding: 'routeName', customHtml: true, keyPath: 'admin.PREF.vdomName' },
        { header: 'SRC 망 구분', binding: 'srcIntf', customHtml: true, keyPath: 'admin.PREF.srcNetworkClass' },
        { header: 'DST 망 구분', binding: 'dstIntf', customHtml: true, keyPath: 'admin.PREF.dstNetworkClass' },
        { header: 'SRC', binding: 'srcIpType', customHtml: true },
        { header: 'DST', binding: 'dstIpType', customHtml: true },
        { header: 'NAT', binding: 'nat', customHtml: true }
      ],
      // 테이블 수정 데이터
      netOptions: [ // 망 옵션
        { field: 'TRUST' },
        { field: 'UNTRUST' }
      ],
      policyOptions: [ // 정책 옵션
        { field: 'RIP' },
        { field: 'VIRTUAL_IP' },
        { field: 'SDN_NAT_IP' },
        { field: 'LEG_NAT_IP' }
      ],
      natOptions: [ // NAT 옵션
        { field: 'ENABLE' },
        { field: 'DISABLE' }
      ]
    }
  }
}
</script>
<style lang="scss" scoped>
  .config-network-routing-detail.dashboard-panel {
    .prev-data-info {
      margin-bottom: $gap-m;
      border-top: 1px solid #3D435E;
    }
  }
</style>
