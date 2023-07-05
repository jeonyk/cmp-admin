<!--
  * 파일명 : TaskDetailApply.vue
  * 파일 기능 : [한일 상세]에서 노출되는 주문정보 입니다.
  * 작성자 : 박경화 외 1명
  * 최종 작성일 : 2020-12-19
  * License By Shinsegae I&C
  * 2020-12-19 신청일자 > 결재신청일로 변경
 -->

<template>
  <article class="task-detail-apply">
    <!-- <div class="detail-contents"> -->
    <section class="apply-detail -left">
      <profile-card :data="profileData" />
      <!-- <task-panel :data="$route.params" /> -->
    </section>

    <section class="apply-detail -right">
      <div class="apply-info-list">
        <register-contents
          :title="$t(item.keyPath) || (item.label)"
          v-for="item in applyTitleList[0]"
          :key="item.field"
          :class="'apply-info ' + item.field"
        >
          <span>{{ data[item.field] }}</span>
        </register-contents>
      </div>

      <!-- <div class="apply-info-list">
        <register-contents
          :title="item.label"
          v-for="item in applyTitleList[1]"
          :key="item.field"
          :class="'apply-info ' + item.field"
        >
          <template>
            <span v-if="item.field === 'attachment'">
              <i class="mdi mdi-clip" />
              <a class="attachment-name">{{ data.attachment }}</a>
            </span>
            <span v-else>{{ data[item.field] }}</span>
          </template>
        </register-contents>
      </div> -->
    </section>
    <!-- </div> -->
  </article>
</template>
<script>
import ProfileCard from '@/components/ProfileCard/ProfileCard'
// import TaskPanel from '@/components/TaskPanel/TaskPanel'

export default {
  name: 'TaskDetailApply',
  components: {
    'profile-card': ProfileCard
    // 'task-panel': TaskPanel
  },
  props: {
    data: {
      type: Object,
      default: () => {}
    }
  },
  created () {
    console.log('@@ data : ', this.data)
    this.profileData = {
      relationComp: this.data.companyName,
      department: this.data.groupName,
      name: this.data.userName,
      applyDate: this.$options.filters.date(this.data.approvalCreateTime),
      hopeDate: this.$options.filters.date(this.data.finishTime),
      projectDate: this.data.serviceDate ? this.$options.filters.date(this.data.serviceDate) : '-'
      // processDate: this.data,
      // userPhoto: undefined
    }
  },
  data () {
    return {
      applyTitleList: [
        [
          // { field: 'categoryName', label: '카테고리명' },
          { field: 'ownerCompanyName', label: '소유관계사', keyPath: 'common.TERMS.ownerRel' },
          { field: 'projectName', label: '프로젝트명', keyPath: 'common.GRID.projectName' },
          // { field: 'target', label: '신청대상' },
          { field: 'deparment', label: '사업부', keyPath: 'task.TODO.DETAIL.business' },
          // { field: 'approvalName', label: '업무 요청 제목' },
          { field: 'chargeDate', label: '과금청구일', keyPath: 'common.GRID.billDate' },
          { field: 'doneDate', label: '처리일자', keyPath: 'common.TERMS.done' }
          // { field: 'task', label: '업무' },
          // { field: 'relation', label: '관계사' },
          // { field: 'team', label: '운영팀' }
        ],
        [
          // { field: 'itsmName', label: 'ITSM명(업무명)' },
          // { field: 'serverManager', label: '서버담당자' },
          // { field: 'taskManager', label: '업무담당자' },
          // { field: 'installDate', label: '설치희망일' },
          // { field: 'chargeDate', label: '과금청구일' },
          // { field: 'attachment', label: '첨부파일' },
          // { field: 'applyDesc', label: '신청 사유' }
        ]

      ],
      profileData: {
        relationComp: '스타벅스',
        department: '백화점팀',
        name: '신세빈',
        applyDate: '2020.06.15 15:00:51',
        hopeDate: '2020.06.25',
        projectDate: '2020.06.30',
        processDate: '2020.06.30',
        userPhoto: undefined
      }
    }
  }
}
</script>
<style lang="scss" scoped>
  .task-detail-apply {
    display: flex;
    border-top: 1px solid $main-gray;
    border-bottom: 1px solid $dark-slate;
    > .apply-detail {
      &.-left { width: 380px; }
      &.-right {
        display: flex;
        width: calc(100% - 400px);
        .apply-info-list {
          flex: 1 1 50%;
          margin-top: 1px;
          margin-bottom: -1px;
          & + .apply-info-list {
            // border-left: 1px solid rgba($color: $white, $alpha: 0.2);
          }
        }
      }
    }
    // .detail-contents {
    //   display: flex;
    //   margin-top: $gap * 2;
    // }

  }
</style>
