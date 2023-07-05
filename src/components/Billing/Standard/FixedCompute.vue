<template>
  <div
    v-loading="isLoadingFixedCompute"
    class="fixed-compute"
  >
    <div
      v-if="viewEdit"
      class="fixed-compute-head"
    >
      <el-upload
        v-if="modelEdit"
        v-loading="isLoadingUploadExcel"
        action=""
        ref="excel-upload"
        :limit="1"
        :on-change="onUploadExcel"
        :multiple="false"
        :show-file-list="false"
        :auto-upload="false"
        style="margin-right: 5px;"
      >
        <button
          class="button"
          type="is-primary"
        >
          Excel 업로드
        </button>
      </el-upload>
      <template v-if="isEdit">
        <button
          class="button"
          type="is-anti"
          @click="onClickCancelRowEdit"
        >
          취소
        </button>
        <button
          class="button"
          type="is-primary"
          @click="onClickSaveRow"
        >
          저장
        </button>
      </template>
      <template v-else>
        <button
          class="button"
          type="is-black"
          :disabled="!selectedRow"
          @click="onClickDeleteRow"
        >
          삭제
        </button>
        <button
          class="button"
          type="is-primary"
          :disabled="!selectedRow"
          @click="onChangeRowEdit"
        >
          변경
        </button>
      </template>
      <button
        class="button"
        type="is-primary"
        @click="onClickAddFixedCompute"
        :disabled="isEdit"
      >
        추가
      </button>
    </div>
    <div class="fixed-compute-body">
      <cmp-grid
        ref="gridRef"
        :selectable="viewEdit"
        :columns="columns"
        :item-source="copyFixedComputes"
        :init-auto-select-row="selectedRow"
        init-auto-select-row-key="index"
        @selectedRow="onSelectGridData"
      >
        <template
          v-for="column in columns"
          v-slot:[column.binding]="{ row }"
        >
          <div :key="column.binding">
            <template v-if="row.isEdit">
              <!-- 관,조,프 -->
              <searchable-select
                v-if="column.isSelectColumn"
                v-model="row[column.binding]"
                :options="getOptions(column.binding, row)"
                @change="(value) => onChangeSelectItem(value, column.binding, row)"
              />
              <el-input
                v-else
                v-model="row[column.binding]"
                :type="column.number ? 'number' : 'text'"
              />
            </template>
            <template v-else>
              <div v-if="column.isSelectColumn">
                {{ row[getNameBinding(column.binding)] }}
              </div>
              <div v-else>
                {{ row[column.binding] }}
              </div>
            </template>
          </div>
        </template>
      </cmp-grid>
    </div>
  </div>
</template>

<script>
import { cloneDeep } from 'lodash'
import { mapGetters } from 'vuex'
import dayjs from 'dayjs'
import API from '@sd-fe/cmp-core'

