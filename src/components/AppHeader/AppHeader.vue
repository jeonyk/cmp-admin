<!--
  * 파일명 : AppHeader.vue
  * 파일 기능 :
  * 작성자 : 이경환 외 3명
  * 최종 작성일 : 2021-02-24
  * License By Shinsegae I&C
  * 2021-02-24 add: 비밀번호 찾기 페이지 추가
 -->

<template>
  <header class="app-header">
    <div class="header-wrap -inner">
      <div class="header-left">
        <a
          class="expand-gnb-button"
          @click="expandPanel"
          v-if="user && licenseInitialized"
        >
          <i class="expand-menu-icon" />
          <span
            v-if="packageType !== 'ENT'"
            class="expane-menu-text -only-mobile-hide"
          >{{ $t('main.LAYOUT.fullMenu') }}</span>
        </a>

        <cloud-switch
          class="left-cloud-switch"
          v-if="packageType === 'ENT' && isRenderCloudSwitch"
        />
        <!-- /. Private / Pulbic 관련 설정 -->

        <tag-search-bar />
      </div>
      <a
        :class="['header-logo', {'-none': activeGlobalSearch}]"
        @click="routeToMain"
      >
        <span class="header-title"><b>Spharos </b>CMP</span>
        <span
          v-if="isDev"
          style="margin-left:10px;"
        >{{ this.typeMapHeader[this.packageType] }}</span>
      </a>
      <!-- /.header-logo -->

      <div :class="['header-right', {'-expand': activeGlobalSearch}]">
        <el-select
          v-if="isLocal"
          class="select-package-type"
          v-model="pType"
          placeholder="패키지 타입 선택"
          @change="changePackageType"
        >
          <el-option
            v-for="item in typeMap"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <header-alert
          v-if="user && licenseInitialized"
        />

        <div :class="['user-set', {'-expand': activeGlobalSearch}]">
          <b class="user-info">
            {{ user? user.userName+'('+semiBlindId+')' : $t('main.LAYOUT.requireLogin') }}
          </b>
          <!-- /. 관리자 정보 -->
          <a
            v-if="authed"
            class="user-info -hover"
            @click="logOut"
          >
            {{ $t('main.LAYOUT.logout') }}
            <!-- 로그아웃 -->
          </a>
          <a
            v-else
            class="user-info -hover"
            @click="routeTo({ name: 'user-login' })"
          >
            {{ $t('main.LAYOUT.login') }}
            <!-- 로그인 -->
          </a>
          <el-select
            class="dropdown-language"
            :popper-append-to-body="false"
            popper-class="dropdown-popper"
            v-model="lang"
            placeholder="KOR"
            @change="selectLanguage"
          >
            <el-option
              v-for="item in langOptions"
              :key="item.field"
              :label="item.name"
              :value="item.field"
            />
          </el-select>
          <!-- /. 언어 선택 -->
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import { mapState, mapGetters, mapMutations, createNamespacedHelpers } from 'vuex'
import VueCookies from 'vue-cookies'
import HeaderAlert from './HeaderAlert.vue'
import CloudSwitch from './CloudSwitch.vue'
import TagSearchBar from './TagSearchBar.vue'

const cloudStore = createNamespacedHelpers('cloud')

