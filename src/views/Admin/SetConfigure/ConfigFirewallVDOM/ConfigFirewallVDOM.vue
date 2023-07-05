<!--
  * 파일명 : ConfigFirewallVDOM.vue
  * 파일 기능 : 환경설정 > 방화벽 VDOM 리스트 노출 및 관리(추가, 변경, 삭제)
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2021-02-03
  * License By Shinsegae I&C
  * 2021-02-03 fix: [환경설정 > 방화벽 VDOM 정보] : 관계사 companyIdx 로 노출에서 관계사명 노출로 수정, 항목 변경 초깃값 세팅 등 수정
 -->

<template>
  <div
    class="config-firewall-vdom"
    v-loading="loading"
    :element-loading-text="$t('common.PLACEHOLDER.loading')"
  >
    <section class="table-top-wrap">
      <total-count :total-count="totalResultCnt" />

      <div class="button-area -right">
        <!--
        <sync-component
          :last-info="lastSync"
          @click="activeSync"
        />
        <button
          class="button"
          style="margin-left: 10px;"
          :disabled="!selectedRow"
        >
          테스트
        </button>
        -->
        <div class="button-area">
          <network-excel-form-download
            :title="`${$t('common.TERMS.firewall')} VDOM`"
            type="VDOM"
          />
          <span class="divider" />

          <button
            class="button -modal-button"
            @click="e => excelUploadModal = true"
          >
            {{ $t('admin.PREF.vdomExcepUpload') }}
          </button>
          <!-- 방화벽 VDOM 엑셀 업로드 -->

          <span class="divider" />

          <button
            class="button"
            type="is-primary"
            @click="e => applyUpdateItem()"
          >
            {{ $t('common.TERMS.itemAdd') }}
          </button>
          <!-- 항목 추가 -->

          <button
            class="button"
            :disabled="!selectedRow"
            @click="e => applyUpdateItem(selectedRow._data)"
          >
            {{ $t('common.BTN.change') }}
          </button>
          <!-- 변경 -->

          <button
            class="button"
            type="is-anti"
            @click="applyRemove"
            :disabled="!selectedRow"
          >
            {{ $t('common.BTN.delete') }}
          </button>
          <!-- 삭제 -->
        </div>
      </div>
    </section>

    <section class="table-area">
      <cmp-grid
        :loading="loading"
        class="firewall-vdom-grid"
        :item-source="tableData"
        :columns="columns"
        :init-custom-action="init"
        selectable
        @selectedRow="selectRow"
        @total-count="cnt => totalResultCnt = cnt"
        :init-auto-select-row="selectedRow ? selectedRow._data : null"
        init-auto-select-row-key="vdomIdx"
      >
        <template #isNat="props">
          <el-checkbox
            v-model="props.row.isNat"
            disabled
          />
        </template>
      </cmp-grid>
    </section>

    <!-- 모달 -->
    <!-- Excel 업로드 모달 -->
    <el-dialog
      :title="$t('config.IP.uploadExcel')"
      :visible.sync="excelUploadModal"
      class="excel-upload-modal"
      width="500px"
      top="30vh"
      @close="() => excelUploadModal = false"
      :before-close="beforeExcelUploadClose"
    >
      <excel-upload
        v-if="excelUploadModal"
        :loading="excelUploadLoading"
        @close="() => excelUploadModal = false"
        @save="saveExcelUpload"
      >
        <template #trigger>
          <button class="button">
            {{ $t('admin.PREF.vdomExcepUpload') }}
          </button>
        </template>
      </excel-upload>
    </el-dialog>

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
          title="VDOM ID"
          required
        >
          <el-input
            :placeholder="$t('admin.PREF.enterVDomId')"
            :disabled="isUpdate"
            v-model="updateItem.vdomId"
            ref="vdomIdRef"
          />
        </register-contents>
        <!-- VDOM 명 -->

        <register-contents
          :title="$t('common.TERMS.rel')"
          required
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

        <!-- <register-contents
          :title="$t('common.GRID.NETWORK.networkClass')"
          required
        >
          <el-select
            v-model="updateItem.workType"
            :placeholder="$t('admin.PREF.selectNetworkInfo')"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in netTypeOptions"
              :key="item.field"
              :label="item.label"
              :value="item.field"
            />
          </el-select>
        </register-contents> -->
        <!-- 망 구분 -->

        <register-contents
          title="Trust"
          required
        >
          <el-input
            :placeholder="$t('admin.PREF.enterTrust')"
            v-model="updateItem.trust"
          />
        </register-contents>
        <!-- Trust -->

        <register-contents
          title="Untrust"
          required
        >
          <el-input
            :placeholder="$t('admin.PREF.enterUnTrust')"
            v-model="updateItem.untrust"
          />
        </register-contents>
        <!-- Untrust -->

        <register-contents
          :title="$t('admin.PREF.networkEquip')"
          required
        >
          <el-select
            v-model="updateItem.netIdx"
            :placeholder="$t('admin.PREF.selectNetworkEquip')"
            :popper-append-to-body="false"
          >
            <el-option
              v-for="item in networkEquipOptions"
              :key="item.field"
              :label="item.label"
              :value="item.field"
            />
          </el-select>
        </register-contents>
        <!-- 네트워크 장비 -->

        <register-contents
          :title="$t('common.GRID.NETWORK.isNat')"
        >
          <el-checkbox v-model="updateItem.isNat" />
        </register-contents>
        <!-- 네트워크 장비 -->

        <register-contents
          :title="$t('common.MODAL.explain')"
        >
          <el-input
            :placeholder="$t('common.PLACEHOLDER.enterDes')"
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
          @click="saveUpdateAction"
          type="is-primary"
        >
          {{ $t('common.BTN.confirm') }}
        </button>
      </div>
    </el-dialog>
  </div>