export default {
  name: 'FixedCompute',
  props: {
    parentModelGroup: {
      type: Object,
      default: () => ({})
    },
    viewEdit: {
      type: Boolean,
      required: true
    },
    affTree: {
      type: Array,
      default: () => ([])
    }
  },
  watch: {
    affTree: {
      immediate: true,
      handler (arr) {
        if (arr && arr.length) {
          this.groupInfo.companyIdx = arr.map(com => ({ ...com, label: com.groupName, value: com.groupIdx }))
        }
      }
    }
  },
  computed: {
    ...mapGetters({
      moduleType: 'cloud/getModuleType'
    }),
    modelEdit () {
      return this.$route.query && this.$route.query.isEdit
    }
  },
  async created () {
    if (this.parentModelGroup && this.parentModelGroup.fixedComputes) {
      this.copyFixedComputes = (cloneDeep(this.parentModelGroup.fixedComputes) || [])
        .map(compute => ({
          ...compute,
          chargeDate: compute.chargeDate ? dayjs(new Date(compute.chargeDate)).format('YYYY-MM-DD') : '',
          deleteReqDate: compute.deleteReqDate ? dayjs(new Date(compute.deleteReqDate)).format('YYYY-MM-DD') : '',
          groupData: {
            group: [],
            project: []
          },
          ...compute.hwBilling
        }))
    }
    this.setColumns()
    this.setFixedComputesData()
  },
  beforeDestroy () {
    this.emitter()
  },
  methods: {
    emitter () {
      this.$emit('update-fixed-compute',
        this.copyFixedComputes
          .filter(compute => {
            if (!this.isEdit) return true
            if (compute.isEdit) return false
            return true
          }).map(this.toApiArr), this.columns)
    },
    async onUploadExcel (file, fileList) {
      if (file.size > (1024 * 1024 * 100)) { // 100Mb 이하 파일만 업로드 가능
        return this.$alert(this.$t('common.ALERT.PROJECT.059', { size: '100Mb' }))
      }

      if (file && fileList.length) {
        this.isLoadingUploadExcel = true
        const formData = new FormData()
        formData.append('file', file.raw)

        try {
          await API.billing.uploadFixedComputeExcel(formData, this.parentModelGroup.id)
          this.$alert('엑셀 업로드 성공 1')
        } catch (error) {
          console.log('실패', error)
          this.$alert(this.$t('common.ALERT.BASE.033')) // 등록 실패하였습니다.
        } finally {
          this.$refs['excel-upload'].clearFiles()
          this.isLoadingUploadExcel = false
        }
      }
    },
    getNameBinding (binding) {
      if (!binding) return 'groupName'
      return binding.replace('Idx', 'Name')
    },
    getOptions (binding, row) {
      if (binding === 'companyIdx') {
        return this.groupInfo.companyIdx
      } else if (binding === 'groupIdx') {
        return row.groupData.group
      } else {
        return row.groupData.project
      }
    },
    async getGroup (value, row) {
      this.isLoadingFixedCompute = true

      try {
        const res = await API.iam.getGroup({
          companyIdx: value
        })
        row.groupData.group = (res || []).map(group => ({
          ...group,
          label: group.groupName,
          value: group.groupIdx
        }))
      } catch (error) {
        console.log(error)
      } finally {
        this.isLoadingFixedCompute = false
      }
    },
    async getProject (value, row) {
      this.isLoadingFixedCompute = true

      try {
        const res = await API.iam.getProject({
          groupIdx: value,
          cloudType: 'PRIVATE'
        })
        row.groupData.project = (res || []).map(project => ({
          ...project,
          label: project.projectName,
          value: project.projectIdx
        }))
      } catch (error) {
        console.log(error)
      } finally {
        this.isLoadingFixedCompute = false
      }
    },
    onChangeSelectItem (value, binding, row) {
      const rawValue = (this.getOptions(binding, row) || []).find(option => option.value === value)
      if (rawValue) {
        row[binding.replace('Idx', 'Name')] = rawValue.label
      }

      if (value && binding === 'companyIdx') {
        row.groupIdx = undefined
        row.groupName = ''
        row.projectIdx = undefined
        row.projectName = ''
        this.getGroup(value, row)
      } else if (value && binding === 'groupIdx') {
        row.projectIdx = undefined
        row.projectName = ''
        this.getProject(value, row)
      }
    },
    toApiArr (compute) {
      // this.columns.forEach(column => {
      //   return column
      // })
      // return compute

      return {
        billingDate: compute.billingDate || new Date().getTime(),
        chargeDate: new Date(compute.chargeDate).getTime() || null,
        clusterName: compute.clusterName || null,
        companyIdx: compute.companyIdx,
        companyName: compute.companyName,
        groupIdx: compute.groupIdx,
        groupName: compute.groupName,
        projectIdx: compute.projectIdx,
        projectName: compute.projectName,
        deleteReqDate: compute.deleteReqDate || null,
        extraBilling: [], // TODO
        hostName: compute.hostName,
        imageName: compute.imageName,
        ipAddress: compute.ipAddress,
        moduleType: this.moduleType,
        priceSum: compute.priceSum,
        hwBilling: {
          cpuExpense: compute.cpuExpense,
          memExpense: compute.memExpense,
          diskExpense: compute.diskExpense,
          vgExpense: compute.vgExpense,
          firewallExpense: compute.firewallExpense,
          l4Expense: compute.l4Expense,
          l7Expense: compute.l7Expense
        },
        swBilling: [
          {
            count: 1,
            expense: compute.os,
            swIdx: null,
            swName: 'osExpense'
          }
        ]
      }
    },
    onClickDeleteRow () {
      if (!this.selectedRow) return

      this.copyFixedComputes.splice(this.selectedRow.index, 1)
    },
    onClickSaveRow () {
      if (this.copyFixedComputes[this.currentEditRow.index]) {

      }

      this.copyFixedComputes[this.currentEditRow.index].isEdit = false

      this.editRowTemp = null
      this.currentEditRow = null
      this.isEdit = false
      this.isAdding = false

      this.emitter()
    },
    onClickCancelRowEdit () {
      this.copyFixedComputes[this.currentEditRow.index].isEdit = false

      this.columns.forEach(column => {
        this.copyFixedComputes[this.currentEditRow.index][column.binding] = this.editRowTemp[column.binding]
      })

      if (this.isAdding) {
        this.copyFixedComputes.splice(0, 1)
      }

      this.editRowTemp = null
      this.currentEditRow = null
      this.isEdit = false
      this.isAdding = false
      this.selectedRow = null
      this.emitter()
    },
    onChangeRowEdit () {
      if (!this.selectedRow) return

      this.editRowTemp = cloneDeep(this.selectedRow)
      this.currentEditRow = this.selectedRow
      this.selectedRow.isEdit = true
      this.isEdit = true
    },
    onClickAddFixedCompute () {
      const columnObj = {}
      this.columns.forEach(column => {
        let defaultValue = ''
        if (column.number) defaultValue = 0
        columnObj[column.binding] = defaultValue
      })
      this.copyFixedComputes.unshift({
        isEdit: false,
        ...columnObj,
        companyName: '',
        groupName: '',
        projectName: '',
        groupData: {
          group: [],
          project: []
        }
      })
      this.$nextTick(() => {
        this.selectedRow = this.copyFixedComputes[0]
        this.onChangeRowEdit()
        this.isAdding = true
      })
    },
    onSelectGridData (row) {
      this.selectedRow = row?.dataItem
    },
    /**
     * 고정 Compute 그리드 데이터 가공
     */
    setFixedComputesData () {
      this.copyFixedComputes.forEach(compute => {
        this.$set(compute, 'isEdit', false)
      })
    },
    getIsSelectColumn (binding) {
      return [
        'companyIdx',
        'groupIdx',
        'projectIdx'
      ].includes(binding)
    },
    /**
     * 컬럼 너비
     */
    setColumnWidth (column) {
      return {
        ...column,
        customHtml: true,
        width: 230,
        isSelectColumn: this.getIsSelectColumn(column.binding)
      }
    },
    /**
     * 컬럼 전반적인 데이터
     */
    setColumns () {
      this.columns = [
        { binding: 'clusterName', header: '클러스터 명' },
        { binding: 'hostName', header: '호스트 명' },
        { binding: 'ipAddress', header: 'IP Address' },
        { binding: 'chargeDate', header: '과금 청구 시작일' },
        { binding: 'deleteReqDate', header: '과금 청구 만료일' },
        { binding: 'companyIdx', header: '관계사' },
        { binding: 'groupIdx', header: '조직' },
        { binding: 'projectIdx', header: '프로젝트' },
        { binding: 'imageName', header: 'OS' },
        { binding: 'cpuExpense', header: 'CPU 비용', number: true, type: 'hwBilling' },
        { binding: 'memExpense', header: 'Memory 비용', number: true, type: 'hwBilling' },
        { binding: 'diskExpense', header: 'Disk 비용', number: true, type: 'hwBilling' },
        { binding: 'vgExpense', header: 'Storage 비용', number: true, type: 'hwBilling' },
        { binding: 'firewallExpense', header: 'SDN(방화벽) 비용', number: true, type: 'hwBilling' },
        { binding: 'l4Expense', header: 'SDN(L4) 비용', number: true, type: 'hwBilling' },
        { binding: 'l7Expense', header: 'SDN(L7) 비용', number: true, type: 'hwBilling' },
        { binding: 'os', header: 'OS 비용', number: true, type: 'swBilling' },
        { binding: 'network', header: '기타(네트워크, 보안)', number: true, type: 'extraBilling' },
        { binding: 'sosan', header: 'MW보안 운영비', number: true, type: 'extraBilling' },
        { binding: 'hoeseon', header: '회선사용료(DWDM)', number: true, type: 'extraBilling' },
        { binding: 'copy', header: '데이터 복제', number: true, type: 'extraBilling' },
        { binding: 'priceSum', header: '비용', number: true, type: 'totalBilling' }
      ]
        .map(this.setColumnWidth)
    }
  },
  data: () => ({
    isLoadingFixedCompute: false,
    isEdit: false,
    columns: [],
    copyFixedComputes: [],
    selectedRow: null,
    editRowTemp: null,
    currentEditRow: null,
    isAdding: false,
    groupInfo: {
      companyIdx: [],
      groupIdx: [],
      projectIdx: []
    },
    isLoadingUploadExcel: false
  })
}
</script>

<style lang="scss" scoped>
.fixed-compute {
  width: 100%;

  &-head {
    text-align: right;

    > div {
      display: inline-block;
    }

    > .button + .button {
      margin-left: 5px;
    }
  }

  &-body {
    margin-top: $gap-m;
  }
}
</style>
