<!--
  * 파일명 : MeteringModifyList.vue
  * 파일 기능 :
  * 작성자 : 염창윤 외 2명
  * 최종 작성일 : 2021-02-03
  * License By Shinsegae I&C
  * 2021-02-03 Wijmo Grid 엑셀 다운로드 추가
 -->

<template>
  <div class="metering-modify-list">
    <cmp-grid
      :item-source="data"
      :columns="columns"
      is-read-only
      :header-merge="headerMergeColumns"
    >
      <template #processState="props">
        <cmp-status-tag
          contents="완료"
          type="is-complete"
          v-if="props.row.processState === 'complete'"
        />
        <cmp-status-tag
          contents="처리 중"
          type="is-ing"
          v-else-if="props.row.processState === 'ing'"
        />
        <cmp-status-tag
          contents="지연"
          type="is-delay"
          v-else-if="props.row.processState === 'delay'"
        />
        <cmp-status-tag
          v-else
          contents="대기"
        />
      </template>

      <template #memo="props">
        <a
          class="cell-wrap"
          @click.stop="memoModal = true"
        >
          <memo-view>
            {{ props.row.memo }}
          </memo-view>
        </a>
      </template>
    </cmp-grid>
    <!-- routable="metering-modify-detail" -->

    <!-- 메모 모달 -->
    <el-dialog
      title="메모"
      :visible.sync="memoModal"
      width="85%"
      @close="memoModal = false"
      class="memo-modal"
    >
      <section class="modal-body">
        <task-memo />
      </section>

      <section class="modal-footer">
        <div class="button-area">
          <button
            class="button -modal-button -alert"
            type="is-anti"
            @click="memoModal = false"
          >
            취소
          </button>
          <button
            class="button -modal-button"
            @click="memoModal = false"
            type="is-primary"
          >
            확인
          </button>
        </div>
      </section>
    </el-dialog>
  </div>
</template>
<script>
import MemoView from '@/components/MemoView/MemoView'
import TaskMemo from '../../Task/TaskMemo/TaskMemo'

export default {
  name: 'MeteringModifyList',
  components: {
    'memo-view': MemoView,
    'task-memo': TaskMemo
  },
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    routeTo (to, param) {
      this.$router.push({
        name: to,
        params: param
      })
    },
    stateDesc (state = undefined) {
      return {
        wait: this.$t('task.STATE.wait'),
        ing: this.$t('task.STATE.progress'),
        delay: this.$t('task.STATE.delay'),
        complete: this.$t('task.STATE.complete'),
        reject: this.$t('task.STATE.reject'),
        confirm: this.$t('task.STATE.confirm'),
        undefined: this.$t('task.STATE.unde')
      }[state]
    }
  },
  data () {
    return {
      memoModal: false,
      headerMergeColumns: {
        colSpan: [
          { startIdx: 1, endIdx: 3, header: '신청자정보' },
          { startIdx: 4, endIdx: 7, header: '프로젝트 정보' },
          { startIdx: 7, endIdx: 12, header: '변경 전' },
          { startIdx: 11, endIdx: 14, header: '변경 후' }
        ],
        rowSpan: ['processState', 'date', 'memo']
      },
      columns: [
        { header: '처리상태', binding: 'processState', width: '*', customHtml: true },

        { header: '관계사', binding: 'relationCop', width: 80 },
        { header: '부서', binding: 'department', width: 80 },
        { header: '신청자', binding: 'name', width: 80 },

        { header: '클러스터', binding: 'cluster', width: 120 },
        { header: 'Host', binding: 'host', width: 120 },
        { header: 'IP', binding: 'ip', width: 120 },

        { header: 'vCPU', binding: 'beforeVcpu', width: 80 },
        { header: 'Memory', binding: 'beforeMemory', width: 80 },
        { header: 'Storage', binding: 'beforeStorage', width: 80 },
        { header: 'S/W', binding: 'beforeSw', width: 80 },

        { header: 'vCPU', binding: 'afterVcpu', width: 80 },
        { header: 'Memory', binding: 'afterMemory', width: 80 },
        { header: 'Storage', binding: 'afterStorage', width: 80 },
        { header: 'S/W', binding: 'afterSw', width: 80 },

        { header: '자원변경일시', binding: 'date', width: '*', dataType: 'Date' },
        { header: '메모', binding: 'memo', width: '*', customHtml: true }
      ]
    }
  }
}
</script>
<style lang="scss">
  .metering-modify-list {
    .memo-modal {
      .modal-body {
        overflow-y: auto;
        max-height: 50vh;
        margin-bottom: $gap;
      }
    }
  }
</style>
