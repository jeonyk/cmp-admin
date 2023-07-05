<!--
  * 파일명 : InstallProgramModal.vue
  * 파일 기능 : [설치프로그램]을 설정할 수 있는 모달입니다. 이미 선택되어있는 설치프로그램 데이터를 받아 팝업이 뜰 때 선택된 값을 보여줄 수 있습니다.
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-02-15
  * License By Shinsegae I&C
  * 2021-02-15 fix: [자원이관] - 체크 자원 세팅 및 출발지 프로젝트 설정
 -->

<template>
  <el-dialog
    :title="$t('common.GRID.COMPUTE.install')"
    :visible.sync="isActive"
    width="880px"
    @close="close"
    class="install-program-modal"
    top="15vh"
  >
    <section class="modal-body">
      <cmp-grid
        :item-source="installProgramTableSampleData"
        :columns="installProgramColumns"
        header-checkbox
        :init-custom-action="init"
        @checkedRowsData="checkedData"
        :use-excel-download="false"
      />
    </section>

    <section class="modal-footer big-button-area">
      <button
        class="button"
        type="is-anti"
        @click="close"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="save"
      >
        {{ $t('common.BTN.confirm') }}
      </button>
    </section>
  </el-dialog>
</template>
<script>
export default {
  name: 'InstallProgramModal',
  components: {
  },
  props: {
    active: {
      type: Boolean,
      default: false
    },
    compareData: {
      type: Array,
      default: () => []
    }
  },
  watch: {
    active (newVal) {
      this.isActive = newVal
    },
    isActive (newVal) {
      this.active = newVal

      if (newVal) {
        this.setCheckState()
      } else {
        this.checkedItems = []
        this.gridRefresh()
      }
    },
    compareData () {
      this.setCheckState()
    }
  },
  methods: {
    init (grid) {
      this.grid = grid
    },
    gridRefresh () {
      const cv = this.grid.collectionView
      cv.refresh()
    },
    save () {
      this.$emit('save', this.checkedItems)
      this.close()
    },
    close () {
      this.$emit('close')
    },
    checkedData (items) {
      this.checkedItems = items
    },
    setCheckState () {
      if (!this.compareData?.length) return
      this.installProgramTableSampleData.forEach(data => {
        this.compareData.forEach(item => {
          if (item.idx === data.idx) data.checked = true
          else data.checked = false
        })
      })
    }
  },
  data () {
    return {
      isActive: this.active || false,
      resetData: false,
      checkedItems: [],
      installProgramColumns: [
        { binding: 'idx', header: 'idx', width: '*' },
        { binding: 'label', header: 'Name', width: '*' },
        { binding: 'version', header: 'VERSION', width: '*' }
      ],
      installProgramTableSampleData: [
        { idx: 1, label: 'installProgram 2', version: '버전 샘플2', checked: false },
        { idx: 2, label: 'installProgram 1', version: '버전 샘플1', checked: false },
        { idx: 3, label: 'installProgram 3', version: '버전 샘플3', checked: false },
        { idx: 4, label: 'installProgram 4', version: '버전 샘플4', checked: false },
        { idx: 5, label: 'installProgram 5', version: '버전 샘플5', checked: false },
        { idx: 6, label: 'installProgram 6', version: '버전 샘플6', checked: false }
      ]
    }
  }
}
</script>
