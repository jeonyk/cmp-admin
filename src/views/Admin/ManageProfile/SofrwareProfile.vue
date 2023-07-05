<!--
  * 파일명 : SofrwareProfile.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2020-12-20
  * License By Shinsegae I&C
  * 2020-12-20 fix: 전반적 css 수정
 -->

<template>
  <div class="software-profile">
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
            :disabled="!selectedEraProfile"
            @click="registUserPage"
          >
            유저 페이지 등록
          </button>
        </div>
      </section>
      <section class="table-area">
        <cmp-grid
          class="profile-table"
          :item-source="eraTableData"
          :columns="eraColumnData"
          :init-custom-action="initEraGrid"
          selectable
          @selectedRow="selectEraProfileRow"
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
        <total-count :total-count="totalCnt" />

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
        </div>
      </section>

      <section class="table-area">
        <cmp-grid
          class="profile-table"
          :item-source="tableData"
          :columns="softwareColumnData"
          :init-custom-action="init"
          selectable
          @selectedRow="selectRow"
          @total-count="cnt => totalCnt = cnt"
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
          title="Engine"
          required
        >
          <el-input
            placeholder="Engine을 입력하세요."
            v-model="updateItem.engineType"
            :disabled="updateItem.crud !== 'create' ? true : false"
          />
        </register-contents>
        <!-- Engine -->

        <register-contents
          title="Version"
          required
        >
          <el-input
            placeholder="Version을 입력하세요."
            v-model="updateItem.version"
            :disabled="updateItem.crud !== 'create' ? true : false"
          />
        </register-contents>
        <!-- Version -->

        <register-contents
          title="OS Vendor"
          required
        >
          <el-input
            placeholder="OS Vendor를 입력하세요."
            v-model="updateItem.osVendor"
          />
        </register-contents>
        <!-- OS Vendor -->

        <register-contents
          title="OS Version"
          required
        >
          <el-input
            placeholder="OS Version을 입력하세요."
            v-model="updateItem.osVersion"
          />
        </register-contents>
        <!-- OS Version -->

        <register-contents
          title="OS Bit"
          required
        >
          <el-input
            placeholder="OS Bit을 입력하세요."
            v-model="updateItem.osBit"
          />
        </register-contents>
        <!-- OS Bit -->
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
        style="border-top: 1px solid #3D435E"
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
          title="Era이름"
          required
        >
          <el-input
            placeholder="Era이름을 입력하세요."
            v-model="registItem.eraName"
            disabled
          />
        </register-contents>
        <register-contents

          title="Engine"
          required
        >
          <el-input
            placeholder="Engine을 입력하세요."
            v-model="registItem.engineType"
            disabled
          />
        </register-contents>

        <register-contents
          title="Version"
          required
        >
          <el-input
            placeholder="Version을 입력하세요."
            v-model="registItem.version"
            disabled
          />
        </register-contents>

        <register-contents
          title="OS Vendor"
          required
        >
          <el-input
            placeholder="OS Vendor를 입력하세요."
            v-model="registItem.osVendor"
          />
        </register-contents>

        <register-contents
          title="OS Version"
          required
        >
          <el-input
            placeholder="OS Version을 입력하세요."
            v-model="registItem.osVersion"
          />
        </register-contents>

        <register-contents
          title="OS Bit"
          required
        >
          <el-input
            placeholder="OS Bit을 입력하세요."
            v-model="registItem.osBit"
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
    this.getEraSwProfiles()
    this.getUserProfiles()
  },
  methods: {
    async getEraSwProfiles () {
      const response = await API.database.getProfiles({ type: 'SOFTWARE' })
      if (response.status === 200) {
        this.eraTableData = response.data.SOFTWARE.filter(item => {
          if (item.profileOsInfo.osVendor && item.profileOsInfo.osVersion) return true
        })
      }
    },
    async getUserProfiles () {
      const response = await API.database.getUserProfiles()
      if (response.status === 200) {
        this.tableData = response.data.SOFTWARE
      }
    },
    initEraGrid (grid) {
      this.eraGrid = grid
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
    selectEraProfileRow (row) {
      this.selectedEraProfile = row._data
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
          engineType: '',
          version: '',
          osVendor: '',
          osVersion: '',
          osBit: ''
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
      if (grid === this.eraGrid) this.selectedEraProfile = null
    },
    /**
     * [유저 페이지 등록] 버튼 눌렀을 때, 액션
     */
    async registUserPage () {
      // this.registItem = JSON.parse(JSON.stringify(this.selectedEraProfile))
      // this.registItemModal = true
      const response = await API.database.createUserProfile({
        userProfType: this.selectedEraProfile.profileType,
        userProfMap: {
          profileName: this.selectedEraProfile.profileName,
          engineType: this.selectedEraProfile.engineType,
          engineVersion: this.selectedEraProfile.propertyMap.VERSION,
          osVendor: this.selectedEraProfile.profileOsInfo.osVendor,
          osVersion: this.selectedEraProfile.profileOsInfo.osVersion,
          osPlatform: this.selectedEraProfile.profileOsInfo.osPlatform
        }
      })
      if (response.status === 200) {
        if (response.data) {
          this.getUserProfiles()
        }
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
        this.cancelRegistAction()
      }).catch(() => {
        return false
      })

      this.$nextTick(() => {
        this.gridSetInit(this.eraGrid)
      })
    },
    /**
     * [유저페이지등록] 모달에서 [취소] 클릭시, 발생 이벤트
     */
    cancelRegistAction () {
      this.registItemModal = false
      this.gridSetInit(this.eraGrid)
    }
  },
  data () {
    return {
      totalCnt: 0,
      totalResultCnt: 0,
      selectedRow: null,
      selectedEraProfile: null,
      modalTitle: '',
      newItemModal: false,
      registItemModal: false, // 유저페이지 등록 모달
      tableData: [],
      initData: null,
      updateItem: {
        userProfIdx: '',
        profileName: '',
        engineType: '',
        version: '',
        osVendor: '',
        osVersion: '',
        osBit: ''
      },
      registItem: {
        profileIdx: '',
        profileName: '',
        eraName: '',
        engineType: '',
        version: '',
        osVendor: '',
        osVersion: '',
        osBit: ''
      },

      // 테이블 임시 데이터
      softwareColumnData: [
        { binding: 'userProfMap.profileName', header: '이름', align: 'left' },
        { binding: 'userProfMap.engineType', header: 'Engine' },
        { binding: 'userProfMap.engineVersion', header: 'Version' },
        { binding: 'userProfMap.osVendor', header: 'OS Vendor' },
        { binding: 'userProfMap.osVersion', header: 'OS Version' },
        { binding: 'userProfMap.osPlatform', header: 'OS Bit' }
      ],
      eraColumnData: [
        { binding: 'profileName', header: '이름', align: 'left' },
        { binding: 'eraConfig.eraName', header: 'Era 이름' },
        { binding: 'engineType', header: 'Engine' },
        { binding: 'propertyMap.VERSION', header: 'Version' },
        { binding: 'profileOsInfo.osVendor', header: 'OS Vendor' },
        { binding: 'profileOsInfo.osVersion', header: 'OS Version' },
        { binding: 'profileOsInfo.osPlatform', header: 'OS Bit' }
      ],
      originTableData: [
        { userProfIdx: '2', profileName: 'MARIADB', engineType: 'mariadb', version: '10.3', osVendor: '', osVersion: '', osBit: '' }
      ],
      eraTableData: [
        { profileIdx: '', eraName: '', profileName: '', engineType: '', version: '', osVendor: '', osVersion: '', osBit: '' }
        // { profileIdx: '2', eraName: 'Era', profileName: 'MARIADB', engineType: 'mariadb', version: '10.3', osVendor: '', osVersion: '', osBit: '' },
        // { profileIdx: '2', eraName: 'Era', profileName: 'MARIADB', engineType: 'mariadb', version: '10.3', osVendor: '', osVersion: '', osBit: '' }
      ]
    }
  }
}
</script>
<style lang="scss" scoped>
  .software-profile {
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
