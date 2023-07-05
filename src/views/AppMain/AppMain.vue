<!--
  * 파일명 : AppMain.vue
  * 파일 기능 :
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-01-05
  * License By Shinsegae I&C
  * 2021-01-05 Update: 헤더 잘림현상 수정
 -->

<template>
  <div class="admin-web-admin-wrapper">
    <div
      v-if="loadedIsSsg"
      class="admin-web-main"
    >
      <section :class="['side-nav-wrap', {'-expand': expanded}]">
        <admin-side-nav :class="['side-nav', {'-expand': expanded}]" />
      </section>

      <section :class="['app-main']">
        <app-header
          class="app-header-comp"
          data-html2canvas-ignore="true"
        />

        <body class="app-body -inner">
          <div
            class="breadcrumb-area"
            v-if="showBreadcrumbs"
          >
            <el-breadcrumb separator-class="el-icon-arrow-right">
              <el-breadcrumb-item
                v-for="(item, index) in breadcrumbs"
                :to="{ name: item.name }"
                :key="item.name + index + '_breadcrumb'"
                :class="[{'-current': !item.path }, {'-sourcebasket': item.field === 'sourceBasket'}]"
              >
                <cmp-status-tag
                  v-if="item.resourceStatus"
                  style="margin-right: 10px;"
                  :line-style="true"
                  :type="item.resourceStatus === 'PROGRESS' ? 'is-loading' : {
                    ON: 'is-info',
                    OFF: 'is-undefined'
                  }[item.resourceStatus]"
                >
                  {{ item.resourceStatus === 'PROGRESS' ? 'Progress' : item.resourceStatus }}
                  <i
                    v-if="item.resourceStatus === 'PROGRESS'"
                    class="el-icon-loading"
                    style="margin: -2px 0 0 3px"
                  />
                </cmp-status-tag>
                <span
                  v-if="item.status || item.marketplace"
                  :class="[
                    {'item-marketplace': item.marketplace},
                    `is-${item.status}`, {'item-type': item.status}
                  ]"
                >
                  {{ item.statusKo ? `${item.statusKo}` : null }}
                  {{ item.marketplace ? 'on' : null }}
                </span>
                <cmp-status-tag
                  v-if="item.resourceType"
                  style="margin-right: 5px;"
                  type="mp"
                  :contents="item.resourceType"
                />

                <span :class="{ '-current-label': item.status }">
                  {{ item.label }}
                </span>
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <router-view />
        </body>
      </section>
    </div>

    <app-footer
      class="app-footer -inner"
      data-html2canvas-ignore="true"
    />
  </div>
</template>
<script>
import { mapState, mapGetters, mapActions } from 'vuex'
import AppHeader from '@/components/AppHeader/AppHeader'
import AppFooter from '@/components/AppFooter/AppFooter'
import AdminSideNav from '@/components/AdminSideNav/AdminSideNav'

export default {
  name: 'AppMain',
  components: {
    'app-header': AppHeader,
    'app-footer': AppFooter,
    'admin-side-nav': AdminSideNav
  },
  created () {
    if (!this.licenseInitialized) {
      this.$router.push({ name: 'license-initialize' })
    }
    if (!this.$route.path.includes('/main/find')) this.getProjects()
    else this.$store.commit('setLoadedIsSsg', true)
  },
  data () {
    return {
    }
  },
  computed: {
    ...mapState({
      expanded: state => state.common.sidenavExpanded,
      breadcrumbs: state => state.common.breadcrumbs
      // authed: state => state.auth.authed
    }),
    ...mapGetters({
      licenseInitialized: 'getLicenseInitialized',
      cloudType: 'cloud/getShortlyCloud',
      loadedIsSsg: 'loadedIsSsg'
    }),
    showBreadcrumbs () {
      const blockName = /^(dashboard-v3|dashboard|dashboard-aws|dashborad-vmw|config-alerts)$/g
      return !blockName.test(this.$route.name)
    }
  },
  methods: {
    ...mapActions({
      getProjects: 'project/getProjectByCloudType'
    }),
    shrinkPanel () {
      this.$store.commit('common/SET_SIDENAV_EXPAND', false)
    }
  }
}
</script>
<style lang="scss">
  .admin-web-admin-wrapper {
    // overflow: auto;
    // max-height: 100vh;
    position: relative;
  }
  .admin-web-main {
    width: 1640px;
    width: 100%;
    margin: 0 auto;
    .app-header-comp {
    // 😭 header fixing...
      position: fixed;
      // position: absolute;
      top: 0;
      left: 0;
      // right: 0;
      z-index: 10;
    }

    .side-nav-wrap {
      z-index: $sidenavi;
      position: fixed;
      top: 0;
      bottom: 0;
      left: -50px;
      width: $sidenav-collapsed;
      background-color: lighten($background-color, 5%);
      transition: width .5s;
      &.-expand {
        width: $sidenav-expanded;
      }
      .side-nav {
        flex: 1 1 auto;
        height: 100vh;
      }
    }
    .app-main {
      transition: margin-left .2s;
      .app-body {
        // 임시로 가이드라인을 정해놓았습니다
        // 다른 컴포넌트들이 이 영역내부에서만 작업되게 해주세요!
        // border: 1px solid rgba(39, 230, 255, 0.2);
        padding: 80px $gap 0;
        overflow: visible;
        margin-bottom: 80px;
        min-width: 1600px;
        z-index: 0;
        > .breadcrumb-area {
          padding: $gap * 2 0;
        }
      }
    }
    .item-type {
      display: block;
      font-size: 13px;
      text-align: center;
      line-height: 24px;
      height: 22px;
      font-weight: normal;
      min-width: 66px;
      margin-right: 10px;
      border-radius: 11px;
    }

    .item-marketplace {
      border: 1px solid $main-red;
      border-radius: 25px;
      font-size: 14px;
      text-align: center;
      line-height: 20px;
      height: 20px;
      color: $main-red;
      display: block;
      width: 35px;
      margin-left: 10px;
    }
  }

  @media only screen and (max-width: 1639px) {
    .admin-web-admin-wrapper {
      width: 1640px;
      overflow-x: hidden;
    }
    .admin-web-main {
      width: 1640px;
      margin: 0 auto;
      .app-header-comp {
        width: 1640px;
      }
    }
  }
  @media only screen and (max-width: 750px) {
    .admin-web-main {
      .side-nav-wrap {
        left: 0;
        width: $sidenav-collapsed;
        background-color: lighten($background-color, 5%);
        transition: width .5s;
        &.-expand {
          width: 100vw;
        }
        .side-nav {
          flex: 1 1 auto;
          height: 100vh;
        }
      }
    }
  }
</style>
