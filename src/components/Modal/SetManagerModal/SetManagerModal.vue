<!--
  * 파일명 : SetManagerModal.vue
  * 파일 기능 : 담당자 선택 모달
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 fix: 역할 생성/상세 - 담당자 선택 초기 선택 세팅
 -->

<template>
  <el-dialog
    :title="title"
    :visible.sync="isActive"
    class="set-manager-modal"
    width="50%"
    @close="close"
  >
    <section class="modal-body">
      <wj-flex-grid-search
        id="theSearch"
        :placeholder="$t('common.PLACEHOLDER.searchEnter')"
        ref="theSearch"
      />
      <div class="table-area">
        <cmp-grid
          v-if="isActive"
          :columns="columns"
          :item-source="managerList"
          @checkedRowsData="setCheckedRows"
          :header-checkbox="!selectableOnly"
          :selectable="selectableOnly"
          @selectedRow="setSelectedRow"
          :init-custom-action="init"
          :init-auto-select-row.sync="initAutoSelectRow"
          :init-auto-select-row-key="initAutoSelectRowKey"
          :changing-page-reset="false"
          :searching="true"
          search-box-id="theSearch"
        />
      </div>
    </section>

    <section class="modal-footer">
      <div class="modal-button-area">
        <button
          class="button -modal-button"
          type="is-anti"
          @click="close"
        >
          취소
        </button>
        <button
          class="button -modal-button"
          @click="applyMapping"
          type="is-primary"
          :disabled="!confirmIsValid"
        >
          확인
        </button>
      </div>
    </section>
  </el-dialog>
</template>
<script>
import { cloneDeep } from 'lodash'
export default {
  name: 'SetManagerModal',
  components: {
  },
  props: {
    active: {
      type: Boolean,
      default: false
    },
    data: {
      type: Array,
      default: () => []
    },
    title: {
      type: String,
      default: ''
    },
    selectableOnly: { // 단일 로우 선택 가능할 때
      type: Boolean,
      default: false
    },
    initAutoSelectRow: { // 이전에 선택된 row의 dataItem - 그리드 시작시 해당 row 의 data 를 기반으로 Array에서 해당하는 row를 찾습니다.
      type: [Object, Array],
      default: () => {}
    },
    initAutoSelectRowKey: { // 그리드 시작 시, 자동 선택되는 로우를 알기 위한 고유 key 값
      type: String,
      default: 'userIdx'
    }
  },
  created () {
    this.managerList = cloneDeep(this.data)
  },
  watch: {
    active (newVal) {
      this.isActive = newVal
      this.managerList = cloneDeep(this.data)
    },
    isActive (newVal) {
      this.active = newVal
    },
    data (newVal) {
      this.managerList = cloneDeep(newVal)
    }
  },
  computed: {
    confirmIsValid () {
      return (this.selectedItem.length > 0)
    }
  },
  methods: {
    init (grid) {
      this.grid = grid
    },
    close () {
      this.setInitState()
      this.gridRefresh(this.grid)
      this.$forceUpdate()
      // setTimeout(() => {
      this.$emit('close')
      // }, 200)
    },
    setInitState () {
      this.$refs.theSearch.control.text = ''
      this.selectedItem = []
      // this.managerList.forEach(item => { item.isChecked = false })
    },
    applyMapping () {
      // this.$nextTick(() => {
      this.$emit('select', this.selectedItem)
      this.close()
      // })
    },
    setCheckedRows (params) { // 여러개 선택 가능할 때
      if (!this.selectableOnly) {
        this.selectedItem = this.managerList.filter(manager => manager.checked)
      }
    },
    setSelectedRow (param) { // 단일 선택 가능할 때
      if (this.selectableOnly) {
        this.$emit('selectedRow', param)
      }
    },
    gridRefresh (grid = this.grid) {
      if (!grid) return
      var cv = grid.collectionView
      if (cv) {
        cv.refresh()
      }
    }
  },
  data () {
    return {
      isActive: this.active || false,

      columns: [
        { binding: 'userId', header: '사번' },
        { binding: 'userName', header: '이름', keyPath: 'common.MODAL.name' },
        { binding: 'userPosition', header: '직급', keyPath: 'admin.ROLE.position' },
        { binding: 'userGroup', header: '부서', keyPath: 'task.PRIOR.GRID.depart' }
      ],
      managerList: [],
      selectedItem: []
    }
  }
}
</script>
<style lang="scss">
  .set-corp-modal {
    // margin-top: -50px;
    .modal-body {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: $gap;
    }
  }
  .set-manager-modal {
    margin-top: -100px;
  }
  #theSearch {
    border: 1px solid #64676b;
  }
</style>
