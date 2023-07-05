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
      {{ $v('주문 정보') }}
    </h4>

    <div class="detail-contents">
      <section class="apply-detail -right">
        <div class="apply-info-list">
          <register-contents
            :title="$t(item.keyPath) || item.label"
            v-for="item in applyTitleList[0]"
            :key="item.field"
            :class="'apply-info ' + item.field"
          >
            <span v-if="item.field === 'projectName' && checkIfCommonProject(type)">
              <el-tag class="-new">{{ $v('신규') }}</el-tag>
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
          { field: 'companyName', label: this.$v('관계사') },
          { field: 'groupName', label: this.$v('조직명') },
          { field: 'projectName', label: this.$v('프로젝트명') },
          { field: 'orderTypeLabel', label: this.$v('구분') }
        ],
        [
          { field: 'name', label: this.$v('주문요청제목') },
          { field: 'userName', label: this.$v('주문자') },
          { field: 'createTime', label: this.$v('주문일') },
          { field: 'finishTime', label: this.$v('완료희망일') }
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
