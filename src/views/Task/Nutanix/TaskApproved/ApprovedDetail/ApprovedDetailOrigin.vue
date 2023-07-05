<!--
  * 파일명 : ApprovedDetail.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2020-12-20
  * License By Shinsegae I&C
  * 2020-12-20 Merge branch 'dev' of https://gitlab-s.growthsoft.co.kr/SSG/cmp-web-admin into publish/markupfix
 -->

<template>
  <div class="approved-detail-origin">
    <!-- /. [사전협의 > 결재 문서 조회], [결재함 상세 > 주문결재문서] 에서 사용함 -->
    <button
      class="button approval-view"
      type="is-primary"
      @click="visible = true"
    >
      {{ button }}
    </button>

    <el-dialog
      title="결재상세"
      :visible.sync="visible"
      width="80%"
      top="35vh"
      @close="visible = false"
    >
      <div class="approved-detail-origin-modal">
        <approval-detail-template
          :data="data"
          :order-list="orderList"
          :approvers="approvers"
          :is-review-mode="true"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script>
import ApprovedDetailTemplate from './ApprovedDetailTemplate'

export default {
  name: 'ApprovedDetailOrigin',
  props: {
    button: {
      type: String,
      default: undefined
    },
    data: { // 결재 데이터
      type: Object,
      default: () => {}
    },
    approvers: { // [결재자] 목록 (외부에서 정의)
      type: Array,
      default: () => []
    },
    isReviewMode: {
      type: Boolean,
      default: false
    }
  },
  components: {
    'approval-detail-template': ApprovedDetailTemplate
  },
  watch: {
    data (data) {
      this.setResources(data)
    }
  },
  created () {
    this.setResources(this.data)
  },
  data () {
    return {
      visible: false,
      orderList: []
    }
  },
  methods: {
    setResources (data) {
      const orderList = data?.order?.orderItemRspRoleGroupList.map(role => {
        return { ...role, workItemRsps: role.orderItemRspList }
      })
      this.orderList = orderList
    }
  }
}
</script>

<style lang="scss" scoped>
.approved-detail-origin {
  &-modal {
    max-height: 800px;
    overflow-y: auto;
  }
}

</style>
