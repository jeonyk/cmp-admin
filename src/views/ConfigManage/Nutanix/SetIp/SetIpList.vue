<!--
  * 파일명 : SetIpList.vue
  * 파일 기능 : 구성관리 > IP대역 리스트 (IP대역 추가/변경/삭제 기능, IP대역 검색 기능, IP대역 속한 IP리스트 엑셀 업로드 기능)
  * 작성자 : 정재은 외 3명
  * 최종 작성일 : 2021-02-26
  * License By Shinsegae I&C
  * 2021-02-26 Update: 관계사 groupIdx로 나오는 버그 수정
 -->
<!-- 스타일 수정 -->

<template>
  <div
    class="set-ip-list body-panel -right"
    v-loading="isIpBands || isGroupTree"
  >
    <dashboard-panel
      class="dashboard-panel"
    >
      <template #header>
        <network-cate-breadcrumb
          :selected-tree-item="selectedCate"
        />
      </template>
      <template v-if="$route.query.ipCategoryIdx">
        <filtering-component
          @reset-data="resetFilter"
        >
          <div class="filter-form">
            <span class="filter-name">{{ $v('검색어') }}</span>
            <search-component
              v-model="filterKeyword"
              @input="filtering"
              :placeholder="$t('common.PLACEHOLDER.search')"
              :clearable="false"
            />
          </div>
        </filtering-component>

        <section class="table-top-wrap">
          <total-count
            class="total-count-wrap"
            :total-count="totalResultCnt"
          />

          <div
            class="button-area -right"
          >
            <!-- :style="{ width: $i18n.locale === 'en' ? '1000px' : '900px' }" -->
            <!-- <wj-flex-grid-search
              id="theDetailSearch"
              :placeholder="$t('common.PLACEHOLDER.search')"
              style="width: 250px;"
            /> -->
            <network-excel-form-download
              :title="$t('config.IP.band')"
              type="IP_BAND"
            />
            <network-excel-form-download
              :title="`${$t('admin.PREF.detail')} IP`"
              type="IP"
            />

            <span class="divider" />

            <div class="flex-wrap">
              <button
                class="button"
                @click="e => openExcelUploadModal('ipBand')"
              >
                {{ $t('common.BTN.CONF.uploadIpBand') }}
              </button>
              <button
                class="button"
                @click="e => openExcelUploadModal('ip')"
              >
                {{ $t('common.BTN.CONF.uploadDetailIp') }}
              </button>
            </div>

            <span class="divider" />

            <button
              class="button"
              type="is-primary"
              @click="e => applyUpdateIp()"
              style="width: 150px;"
            >
              {{ $t('common.BTN.addItem') }}
            </button>
            <button
              class="button"
              :disabled="!selectedRow"
              @click="e => applyUpdateIp(selectedRow._data)"
            >
              {{ $t('common.BTN.change') }}
            </button>
            <button
              class="button"
              type="is-anti"
              @click="applyRemove"
              :disabled="!selectedRow || isDisabled"
            >
              {{ $t('common.BTN.delete') }}
            </button>
          </div>
        </section>

        <section class="table-area">
          <cmp-grid
            :item-source="ipBandTable"
            :columns="columns"
            :init-custom-action="initGrid"
            selectable
            @selectedRow="selectRow"
            grid-id="theDetailGrid"
            :column-data-map="columnDataMap"
            :use-excel-download="true"
            @total-count="cnt => totalResultCnt = cnt"
          >
            <template #serviceDiv="props">
              <span v-if="props.row.serviceDiv=='MANAGE'">{{ $t('common.GRID.NETWORK.oper') }}</span>
              <span v-else-if="props.row.serviceDiv=='TEST'">{{ $t('common.BTN.test') }}</span>
              <span v-else-if="props.row.serviceDiv=='STAGING'">{{ $t('common.GRID.NETWORK.stag') }}</span>
            </template>
            <!-- 서비스 유형-->

            <template #isSync="props">
              <div>
                <span v-if="props.row.isSync">
                  Y
                </span>
                <span v-else-if="!props.row.isSync">
                  N
                </span>
                <!-- <span v-else-if="!props.row.isSync">{{ this.$v('관리 타입 - 대역') }}</span> -->
                <span v-else />
              </div>
            </template>
            <!-- 자동 동기화 여부 -->

            <template #comment="props">
              <div v-if="props.row.comment">
                <el-tooltip
                  effect="light"
                  popper-class="shade-popper"
                >
                  <span class="table-row-description">
                    {{ props.row.comment }}
                  </span>
                  <div slot="content">
                    {{ props.row.comment }}
                  </div>
                </el-tooltip>
              </div>
            </template>
            <!-- 설명 -->

            <template #detail="props">
              <a
                class="-link"
                @click.stop="selectDetail(props.row)"
              >{{ $t('common.BTN.detail') }}</a>
            </template>
            <!-- 상세 -->
          </cmp-grid>
        </section>
      </template>

      <template v-else>
        <div class="empty-zone">
          {{ $t('common.PLACEHOLDER.noData') }}
        </div>
      </template>
    </dashboard-panel>

    <!-- 항목 생성/수정 모달 -->
    <el-dialog
      :title="modalTitle"
      :visible.sync="newItemModal"
      class="new-item-modal"
      width="600px"
      @close="handleClose"
    >
      <section
        class="modal-body"
        style="border-top: 1px solid #3D435E"
      >
        <register-contents
          required
        >
          <template #title>
            {{ $v('자동 동기화 여부') }}
          </template>
          <div class="input-form">
            <el-radio-group
              class="auto-sync-radio"

              v-model="updateItem.isSync"
              :disabled="updateItem.crud !== 'create'"
              @change="e => {
                if(updateItem.crud === 'create') {
                  handleChangeAuthSync()
                }
              }"
            >
              <el-radio
                :label="true"
                class="auto-sync-radio__item"
              >
                Y
              </el-radio>
              <el-radio
                :label="false"
                class="auto-sync-radio__item"
              >
                N
              </el-radio>
            </el-radio-group>
          </div>
        </register-contents>
        <register-contents
          :title="$v('서비스 유형')"
          :required="updateItem.isSync"
        >
          <el-select
            v-model="updateItem.serviceType"
            :placeholder="$v('서비스 유형')"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in serviceTypeOptions"
              :key="item.codeVal"
              :label="item.codeName"
              :value="item.codeVal"
            />
          </el-select>
        </register-contents>

        <register-contents
          :title="$v('서비스 구분')"
          :required="updateItem.isSync"
        >
          <el-select
            v-model="updateItem.serviceDiv"
            :placeholder="$v('서비스 구분')"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in serviceCateOptions"
              :key="item.codeVal"
              :label="item.codeName"
              :value="item.codeVal"
            />
          </el-select>
        </register-contents>
        <!-- IP 대역 구분 -->

        <register-contents
          title="VLAN ID"
          :required="updateItem.isSync"
        >
          <el-input
            :placeholder="$t('common.ALERT.SECURITY.048')"
            v-model="updateItem.vlanId"
            type="number"
            @keydown.native="e => {
              const invalid = ['i','+','e','-']
              if(invalid.includes(e.key)) e.preventDefault()
            }"
          />
          <!-- @keydown="e => {
              if (e.which != 8 && e.which != 0 && e.which < 48 || e.which > 57)e.preventDefault()
            }" -->
        </register-contents>
        <!-- VLAN ID -->

        <register-contents
          :title="$t('common.GRID.NETWORK.vlanBandName')"
          :required="updateItem.isSync"
        >
          <el-input
            :placeholder="$t('common.ALERT.SECURITY.046')"
            v-model="updateItem.vlanName"
          />
        </register-contents>
        <!-- VLAN 명 -->

        <register-contents
          :title="$t('common.TERMS.rel')"
          :required="updateItem.isSync"
        >
          <el-select
            v-model="updateItem.companyIdx"
            :placeholder="$t('admin.PREF.selectAff')"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in relationCompOptions"
              :key="item.field"
              :label="item.label"
              :value="item.field"
            />
          </el-select>
        </register-contents>
        <!-- 관계사 -->

        <register-contents
          :title="$t('config.IP.band')"
          required
        >
          <el-input
            :placeholder="$t('common.ALERT.SECURITY.037')"
            v-model="updateItem.ipRange"
            :disabled="modifyMode"
          />
        </register-contents>
        <!-- 대역 -->
        <register-contents
          :title="$v('게이트웨이')"
        >
          <el-input
            :placeholder="$v('게이트웨이 입력')"
            v-model="updateItem.gatewayIpAddress"
          />
        </register-contents>
        <!-- 게이트웨이 -->
        <register-contents
          title="DNS"
        >
          <el-input
            :placeholder="$v('DNS 입력')"
            v-model="updateItem.dnsIpAddress"
          />
        </register-contents>
        <!-- DNS -->

        <!-- 프로토콜 -->

        <register-contents
          :title="$t('common.MODAL.explain')"
        >
          <el-input
            :placeholder="$t('common.MODAL.explain')"
            v-model="updateItem.comment"
            type="textarea"
          />
        </register-contents>
        <!-- 설명 -->
      </section>

      <div class="modal-footer modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="cancelSave"
        >
          {{ $t('common.BTN.cancel') }}
        </button>
        <button
          class="button -modal-button"
          @click="applyUpdate"
          type="is-primary"
          v-loading="isAction"
        >
          {{ $t('common.BTN.confirm') }}
        </button>
      </div>
    </el-dialog>

    <!-- Excel 업로드 모달 -->
    <el-dialog
      :title="$t('config.IP.uploadExcel')"
      :visible.sync="excelUploadModal.view"
      class="excel-upload-modal"
      width="500px"
      top="30vh"
      @close="handleCloseUpload"
      :before-close="beforeExcelUploadClose"
    >
      <ip-range-excel-upload
        v-if="excelUploadModal.view"
        :type="excelUploadModal.type"
        @close="handleCloseUpload"
        @before-close="beforeExcelUploadClose"
      />
    </el-dialog>

    <router-view />
  </div>