export default {
  name: 'AppHeader',
  components: {
    HeaderAlert,
    CloudSwitch,
    TagSearchBar
  },
  created () {
    this.langCheck()
    this.pType = this.packageType
  },
  computed: {
    ...mapState({
      // packageType: state => state.auth.packageType
      shortlyCloud: state => state.cloud.shortlyCloud
    }),
    ...mapGetters(['authed', 'user', 'perm', 'packageType']),
    ...mapGetters({
      licenseInitialized: 'getLicenseInitialized'
    }),
    ...cloudStore.mapGetters({
      isRenderCloudSwitch: 'getIsRenderCloudSwitch'
    }),
    semiBlindId () {
      // const length = this.user?.userId?.length
      // const start = this.user?.userId?.substring(0, 2)
      // const last = this.user?.userId?.substring(length - 2, length)
      // let mid = ''
      // for (let i = 0; i < length - 4; i++) {
      //   mid += '*'
      // }
      // return start + mid + last
      return '**' + this.user?.userId?.substring(2)
    }
  },

  watch: {
    activeGlobalSearch (oldval, newval) {
      if (oldval) document.addEventListener('click', this.globalSearchHandler)
      else document.removeEventListener('click', this.globalSearchHandler)
    }
  },
  methods: {
    /**
     * 헤더 로고 클릭시 클라우드 타입에 맞는 대시보드로 이동
     */
    routeToMain () {
      if (this.shortlyCloud === 'nx') {
        this.$router.push({ name: 'dashboard' })
      } else {
        this.$router.push({ name: `dashboard-${this.shortlyCloud}` })
      }
    },
    /**
     * 돋보기 버튼을 눌렀을 때 ui 변경해줍니다.
     * @function
     */
    searchClickAction () {
      if (this.activeGlobalSearch) {
        this.searchText = ''
        this.activeGlobalSearch = false
      } else this.activeGlobalSearch = true
    },
    searchAction () {
      console.log('Global Search Text: ', this.searchText)
      this.activeGlobalSearch = false
    },
    routeTo (to) {
      if (this.$route.name === 'find-password') {
        this.$router.push({ name: 'main' })
      } else {
        if (to === 'main') {
          if (this.perm?.menu.length) {
            // 운영관리자
            const to = this.perm?.menu[0]
            this.$router.push({ name: to })
          } else {
          // 최고관리자
            this.$router.push({ name: 'main' })
          }
        } else {
          this.$router.push(to)
        }
      }
    },
    expandPanel () {
      this.setSideNavExpand(true)
      this.activeGlobalSearch = false
    },
    globalSearchHandler (e) {
      const searchArea = document.querySelector('.header-right')
      const childrens = searchArea.querySelectorAll('*')

      const isChild = []
      for (let i = 0; i < childrens.length; i++) isChild.push(childrens[i] === e.target)

      if (!isChild.includes(true)) this.activeGlobalSearch = false
    },
    ...mapMutations({
      setSideNavExpand: 'common/SET_SIDENAV_EXPAND'
    }),
    logOut () {
      this.$confirm(this.$t('common.CONFIRM.LOGIN.001'), '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel')
      }).then(() => {
        this.$store.dispatch('logout')
        return this.$router.push({ name: 'user-login' })
      }).catch((err) => console.error('로그아웃 에러', err))
    },
    /**
     * 초기 언어 세팅
     */
    langCheck () {
      const cookLocale = VueCookies.get('CMPLang')
      if (cookLocale) {
        this.lang = cookLocale === 'ko' ? 'korean' : 'english'
      } else {
        this.lang = 'korean'
      }
    },
    // 세팅된 랭귀지를 스토어에 저장
    selectLanguage () {
      const locale = this.lang === 'korean' ? 'ko' : 'en'
      this.$store.dispatch('setLanguage', locale)
      // this.$i18n.locale = locale
      this.$router.go()
    },
    /**
     * 로컬 개발용: 패키지 타입 변경
     */
    changePackageType (val) {
      this.$store.dispatch('setPackageType', val)
      this.$router.go()
    }
  },
  data () {
    return {
      langOptions: [
        { field: 'korean', name: 'KOR' },
        { field: 'english', name: 'ENG' }
      ],
      lang: '',
      searchRadio: '',
      searchCheckbox: [],
      options: [{
        value: 'Option1',
        label: 'Option1'
      }, {
        value: 'Option2',
        label: 'Option2'
      }, {
        value: 'Option3',
        label: 'Option3'
      }, {
        value: 'Option4',
        label: 'Option4'
      }, {
        value: 'Option5',
        label: 'Option5'
      }],
      value: '',
      searchText: '',
      activeGlobalSearch: false,
      startDate: '',
      endDate: new Date(),
      pType: '',
      typeMap: [{
        value: 'PL',
        label: 'PLUS'
      }, {
        value: 'BS',
        label: 'BASIC'
      }, {
        value: 'STD',
        label: 'STANDARD'
      }, {
        value: 'ENT',
        label: 'ENTERPRISE'
      }],
      typeMapHeader: {
        PL: 'PLUS',
        BS: 'BASIC',
        STD: 'STANDARD',
        ENT: 'ENTERPRISE'
      },
      isDev: process.env.NODE_ENV === 'development',
      isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    }
  }
}
</script>
<style lang="scss">
  .app-header {
    width: 100%;
    height: 80px;
    background-position: center;
    background-color: #141425;
    > .header-wrap {
      position: relative;
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 80px;
      z-index: $header-z-index;
      > * {
        height: 40px;
      }
      .expand-gnb-button {
        // position: absolute;
        // top: 20px;
        // left: 0;
        display: flex;
        align-items: center;
        > .expand-menu-icon {
          display: inline-block;
          margin-right: $gap-s;
          width: 40px;
          height: 40px;
          background: url('../../assets/images/icon-menu.svg') no-repeat;
          background-size: 40px 40px;
        }
        > .expand-menu-text {
          color: #ddd;
          font-size: 16px;
        }
      }
      .header-logo {
        position: absolute;
        // top: 50%;
        vertical-align: middle;
        line-height: 40px;
        left: 50%;
        transform: translate(-50%);
        align-items: center;
        transition: all 1s ease;
        > .header-title {
          font-family: 'Roboto';
          font-size: 17.5px;
          letter-spacing: -0.44px;
        }
        > .header-sub {
          margin-left: $gap-s;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: -0.26px;
        }
        &.-none{
          visibility: hidden;
          opacity: 0;
          transition: all .9s ease;
        }
      }
      .header-left {
        display: flex;
        .left-cloud-switch {
          display: flex;
          margin-left: 20px;
        }
      }
      .header-right {
        // position: absolute;
        // top: 20px;
        // right: 0;
        display: flex;
        align-items: center;

        .select-package-type {
          margin-right: 20px;
          width: 150px;
        }

        > .user-set {
          transition: all .5s .3s ease;
          opacity: 1;
          > .user-info {
            margin-left: $gap;
            white-space: nowrap;
            background-color: transparent;
            border: 0;
            &.-hover:hover {
              color: $primary
            }
          }
          > .dropdown-language {
            margin-left: $gap-s;
            width: 63px;
            .el-input {
              .el-select__caret.el-input__icon.is-reverse {
                color: $color-black;
              }
              .el-input__inner {
                padding: 10px;
                // background-color: transparent;
                border-radius: $radius-r $radius-r 0 0;
                border: 0 !important;
                // &:focus {
                //   color: $white;
                // }
                &+.el-input__suffix {
                  display: flex;
                  align-items: center;
                  justify-content: flex-end;
                }
              }
            }
            > .el-select-dropdown.el-popper {
              box-shadow: none;
              border-radius: 0 0 $radius-r $radius-r;
              // background-color: transparent;
              .el-select-dropdown__wrap.el-scrollbar__wrap{
                overflow: hidden;
                .el-scrollbar__view {
                  padding: 0 0 10px 0;
                  background-color: transparent;
                  border: none;
                  > .el-select-dropdown__item {
                    padding: 0 $gap-s;
                    font-size: 13px;
                    background-color: transparent;
                  }
                }
              }
            }
          }
          &.-expand {
            opacity: 0;
            transition: all .2s ease;
          }
        }

        .header-global-search {
          transition: all .5s ease;
          position: absolute;
          right: calc(-100% + 100px);
          display: flex;
          align-items: center;
          overflow: hidden;
          box-sizing: border-box;
          padding: 0 $gap-s;
          height: 40px;
          // width: calc(100% - 40px);
          width: 0;
          color: $color-lightgrey;
          opacity: 0;
          &.-expand {
            right: 0;
            width: 1024px;
            overflow: inherit;
            overflow: inherit;
            opacity: 1;
            transition: all 1s ease;
          }
        }

        .-inside-conts {
          box-sizing: border-box;
          height: 18px;
          padding: 0 $gap-s;
          position: relative;
          font-size: 12px;
          display: flex;
          align-items: center;
          &:after {
            content: '';
            position: absolute;
            right: 0; top: 0;
            width: 1px;
            height: 100%;
            background: $filter-stroke;
          }

          .export-excel {
            cursor: pointer;
            border: none;
            color: $white;
            text-align: center;
            font-size: 12px;
            width: 80px;
            height: 24px;
            border-radius: 4px;
            background-color: $filter-stroke;
            padding: 0;
          }

          .item-title {
            width: 40px;
            display: inline-block;
            margin-right: 6px;
          }

          > .dateIcon {
            width: 16px; height: 16px;
            margin-right: 9px;
            background: url('../../assets//images/icon-calendar@3x.png') no-repeat;
            background-size: 16px 16px;
          }

          &.-last {
            width: 126px;
            &:after { content: none; }
          }
        }

        .search-button-section {
          margin-left: $gap-s;
          width: 40px;
          height: 40px;
          display: flex;
          text-align: center;
          align-items: center;
          justify-content: center;
          border-radius: 0 50px 50px 0;

          .performance-icon {
            display: block;
            width: 16px;
            height: 16px;
            cursor: pointer;

            > .magnify-icon {
              position: relative;
              display: inline-block;
              width: 16px;
              height: 16px;
              &::before,
              &::after {
                content: '';
                position: absolute;
              }
              &::before {
                top: 0;
                left: 0;
                width: 10px;
                height: 10px;
                border: 2px solid $white;
                border-radius: 50%;
              }
              &::after {
                bottom: 1px;
                right: -1px;
                width: 7px;
                height: 2px;
                background-color: $white;
                border-radius: 2px;
                transform: rotate(45deg);
              }
            }
            &:hover {
              > .magnify-icon {
                &::before {
                  border-color: $primary;
                }
                &::after {
                  background-color: $primary;
                }
              }
            }
          }
        }

        // &:after {
        //   content: '';
        //   width: 100%; height: 100%;
        //   position: absolute;
        //   left: calc(100% + 1px);
        //   background-color: $background-color;
        // }
      }

      // .item-type {
      //   border-radius: $radius;
      //   font-size: 13px;
      //   text-align: center;
      //   line-height: 25px;
      //   font-weight: normal;
      //   display: block;
      //   width: 80px;
      //   margin-left: 10px;
      //   margin-top: -2px;
      // }

      // .item-marketplace {
      //   border: 1px solid $main-red;
      //   border-radius: 25px;
      //   font-size: 14px;
      //   text-align: center;
      //   line-height: 20px;
      //   height: 20px;
      //   color: $main-red;
      //   display: block;
      //   width: 35px;
      //   margin-left: 10px;
      // }

      // .slide-enter-active,
      // .slide-leave-active {
      //   transform-origin: 0 0;
      //   transition-duration: .2s;
      //   transition-property: all;
      //   // width: 1048px;
      // }
      // .slide-enter,
      // .slide-leave-to {
      //   // transform-origin: 0 0;
      //   transform: scaleX(0%);
      //   width: 0;
      // }
    }
  }

  @media only screen and (max-width: 750px) {
    .app-header {
      .header-right {
        right: $gap !important;
      }
      .-only-mobile-hide {
        display: none !important;
      }

      > .header-wrap {
        margin: 0;
        .expand-gnb-button {
          left: $gap;
        }
      }

    }
  }
