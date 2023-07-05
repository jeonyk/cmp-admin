<template>
  <el-dialog
    :title="$v('카테고리 관리')"
    :visible.sync="visible"
    width="800px"
    :before-close="() => $emit('close')"
  >
    <!-- v-loading="isDefaultUsedDetail" -->
    <section class="modal-body">
      <div
        class="flex-wrap -flex-end button-area"
        style="margin-bottom: 10px;"
      >
        <button
          class="button"
          type="is-primary"
          v-if="!editable"
          @click="editRow('NEW')"
        >
          {{ $v('추가') }}
        </button>
        <button
          class="button"
          type="is-primary"
          v-else
          @click="saveSWLicenseCategory"
        >
          {{ $v('적용') }}
        </button>
        <button
          class="button"
          v-if="!editable"
          :disabled="!checkedData.length || checkedData.length > 1"
          @click="editRow('UPDATE')"
        >
          {{ $v('변경') }}
        </button>
        <button
          v-else
          class="button"
          :disabled="!editable"
          @click="cancelAddRow"
        >
          {{ $v('취소') }}
        </button>
        <button
          class="button"
          :disabled="!checkedData.length || editable"
          @click="deleteRow"
        >
          {{ $v('삭제') }}
        </button>
      </div>

      <cmp-grid
        :item-source="data"
        :columns="columns"
        header-checkbox
        @checkedRowsData="checkedRowsData"
      >
        <template #categoryName="{ row }">
          <!-- {{ row.editable }} -->
          <el-input
            v-if="row.editable"
            v-model="value"
          />
          <span v-else>{{ row.categoryName }}</span>
        </template>
      </cmp-grid>
    </section>
  </el-dialog>
</template>

<script>
import API from '@sd-fe/cmp-core'
import { cloneDeep } from 'lodash'

export default {
  name: 'AddMeteringLicenseModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    visible (active) {
      if (active) this.getSWLicenseCategory()
    }
  },
  methods: {
    /**
     * [카테고리] 목록 호출
     */
    async getSWLicenseCategory () {
      try {
        // 초기화 확인사살!!!
        this.editable = false
        this.value = undefined
        this.checkedData = []

        const response = await API.metering.getSWLicenseCategory()
        if (!response) return

        this.data = [...response]
      } catch (error) {
        this.$alert(this.$v('카테고리 목록을 가져오는데 문제가 발생했습니다. 다시 시도해주세요.'))
      }
    },
    /**
     * [카테고리 > 추가/변경] 버튼 클릭시 row 생성
     * @param {String} type
     */
    editRow (type) {
      this.editable = !this.editable
      this.data.forEach(item => {
        item.disable = this.editable // 편집중일때는 disabled 처리
        item.checked = false // 체크는 무조건 해제
      })

      const isNew = type === 'NEW'

      // [추가] 인 경우 제일 앞에 추가
      if (isNew) this.data.unshift({ categoryName: undefined, editable: true, disable: true })
      else {
        // [변경] 인 경우 idx 확인
        const idx = this.checkedData[0].index
        const categoryName = this.data[idx].categoryName

        this.data.splice(idx, 1, { categoryName, editable: true, disable: true })
        this.value = categoryName
      }

      this.$forceUpdate()
    },
    /**
     * [카테고리 > 취소] 버튼시 초기화
     */
    cancelAddRow () {
      this.editable = !this.editable
      this.getSWLicenseCategory()
    },
    /**
     * [카테고리 > 적용] 버튼 클릭시 카테고리 저장
     */
    async saveSWLicenseCategory () {
      try {
        // [추가] [변경] API 분리
        const isNew = this.checkedData[0] === undefined
        const apiName = isNew ? 'createSWLicenseCategory' : 'updateSWLicenseCategory'

        const payload = {
          categoryName: this.value,
          isDeletable: true
        }

        await API.metering[apiName](payload)
        this.getSWLicenseCategory()
      } catch (error) {
        console.error('@@ CategoryModal > saveSWLicenseCategory', error)
        this.$alert(this.$v('카테고리 저장 도중 문제가 발생했습니다. 다시 시도해주세요.'))
      }
    },

    /**
     * [카테고리 > 삭제] 카테고리 삭제
     */
    async deleteRow () {
      try {
        const categoryIdxs = this.checkedData.map(({ categoryIdx }) => categoryIdx)
        if (!categoryIdxs.length) return

        await API.metering.deleteSWLicenseCategory({ categoryIdxList: categoryIdxs })

        this.$alert(this.$v('카테고리가 삭제 되었습니다.'), { callback: this.getSWLicenseCategory })
      } catch (error) {
        console.error('@@ CategoryModal > deleteRow', error)
        this.$alert(this.$v('카테고리를 삭제하는동안 문제가 발생했습니다. 다시 시도해주세요.'))
      }
    },
    checkedRowsData (rows) {
      this.checkedData = cloneDeep(rows)
      // console.log(this.checkedData)
    }
  },
  data: root => ({
    editable: false,
    value: undefined, // 신규 카테고리 값
    columns: [{ header: root.$v('카테고리'), binding: 'categoryName', customHtml: true }],
    data: [],
    checkedData: []
  })
}
</script>
