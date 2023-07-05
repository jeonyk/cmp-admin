<!--
  * 파일명 : InstallProgram.vue
  * 파일 기능 : 서비스 카탈로그 > 설치프로그램 Wrapper
  * 작성자 : 정재은 외 1명
  * 최종 작성일 : 2020-08-03
  * License By Shinsegae I&C
  * 2020-08-03 fix: router 정리 진행중
 -->

<template>
  <div class="installprogram-page">
    <router-view />
  </div>
</template>
<script>

export default {
  name: 'InstallProgram',
  methods: {

  },
  data () {
    return {
    }
  }
}
</script>

<style lang="scss">

.script-install-execute {
  .version-setting {
    margin-left: 15px;
  }

  .shell-script-area {
    background-color: $dark-navy;
    height: 300px;
    border-radius: $radius-s;
    box-sizing: border-box;
    line-height: 24px;
    overflow-y: auto;
    text-align: left;
  }
}

.install-button-wrap {
  height: 70px;
  display: flex;
  align-items: center;

  .install-button {
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    span {
      display: flex;
      align-items: center;
      .mdi {
        margin-left: 5px;
        display: block;
        transition: .3s ease transform;
        &::before { font-size: 13px; }

        &.-open  {
          transform: rotate(-180deg);
        }
      }
    }
  }
}

.installprogram-page {
  .wj-cells {
    .wj-cell.open-install {
      padding: 0;
    }

    .wj-row {
      .wj-cell { padding: 0; }
      &:hover {
        .wj-cell.is-shell-script {
          cursor: auto;
          background: transparent;
          color: $light-gray;
        }
      }
    }
  }
}
</style>
