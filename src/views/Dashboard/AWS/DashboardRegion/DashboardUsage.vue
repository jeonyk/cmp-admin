<template>
  <div class="usage-block">
    <div class="block-image">
      <img :src="require(`../../../../assets/images/dashboard/${data.image}.svg`)">
    </div>

    <div class="content">
      <strong class="tit">{{ data.title }}</strong>

      <div class="values">
        <p class="value">
          <b>{{ data.total | locale }}</b>
          <small> {{ data.unit }}</small>
        </p>

        <i
          class="difference"
          v-if="data.diff"
        >
          <b :class="setSign(data.diff)">{{ data.diff.value }}</b>
          <!-- <b class="">{{ data.diff.value }}</b> -->
          <small>{{ data.diff.unit }}</small>
        </i>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DashboardUsage',
  props: {
    type: {
      type: String,
      default: undefined
    },
    data: {
      type: Object,
      default: () => {}
    }
  },
  data () {
    return {
      setSign ({ value }) {
        const check = /-/g
        return check.test(value) ? '-minus' : '-plus'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.usage-block {
  border-right: 2px solid #1D2034;
  display: flex;

  .block-image {
    flex: 0 0 90px;
    height: 90px;
    border-radius: 15px;
    background: #14172E;
    display: flex;
    align-content: center;
    justify-content: center;
    margin-right: 30px;

    img { width: 40px; }
  }

  .content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 1 1 auto;
    padding-right: 30px;

    .tit {
      font-size: 15px;
      font-weight: normal;
      margin-bottom: 15px;
      display: block;
    }

    .values {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;

      .value {
        b {
          font-size: 24px;
          font-weight: 500;
        }

        > small {
          font-weight: normal;
          font-size: 14px;
          color: #727797;
        }
      }

      .difference {
        font-size: 15px;

        b {
          font-weight: 500;
          &.-plus { color: #3E57C9; }
          &.-minus { color: #FA5657; }
        }

        small {
          font-size: 15px;
          font-weight: 300;
          display: inline-block;
          margin-left: 5px;
        }
      }
    }
  }

  &:last-child {
    border: none;
    margin: 0;
  }
}
</style>
