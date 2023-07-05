<!--
  * 파일명 : MarketplaceInfo.vue
  * 파일 기능 : Compute 내부 마켓플레이스 제품 정보 (readOnly)
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2021-02-18
  * License By Shinsegae I&C
  * 2021-02-18 fix: 기등록 자원 이관 - 마켓플레이스 정보 추가
 -->

<template>
  <div class="marketplace-information-wrapper">
    <div class="info-tit">
      <!-- <strong class="product-title">
        마켓플레이스 정보
      </strong> -->
    </div>
    <article
      class="service-info-component"
      v-loading="loading"
    >
      <div class="service-image">
        <div class="service-img">
          <span v-if="data.bpInfo && data.bpInfo.iconImage">
            <img
              width="90"
              :src="data.bpInfo.iconImage"
            >
          </span>
          <!-- <span v-if="data.bpDescriptions">
            <span
              v-for="(desc,idx) in data.bpDescriptions"
              :key="idx"
            >
              <img
                v-if="desc.descType==='ICON_IMAGE'"
                width="90"
                :src="desc.descValue"
              >

            </span>
          </span> -->
          <span v-else>
            <img
              width="90"
              :src="data.iconImage ? data.iconImage : '/img/jeus.3f513635.png'"
            >
          </span>
        </div>
      </div>

      <div class="service-info">
        <p class="-name">
          <cmp-status-tag
            v-if="data.category"
            type="is-primary"
            :contents="data.category"
            style="margin-right: 10px;"
          />
          {{ data.bpName }}
        </p>

        <div class="-detail">
          <span v-if="data.subTitle">{{ data.subTitle }}</span>
          <span v-if="data.versionInfo">
            <b>Ver</b> {{ data.versionInfo }}
            <small v-if="data.createTime">&nbsp;({{ data.createTime | date }})</small>
          </span>
          <span v-if="data.osInfo"><b>OS</b> {{ data.osInfo }} </span>
        </div>

        <!-- 현재자원 > compute 상세 일 경우에만 보입니다 -->

        <div>
          <small class="bottom-line" />
          <p class="-description">
            {{ data.summary }}
          </p>
        </div>
        <!-- 마켓플레이스 / 제품상세일 경우 desc를 보여줍니다. -->
      </div>
    </article>
  </div>
</template>

<script>
export default {
  name: 'MarketplaceInfo',
  props: {
    data: {
      type: Object,
      default () {
        return {
          bpName: 'No Data',
          iconImage: '',
          versionInfo: 'Ver 2020.03.18',
          osInfo: 'Ver 2020.03.18',
          category: '카테',
          date: '13:54:04',
          summary: 'Windows, Windows Server 2019 Base 10 - 64-bit Amazon Machine Image (AMI)'
        }
      }
    },
    forCompute: { // compute 일 경우에 보여줍니다.
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  created () {
    if (this.data && this.data.bpDescriptions) {
      for (let i = 0; i < this.data.bpDescriptions.length; i++) {
        if (this.data.bpDescriptions[i].descKey === 'CMP_PG_NAME') this.pkgName = this.data.bpDescriptions[i].descValue
        if (this.data.bpDescriptions[i].descKey === 'CMP_PG_VERSION') this.pkgVersion = this.data.bpDescriptions[i].descValue
      }
    }
  },
  methods: {
    activeTag (item, idx) {
      this.tagList.forEach((tag, tagIndex) => {
        if (tagIndex === idx) tag.isActive = true
        else tag.isActive = false
      })
    }
  },
  data () {
    return {
      pkgName: '',
      pkgVersion: '',
      tagList: [
        { data: 'Compute: ssgtest-iWEB', isActive: true },
        { data: 'Network: default group', isActive: false },
        { data: 'Database: ssg_mysql_test', isActive: false }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.service-info-component {
  display: flex;
  align-items: center;
  display: flex;
  background-color: $ticket-back-color;
  align-items: flex-start;
  min-height: 57px;
  // box-sizing: border-box;
  padding: $gap-m 55px;
  margin-bottom: $gap;
  color: $white;
}
.service-image {
  width: 95px;
  height: 95px;
  margin-right: 50px;
}
.service-img {
  display: flex;
  align-items: center;
  width: 95px;
  height: 95px;
  > img {
    margin: 0 auto;
  }
}
////

  .service-info {
    // min-height: 150px;
    font-family: Roboto;
    font-weight: normal;
    font-stretch: normal;
    font-style: normal;

    .-name {
      display: flex;
      height: $gap;
      line-height: $gap;
      margin-bottom: $gap;
      font-weight: 500;
      font-size: 18px;
    }

    .-detail {
      display: flex;
      letter-spacing: -0.35px;
      line-height: 1.57;
      height: 35px;
      align-items: center;
      justify-content: flex-start;
      flex-direction: column;

      span {
        height: 20px;
        width: 100%;
        display: flex;
        float:left;
        font-size: 13px;
        line-height: 20px;
        min-width: 100px;
        b {
          display: block;
          width: 25px;
        }
        small {
          font-size: 13px;
        }
        &:nth-of-type(3) { width: 100%; }
      }
    }

    .bottom-line {
      border-top: 1px solid #b3b3b3;
      display: block;
      width: 15px;
      margin: 15px 0;
    }
    .-description {
      line-height: 1.69;
      color: $color-grey;
      // height: 37px;
      // overflow: hidden;
      font-size: 13px;
    }

    .applyinfo {
      display: flex;
      flex-wrap: wrap;
      margin-top: $gap;
      > .applyinfo-tag {
        min-width: 100px;
        padding: 0 $gap-s;
        margin-right: 7px;
        line-height: 28px;
        border-radius: 25px;
        color: $text-dark-gray;
        background-color: $white;
        font-size: 13px;
        cursor: pointer;
        // &.-active {
        //   color: $white;
        //   background-color: #4d4d4d;
        // }
      }
    }
  }
</style>
