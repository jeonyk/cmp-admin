<!--
  * 파일명 : TaskSourceModalL7.vue
  * 파일 기능 : [클러스터/노드]를 설정할 수 있는 모달입니다.
  *           클러스터 데이터를 외부에서 받아 관련 노드/이미지/네트워크 정보를 선택할 수 있도록 하단에 그려줍니다.
  *           클러스터/노드/이미지/네트워크 정보를 모두 선택해야만 저장이 가능합니다.
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2021-02-25
  * License By Shinsegae I&C
  * 2021-02-25 클러스터/노드 선택 - 그리드 sorting 및 프로그레스바 수정
 -->

<template>
  <el-dialog
    :title="$v('자원할당설정')"
    :visible.sync="active"
    width="90%"
    class="set-cluster-node-modal"
    top="5vh"
    @close="close"
    :before-close="() => $emit('close')"
  >
    <div class="contents-wrapper">
      <!--
        [사전협의]에서는 [자원정보] 편집 불가능 (사용자에서 들어온 값 그대로 노출)
        is-prearrangement : 통합업무 전용 (언제나 TRUE)
      -->
      <network-l7-core-info-step
        in-admin
        editing
        :read-only="readOnly"
        :is-prearrangement="true"
        :data="rawData"
        :user-info="user"
        @changeFormInfo="handleChangeFormInfo"
      />
    </div>

    <section class="modal-footer big-button-area">
      <button
        v-if="readOnly"
        class="button"
        @click="close"
      >
        {{ $v('닫기') }}
      </button>
      <button
        v-if="!readOnly"
        class="button"
        type="is-anti"
        @click="close"
      >
        {{ $v('취소') }}
      </button>
      <button
        v-if="!readOnly"
        class="button"
        type="is-primary"
        @click="confirm"
      >
        {{ $v('확인') }}
      </button>
    </section>
  </el-dialog>
</template>

<script>
import { mapState } from 'vuex'
import { cloneDeep } from 'lodash'
import { NetworkL7UpdateCoreInfoStep } from '@sd-fe/cmp-core'
import TaskSourceModalMixins from './TaskSourceModalMixins.script'

export default {
  name: 'TaskSourceModalL7',
  mixins: [TaskSourceModalMixins],
  components: {
    'network-l7-core-info-step': NetworkL7UpdateCoreInfoStep
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  watch: {
    active (newVal) {
      if (newVal) {
        console.clear()
        console.log('%c@@ DATA :: ', 'color: skyblue', this.data)

        this.rawData = cloneDeep(this.data)
      }
    }
  },
  methods: {
    handleChangeFormInfo (data) {
      this.cloneData = cloneDeep(data)
    },

    close (data) {
      this.$emit('close')
    },

    /**
     * [확인] 버튼 클릭했을 때 발생하는 이벤트입니다.
     * @return {Function || Boolean}
     */
    async confirm () {
      const data = this.cloneData

      // 서비스명 모두 입력되었는지 여부 확인
      const scanList = lists => lists.every(({ serviceName }) => serviceName)

      // 해당 IP가 서버에서 사용가능한지 확인
      const ipValidator = await this.setIPValidationPayload(data)

      const conditions = [
        { condition: data.cateKey, message: this.$v('네트워크 카테고리를 입력하세요.') },
        { condition: data.csVrserverName, message: this.$v('로드밸런스명을 입력하세요.') },
        { condition: data.netIdx, message: this.$v('스위치장비명을 입력하세요.') },
        { condition: data.ip, message: this.$v('가상IP를 입력하세요.') },
        { condition: data.port, message: this.$v('포트를 입력하세요.') },
        { condition: data.protocolType, message: this.$v('프로토콜을 입력하세요.') },
        { condition: data.method, message: this.$v('방식을 선택하세요.') },
        { condition: data.serviceList && data.serviceList.length > 0, message: this.$v('서버정보를 확인해주세요.') },
        { condition: scanList(data.serviceList), message: this.$v('서비스 명이 입력되지 않은 서버정보가 포함되어있습니다.<br>서비스명을 확인해주세요.') },
        { condition: data.policies && data.policies.length > 0, message: this.$v('정책정보를 확인해주세요.') },
        // { condition: data.policyRequestComment, message: this.$v('정책 요청사항을 입력해주세요.') }
        { condition: ipValidator, message: this.$v('서버정보애 등록된 해당 IP는<br>사용이 불가능합니다.') }
      ]

      // 기본으로 다 선택되어있는지 확인
      const validator = conditions.every(cond => {
        if (!cond.condition) this.$alert(cond.message, '알림', { dangerouslyUseHTMLString: true, confirmButtonText: this.$t('common.BTN.confirm') })
        return cond.condition
      })

      if (!validator) return

      const ipAllocator = this.$store.state.auth.user.userId

      const emitData = {
        ...this.cloneData,
        ipAllocator
      }

      return this.emitSavedData(Object.assign(emitData))
    },

    /**
     * 데이터를 emit 하여 부모컴포넌트에 보냅니다.
     * @param { Object } emitData 가공된 데이터
     */
    emitSavedData (emitData) {
      this.$confirm(this.$t('common.CONFIRM.BASE.019'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.$emit('confirm', emitData)
        this.$emit('close')
      }).catch(() => false)
    }
  },
  data () {
    return {
      ipformat: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      loading: true,
      rawData: null,
      cloneData: null,
      networkList: []
    }
  }
}
</script>

<style lang="scss" scoped>
  .set-cluster-node-modal {
    .contents-wrapper {
      height: 68vh;
      overflow-y: auto;

      .cell-flex-wrap {
        padding: 0 $gap;
      }
      .custom-ip {
        color: $main-blue;
        &:hover {
          text-decoration: underline;
        }
      }
    }

    .node-contents {
      margin-bottom: 50px;

      &:last-child { margin-bottom: 0;}

      .progressbar-wrap {
        display: flex;
        align-items: center;
        padding: 6px 10px;
        border-radius: 6px;
        background-color: $ticket-back-color;;
        .progress-desc {
          display: inline-block;
          margin-left: $gap-m;
          color: $color-lightgrey;
        }
      }

      .active-ipm {
        text-align: center;
        justify-content: center;
        align-items: center;
      }
    }

  }
</style>
