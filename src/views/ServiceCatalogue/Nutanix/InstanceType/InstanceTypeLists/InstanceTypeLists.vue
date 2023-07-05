<!--
  * 파일명 : InstanceTypeLists.vue
  * 파일 기능 : 서비스 카탈로그 > 인스턴스 타입 정보 리스트, 서버 사양 추가/수정/삭제 기능, 필터링(성능) 기능
  * 작성자 : 김진범 외 2명
  * 최종 작성일 : 2021-01-26
  * License By Shinsegae I&C
  * 2021-01-26 Merge branch 'dev' of https://gitlab-s.growthsoft.co.kr/SSG/cmp-web-admin into dev
 -->

<template>
  <div class="installprogram-page">
    <!-- <filtering-component
      :data="filteringList"
      @selected="selectFilter"
      @reset-data="resetFilter"
    /> -->

    <section class="table-top-wrap">
      <total-count :total-count="totalResultCnt" />

      <div class="button-area -right">
        <button
          class="button"
          type="is-primary"
          @click="$router.push({ name: 'instance-type-lists-add', params: { list: tableData } })"
        >
          {{ $t('service.addServerSpec') }}
        </button>
        <button
          :disabled="!selectedRow"
          class="button"
          @click="changeEditStatus"
        >
          {{ $t('common.BTN.change') }}
        </button>
        <button
          :disabled="!selectedRow"
          class="button"
          type="is-anti"
          @click="removeListsAlert"
        >
          {{ $t('common.BTN.delete') }}
        </button>
      </div>
    </section>
    <!-- /. 버튼영역 -->

    <section class="table-area">
      <cmp-grid
        :item-source="tableData"
        :columns="installProgramColumns"
        :init-custom-action="init"
        selectable
        @selectedRow="selectedRowData"
        @total-count="cnt => totalResultCnt = cnt"
      >
        <template #rootDisk="props">
          {{ props.row.rootDisk }} GB
        </template>
      </cmp-grid>
    </section>
    <!-- /. 설치프로그램 그리드영역 -->

    <!-- row 편집 모달 -->
    <el-dialog
      :title="$t('common.MODAL.changeInstance')"
      width="500px"
      top="25vh"
      :visible.sync="editModal.view"
      :before-close="cancelEdit"
      class="update-modal"
    >
      <div
        v-if="editModal.data"
        class="update-modal-body"
      >
        <register-contents
          v-for="cols in installProgramEditCols"
          :key="cols.binding + '_edit'"
          :title="$t(cols.keyPath) || cols.title"
          required
        >
          <!-- /. 사용 여부 -->
          <!-- <el-select
            v-if="cols.select"
            v-model="editOnlyRow[cols.binding]"
            :popper-append-to-body="false"
            :placeholder="$t('service.perf')"
            class="installprogram-os-selection"
          >
            <el-option
              v-for="item in performanceType"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select> -->
          <el-input-number
            v-if="cols.number"
            :min="cols.min"
            :max="cols.max"
            v-model="editOnlyRow[cols.binding]"
            :placeholder="$t('common.PLACEHOLDER.enterSome', { some: $t(cols.keyPath) }) || cols.title + ' 입력'"
            class="form-input-number"
          />
          <el-input
            v-else
            v-model="editOnlyRow[cols.binding]"
            :placeholder="$t('common.PLACEHOLDER.enterSome', { some: $t(cols.keyPath) }) || cols.title + ' 입력'"
          />
          <!-- :placeholder="cols.title + ' 입력'" -->
          <!-- /. 그외 input 박스 -->
        </register-contents>

        <section class="modal-footer modal-button-area">
          <button
            class="button -modal-button"
            type="is-anti"
            @click="cancelEdit"
          >
            {{ $t('common.BTN.cancel') }}
          </button>
          <button
            class="button -modal-button"
            type="is-primary"
            @click="saveData"
          >
            {{ $t('common.BTN.apply') }}
          </button>
        </section>
      </div>
    </el-dialog>
    <!-- /. 편집 모달 -->
  </div>
</template>

<script>
import API from '@sd-fe/cmp-core'
import { cloneDeep, isEqual } from 'lodash'

