<template>
  <el-dialog
    :title="$v('주문취소')"
    :visible="active"
    width="600px"
    @close="$emit('close')"
  >
    <p
      class="alert-message"
      v-html="$v('해당 자원을 주문 취소할 경우, <br>현재 보고있는 주문의 자원 또한 영향을 받습니다. <br>주문취소를 계속 진행하시겠습니까?')"
    />

    <div class="border-top">
      <register-contents
        :title="$v('연관된 자원 리스트')"
        v-if="connected.length"
      >
        <p
          v-for="item in connected"
          :key="item"
        >
          {{ item }}
        </p>
      </register-contents>
      <register-contents
        :title="$v('주문 취소 사유')"
        required
      >
        <el-input
          v-model="reason"
          type="textarea"
          placeholder="주문취소 사유를 입력하세요."
          :autosize="{ minRows: 4 , maxRows: 4 }"
        />
      </register-contents>
    </div>

    <div class="modal-button-area -center">
      <button
        class="button"
        @click="$emit('close')"
      >
        {{ $v('취소') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="confirm(data)"
      >
        {{ $v('확인') }}
      </button>
    </div>
  </el-dialog>
</template>

<script>
import API from '@sd-fe/cmp-core'
import { mapState } from 'vuex'

export default {
  name: 'CancelOrder',
  inject: ['$field_V3', '$orderType'],
  props: {
    active: { // 모달 on/off
      type: Boolean,
      default: false
    },
    data: {
      type: [Object, Array],
      default: () => []
    }
  },
  watch: {
    active (active) {
      if (active) this.initialize(this.data)
      else {
        this.reason = undefined
      }
    }
  },
  computed: {
    ...mapState({
      user: state => state.auth.user
    })
  },
  created () {
  },
  methods: {
    /**
     * 연관자원 목록 확인
     */
    async initialize ({ rows: itemIdxs, workId }) {
      try {
        // console.log(this.data, '하하핳하ㅏ')
        const params = { itemIdxs }
        const response = await API.work_v3.workItemConnected({ params, workId })
        // console.log(response)

        if (!response.length) return

        // 네트워크 – L4 – vsr_192.168.90.45
        this.connected = response.map(({ service, workItemSpec }) => {
          const { hostname } = workItemSpec
          return `${service}-${hostname}`
        })
      } catch (error) {
        this.$alert(this.$v('연관된 자원 리스트를 불러오는데 문제가 발생했습니다.'))
        console.error('@@ CancleOrder > workItemConnected', error)
      }
    },

    /**
     * 주문취소 확인
     */
    async confirm ({ rows: itemIdxs, workId } = this.data) {
      try {
        if (!this.reason) return this.$alert(this.$v('주문 취소사유를 입력해주세요.'))
        const payload = {
          itemIdxs,
          reason: this.reason
        }

        const apiName = {
          CONFERENCE: 'workItemCancel',
          TODO: 'cancelWorkTodo'
        }[this.$field_V3()]

        await API.work_v3[apiName]({ workId, payload })

        this.$emit('confirm')
        this.$emit('close')
      } catch (error) {
        this.$alert(this.$v('주문 취소 도중 문제가 발생하였습니다.'))
        console.error('@@ CancleOrder > workItemCancel', error)
      }
    }
  },
  data: () => ({
    connected: [],
    reason: undefined
  })
}
</script>

<style lang="scss" scoped>
.alert-message {
  line-height: 2;
  text-align: center;
  margin-bottom: $gap-m;
  font-weight: 400;
}

.border-top {
  border-top: 1px solid $dark-slate;
}
</style>
