<!--
  * 파일명 : ProfileList.vue
  * 파일 기능 : 뉴타닉스 관리 > Era > 사용자 화면 프로파일
  * 작성자 : 이경환 외 2명
  * 최종 작성일 : 2021-01-27
  * License By Shinsegae I&C
  * 2021-01-27 fix: 그리드 데이터 로딩 UI 개선
 -->

<template>
  <div class="profile-list">
    <h3 class="mid-title">
      <!-- 사용자 화면 프로파일 -->
      {{ $t('admin.PREF.userScreenProfile') }}
    </h3>

    <el-radio-group
      class="radio-switch-group"
      v-model="view"
      style="margin-top:10px;"
    >
      <el-radio-button label="software">
        Software Profile
      </el-radio-button>
      <el-radio-button label="compute">
        Compute Profile
      </el-radio-button>
    </el-radio-group>
    <!-- /. 프로파일 타입 라디오 버튼 (Software / Compute) -->

    <div class="button-area -right">
      <button
        class="button"
        type="is-primary"
        @click="registNewProfle(view, columnData)"
      >
        <!-- 등록 -->
        {{ $t('common.BTN.enroll') }}
      </button>
      <button
        class="button"
        :disabled="!selectedRow"
        @click="selectMetaProfile(view, selectedRow, columnData)"
      >
        <!-- 변경 -->
        {{ $t('common.BTN.change') }}
      </button>
      <button
        class="button"
        type="is-anti"
        :disabled="!selectedRow"
        @click="applySwRemove"
      >
        <!-- 삭제 -->
        {{ $t('common.BTN.delete') }}
      </button>
    </div>
    <!-- /. 등록, 변경, 삭제 -->

    <div
      class="table-area"
      v-loading="isProfile"
      :element-loading-text="$t('common.PLACEHOLDER.loading')"
    >
      <cmp-grid
        :loading="isProfile"
        class="overflow-visible-grid"
        :item-source="tableData"
        :columns="columnData"
        selectable
        @selectedRow="rowSelect"
        :init-custom-action="init"
        :init-auto-select-row="selectedRow"
        init-auto-select-row-key="index"
      >
        <template
          v-for="column in columnData"
          :slot="column.binding"
          slot-scope="props"
        >
          <template>
            <view-box-cnt
              :key="column.binding"
              :hover-info="props.row[column.binding]"
              type="is-white"
              action-type="hover"
            >
              <template #hoverItem="more">
                {{ more.item.eraName }}
              </template>
              {{ props.row[column.binding] ? props.row[column.binding].length : 0 }}
            </view-box-cnt>
          </template>
        </template>
      </cmp-grid>
    </div>
  </div>
</template>

<script>
import ViewBoxCnt from '@/components/ViewBoxCnt/ViewBoxCnt'
import API from '@sd-fe/cmp-core'

import { cloneDeep } from 'lodash'

