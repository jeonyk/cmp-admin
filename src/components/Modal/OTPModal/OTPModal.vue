<template>
  <el-dialog
    :visible="active"
    :title="$t('admin.ACCOUNT.authOtp')"
    top="10vh"
    width="700px"
    @close="$emit('close')"
  >
    <find-password
      v-if="active"
      @validated-otp="payload => $emit('validated-otp', payload)"
      :required-api="requiredApi"
      :callback-api="callbackApi"
      :ntx-idx="ntxIdx"
      :network-idx="networkIdx"
      :alarm-type="alarmType"
      :it-automation-idx="itAutomationIdx"
      :api-call-component-name="apiCallComponentName"
      otp-popup
    />
  </el-dialog>
</template>

<script>
import FindPassword from '@/views/User/FindPassword'

export default {
  props: {
    active: {
      type: Boolean,
      required: true
    },
    requiredApi: {
      type: Boolean,
      required: false,
      default: false
    },
    callbackApi: {
      type: Function,
      required: false,
      default: () => {}
    },
    ntxIdx: {
      type: Number,
      required: false,
      default: 0
    },
    networkIdx: {
      type: Number,
      required: false,
      default: null
    },
    alarmType: {
      type: String,
      required: false,
      default: ''
    },
    itAutomationIdx: {
      type: Number,
      required: false,
      default: 0
    },
    apiCallComponentName: {
      type: String,
      required: false,
      default: ''
    }
  },
  components: {
    FindPassword
  }
}
</script>
