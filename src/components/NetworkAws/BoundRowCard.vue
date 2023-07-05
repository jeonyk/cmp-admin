<template>
  <li class="bound-card">
    <ul class="bound-card-inner">
      <li
        style="flex-basis:5%; text-align:center;"
        class="card-control"
      >
        {{ data.ruleNumber }}
      </li>
      <li
        style="flex-basis:50%;"
        class="card-control"
      >
        <cmp-status-tag
          class="bound-rule-status"
          :type="ruleActionTagType"
          contents="is-primary"
        >
          {{ ruleActionDisplay }}
        </cmp-status-tag>
        <span style="margin-left:10px;">{{ titleDisplay }}</span>
      </li>
      <li
        style="flex-basis:15%;"
        class="card-control"
      >
        <span>포트</span>
        <span style="margin-left:40px;">{{ portRangeDisplay }}</span>
      </li>
      <li
        style="flex-basis:15%;"
        class="card-control"
      >
        <span>소스</span>
        <span style="margin-left:40px;">{{ data.cidrBlock }}</span>
      </li>
      <li
        style="flex-basis:15%;"
        class="card-control"
      >
        <span>통신방법</span>
        <span style="margin-left:40px;">{{ protocolDisplay }}</span>
      </li>
    </ul>
  </li>
</template>

<script>
export default {
  props: {
    data: {
      type: Object,
      default: () => {}
    }
  },
  computed: {
    ruleActionDisplay () {
      const ruleAction = this.data.ruleAction
      if (ruleAction === 'allow' || ruleAction === 'deny') { return this.$t(`common.TERMS.${ruleAction}`) } else return ''
    },
    ruleActionTagType () {
      const ruleAction = this.data.ruleAction
      if (ruleAction === 'allow') {
        return 'is-primary'
      } else if (ruleAction) {
        return 'is-error'
      } else return 'is-primary'
    },
    protocolDisplay () {
      const protocol = this.data.protocol
      let displayProtocolName = ''

      if (protocol === '-1') displayProtocolName = '모두'
      else if (protocol === '6') displayProtocolName = 'TCP'
      else if (protocol === '1') displayProtocolName = 'UDP'
      else if (protocol === '17') displayProtocolName = 'ICMP'
      else displayProtocolName = '알 수 없음'
      return displayProtocolName
    },

    portRangeDisplay () {
      const existPortRange = !!this.data.portRange
      const protocol = this.data.protocol
      let displayPortRange = '잘못된 포트범위'

      // '모든 트래픽이'(protocol = -'1')거나 또는
      // 포트범위가 존재하지않으면서(!existPortRange) ICMP(protocol = '17')인 경우 포드 범위는 '모두'입니다.
      // 참고: 포트범위 '0-65535'와 '모두'는 다릅니다.
      if (protocol === '-1' || (!existPortRange && protocol === '17')) {
        displayPortRange = '모두'
        return displayPortRange
      }

      if (existPortRange) {
        const { toPort, fromPort } = this.data.portRange
        if (toPort === fromPort) return toPort
        displayPortRange = `${fromPort} - ${toPort}`
      } else if (!existPortRange && protocol === '-1') {

      }

      return displayPortRange
    },

    titleDisplay () {
      const protocolDisplay = this.protocolDisplay
      const existPortRange = this.portRangeDisplay !== '모두' && this.portRangeDisplay !== '0 - 65535'
      let displayTitleName = ''
      if (existPortRange) {
        if (this.data.portRange.to === '22' && this.data.portRange.from === '22') displayTitleName = 'SSH'
        else if (this.data.portRange.to === '25' && this.data.portRange.from === '25') displayTitleName = 'SMTP'
        else if (this.data.portRange.to === '80' && this.data.portRange.from === '80') displayTitleName = 'HTTP'
        else if (this.data.portRange.to === '443' && this.data.portRange.from === '443') displayTitleName = 'HTTPS'
        else displayTitleName = `${existPortRange ? '사용자 지정' : '모든'} ${protocolDisplay === '모두' ? '트래픽' : protocolDisplay}`
      } else displayTitleName = `${existPortRange ? '사용자 지정' : '모든'} ${protocolDisplay === '모두' ? '트래픽' : protocolDisplay}`
      return displayTitleName
    }
  }
}
</script>

<style lang="scss" scoped>
.bound-card {
  width: 100%;
  height: 60px;
  border-radius: 6px;
  background: #0a0c20;
  display: flex;
  align-items: center;

  .bound-card-inner {
    flex-basis: 100%;
    display: flex;
    align-items: center;
    &.__card {
      display:block;
    }
  }

  &.__card {
    // border:1px solid red;
    width:25%;
    height:auto;
    display:block;
    .bound-card-inner {
      display:block;
    }
  }
}
</style>
<style lang="scss">
.bound-rule-status{
  &.is-primary {
    border: 1.6px solid #3e57c9 !important;
  }
  &.is-error {
    .tag-text {
      .mdi-close {
        display: none;
      }
    }
  }
}
</style>
