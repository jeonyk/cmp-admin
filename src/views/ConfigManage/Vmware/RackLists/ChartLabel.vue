<!--
  * 파일명 : ChartLabel.vue
  * 파일 기능 : 차트 라벨 컴포넌트
  * 작성자 : 정재은
  * 최종 작성일 : 2020-10-16
  * License By Shinsegae I&C
  * 2020-10-16 Update: 관리자 메인 대시보드 디자인 수정 완료
 -->

<template>
  <div class="chart-label">
    <i
      class="-bullet"
      :style="`background-color: ${color};border: 1px solid ${borderColor}`"
    />
    <span class="-label">
      {{ label }}
    </span>
  </div>
</template>

<script>
export default {
  name: 'ChartLabel',
  props: {
    label: {
      type: String,
      default: undefined
    },
    color: {
      type: String,
      default: '#ddd'
    },
    borderColor: {
      type: String,
      default: '#ddd'
    }
  }
}
</script>

<style lang="scss" scoped>
.chart-label {
  display: flex;
  align-items: center;
  margin-right: $gap-s;
  .-bullet {
    display: block;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    box-sizing: border-box;
  }
  .-label {
    margin-left: 5px;
    line-height: 16px;
    color: #e1e1e1;
    font-size: 12px;
    font-weight: 400;
  }
}
</style>
