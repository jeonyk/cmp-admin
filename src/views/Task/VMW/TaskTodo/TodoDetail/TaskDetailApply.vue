<!--
  * 파일명 : TaskDetailApply.vue
  * 파일 기능 : [할일 상세]에서 노출되는 주문정보 입니다.
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-01-07
  * License By Shinsegae I&C
  * 2021-01-07 fix: [업무] - 로딩 없는 페이지 추가
 -->

<template>
  <article class="task-detail-apply">
    <!-- <section
      class="apply-detail -left"
      v-if="true"
    >
      <profile-card
        :data="profileData"
      />
    </section> -->

    <section class="apply-detail -right">
      <div class="apply-info-list">
        <register-contents
          :title="$t(item.keyPath) || item.label"
          v-for="item in applyTitleList[0]"
          :key="item.field"
          :class="'apply-info ' + item.field"
        >
          <span>{{ profile[item.field] }}</span>
        </register-contents>
      </div>

      <div class="apply-info-list">
        <register-contents
          :title="$t(item.keyPath) || item.label"
          v-for="item in applyTitleList[1]"
          :key="item.field"
          :class="'apply-info ' + item.field"
        >
          <span>{{ profile[item.field] }}</span>
        </register-contents>
      </div>
    </section>
  </article>
</template>
<script>
// import ProfileCard from '@/components/ProfileCard/ProfileCard'

export default {
  name: 'TaskDetailApply',
  components: {
    // 'profile-card': ProfileCard
  },
  props: {
    data: {
      type: Object,
      default: () => {}
    }
  },
  created () {
    console.log('@@ data : ', this.data)

    if (this.$route.name === 'done-detail') {
      const field = { field: 'doneDate', label: '처리일자', keyPath: 'common.TERMS.done' }
      this.applyTitleList[0].splice(this.applyTitleList[0].length, 0, field)
    }

    const filter = date => this.$options.filters.date(date)
    const data = this.data
    this.profile = {
      ...data,
      // chargeDate: data.chargeDate ? data.chargeDate
      approvalCreateTime: data.approvalCreateTime ? filter(data.approvalCreateTime) : '-',
      finishTime: data.finishTime ? filter(data.finishTime) : '-',
      serviceDate: data.serviceDate ? filter(data.serviceDate) : '-',
      doneDate: data.doneDate ? filter(data.doneDate) : '-'
    }
  },
  data () {
    return {
      applyTitleList: [
        [
          { field: 'companyName', label: '관계사', keyPath: 'common.TERMS.rel' },
          { field: 'deparment', label: '사업부', keyPath: 'task.TODO.DETAIL.business' }, // GS용
          { field: 'projectName', label: '프로젝트명', keyPath: 'common.GRID.projectName' }
        ],
        [
          // { field: 'chargeDate', label: '과금청구일', keyPath: 'common.GRID.billDate' }, // 답변받기 전까진 임시처리 🟡
          { field: 'approvalCreateTime', label: '신청일자', keyPath: 'common.TERMS.ad' },
          { field: 'finishTime', label: '완료희망일', keyPath: 'task.TODO.DETAIL.endDate' },
          { field: 'ownerCompanyName', label: '소유관계사', keyPath: 'common.TERMS.ownerRel' }
          // { field: 'serviceDate', label: '서비스 개시일', keyPath: 'common.GRID.serviceStart' } // 답변받기 전까진 임시처리 🟡
        ]
      ],
      profile: {}
    }
  }
}
</script>
<style lang="scss" scoped>
  .task-detail-apply {
    display: flex;
    border-top: 1px solid $border-color;
    border-bottom: 1px solid $dark-slate;
    > .apply-detail {
      &.-right {
        display: flex;
        width: 100%;
        .apply-info-list {
          flex: 1 1 50%;
          margin-top: 1px;
          margin-bottom: -1px;
        }
      }
    }
  }
</style>
