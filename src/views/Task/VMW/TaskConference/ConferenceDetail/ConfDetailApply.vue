<!--
  * 파일명 : ConfDetailApply.vue
  * 파일 기능 : [주문 정보]를 테이블 형태로 보여줍니다.
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2020-12-18
  * License By Shinsegae I&C
  * 2020-12-18 fix: 사전협의 상세 css 수정
 -->

<template>
  <article class="task-detail-apply">
    <h4 class="detail-title skip-article-header">
      주문 정보
    </h4>

    <div class="detail-contents">
      <!-- <section class="apply-detail -left"> -->
      <!-- <profile-card :data="profileData" /> -->
      <!-- <task-panel :data="$route.params" /> -->
      <!-- </section> -->

      <section class="apply-detail -right">
        <div class="apply-info-list">
          <register-contents
            :title="$t(item.keyPath) || item.label"
            v-for="item in applyTitleList[0]"
            :key="item.field"
            :class="'apply-info ' + item.field"
          >
            <span v-if="item.field === 'projectName' && checkIfCommonProject(type)">
              <el-tag class="-new">신규</el-tag>
            </span>
            <span>{{ data[item.field] }}</span>
            <span v-if="item.field === 'relatedComp'">
              {{ getRelatedCompName(data) }}
            </span>
            <span v-if="item.field === 'projectName'">
              {{ getProjectName(data) }}
            </span>
          </register-contents>
        </div>

        <div class="apply-info-list">
          <register-contents
            :title="$t(item.keyPath) || item.label"
            v-for="item in applyTitleList[1]"
            :key="item.field"
            :class="'apply-info ' + item.field"
          >
            <span v-if="item.field === 'attachment'">
              <i class="mdi mdi-clip" />
              <a class="attachment-name">{{ data.attachment }}</a>
            </span>
            <span
              v-else-if="item.field === 'createTime' || item.field === 'finishTime'"
            >{{ data[item.field] | date }}</span>
            <span v-else-if="item.field === 'taskStatus'">{{ setStatus[data.taskStatus] }}</span>
            <span v-else>{{ data[item.field] }}</span>
          </register-contents>
        </div>
      </section>
    </div>
  </article>
</template>

<script>
export default {
  name: 'ConfDetailApply',
  props: {
    data: {
      type: Object,
      default: () => {}
    },
    type: {
      type: String,
      default: 'RESOURCE'
    }
  },
  created () {
    if (this.checkIfCommonProject(this.type)) this.applyTitleList.map(list => list.pop())
  },
  methods: {
    checkIfCommonProject (type) {
      if (type === 'COMMON_PROJECT') return true
      return false
    },
    getProjectName (data = this.data) {
      if (data.orders) return data?.orders[0].orderInfo.projectName
      else return ''
    },
    getRelatedCompName (data = this.data) {
      if (data.orders) return data?.orders[0].orderInfo.ownerCompanyName
      else return ''
    }
  },
  data () {
    return {
      applyTitleList: [
        [
          { field: 'companyName', label: '관계사', keyPath: 'common.TERMS.rel' },
          { field: 'groupName', label: '조직명', keyPath: 'common.TERMS.orgName' },
          { field: 'projectName', label: '프로젝트명', keyPath: 'common.GRID.projectName' },
          { field: 'relatedComp', label: '소유관계사', keyPath: 'common.REGCON.ownerAff' }
        ],
        [
          { field: 'name', label: '업무요청제목', keyPath: 'task.PRIOR.DETAIL.title' },
          { field: 'userName', label: '기안자', keyPath: 'task.PRIOR.DETAIL.drafter' },
          { field: 'createTime', label: '신청일자', keyPath: 'common.TERMS.ad' },
          { field: 'finishTime', label: '완료희망일', keyPath: 'task.TODO.DETAIL.endDate' }
        ]
      ],
      setStatus: {
        REQUEST: '결재 요청',
        WAIT: '대기',
        PROCEED: '처리중',
        DELAY: '지연',
        DONE: '완료',
        REJECT: '반려',
        undefined: '미정'
      },
      profileData: {
        applicant: '백화점팀 신세빈',
        applyDate: '2020.06.15 15:00:51',
        hopeData: '2020.06.25',
        projectDate: '2020.06.30',
        processDate: '2020.06.30',
        userPhoto: undefined
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.-new {
  color: #3E57C9;
  border:1px solid #3E57C9;
  background:transparent;
}

  .task-detail-apply {
    border-top: 1px solid $border-color;
    .detail-contents {
      display: flex;
      > .apply-detail {
        display: flex;
        width: 100%;
        .apply-info-list {
          flex: 1 1 50%;
          > .apply-info {
            &.attachment {
              .attachment-name { margin-left: $gap-s;}
            }
          }
        }
      }
    }

  }
</style>