</template>
<script>
import API, { FilteringComponent, DashboardPanel } from '@sd-fe/cmp-core'
import IPRangeExcelUpload from './IPRangeExcelUpload'
import NetworkExcelFormDownload from '@/components/ExcelDownload/NetworkExcelFormDownload'
import NetworkCateBreadcrumb from '@/components/NetworkCategorySelection/NetworkCateBreadcrumb.vue'

export default {
  name: 'SetIpList',
  components: {
    FilteringComponent,
    'dashboard-panel': DashboardPanel,
    'ip-range-excel-upload': IPRangeExcelUpload,
    'network-excel-form-download': NetworkExcelFormDownload,
    NetworkCateBreadcrumb
  },
  props: {
    selectedCate: {
      type: Object,
      default () {
        return {}
      }
    }
  },
  async created () {
    // if (this.$route.query.ipCategoryIdx) this.ipCategoryIdx = Number(this.$route.query.ipCategoryIdx)
    // else this.ipCategoryIdx = undefined
    // this.getIpBands(this.ipCategoryIdx)
    await this.getGroupList()
    await this.getIpTypes()
    await this.getIpClass()
    const ipCategoryIdx = this.$route.query?.ipCategoryIdx
    if (ipCategoryIdx) await this.getIpBands(ipCategoryIdx)
  },
  watch: {
    '$route.query.ipCategoryIdx': {
      immediate: true,
      async handler (newVal) {
        this.ipCategoryIdx = Number(newVal)
        await this.getIpBands(newVal)
      }
    },
    newItemModal (newVal) {
      if (newVal) {
        this.setTitle()
        this.updateItem.isSync = true
      } else this.updateItem = this.setUpdateItem()
    },
    updateItem: {
      immediate: true,
      deep: true,
      handler (newVal) {
        if (newVal.ipBandIdx) { // 수정일 때,
          this.updateItem.isSync = newVal.vlanId !== null
        }
      }
    }
  },
  methods: {
    // 서비스 타입 정보를 받아와 드롭다운에 넣을 아이템을 세팅합니다.
    async getIpTypes () {
      this.serviceTypeOptions = await API.config.getCodeList({ codeType: 'IP_BAND_TYPE' })
    },
    // 서비스 유형 정보를 받아와 드롭다운에 넣을 아이템을 세팅합니다.
    async getIpClass () {
      this.serviceCateOptions = await API.config.getCodeList({ codeType: 'IP_BAND_CLASS' })
    },
    // 프리픽스를 반환합니다.
    extractPrefixFromCidr (cidr) {
      const subnetMaskArr = cidr.split('/')
      const subnetBits = subnetMaskArr[1]
      return subnetBits
    },

    async getIpBands (ipCategoryIdx) {
      try {
        this.isIpBands = true
        if (ipCategoryIdx !== undefined) {
          const response = await API.network.getIpBands(ipCategoryIdx)
          if (!response) return

          for (let i = 0; i < response.length; i++) {
            response[i].vlanId = response[i].vlanId === null ? '' : Number(response[i].vlanId)
            response[i].companyName = this.getRelation(response[i].companyIdx)
            response[i].prefix = this.extractPrefixFromCidr(response[i].ipRange)
          }
          this.ipBandsOrigin = response
        }
        this.filtering()
      } catch (error) {
        console.error(error)
        this.ipBandsOrigin = []
      } finally {
        this.isIpBands = false
        this.handleClose()
        this.gridSetInit()
      }
    },
    async handleChangeAuthSync () {
      this.updateItem.isSync = !this.updateItem.isSync
      const isConfirmed = await this.$confirm(this.$v('변경 시 아래 작성하신 내용이 초기화됩니다.<br/>그래도 변경 하시겠습니까?'), { dangerouslyUseHTMLString: true }).then(() => true).catch(() => false)
      if (isConfirmed) {
        this.updateItem.isSync = !this.updateItem.isSync
        this.updateItem.vlanId = ''
        this.updateItem.vlanName = ''
        this.updateItem.ipRange = ''
        this.updateItem.companyIdx = ''
        this.updateItem.ipRange = ''
        this.updateItem.serviceType = ''
        this.updateItem.serviceDiv = ''
        this.updateItem.comment = ''
      } else {

      }
    },
    async createIpBand (ipBand) {
      try {
        ipBand.ipCategoryIdx = this.ipCategoryIdx

        const result = await API.network.createIpBand(ipBand)

        if (result) {
          this.$alert(this.$t('common.ALERT.BASE.032')) // 등록 성공하였습니다.
          await this.getIpBands(this.ipCategoryIdx)
        }
      } catch (error) {
        let msg
        if (error?.data?.code) {
          msg = {
            NET1502: this.$t('common.ALERT.IP.001'), // 이미 사용 중인 IP대역입니다.,
            NET1503: this.$t('common.ALERT.IP.002') // 해당 대역 내에 기존에 등록된 IP와<br>중복된 IP가 있습니다.
          }[error.data.code]
        }

        const errMsg = msg || this.$t('common.ALERT.LOGGING.004') // 생성에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        return this.$alert(errMsg, { dangerouslyUseHTMLString: true })
      }
    },
    async updateIpBand (ipBand) {
      try {
        // ipBand.ipBandIdx = this.selectedRow.ipBandIdx
        const result = await API.network.updateIpBand(ipBand)

        if (result) {
          this.$alert(this.$t('common.ALERT.BASE.019')) // 성공적으로 변경되었습니다.
          await this.getIpBands(this.ipCategoryIdx)
        }
      } catch (error) {
        let errMsg = this.$t('common.ALERT.LOGGING.005') // 수정에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        const errCode = ['NET1502', 'NET1503']
        if (error?.data?.code) {
          if (errCode.includes(error.data.code)) {
            errMsg = {
              NET1502: this.$t('common.ALERT.IP.001'), // 이미 사용 중인 IP대역입니다.,
              NET1503: this.$t('common.ALERT.IP.002') // 해당 대역 내에 기존에 등록된 IP와<br>중복된 IP가 있습니다.
            }[error.data.code]
          } else {
            errMsg = this.$t('common.ALERT.LOGGING.005') // 수정에 실패하였습니다.<br>관리자 문의 부탁드립니다.
          }
        }
        return this.$alert(errMsg, { dangerouslyUseHTMLString: true })
      }
    },
    async deleteIpBand (ipBandIdx) {
      try {
        const result = await API.network.deleteIpBand(ipBandIdx)
        if (!result) return this.$alert(this.$t('common.ALERT.BASE.015'), { dangerouslyUseHTMLString: true }) // 삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        else this.$alert(this.$t('common.ALERT.BASE.017')) // 삭제되었습니다.
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.BASE.015'), { dangerouslyUseHTMLString: true }) // 삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.
      } finally {
        await this.getIpBands(this.ipCategoryIdx)
      }
    },
    async getGroupList () {
      try {
        this.isGroupTree = true
        const response = await API.iam.getGroupList({ groupUpper: 0 })
        if (!response) return

        // 관계사만 담아줌..
        const result = response.map(item => {
          return {
            label: item.groupName,
            field: item.groupIdx
          }
        }).filter(x => x.label !== '공통')

        this.relationCompOptions = result
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.relationCompOptions = []
        this.$alert(message)
        this.isGroupTree = false
        throw error
      } finally {
        this.isGroupTree = false
      }
    },
    getRelation (value) {
      const relation = this.relationCompOptions.find(p => p.field === value)
      if (relation !== undefined) {
        return relation.label
      }
      return value
    },
    initGrid (grid) {
      this.grid = grid
    },
    routeTo (to) {
      this.$router.push(to)
    },
    setTitle () {
      if (this.updateItem.crud === 'update') {
        // this.modalTitle = this.$t('admin.PREF.changeItem')
        this.modalTitle = this.$t('common.TERMS.itemChange')
      } else {
        // this.modalTitle = this.$t('common.TERMS.itemAdd')
        this.modalTitle = this.$t('common.TERMS.itemAdd')
      }
    },
    gridRefresh (grid) {
      const cv = grid?.collectionView
      if (!cv) return
      cv.refresh()
    },
    async selectRow (rowData) {
      if (rowData) {
        this.selectedRow = rowData
        console.log(rowData._data.ipBandIdx)
        const result = await API.network.checkDeleteIpBand(rowData._data.ipBandIdx)
        if (result) {
          this.isDisabled = false
        } else {
          this.isDisabled = true
        }
      } else {
        this.selectedRow = null
        this.isDisabled = false
      }
    },
    /**
     * '상세' 텍스트 클릭 시, 상세 페이지로 이동합니다.
     */
    selectDetail (rowData) {
      const routingData = rowData
      routingData.relationCompOptions = this.relationCompOptions
      if (routingData.crud === 'create') return

      this.routeTo({
        name: 'set-ip-detail',
        params: routingData,
        query: { category: this.$route.query.category, ipCategoryIdx: this.ipCategoryIdx }
      })
    },
    /**
     * 템플릿 편집 -> 편집 전 데이터를 this.initData에 담아주고,
     * 업데이트 아이템을 세팅해줍니다. (생성/수정 구분을 위함)
     */
    applyUpdateIp (item) {
      this.updateItem = this.setUpdateItem(item)
      if (item) {
        // this.initData = JSON.parse(JSON.stringify(item))
        this.modifyMode = true
      }
      this.newItemModal = true
    },
    /**
     * [대역 항목 Excel 업로드], [상세 IP Excel 업로드] 팝업 관련 메서드
     */
    handleCloseUpload () {
      this.excelUploadModal.view = false
      this.excelUploadModal.type = undefined

      const ipCategoryIdx = this.$route.query?.ipCategoryIdx
      if (ipCategoryIdx) this.getIpBands(ipCategoryIdx)
    },
    openExcelUploadModal (type) {
      this.excelUploadModal = { view: true, type }
    },
    beforeExcelUploadClose () {
      this.$confirm(this.$t('common.CONFIRM.BASE.003'), { // 등록하지 않고 취소하시겠습니까?<br>업로드된 파일은 저장되지 않습니다.
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(() => this.handleCloseUpload())
        .catch(() => false)
    },
    /**
     * 업데이트 아이템 세팅
     * @return {Object} [변경]을 누르면 체크된 친구가 updateItem, [항목 추가]를 누르면 새로운 데이터 세팅
     */
    setUpdateItem (data) {
      let newTemp
      if (data) {
        newTemp = {
          crud: 'update',
          isSync: data.isSync,
          ipCategoryIdx: data.ipCategoryIdx,
          ipBandIdx: data.ipBandIdx,
          vlanId: data.vlanId,
          vlanName: data.vlanName,
          companyIdx: data.companyIdx,
          ipRange: data.ipRange,
          serviceType: data.serviceType,
          serviceDiv: data.serviceDiv,
          comment: data.comment
        }
      } else {
        newTemp = {
          isSync: false,
          crud: 'create',
          ipCategoryIdx: '',
          vlanId: '',
          vlanName: '',
          companyIdx: '',
          ipRange: '',
          serviceType: '',
          serviceDiv: '',
          comment: ''
        }
      }
      return newTemp
    },
    /**
     * [삭제] 버튼을 눌렀을 때, 선택한 row 삭제 여부를 리턴합니다.
     * @return {Boolean} 삭제 성공 여부
     */
    applyRemove () {
      this.$confirm(this.$t('common.CONFIRM.BASE.032'), '삭제', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.removeItems(this.selectedRow)
      }).catch(() => false)
    },
    /**
     * 선택된 로우들을 삭제합니다.
     */
    removeItems (removeObj) {
      const removeIdx = removeObj._data.ipBandIdx
      this.deleteIpBand(removeIdx)
      // let removeIdx
      // this.tableData.forEach((data, index) => {
      //   if (data.vlanId === removeObj._data.vlanId) removeIdx = index
      // })
      // this.tableData.splice(removeIdx, 1)
      // this.grid.rows.remove(this.grid.rows[removeIdx])
      // this.gridSetInit()
    },
    updateValid () {
      const alert = (message, callback) => {
        this.$alert(message, {
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: callback
        })
      }

      const ipRangeRegExp = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
      const validateIpRange = (str) => {
        if (typeof str === 'string') {
          return !(parseInt(str.split('/')[1]) > 32)
        }
        return false
      }
      // const vlanIdRegExp = /^[0-9]*$/g

      if (this.updateItem.isSync) {
        // if (this.updateItem.vlanId === '') return alert(this.$t('common.ALERT.SECURITY.048'), () => false)
        // if (!vlanIdRegExp.test(this.updateItem.vlanId)) return alert(this.$t('common.ALERT.SECURITY.047'), () => false)

        // VLAN ID 중복 체크 - 2021.12.03 IP대역 생성 정책이 바껴서 VLAN ID 중복 체크하지 않음.
        // let flag
        // if (this.updateItem.crud === 'update') {
        //   console.log(this.updateItem.ipCategoryIdx)
        //   flag = this.ipBandTable.some(row => (row.vlanId === this.updateItem.vlanId && row.ipRange !== this.updateItem.ipRange))
        // } else flag = this.ipBandTable.some(row => (row.vlanId === this.updateItem.vlanId))

        // if (flag) return alert(this.$t('common.ALERT.NETWORK.026'), () => false) // 중복된 VLAN ID가 있습니다.

        if (!this.updateItem.vlanId) return alert(this.$t('common.ALERT.SECURITY.048'), () => false)
        if (!this.updateItem.companyIdx) return alert(this.$t('common.ALERT.PROJECT.008'), () => false)
        if (!this.updateItem.ipRange) return alert(this.$t('common.ALERT.SECURITY.042'), () => false)
        else {
          if (!ipRangeRegExp.test(this.updateItem.ipRange)) return alert(this.$v('IP 대역 형식(CIDR 표기법)을 확인해주세요.'), () => false)
          if (!validateIpRange(this.updateItem.ipRange)) return alert(this.$t('common.ALERT.SECURITY.041'), () => false)
        }

        if (!this.updateItem.serviceType) return alert(this.$t('common.ALERT.NETWORK.019'), () => false) // 서비스 유형을 선택하세요.
        if (!this.updateItem.serviceDiv) return alert(this.$t('common.ALERT.NETWORK.018'), () => false) // 서비스 구분을 선택하세요.
      } else {
        // if (!this.updateItem.vlanName) return alert(this.$t('common.ALERT.SECURITY.046'), () => false)
        if (!this.updateItem.ipRange) return alert(this.$t('common.ALERT.SECURITY.037'), () => false)
        else {
          if (!ipRangeRegExp.test(this.updateItem.ipRange)) return alert(this.$t('common.ALERT.SECURITY.041'), () => false)
          if (!validateIpRange(this.updateItem.ipRange)) return alert(this.$t('common.ALERT.SECURITY.041'), () => false)
        }
        // if (!this.updateItem.serviceType) return alert(this.$t('common.ALERT.NETWORK.019'), () => false)
        // if (!this.updateItem.serviceDiv) return alert(this.$t('common.ALERT.NETWORK.018'), () => false)
      }

      return true
    },
    /**
     * 항목 생성/수정 모달에서 [확인]을 눌렀을 때 해당 로우 저장
     */
    applyUpdate () {
      if (!this.updateValid()) return

      this.$confirm(this.$t('common.CONFIRM.BASE.001'), {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.saveUpdatedIp(this.updateItem)
      }).catch(() => {
        return false
      })
    },
    /**
     * dialog close 시 실행
     */
    handleClose () {
      this.newItemModal = false
      this.modifyMode = false
    },
    /**
     * 항목 생성/수정 모달에서 [취소] 버튼을 눌렀을 때 발생하는 이벤트
     */
    cancelSave () {
      this.saveUpdatedIp(null)
      this.handleClose()
    },
    /**
     * 변경 모달 -> [확인]/[취소] -> 저장
     * @param {Object} updateItem emit으로 전달 받은 업데이트 된 템플릿 아이템, 없을 때 (저장 안하고 취소 눌렀을 때) 편집 전 상태로 돌려줍니다.
     */
    async saveUpdatedIp (updateRow) {
      if (!updateRow) { // [취소] 눌렀을 때
        if (this.updateItem.crud === 'create') return false
        // this.updateItem = JSON.parse(JSON.stringify(this.initData))
        // this.tableData[this.selectedRow.index] = JSON.parse(JSON.stringify(this.initData))
      } else {
        let payload
        if (!this.updateItem.isSync) {
          const { vlanId, crud, ...rest } = updateRow
          payload = rest
        } else {
          const { crud, ...rest } = updateRow
          payload = rest
        }
        if (updateRow.crud === 'create') { // 아이템 생성일 때
          await this.createIpBand(payload)
        } else { // 아이템 변경일 때
          await this.updateIpBand(payload)
        }
      }
    },
    gridSetInit () {
      this.selectedRow = null
      this.gridRefresh(this.grid)
    },
    /**
     * 그리드 상단 필터 리셋
     * */
    resetFilter () {
      this.filterKeyword = ''
      this.filtering()
    },
    filtering (val = this.filterKeyword) {
      if (!val) {
        this.ipBandTable = this.ipBandsOrigin
      } else {
        this.ipBandTable = this.ipBandsOrigin.filter(item => {
          const {
            vlanId,
            vlanName,
            companyName,
            ipRange,
            serviceDiv,
            serviceType,
            detail
          } = item

          const rowStr = vlanId + vlanName + companyName + ipRange + serviceType + serviceDiv + detail
          if (rowStr.toLowerCase().includes(this.filterKeyword.toLowerCase())) return item
        })
      }
    }
  },
  data () {
    return {
      totalResultCnt: 0,
      ipCategoryIdx: undefined, // query로 넘어온 ipCategoryIdx
      isIpBands: false,
      isGroupTree: false,
      ipBandTable: [],
      ipBandsOrigin: [],
      isAction: false,
      tableData: [],
      selectedRow: null,
      modalTitle: '',
      isDisabled: false,
      newItemModal: false,
      excelUploadModal: {
        view: false,
        type: undefined
      },
      modifyMode: false,
      initData: null, // 변경 전 로우 데이터
      columns: [
        { header: 'VLAN_ID', binding: 'vlanId', width: 80, format: 'd*' },
        { header: 'VLAN 명', binding: 'vlanName', width: 140, align: 'left', keyPath: 'common.GRID.NETWORK.vlanName' },
        { header: '관계사', binding: 'companyName', width: 140, align: 'left', customHtml: true, keyPath: 'common.TERMS.rel' },
        { header: '대역', binding: 'ipRange', width: 120, keyPath: 'config.IP.band' },
        { header: '서비스 유형', binding: 'serviceType', width: 140, keyPath: 'common.GRID.serviceType' },
        { header: '서비스 구분', binding: 'serviceDiv', width: 150, customHtml: true, keyPath: 'common.GRID.serviceClass' },
        { header: this.$v('자동 동기화 여부'), binding: 'isSync', width: 120, customHtml: true, sorting: false },
        { header: 'Gateway', binding: 'gatewayIpAddress', width: 200, customHtml: true, sorting: false },

        { header: this.$v('설명'), binding: 'comment', width: '*', customHtml: true, sorting: false },
        { header: '상세', binding: 'detail', width: 80, customHtml: true, sorting: false, keyPath: 'common.BTN.detail' }
        // { header: '할당', binding: 'assign', width: 200, customHtml: true }
        // { header: '동기 시간', binding: 'updateTime', width: 200 }
      ],
      data: [],
      // 테이블 수정 정보
      updateItem: {
        ipCategoryIdx: '',
        vlanId: '',
        vlanName: '',
        companyIdx: '',
        ipRange: '',
        ipBadnIdx: '',
        serviceType: '',
        serviceDiv: '',
        dnsIpAddress: '',
        gatewayIpAddress: '',
        isSync: false,
        comment: ''
      },
      newItem: {
        crud: 'create',
        ipCategoryIdx: '',
        vlanId: '',
        isSync: false,
        vlanName: '',
        companyIdx: '',
        ipRange: '',
        ipBadnIdx: '',
        serviceType: '',
        serviceDiv: '',
        dnsIpAddress: '',
        gatewayIpAddress: '',
        comment: ''
      },
      relationCompOptions: [],
      serviceTypeOptions: [],
      serviceCateOptions: [],
      filter: {
        keyword: '',
        vlanId: '',
        vlanName: '',
        companyName: '',
        ipRange: '',
        serviceType: '',
        serviceDiv: '',
        detail: ''
      },
      filterKeyword: '',
      columnDataMap: {
        serviceDiv: [
          { value: 'MANAGE', caption: this.$t('common.GRID.NETWORK.oper') },
          { value: 'TEST', caption: this.$t('common.BTN.test') },
          { value: 'STAGING', caption: this.$t('common.GRID.NETWORK.stag') }
        ]
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.dashboard-panel {
  &::v-deep {
    .panel-head {
      justify-content: flex-start;
    }
  }
}
.auto-sync-radio {
  align-items: flex-start;
  gap: 20px;
}
.table-row-description {
  display: block;
  width: 100%;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}
.auto-sync-radio {
  &__item {
    margin-right: 10px;
  }
}
</style>
