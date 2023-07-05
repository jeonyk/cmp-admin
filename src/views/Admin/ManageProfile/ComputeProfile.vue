<!--
  * 파일명 : ComputeProfile.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2020-11-13
  * License By Shinsegae I&C
  * 2020-11-13 fix: 테이블 상단 버튼 위치 통일 (추가-변경-삭제)
 -->

<template>
  <div class="compute-profile">
    <dashboard-panel
      class="profile-panel -left"
      title="Era Profile"
    >
      <section class="table-top-wrap">
        <total-count :total-count="totalResultCnt" />

        <div class="button-area -right">
          <button
            class="button"
            style="margin-left: 10px;"
            type="is-primary"
            :disabled="!selectedComputeProfile"
            @click="registUserPage"
          >
            유저 페이지 등록
          </button>
        </div>
      </section>
      <section class="table-area">
        <cmp-grid
          class="profile-table"
          :item-source="computeTableData"
          :columns="computeColumnData"
          :init-custom-action="initComputeGrid"
          selectable
          @selectedRow="selectComputeProfileRow"
          @total-count="cnt => totalResultCnt = cnt"
        />
      </section>
    </dashboard-panel>
    <!-- Era Profile 그리드 -->

    <i class="db-arrow-icon" />

    <dashboard-panel
      class="profile-panel -right"
      title="User Profile"
    >
      <section class="table-top-wrap">
        <total-count :total-count="totalTableDatatCnt" />

        <div class="button-area -right">
          <!-- <button
            class="button"
            style="margin-left: 10px;"
            :disabled="!selectedRow"
            @click="registUserPage"
          >
            유저 페이지 등록
          </button> -->
          <!-- <span class="divider" /> -->
          <div class="button-area">
            <!-- <button
              class="button"
              type="is-primary"
              @click="e => applyUpdateItem()"
            >
              등록
            </button> -->
          </div>
          <button
            class="button"
            :disabled="!selectedRow"
            @click="e => applyUpdateItem(selectedRow._data)"
          >
            변경
          </button>
          <button
            class="button"
            type="is-anti"
            @click="applyRemove"
            :disabled="!selectedRow"
          >
            삭제
          </button>
        </div>
      </section>

      <section class="table-area">
        <cmp-grid
          class="profile-table"
          :item-source="tableData"
          :columns="userProfileColumn"
          :init-custom-action="init"
          selectable
          @selectedRow="selectRow"
          @total-count="cnt => totalTableDatatCnt = cnt"
        />
      </section>
    </dashboard-panel>

    <!-- 모달 -->
    <!-- 유저 그리드 등록/수정 모달 -->
    <el-dialog
      :title="modalTitle"
      :visible.sync="newItemModal"
      class="new-item-modal"
      width="40%"
      @close="newItemModal = false"
    >
      <section
        class="modal-body"
        style="border-top: 1px solid #3D435E"
      >
        <register-contents
          :title="$t('common.MODAL.name')"
          required
        >
          <el-input
            placeholder="이름을 입력하세요."
            v-model="updateItem.profileName"
          />
        </register-contents>
        <!-- 이름 -->

        <register-contents
          title="VCPU(개)"
          required
        >
          <el-input-number
            placeholder="VCPU(개)을 입력하세요."
            v-model="updateItem.vcpu"
            :min="0"
          />
        </register-contents>
        <!-- VCPU(개) -->

        <register-contents
          title="MEMORY (GB)"
          required
        >
          <el-input-number
            placeholder="Momory을 입력하세요."
            v-model="updateItem.memory"
            :min="0"
          />
        </register-contents>
        <!-- MEMORY (GB) -->
      </section>

      <div class="modal-footer modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="cancelSave"
        >
          취소
        </button>
        <button
          class="button -modal-button"
          @click="saveUpdateAction"
          type="is-primary"
        >
          확인
        </button>
      </div>
    </el-dialog>

    <!-- 유저 페이지 등록 관련 모달 -->
    <!-- <el-dialog
      title="유저 페이지 등록"
      :visible.sync="registItemModal"
      class="new-item-modal"
      width="40%"
      @close="registItemModal = false"
    >
      <section
        class="modal-body"
        style="border-top: 1px solid #3f4145"
      >
        <register-contents
          title="이름"
          required
        >
          <el-input
            placeholder="이름을 입력하세요."
            v-model="registItem.profileName"
          />
        </register-contents>

        <register-contents
          title="VCPU(개)"
          required
        >
          <el-input-number
            placeholder="VCPU(개)을 입력하세요."
            v-model="registItem.propertyMap.CORE_PER_CPU"
            :min="0"
          />
        </register-contents>

        <register-contents
          title="MEMORY (GB)"
          required
        >
          <el-input-number
            placeholder="Momory을 입력하세요."
            v-model="registItem.propertyMap.MEMORY_SIZE"
            :min="0"
          />
        </register-contents>
      </section>

      <div class="modal-footer modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="e => cancelRegistAction()"
        >
          취소
        </button>
        <button
          class="button -modal-button"
          @click="registAction"
          type="is-primary"
        >
          등록
        </button>
      </div>
    </el-dialog> -->
  </div>