export default {
  name: 'InstanceTypeLists',
  // components: {
  //   FilteringComponent
  // },
  async mounted () {
    // await this.getPerformanceType()
    await this.getInstanceList()
  },
  watch: {
    'editModal.view' (visible) {
      if (visible) this.editOnlyRow = cloneDeep(this.selectedRow._data)
    }
  },
  methods: {
    // resetFilter () {
    //   this.tableData = [...this.instanceRawData]
    // },
    init (grid) {
      this.grid = grid
    },
    /**
     * [변경취소]버튼 클릭시 발생하는 이벤트
     */
    cancelEdit () {
      // 첫 데이터에서 아무런 변화가 없음
      if (isEqual(this.editOnlyRow, this.tempEditData)) {
        this.editModal = { view: false, data: null }
        return
      }
      this.$confirm(this.$t('common.CONFIRM.BASE.029'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.editModal = { view: false, data: null }
      }).catch(() => false)

      return false
    },
    /**
     * [삭제버튼] 클릭시 발생하는 이벤트
     */
    removeListsAlert () {
      this.$confirm(this.$t('common.CONFIRM.BASE.008'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        const response = await API.config.deleteInstance({ flavorIdx: this.selectedRow?._data?.idx })
        if (response) {
          this.$alert(this.$t('common.ALERT.PROJECT.013'))
          this.selectedRow = null
          this.getInstanceList()
        } else {
          this.$alert(this.$t('common.ALERT.BASE.014'))
        }
      }).catch(() => false)
    },
    /**
     * selected된 데이터를 저장합니다.
     */
    selectedRowData (row) {
      this.selectedRow = row
    },
    changeEditStatus () {
      this.editModal = {
        view: true,
        data: this.selectedRow?.dataItem
      }
      this.tempEditData = cloneDeep(this.selectedRow._data)
    },
    saveData () {
      const param = { ...this.editOnlyRow }
      const apiParams = {
        flavorIdx: param.idx,
        flavorName: param.name,
        flavorCpu: param.vcpu,
        flavorCorePerCpu: param.corePerCpu,
        flavorGpu: param.gpu,
        flavorRam: param.ram,
        flavorDisk: param.rootDisk
        // flavorType: param.performance
      }
      if (!this.checkValidation(apiParams)) {
        this.$alert(this.$t('common.ALERT.PROJECT.032'))
        return
      }
      this.$confirm(this.$t('common.CONFIRM.BASE.023'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(async () => {
        const response = await API.config.updateInstance(apiParams)
        if (response) {
          this.$alert(this.$t('common.ALERT.PROJECT.024'), () => false) // '저장 성공. 목록을 갱신합니다.'
          this.selectedRow = null
          this.getInstanceList()
        } else {
          this.$alert(this.$t('common.ALERT.BASE.048'), () => false)
        }
        this.editModal = { view: false, data: null }
      }).catch(() => false)
    },
    async getInstanceList () {
      const response = await API.config.getInstanceList()
      this.instanceRawData = response.map(ins => {
        return {
          idx: ins.flavorIdx,
          name: ins.flavorName,
          vcpu: ins.flavorCpu,
          ram: ins.flavorRam,
          rootDisk: ins.flavorDisk,
          // performance: ins.flavorType,
          // showPerform: this.performanceTypeMap.get(ins.flavorType),
          gpu: ins.flavorGpu,
          updateTime: ins.updateTime
        }
      })
      this.tableData = this.instanceRawData
      this.tableData.sort((a, b) => b.updateTime - a.updateTime)
    },
    // selectFilter (item) {
    //   if (!item.performance || item.performance === 'all') {
    //     this.tableData = this.instanceRawData
    //   } else {
    //     this.tableData = this.instanceRawData.filter(data => data.performance === item.performance)
    //   }
    // },
    checkValidation (param) {
      const validate = param.flavorName && param.flavorName.trim() && param.flavorCpu && param.flavorRam && (param.flavorDisk === 0 || param.flavorDisk)
      const filterData = this.instanceRawData.filter(data => data.idx !== param.idx && data.name === param.name)
      return filterData.length === 0 && validate
    }
    // async getPerformanceType () {
    //   const response = await API.config.getCodeList({ codeType: 'FLAVOR' })
    //   this.performanceType = await response.map(data => {
    //     return {
    //       label: data.codeName,
    //       value: data.codeVal
    //     }
    //   })
    //   const typeMap = new Map()
    //   this.performanceType.forEach(type => typeMap.set(type.value, type.label))
    //   this.performanceTypeMap = typeMap
    // }
  },
  data () {
    return {
      tempEditData: null,
      totalResultCnt: 0,
      filteringList: [
        {
          field: 'performance',
          label: '성능',
          keyPath: 'service.perf',
          selections: [
            { label: this.$t('main.DASHBOARD.all'), value: 'all' }, // 전체
            { label: this.$t('service.PLACEHOLDER.highSpec'), value: 'HIGH' }, // 고성능
            { label: this.$t('service.PLACEHOLDER.general'), value: 'NORMAL' } // 일반
          ]
        }
      ],
      // performanceTypeMap: new Map(),
      // performanceType: [],
      selectedRow: null,
      editOnlyRow: {},
      editModal: {
        view: false,
        data: null
      },
      tableData: [],
      installProgramColumns: [
        { header: '사양명', binding: 'name', align: 'left', keyPath: 'service.specName' },
        { header: 'Vcpu(개)', binding: 'vcpu', keyPath: 'service.vCpu' },
        { header: 'RAM(GB)', binding: 'ram' },
        { header: 'RootDisk(GB)', binding: 'rootDisk', customHtml: true }
        // { header: '성능', binding: 'showPerform', keyPath: 'service.perf' }
      ],
      installProgramEditCols: [
        { title: '사양명', binding: 'name', keyPath: 'service.specName' },
        { title: 'Vcpu(개)', binding: 'vcpu', min: 1, max: 1024, number: true, keyPath: 'service.vCpu' },
        { title: 'RAM(GB)', binding: 'ram', min: 1, max: 1024, number: true },
        { title: 'RootDisk(GB)', binding: 'rootDisk', min: 0, max: 1024, number: true }
      ],
      instanceRawData: []
    }
  }
}
</script>

<style lang="scss" scoped>
.installprogram-page {
  .usable-wrap {
    display: flex;
    > label {
      flex: 0 0 20%;
    }
  }

  .install-lists {
    > li {
      line-height: 1.5
    }
  }

  .usable-icon {
    text-align: center;
    display: block;
  }

  .update-modal {
    &-body {border-top: 1px solid $border-color;}

    .form-input-number { width: 150px; }
  }
}
</style>
