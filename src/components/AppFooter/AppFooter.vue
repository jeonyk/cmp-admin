<!--
  * 파일명 : AppFooter.vue
  * 파일 기능 : footer (회사 정보)
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2021-01-07
  * License By Shinsegae I&C
  * 2021-01-07 fix: 과금모델 > 생성 validation 처리
 -->

<template>
  <footer class="app-footer">
    <section
      v-if="isSsg"
      class="footer-info"
    >
      <!-- <div
        class="reference-lists"
        :style="{ width: $i18n.locale !== 'ko' && '420px' }"
      >
        <a class="footer-info-item">
          {{ $t('main.LAYOUT.privacy') }}
        </a>
        <a class="footer-info-item">
          {{ $t('main.LAYOUT.elecAnno') }}
        </a>
        <a class="footer-info-item">
          {{ $t('main.LAYOUT.partner') }}
        </a>
      </div> -->

      <div class="family-site-sect">
        <el-select
          v-model="selectedRelatedCorp"
          placeholder="Family Site"
          :popper-append-to-body="false"
          @change="openNewWindow(selectedRelatedCorp)"
        >
          <el-option-group
            v-for="group in relatedCorps"
            :key="group.label"
            :label="group.label"
          >
            <el-option
              v-for="item in group.options"
              :key="item.to"
              :label="item.title"
              :value="item.to"
            />
          </el-option-group>
        </el-select>
      </div>
    </section>

    <section class="footer-bottom">
      <div class="corp-detail">
        <div>
          <p class="phone">
            <!-- <span>서울특별시 중구 남대문시장10길 2,메사빌딩 21층 대표이사 : 손정현</span> -->
            <!-- <span>{{ $t('main.LAYOUT.location') }}</span> -->
            <span>{{ estimate.address }} {{ $t('main.LAYOUT.owner') }} : {{ estimate.name }}</span>
            <span>{{ estimate.name_tel }}</span>
            <span>{{ estimate.name_fax }}</span>
          </p>
        </div>

        <!-- <p>Copyright © 2017 SHINSEGAE I&C Inc. ALL RIGHTS RESERVED</p> -->
        <p>{{ estimate.copyright }}</p>
      </div>

      <div class="logo-sect">
        <h2 class="cmp-logo">
          <span class="cmp-logo-title">
            <b>Spharos</b>&nbsp;CMP
          </span>
          <!-- <span class="cmp-logo-sub">hyper platform</span> -->
        </h2>
      </div>
    </section>
  </footer>
</template>
<script>
import API from '@sd-fe/cmp-core'