export default {
  name: 'ProfileList',
  components: {
    'view-box-cnt': ViewBoxCnt
  },
  created () {
    this.getUserProfiles()
  },
  watch: {
    view (view) {
      this.setTableData(view)
    }
  },
  methods: {
    init (grid) {
      this.grid = grid
    },
    rowSelect (selected) {
      const data = selected ? selected.dataItem : null
      this.selectedRow = data
    },

    routeTo (to) {
      this.$router.push(to)
    },
    setTableData (view = this.view) {
      const { table, column } = {
        compute: { table: cloneDeep(this.computeTableData), column: cloneDeep(this.computeColumnData) },
        software: { table: cloneDeep(this.softwareTableData), column: cloneDeep(this.softwareColumnData) }
      }[view]

      this.selectedRow = null
      this.tableData = table
      this.columnData = column

      if (this.grid) this.grid.invalidate(true)

      console.log('table', this.tableData)
      console.log('column', this.columnData)
    },
    /**
     * 전체 Profile 호출
     */
    async getUserProfiles () {
      try {
        this.isProfile = true

        const response = await API.database.getUserProfiles()
        if (!response || response.length < 1) return

        const COMPUTE = response.COMPUTE || []
        const SOFTWARE = response.SOFTWARE || []

        this.computeTableData = COMPUTE?.map(({ userProfMap, eraConfigs, userProfIdx, userProfType, ...test }) => {
          const { profileName, vcpu, memory } = userProfMap

          return {
            profileName,
            vcpu,
            memory,
            userProfIdx,
            userProfType,
            computeEraConfigs: eraConfigs
          }
        })
        this.softwareTableData = SOFTWARE?.map(({ userProfMap, eraConfigs, userProfIdx, userProfType, ...test }) => {
          const { profileName, engineType, engineVersion, osVendor, osVersion, osPlatform } = userProfMap

          return {
            profileName,
            engineType,
            engineVersion,
            osVendor,
            osVersion,
            osPlatform,
            userProfIdx,
            userProfType,
            softwareEraConfigs: eraConfigs
          }
        })

        this.setTableData(this.view)
      } catch (error) {
        console.error(error)
        this.computeTableData = []
        this.softwareTableData = []
        this.$alert(error, '알림', { confirmButtonText: this.$t('common.BTN.confirm') })
      } finally {
        this.isProfile = false
      }
    },
    /**
     * 프로파일 [등록]
     * @param {String} field 어느 영역인지 ? ('software', 'compute')
     * @param {Array} columns 상세 정보 verticalTable이 뿌려줄 칼럼 정보
     */
    registNewProfle (field, columns) {
      return this.routeTo({
        name: 'manage-profile-create',
        params: {
          field,
          columns,
          data: { edit: true }
        }
      })
    },
    /**
     * 프로파일 [상세]
     * @param {String} field 어느 영역인지 ? ('software', 'compute')
     * @param {GroupRow} rowData 선택한 로우 데이터
     * @param {Array} columnData 상세 정보 verticalTable이 뿌려줄 칼럼 정보
     */
    selectMetaProfile (field, rowData, columns) {
      if (!rowData) return
      this.routeTo({
        name: 'manage-profile-detail',
        params: {
          field,
          columns,
          data: rowData,
          userProfIdx: rowData.userProfIdx
        }
      })
    },
    /**
     * [Compute/Software Profile] 삭제시
     */
    applySwRemove () {
      // 해당 항목을 삭제하시겠습니까?
      this.confirm(this.$t('common.CONFIRM.BASE.032'), async () => {
        // console.log('@@ this.selectedRow.dataItem : ', this.selectedRow.dataItem)
        const userProfType = this.selectedRow?.userProfType
        const userProfIdx = this.selectedRow?.userProfIdx

        const isdeleted = await this.checkIsUsedProfile(userProfType, userProfIdx)
        if (isdeleted) this.$alert(this.$t('common.ALERT.BASE.013')) // 삭제되었습니다.
        return this.getUserProfiles()
      })
    },
    async checkIsUsedProfile (type, idx) {
      try {
        this.isProfile = true
        const isUse = await API.work.getIsUseEraUserProfile({ type: type, profileIdx: idx })

        if (isUse) return this.$alert(this.$t('common.ALERT.NUTA.040'), { callback: () => false }) // 사용중인 프로파일이라 삭제할 수 없습니다.
        else return await this.deleteUserProfile(idx)
      } finally {
        this.isProfile = false
        this.selectedRow = null
      }
    },
    async deleteUserProfile (idx) {
      // try/catch 가 안됩니다.. response.data 때문인듯
      const resp = await API.database.deleteUserProfile(idx)

      if (resp.status === 200) return true
      else {
        // 삭제에 실패하였습니다.<br>관리자 문의 부탁드립니다.
        return this.$alert(this.$t('common.ALERT.BASE.015'), {
          dangerouslyUseHTMLString: true,
          callback: () => {
            this.isProfile = false
            return false
          }
        })
      }
    }
  },
  data () {
    return {
      grid: null,
      isProfile: false,
      view: 'software',
      profileTab: [
        { field: 'software', name: 'S/W Profile' },
        { field: 'compute', name: 'Compute Profile' }
      ],

      tableData: [],
      columnData: [],
      selectedRow: null,

      // 그리드 정보 - Software Profile
      softwareTableData: [],
      softwareColumnData: [
        { binding: 'profileName', header: '이름', keyPath: 'common.REGCON.name' },
        { binding: 'engineType', header: 'DB Engine', required: true },
        { binding: 'engineVersion', header: 'DB Version', required: true },
        { binding: 'osVendor', header: 'OS Vendor', required: true },
        { binding: 'osVersion', header: 'OS Version', required: true },
        { binding: 'osPlatform', header: 'OS Bit', required: true },
        { binding: 'softwareEraConfigs', header: '연결정보 (Era)', customHtml: true, keyPath: 'common.GRID.NUTA.connInfoEra' }
      ],

      // 그리드 정보 - Compute Profile
      computeTableData: [],
      computeColumnData: [
        { binding: 'profileName', header: '이름', required: true, keyPath: 'common.REGCON.name' },
        { binding: 'vcpu', header: 'VCPU (개)', required: true, keyPath: 'service.vCpu' },
        { binding: 'memory', header: 'MEMORY (GB)', required: true },
        { binding: 'computeEraConfigs', header: '연결정보 (Era)', customHtml: true, required: true, keyPath: 'common.GRID.NUTA.connInfoEra' }
      ],
      confirm (message, callback) {
        this.$confirm(message, '삭제', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          cancelButtonText: this.$t('common.BTN.cancel')
        }).then(callback).catch(() => false)
      }
    }
  }

}
</script>
<style lang="scss">
  .profile-list {
    position: relative;

    .button-area {
      position: absolute;
      top: 38px;
      right: 0;
    }
    .profile-tab {
      >.tab-contents-area {
        // padding-top: $gap;
      }
    }
  }
</style>
