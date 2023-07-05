<!--
  * 파일명 : MeteringDeleteList.vue
  * 파일 기능 :
  * 작성자 : 염창윤 외 2명
  * 최종 작성일 : 2021-02-03
  * License By Shinsegae I&C
  * 2021-02-03 Wijmo Grid 엑셀 다운로드 추가
 -->

<template>
  <div class="metering-delete-list">
    <!-- @@@@ 병합 -->

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

      <template #hopeDate="props">
        <div class="cell-wrap">
          <i class="date-icon" />
          <el-date-picker
            v-model="props.row.hopeDate"
            type="date"
            class="hope-date-datepicker"
          />
        </div>
      </template>
      <!-- 삭제 희망일 -->

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
  name: 'MeteringDeleteList',
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

  },
  data () {
    return {
      memoModal: false,
      deleteColumnGroups: [
        { field: 'processState', label: '처리상태', sortable: true },
        {
          field: 'applicant',
          label: '신청자 정보',
          columns: [
            { field: 'relationCop', label: '관계사', sortable: true },
            { field: 'department', label: '부서', sortable: true },
            { field: 'name', label: '신청자', sortable: true }
          ]
        },
        {
          field: 'vm',
          label: 'VM',
          columns: [
            { field: 'cluster', label: '클러스터', sortable: true },
            { field: 'host', label: 'Host', sortable: true },
            { field: 'ip', label: 'IP', sortable: true }
          ]
        },
        {
          field: 'deleteInfo',
          label: '삭제 정보',
          columns: [
            { field: 'appDate', label: '신청일', sortable: true },
            { field: 'hopeDate', label: '삭제 희망일', sortable: true },
            { field: 'dueDate', label: '삭제 완료일', sortable: true }
          ]
        },
        { field: 'memo', label: '메모' }
      ],

      headerMergeColumns: {
        colSpan: [
          { startIdx: 1, endIdx: 3, header: '신청자정보' },
          { startIdx: 4, endIdx: 6, header: 'VM' },
          { startIdx: 7, endIdx: 9, header: '삭제 정보' }
        ],
        rowSpan: ['processState', 'memo']
      },
      columns: [
        { header: '처리상태', binding: 'processState', width: 120, customHtml: true },

        { header: '관계사', binding: 'relationCop', width: 120 },
        { header: '부서', binding: 'department', width: 120 },
        { header: '신청자', binding: 'name', width: 120 },

        { header: '클러스터', binding: 'cluster', width: 150 },
        { header: 'Host', binding: 'host', width: 150 },
        { header: 'IP', binding: 'ip', width: 150 },

        { header: '신청일', binding: 'appDate', width: 150, dataType: 'Date' },
        { header: '삭제 희망일', binding: 'hopeDate', width: '*', customHtml: true, dataType: 'Date' },
        { header: '삭제 완료일', binding: 'dueDate', width: 150, dataType: 'Date' },

        { header: '메모', binding: 'memo', width: 120, customHtml: true }
      ]
    }
  }
}
</script>
<style lang="scss">
  .metering-delete-list {
    .cell-wrap {
      position: relative;
      margin: auto;
      width: 100%;
      // .date-icon {
      //   position: absolute;
      //   top: 50%;
      //   left: 0;
      //   width: 16px;
      //   height: 16px;
      //   background: url('../../../assets/images/icon-calendar@3x.png') no-repeat;
      //   background-size: 16px 16px;
      // }
      .hope-date-datepicker {
        // padding-left: 20px;
        width: 150px;
        > .el-input__inner {
          border: 0;
          background-color: transparent;
          color: $color-lightgrey;
        }
      }
    }

    .memo-modal {
      .modal-body {
        overflow-y: auto;
        max-height: 50vh;
        margin-bottom: $gap;
      }
    }
  }
</style>
