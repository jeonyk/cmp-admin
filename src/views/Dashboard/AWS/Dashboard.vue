
<template>
  <div class="main-dashboard">
    <common-dashboard-work
      v-if="packageType !== 'PL'"
      style="margin-bottom:50px;"
    />

    <section class="dashboard-section">
      <dashboard-region
        @region="setRegion"
        @rawSources="getSources"
        :time="syncTime"
      />
    </section>
    <!-- /. 리전 -->

    <section class="dashboard-section">
      <dashboard-project-list
        :region="region"
        :raw-sources="rawSources"
        :time="syncTime"
      />
    </section>
    <!-- /. 자원 개요 -->

    <section class="dashboard-section">
      <dashboard-resource-trend
        :region="region"
        :time="syncTime"
        :csp="'AWS'"
      />
    </section>
    <!-- /. 자원 트렌드 -->
  </div>
</template>

<script>
// import DashboardWorks from './DashboardWorks'
import DashboardRegion from './DashboardRegion'
import DashboardProjectList from './DashboardProjectList'
import DashboardResourceTrend from './DashboardResourceTrend'
import CommonDashboardWork from '@/views/Dashboard/Common/CommonDashboardWork.vue'

import { mapState } from 'vuex'

export default {
  name: 'Dashboard',
  components: {
    // 'dashboard-works': DashboardWorks,
    'dashboard-region': DashboardRegion,
    'dashboard-project-list': DashboardProjectList,
    'dashboard-resource-trend': DashboardResourceTrend,
    CommonDashboardWork
  },
  computed: {
    ...mapState({
      packageType: state => state.auth.packageType
    }),
    syncTime () {
      return this.$options.filters.date(new Date(), 'YYYY.MM.DD HH:00')
    }
  },
  methods: {
    setRegion (region) {
      this.region = region
    },
    getSources (sources) {
      this.rawSources = JSON.parse(JSON.stringify(sources))
    },
    setWorksLength (works) {
      this.worksLenght = works
    }
  },
  data () {
    return {
      region: undefined,
      rawSources: [],
      worksLenght: {}
    }
  }
}
</script>
<style lang="scss" scoped>
  .main-dashboard {
    margin-top: 60px;
    > div { margin-top: 40px; }

    .dashboard-section {
      margin-bottom: 90px;
    }
  }

  .dashboard-title {
    height: 17px;
    font-size: 18px;
    font-weight: bold;
    font-style: normal;
    letter-spacing: -0.45px;
    color: #fefefe;
    margin-right: $gap * 2;
  }

  .board-info-group {
    border-bottom: 1px solid $main-black;
    height: 17px;
    padding-bottom: $gap;
    margin-bottom: $gap;
    .recent-sync {
      font-weight: normal;
      color: $light-gray;
      font-size: 13px;
      > span { font-family: 'Roboto'; }
    }
  }

  .system-lists {
    > .system {
      position: relative;
      padding-left: 15px;
      margin-right: $gap;
      &::before {
        content: '';
        background-color: $general;
        position: absolute;
        top: 2px; left: 0;
        width: 10px; height: 10px;
        border-radius: 50%;
        display: block;
      }

      .-count {
        border-bottom: 1px solid grey;
        margin-left: 5px;
        display: inline-block;
        cursor: pointer;
      }

      &.-all-fail {
        &::before { background-color: #ff5c67; }
        .-count {
          color: #ff5c67;
          border-color: #ff5c67;
        }
      }
      &.-few-fail {
        &::before { background-color: $alert; }
        .-count {
          color: $alert;
          border-color: $alert;
        }
      }
      &.-complete {
        &::before { background-color: $success; }
        .-count {
          color: $success;
          border-color: $success;
        }
      }
    }
  }

  .board-conts { margin-top: $gap; }
</style>

<style lang="scss">
.main-dashboard {
  .current-value {
    margin-bottom: $gap;
    .chart-selection {
      width: 140px;
      border-radius: 25px;
      background-color: $black;
      margin-right: $gap;
      .el-radio-button {
        width: 70px;
        height: 30px;
        border: none;
        .el-radio-button__inner {
          background-color: transparent;
          transition: .5s ease;
          padding: 0;
          height: 30px;
          line-height: 32px;
          width: 100%;
          border: none;
          font-size: 13px;
          &:hover { color: $white; }
          &:focus { outline: none; }
        }

        &.is-active {
          border-radius: 15px;
          color: $text-black;
          background-color: $white;
          .el-radio-button__inner {
            border: none;
            background-color: $white;
            border-radius: 25px;
            color: #333;
            box-shadow: none;
            position: relative;
            &::before {
              position: absolute;
              width: 100%; height: 100%;
              box-shadow: 2.5px 4.3px 5px 0 rgba(102, 102, 102, 0.2);
              border-radius: 25px;
              top:0; left: 0;
              content: ''
            }
            &:hover { color: $text-black; }
          }
        }
      }
    }

    .chart-options {
      // width: 140px;
      .el-select {
        .el-input {
          .el-input__inner {
            border-radius: 0;
            border: none;
            border-bottom: 1px solid $input-stroke;
          }
        }
      }
    }
  }

  // 대시보드 타이틀
  .section-title3 {
    font-size: 18px;
    color: $white;
    display: flex;
    align-items: center;
    margin-bottom: $gap-m;
    small {
      color: $input-placeholder;
      font-size: 13px;
      margin-left: $gap-s;
      font-weight: normal;
    }
  }

  // 동기화 시간
  .sync-time {
    color: #727797;
    position: absolute;
    top: -25px; right: 0;
  }
}

.system-detail-body {
  height: 200px;
  overflow-y: auto;
  .system-fail-log {
    display: flex;
    flex-direction: column;
    justify-content: center;
    > .-list {
      line-height: 2.5;
      position: relative;
      padding-left: $gap;
      &::before {
        position: absolute;
        left: 0; top: calc(50% - 3px);
        content: '';
        background-color: $main-red;
        width: 5px; height: 5px;
        border-radius: 50%;
      }

      > span {
        display: inline-block;
        margin-left: $gap-s;
        font-weight: bold;
        font-family: 'Roboto';
        color: $main-red;
        cursor: pointer;
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}
</style>