</template>
<script>
import ExcelUpload from '@/components/ExcelUpload/ExcelUpload'
import NetworkExcelFormDownload from '@/components/ExcelDownload/NetworkExcelFormDownload'
import { mapState } from 'vuex'
import API from '@sd-fe/cmp-core'

export default {
  name: 'ConfigFirewallVDOM',
  components: {
    'excel-upload': ExcelUpload,
    'network-excel-form-download': NetworkExcelFormDownload
  },
  watch: {
    newItemModal (newVal) {
      if (newVal) this.setModalTitle()
    }
  },
  computed: {
    ...mapState({
      userInfo: state => state.auth.user
    })
  },
  mounted () {
    this.initTable()
  },
  methods: {
    init (grid) {
      this.grid = grid
    },
    async initTable () {
      await this.getGroupList({ groupUpper: 0 })
      this.getEquipVdoms()
      this.getEquipNetworks()
    },
    /**
     * API 영역
     */
    async getEquipVdoms () {
      try {
        this.loading = true
        const response = await API.network.getEquipVdoms()
        if (!response) return
        this.setTableData(response)
      } catch (error) {
        this.loading = false
        console.error(error)
        this.tableData = []
        this.$alert(error, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
      } finally {
        this.loading = false
      }
    },
    async createEquipVdom (equipVdom) {
      try {
        const result = await API.network.createEquipVdom(equipVdom)
        if (result && !result.errorCode) {
          this.$alert(this.$t('common.ALERT.BASE.032')) // 등록 성공하였습니다.
          await this.getEquipVdoms()
          this.newItemModal = false
        } else if (result.errorCode === 'NET5002') {
          this.$alert(this.$t('common.ALERT.NETWORK.045'), { dangerouslyUseHTMLString: true }) // 동일한 VDOM ID가 존재합니다.
          return this.$nextTick(function () { this.$refs.vdomIdRef.focus() })
        } else this.$alert(this.$t('common.ALERT.LOGGING.004'), { dangerouslyUseHTMLString: true }) // 생성에 실패하였습니다.<br>관리자 문의 부탁드립니다.
      } catch (error) {
        this.$alert(this.$t('common.ALERT.LOGGING.004'), { dangerouslyUseHTMLString: true }) // 생성에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        console.error(error)
      }
    },
    async updateEquipVdom (vdomIdx, equipVdom) {
      try {
        const result = await API.network.updateEquipVdom(vdomIdx, equipVdom)

        if (result && !result.errorCode) {
          this.$alert(this.$t('common.ALERT.BASE.019')) // 성공적으로 변경되었습니다.
          await this.getEquipVdoms()
          this.newItemModal = false
        } else this.$alert(this.$t('common.ALERT.LOGGING.005'), { dangerouslyUseHTMLString: true }) // 수정에 실패하였습니다.<br>관리자 문의 부탁드립니다.
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.LOGGING.005'), { dangerouslyUseHTMLString: true }) // 수정에 실패하였습니다.<br>관리자 문의 부탁드립니다.
      }
    },
    async deleteEquipVdom (vdomIdx) {
      try {
        const payload = {
          userId: this.userInfo.userId,
          vdomIdx: vdomIdx
        }
        const result = await API.network.deleteEquipVdom(payload)
        if (!result) return this.$alert(this.$t('common.ALERT.BASE.015'), { dangerouslyUseHTMLString: true }) // 삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        else this.$alert(this.$t('common.ALERT.BASE.017')) // 삭제되었습니다.
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.BASE.015'), { dangerouslyUseHTMLString: true }) // 삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.
      } finally {
        await this.getEquipVdoms()
      }
    },
    async getEquipNetworks () {
      const response = await API.network.getEquipNetworks()
      this.networkEquipOptions = []
      if (!response) return
      const equipOptions = response.map(item => {
        return {
          field: item.netIdx,
          label: item.netName
        }
      })
      this.networkEquipOptions = equipOptions
    },
    async getGroupList (param) {
      try {
        this.isGroupTree = true
        const response = await API.iam.getGroupList(param)
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
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          type: 'error'
        })
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
      // return value
    },
    routeTo (to) {
      this.$router.push(to)
    },
    gridRefresh (grid = this.grid) {
      const cv = grid.collectionView
      cv.refresh()
    },
    setTableData (data) {
      this.tableData = JSON.parse(JSON.stringify(data))
      this.tableData = this.tableData.map(row => {
        return {
          ...row,
          companyLabel: this.getRelation(row.companyIdx)
        }
      })
    },
    /**
     * 생성/수정 모달 타이틀 설정
     */
    setModalTitle () {
      if (this.updateItem.vdomIdx !== undefined) {
        this.modalTitle = this.$t('admin.PREF.changeItem')
      } else {
        this.modalTitle = this.$t('common.TERMS.itemAdd')
      }
    },
    selectRow (rowData) {
      this.selectedRow = rowData
    },
    /**
     * 템플릿 편집 -> 편집 전 데이터를 this.initData에 담아주고,
     * 업데이트 아이템을 세팅해줍니다. (생성/수정 구분을 위함)
     */
    applyUpdateItem (item) {
      this.updateItem = this.setUpdateItem(item)

      if (item) this.initData = JSON.stringify(item)
      this.newItemModal = true
    },
    /**
     * 업데이트 아이템 세팅
     * @return {Object} [변경]을 누르면 체크된 친구가 updateItem, [항목 추가]를 누르면 새로운 데이터 세팅
     */
    setUpdateItem (data) {
      let newTemp
      if (data) {
        this.isUpdate = true
        // this.updateItem = data
        // return this.updateItem
        newTemp = {
          vdomId: data.vdomId,
          vdomIdx: data.vdomIdx,
          companyIdx: data.companyIdx,
          workType: data.workType,
          trust: data.trust,
          untrust: data.untrust,
          netName: data.netName,
          netIdx: data.netIdx,
          isNat: data.isNat || false,
          comment: data.comment ? data.comment : ''
        }
      } else {
        this.isUpdate = false
        newTemp = {
          vdomId: '',
          companyIdx: '',
          workType: '',
          trust: '',
          untrust: '',
          netName: '',
          netIdx: undefined,
          isNat: false,
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
      this.deleteEquipVdom(removeObj._data.vdomIdx)
      this.selectedRow = null
    },
    /**
     * 항목 생성/수정 모달에서 [확인]을 눌렀을 때 해당 로우 저장
     */
    saveUpdateAction () {
      if (!this.updateValid()) return

      this.$confirm(this.$t('common.CONFIRM.BASE.001'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.saveUpdatedItem(this.updateItem)
      }).catch(() => {
        return false
      })
    },
    /**
     * 항목 생성/수정 모달에서 [취소] 버튼을 눌렀을 때 발생하는 이벤트
     */
    cancelSave () {
      this.saveUpdatedItem(null)
      this.newItemModal = false
    },
    /**
     * 변경 모달 -> [확인]/[취소] -> 저장
     * @param {Object} updateItem emit으로 전달 받은 업데이트 된 템플릿 아이템, 없을 때 (저장 안하고 취소 눌렀을 때) 편집 전 상태로 돌려줍니다.
     */
    saveUpdatedItem (updateRow) {
      if (!updateRow) { // [취소] 눌렀을 때
        if (this.updateItem.vdomIdx === undefined) return false
        // this.tableData[this.selectedRow.index] = JSON.parse(this.initData)
      } else {
        const { netName, ...rest } = updateRow
        rest.userId = this.userInfo.userId

        if (rest.vdomIdx === undefined) { // 아이템 생성일 때
          this.createEquipVdom(rest)
        } else { // 아이템 변경일 때
          this.updateEquipVdom(rest.vdomIdx, rest)
        }
      }
    },
    gridSetInit () {
      this.gridRefresh(this.grid)
      this.selectedRow = null
    },

    activeSync () {
      this.lastSync = new Date()
    },
    updateValid () {
      if (!this.updateItem.vdomId?.trim()) {
        // this.$alert('VDOM ID를 입력해주세요.')
        this.$alert(this.$t('common.ALERT.SECURITY.035'))
        return false
      }
      if (!this.updateItem.companyIdx) {
        // this.$alert('관계사를 선택해주세요.')
        this.$alert(this.$t('common.ALERT.PROJECT.008'))
        return false
      }
      if (!this.updateItem.trust?.trim()) {
        // this.$alert('Trust를 입력해주세요.')
        this.$alert(this.$t('common.ALERT.SECURITY.032'))
        return false
      }
      if (!this.updateItem.untrust?.trim()) {
        // this.$alert('Untrust를 입력해주세요.')
        this.$alert(this.$t('common.ALERT.SECURITY.033'))
        return false
      }
      if (this.updateItem.netIdx === undefined) {
        // this.$alert('네트워크 장비를 선택해주세요.')
        this.$alert(this.$t('common.ALERT.NETWORK.001'))
        return false
      }
      return true
    },
    /**
     * 엑셀 업로드 모달 닫기 전 이벤트
     */
    beforeExcelUploadClose () {
      this.$confirm(this.$t('common.CONFIRM.BASE.003'), {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(() => { this.excelUploadModal = false })
        .catch(() => false)
    },
    /**
     * 방화벽 VDOM 엑셀 업로드
     */
    async saveExcelUpload (file) {
      try {
        this.excelUploadLoading = true
        const response = await API.network.uploadVdomExcel(file)
        if (response && !response.errorCode) {
          this.$alert(this.$t('common.ALERT.SECURITY.016'), { callback: () => this.$emit('close') }) // 파일 업로드가 완료되었습니다.
          this.excelUploadModal = false
          await this.getEquipVdoms()
        } else if (response.errorCode) {
          const message = {
            NET5002: this.$t('common.ALERT.NETWORK.041'), // 해당하는 방화벽 VDOM이 이미 존재합니다. 다시 시도해주세요.
            NET7000: this.$t('common.ALERT.NETWORK.047'), // 파일 내용을 확인해주세요.
            NET7002: this.$t('common.ALERT.NETWORK.047'), // 파일 내용을 확인해주세요.
            NET0000: this.$t('common.ALERT.SECURITY.017')
          }[response.errorCode]

          const msg = message || this.$t('common.ALERT.NUTA.014')
          return this.$alert(msg, { dangerouslyUseHTMLString: true })
        } else {
          this.$alert(this.$t('common.ALERT.NUTA.014'), { dangerouslyUseHTMLString: true }) // 파일 업로드 중에 문제가 발생하였습니다.<br>다시 시도해주세요.
        }
      } catch (error) {
        console.error(error)
        this.$alert(this.$t('common.ALERT.NUTA.014'), { dangerouslyUseHTMLString: true }) // 파일 업로드 중에 문제가 발생하였습니다.<br>다시 시도해주세요.
      } finally {
        this.excelUploadLoading = false
      }
    }
  },
  data () {
    return {
      totalResultCnt: 0,
      loading: false,
      isGroupTree: false,
      excelUploadLoading: false,

      isUpdate: false,
      selectedRow: null,
      modalTitle: '',
      newItemModal: false,
      excelUploadModal: false,
      tableData: [],
      initData: null,
      updateItem: {
        vdomId: '',
        companyIdx: '',
        workType: '',
        trust: '',
        untrust: '',
        netIdx: undefined,
        isNat: false,
        comment: ''
      },

      lastSync: null,

      // 테이블 수정 정보
      relationCompOptions: [],
      netTypeOptions: [
        { field: 'INT', label: 'INT' },
        { field: 'DMZ', label: 'DMZ' },
        { field: 'DB', label: 'DB' },
        { field: 'NAT', label: 'NAT' },
        { field: 'DEV', label: 'DEV' }
      ],
      networkEquipOptions: [],

      // 테이블 정보
      columns: [
        { header: 'VDOM ID', binding: 'vdomId', width: 250, align: 'left' },
        { header: '관계사', binding: 'companyLabel', width: 200, align: 'left', keyPath: 'common.TERMS.rel' },
        { header: '망 구분', binding: 'workType', width: 150, keyPath: 'common.GRID.NETWORK.networkClass' },
        { header: 'Trust', binding: 'trust', width: 150 },
        { header: 'Untrust', binding: 'untrust', width: 150 },
        { header: '연동 방화벽 장비', binding: 'netName', width: 200, align: 'left', keyPath: 'admin.PREF.firewallEquip' },
        { header: 'NAT 방화벽 사용', binding: 'isNat', width: 170, keyPath: 'common.GRID.NETWORK.isNat', customHtml: true },
        { header: '설명', binding: 'comment', width: '*', align: 'left', keyPath: 'admin.PREF.explain' }
      ]
    }
  }
}
</script>
<style lang="scss">
  .config-firewall-vdom {
    .table-area {
      margin-top: $gap;
      .firewall-vdom-grid {
        .wj-cell {
          overflow: visible;
          // justify-content: flex-start;
          padding: 0 $gap * 2;
          cursor: pointer;
        }
      }
    }
  }
</style>
