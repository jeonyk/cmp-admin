<!--
  * 파일명 : ProfileCard.vue
  * 파일 기능 :
  * 작성자 : 박경화 외 1명
  * 최종 작성일 : 2020-12-08
  * License By Shinsegae I&C
  * 2020-12-08 상세정보 세팅
 -->

<template>
  <div class="profile-card">
    <section class="card-header">
      <span
        class="user-image"
      />

      <p class="user-title">
        <span class="relationcomp-info">{{ data.relationComp }}</span>
        <span class="user-info">
          {{ data.department }}
          &nbsp;
          {{ data.name }}
        </span>
      </p>
      <!-- :style="{ 'background-image': 'url(' + userAvatar + ')' }" -->
    </section>
    <ul class="card-body info-list">
      <li
        class="info-item"
        v-for="column in columns"
        :key="column.field"
      >
        <b class="info-title">{{ $t(column.keyPath) }}</b>
        <span :class="['info-desc', {'-important': column.field === 'hopeDate'}]">
          {{ data[column.field] }}
        </span>
      </li>
    </ul>
  </div>
</template>
<script>
export default {
  name: 'ProfileCard',
  props: {
    data: {
      type: Object,
      default: () => {}
    }
  },
  mounted () {
    this.getPhoto()
  },
  methods: {
    getPhoto () {
      if (this.data.userPhoto) {
        this.userAvatar = 'data:image/jpeg;base64,' + this.data.userPhoto
      } else {
        this.userAvatar = '@/assets/images/profile_ico@3x.png'
      }
    }
  },
  data () {
    return {
      columns: [
        // { field: 'applicant', label: '신청자' },
        { field: 'applyDate', label: '신청일자', keyPath: 'common.TERMS.ad' },
        { field: 'hopeDate', label: '완료희망일', keyPath: 'task.TODO.DETAIL.endDate' },
        { field: 'projectDate', label: '서비스 개시일', keyPath: 'common.GRID.serviceStart' }
      ],
      userAvatar: ''
    }
  }
}
</script>
<style lang="scss" scoped>
  .profile-card {
    padding: 50px;
    // background-color: $panel-bg;
    > .card-header {
      display: flex;
      align-items: center;
      .user-image {
        display: inline-block;
        width: 45px;
        height: 45px;
        background-position: center;
        background-size: contain;
        background-repeat: no-repeat;
        background-image: url('../../assets/images/profile.png');
      }
      .user-title {
        display: flex;
        flex-direction: column;
        margin-left: $gap;
        > .relationcomp-info {
          font-size: 20px;
        }
        > .user-info {
          margin-top: $gap-s;
          font-size: 14px;
          color: $color-lightestgrey;
        }
      }
    }

    > .card-body.info-list {
      margin-top: $gap * 2;
      .info-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        & + .info-item { margin-top: $gap;}
        > .info-title {
          color: #666;
          min-width: 110px;
        }
        > .info-desc {
          color: $color-lightestgrey;
          &.-important {color: $primary;}
        }
      }
    }
  }
</style>