</template>
<script>
import API, { DashboardPanel } from '@sd-fe/cmp-core'

export default {
  name: 'SofrwareProfile',
  components: {
    'dashboard-panel': DashboardPanel
  },
  watch: {
    originTableData (newVal) {
      this.setTableData(newVal)
    },
    newItemModal (newVal) {
      if (newVal) this.setModalTitle()
    }
  },
  created () {
    this.setTableData(this.originTableData)
    this.getEraComputeProfiles()
    this.getUserProfiles()
  },
  methods: {
    async getEraComputeProfiles () {
      const response = await API.database.getProfiles({ type: 'COMPUTE', isLatest: true })
      if (response.status === 200) {
        this.computeTableData = response.data.COMPUTE.map(item => {
          item.vcpu = item.propertyMap.CORE_PER_CPU * item.propertyMap.CPUS
          item.memory = item.propertyMap.MEMORY_SIZE
          return item
        })
      }
    },
    initComputeGrid (grid) {
      this.computeGrid = grid
    },
    init (grid) {
      this.grid = grid
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
          crud: ''
        }
      })
    },

    /**
     * Era Profile 에서 로우를 선택했을 때
     */
    selectComputeProfileRow (row) {
      this.selectedComputeProfile = row._data
    },
    /**
     * 생성/수정 모달 타이틀 설정
     */
    setModalTitle () {
      if (this.updateItem.crud === 'create') {
        this.modalTitle = '등록'
      } else {
        this.modalTitle = '변경'
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
      if (item) this.initData = JSON.parse(JSON.stringify(item))
      this.newItemModal = true
    },
    /**
     * 업데이트 아이템 세팅
     * @return {Object} [변경]을 누르면 체크된 친구가 updateItem, [항목 추가]를 누르면 새로운 데이터 세팅
     */
    setUpdateItem (data) {
      if (data) {
        this.updateItem = data
        this.updateItem.crud = 'update'
        return this.updateItem
      } else {
        const newTemp = {
          crud: 'create',
          userProfIdx: Math.random().toString(36).substr(2),
          profileName: '',
          vcpu: '',
          memory: ''
        }
        return newTemp
      }
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
    async removeItems (removeObj) {
      // let removeIdx
      // this.tableData.forEach((data, index) => {
      //   if (data.userProfIdx === removeObj._data.userProfIdx) removeIdx = index
      // })
      // this.tableData.splice(removeIdx, 1)
      // this.grid.rows.remove(this.grid.rows[removeIdx])
      // this.gridSetInit(this.grid)

      const response = await API.database.deleteUserProfile(removeObj._data.userProfIdx)
      if (response.status === 200) {
        this.getUserProfiles()
      }
    },
    /**
     * 항목 생성/수정 모달에서 [확인]을 눌렀을 때 해당 로우 저장
     */
    saveUpdateAction () {
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
        if (this.updateItem.crud === 'create') return
        this.tableData[this.selectedRow.index] = JSON.parse(JSON.stringify(this.initData))
      } else {
        if (updateRow.crud === 'create') { // 아이템 생성일 때
          this.tableData.length ? this.tableData.unshift(updateRow) : this.tableData.push(updateRow)
        } else { // 아이템 변경일 때
          const rowIdx = this.tableData.map((item, idx) => {
            if (item.userProfIdx === this.selectedRow._data.userProfIdx) return idx
          })
          this.tableData[rowIdx] = updateRow
        }
      }

      this.$nextTick(() => {
        this.gridSetInit(this.grid)
        this.newItemModal = false
      })
    },
    gridSetInit (grid) {
      this.gridRefresh(grid)
      if (grid === this.grid) this.selectedRow = null
      if (grid === this.computeGrid) this.selectedComputeProfile = null
    },
    /**
     * [유저 페이지 등록] 버튼 눌렀을 때, 액션
     */
    async registUserPage () {
      // this.registItem = JSON.parse(JSON.stringify(this.selectedComputeProfile))
      // this.registItemModal = true
      const response = await API.database.createUserProfile({
        userProfType: this.selectedComputeProfile.profileType,
        userProfMap: {
          profileName: this.selectedComputeProfile.profileName,
          vcpu: this.selectedComputeProfile.vcpu,
          memory: this.selectedComputeProfile.memory
        }
      })
      if (response.status === 200) {
        if (response.data) {
          this.getUserProfiles()
        }
      }
    },
    async getUserProfiles () {
      const response = await API.database.getUserProfiles()
      if (response.status === 200) {
        this.tableData = response.data.COMPUTE
      }
    },
    /**
     * [유저페이지등록] 모달에서 [등록] 클릭시, 발생 이벤트
     */
    registAction () {
      // this.$confirm(`${this.registItem.profileName}을 유저 페이지에 등록하시겠습니까?`, '알림', {
      this.$confirm(this.$t('common.CONFIRM.ACCOUNT.002', { profileName: this.registItem.profileName }), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(() => {
        this.$alert(this.$t('common.ALERT.BASE.031'))
        this.createUserProfile(this.registerItem)
        this.cancelRegistAction()
      }).catch(() => {
        return false
      })

      this.$nextTick(() => {
        this.gridSetInit(this.computeGrid)
      })
    },
    /**
     * [유저페이지등록] 모달에서 [취소] 클릭시, 발생 이벤트
     */
    cancelRegistAction () {
      this.registItemModal = false
      this.gridSetInit(this.computeGrid)
    }
  },
  data () {
    return {
      totalResultCnt: 0,
      totalTableDatatCnt: 0,
      selectedRow: null,
      selectedComputeProfile: null,
      modalTitle: '',
      newItemModal: false,
      registItemModal: false, // 유저페이지 등록 모달
      tableData: [],
      initData: null,
      updateItem: {
        userProfIdx: '',
        profileName: '',
        vcpu: '',
        memory: ''
      },
      registItem: {
        profileIdx: '',
        profileName: '',
        vcpu: '',
        memory: ''
      },

      // 테이블 임시 데이터
      computeTableData: [
        // { profileIdx: '1', profileName: 'test_compute1', vcpu: 4, memory: 32 },
        // { profileIdx: '2', profileName: 'test_compute2', vcpu: 1, memory: 2 },
        // { profileIdx: '3', profileName: 'test_compute3', vcpu: 1, memory: 2 }
      ],
      computeColumnData: [
        { binding: 'profileName', header: '이름' },
        { binding: 'eraConfig.eraName', header: 'Era 이름' },
        { binding: 'vcpu', header: 'VCPU (개)' },
        { binding: 'memory', header: 'MEMORY (GB)' }
      ],
      originTableData: [
        { userProfIdx: '1', profileName: 'test_compute1', vcpu: 4, memory: 32 },
        { userProfIdx: '2', profileName: 'test_compute2', vcpu: 1, memory: 2 }
      ],
      userProfileColumn: [
        { binding: 'userProfMap.profileName', header: '이름' },
        { binding: 'userProfMap.vcpu', header: 'VCPU (개)' },
        { binding: 'userProfMap.memory', header: 'MEMORY (GB)' }
      ]
    }
  }
}
</script>
<style lang="scss" scoped>
  .compute-profile {
    display: flex;
    align-items: flex-start;
    .profile-panel {
      width: 50%;

    }
    .db-arrow-icon {
      display: inline-block;
      margin: 0 $gap-m;
      min-width: 27px;
      height: 300px;
      background-position: center;
      background-size: contain;
      background-repeat: no-repeat;
      background-image: url('../../../assets/images/icon-dbarrow-left@3x.png');
      transform: rotate(180deg);
    }
  }
</style>