</style>

<style lang="scss">

// header 상단 radio 버튼
.header-global-search {
  font-family: 'NotoSansCJKkr';
  .el-radio-group,
  .el-checkbox-group {
    display: flex;
    .el-radio {
      margin-right: 15px;
      .el-radio__label {
        font-size: 12px;
        height: 20px;
        line-height: 20px;
        padding-left: 5px;
      }
    }
    .el-radio:last-child {
      margin-right: 0;
    }
  }

  // 아이템 dropdown
  .el-select {
    width: 123px;
    height: 20px;
    border-bottom: 1px solid $color-lightgrey;

    > .el-input.el-input--suffix {
      &.is-focus {
        > .el-input__inner {
          border: none;
        }
      }
      > .el-input__inner {
        padding: 0 $gap-s;
        width: 100%;
        height: 20px;
        line-height: 20px;
        border-radius: $radius-s;
        background-color: transparent;
        // border: 1 solid $background-color;
        // color: $white;
      }
      .el-input__suffix { margin: 0; right: 10px; }
      .el-select__caret.el-input__icon {
        color: $white;
        width: 10px; line-height: 5px;
        height: 8px;
        margin-top: 5px;
        &:before {
          font-size: 10px;
        }
      }
    }
  }

  .el-select-dropdown {
    border-radius: 0;
    border: none !important;
    // background-color: $main-black !important;
    &.el-popper {
      position: absolute !important;
      top: calc(100% + 3px) !important;
      .popper__arrow {
        display: none;
      }
    }
    .el-select-dropdown__list {
      border: none;
      // background-color: $main-black !important;
      .el-select-dropdown__item {
        height: $gap-m;
        line-height: $gap-m !important;
        &.hover {
          // color :$primary;
          font-weight: 500;
          // background-color: $main-black !important;
        }
        &.selected {
          // color: $white;
          font-weight: 500;
        }
      }
    }
  }

  .el-popper[x-placement^=bottom],
  .el-popper[x-placement^=top] {
    border-top: 0;
     &::before {
      content: none;
    }
  }

  // header datepicker
  .datepicker {
    > span {
      display: inline-block;
      // margin: 0 2px;
    }
    .el-date-editor.el-input,
    .el-date-editor.el-input__inner {
      width: 60px;
      width: 70px;
      height: 12px;
    }

    .el-icon-date { display: none }
    .el-input__inner {
      border: none;
      color: $white;
      background: transparent;
      height: 12px;
      text-align: center;
      line-height: 12px;
      padding: 0;
      &::placeholder {
        color: $color-middlegrey;
      }
    }
  }

  // input
  .-last {
    .el-input {
      .el-input__inner {
        border: none;
        padding: 0;
        height: $gap;
        background-color: transparent;
        color: $white;
        &::placeholder {
          color: $color-middlegrey;
          line-height: $gap;
        }
      }
    }
  }
}
</style>