export default {
  name: 'AppFooter',
  created () {
    this.getEstimateCodes()
  },
  methods: {
    openNewWindow (href) {
      window.open(href)
    },
    async getEstimateCodes () {
      try {
        const codes = await API.config.getCodeList({ codeType: 'ESTIMATE' })
        Object.keys(this.estimate).forEach(key => {
          const fullKeyName = 'estimate_' + key
          this.estimate[key] = codes.find(code => code.codeVal === fullKeyName).codeName
        })
      } catch (error) {
        console.log(error)
      }
    }
  },
  data () {
    return {
      isSsg: process.env.VUE_APP_SSG_USER === 'true',
      estimate: {
        name: '',
        address: '',
        company: '',
        manager: '',
        name_tel: '',
        name_fax: '',
        copyright: ''
      },
      relatedCorps: [
        {
          label: this.$t('main.LAYOUT.ic'), // 신세계아이앤씨
          options: [
            { to: 'https://shinsegae-inc.com/', traget: '_blank', title: '신세계아이앤씨' },
            { to: 'https://www.ssgsellpick.com/', target: '_blank', title: 'SELLPICK' },
            { to: 'https://www.good-md.com/', target: '_blank', title: 'goodMD' },
            { to: 'https://www.msgssg.com/', target: '_blank', title: '문자쓱' },
            { to: 'https://www.ecvan.co.kr/', target: '_blank', title: 'eCvan' },
            { to: 'https://www.ectax.co.kr/service/', target: '_blank', title: 'eCtax' },
            { to: 'https://www.ecdocu.co.kr/', target: '_blank', title: 'eCdocu' },
            { to: 'https://shinsegae-inc.com/www.sisguard.co.kr/', target: '_blank', title: 'SISGuard' },
            { to: 'http://www.aruba-shinsegaeinc.com/', target: '_blank', title: 'HPE Aruba' }
          ]
        },
        {
          label: this.$t('main.LAYOUT.group'), // 신세계그룹
          options: [
            { to: 'https://www.shinsegaegroupinside.com/', target: '_blank', title: '신세계그룹' },
            { to: 'https://store.emart.com/main/main.do/', target: '_blank', title: '이마트' },
            { to: 'https://www.shinsegae.com/index.do/', target: '_blank', title: '신세계백화점' },
            { to: 'http://www.sikorea.co.kr/main/', target: '_blank', title: '신세계인터내셔날' },
            { to: 'http://www.shinsegaefood.com/main.sf/', target: '_blank', title: '신세계푸드' },
            { to: 'http://www.shinsegae-con.co.kr/', target: '_blank', title: '신세계건설' },
            { to: 'http://www.istarbucks.co.kr/', target: '_blank', title: '스타벅스커피코리아' },
            { to: 'https://www.echosunhotel.com/intro.do/', target: '_blank', title: '신세계조선호텔' },
            { to: 'https://www.premiumoutlets.co.kr/main/ko/', target: '_blank', title: '신세계사이먼' },
            { to: 'http://www.shinsegaewine.co.kr/', target: '_blank', title: '신세계L&B' },
            { to: 'http://www.ssgdfm.com/shop/main/', target: '_blank', title: '신세계면세점' },
            { to: 'https://www.emart24.co.kr/index.asp/', target: '_blank', title: '이마트24' },
            { to: 'http://www.emarteveryday.co.kr/', target: '_blank', title: '이마트에브리데이' },
            { to: 'http://www.ssg.com/', target: '_blank', title: 'SSG.COM' },
            { to: 'http://www.shinsegaetvshopping.com/', target: '_blank', title: '신세계TV쇼핑' },
            { to: 'http://www.shinsegaeproperty.com/', target: '_blank', title: '신세계프라퍼티' },
            { to: 'http://www.shinsegaecentralcity.com/', target: '_blank', title: '신세계센트럴시티' }
          ]
        }
      ],
      selectedRelatedCorp: ''
    }
  }
}
</script>
<style lang="scss" scoped>
  .app-footer {
    // height: 170px;
    width: 1640px;
    padding: $gap * 2 0;
    // padding: $gap-m 160px $gap*2 160px;
    box-sizing: border-box;
    border-top: 1px solid $border-color;

    > .footer-info {
      // border-bottom: 1px solid $filter-stroke;
      display: flex;
      justify-content: space-between;
      // padding-bottom: $gap;
      margin-bottom: $gap-m;

      .reference-lists {
        width: 300px;
        padding: calc(#{$gap-s} + 2px) 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        > .footer-info-item {
          line-height: 13px;
          height: 13px;
          color: $input-placeholder;
          position: relative;
          &::after {
            content: '';
            position: absolute;
            width: 2px; height: 2px;
            background: $input-placeholder;
            top: 6px; right: -16px;
          }
          &:last-child {
            &::after { content: none; }
          }
        }
      }

      > .family-site-sect {
        width: 150px;
        display: flex;
        align-items: center;
      }
    }

    > .footer-bottom {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;

      > .corp-detail {
        box-sizing: border-box;
        color: #43475c;
        font-size: 12px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        p {
          line-height: 1.67;
          &.phone {
            line-height: $gap-m;
            > span:not(:last-child) {
              display: inline-block;
              padding-right: $gap-s;
              margin-right: $gap-s;
              position: relative;
              &::before {
                content: '';
                position: absolute;
                right: 0; top: $gap-s;
                width: 1px;
                height: 10px;
                background: $color-ticket;
              }
            }
          }
        }
      }

      .logo-sect {
        .cmp-logo {
          height: 40px;
          display: flex;
          opacity: .5;
          flex-direction: column;
          font-family: 'Roboto';
          color: #fff;
          word-break: keep-all;
          white-space: nowrap;
          font-weight: 600;
          text-align: center;
          &.-expanded {
            opacity: 1;
          }
          .cmp-logo-title {
            font-size: 26.5px;
            height: 20px;
            line-height: 20px;
            // text-transform: uppercase;
            margin-bottom: 7px;
          }
          .cmp-logo-sub {
            font-weight: 500;
            font-size: 16.5px;
            height: 13px;
            text-transform: uppercase;
          }
        }
      }
    }
  }
</style>
