<template>
  <div class="dashboard-works-comp-wrapper">
    <div class="-info">
      <p class="-left">
        <span class="status is-info">신규</span>
        <span>D-11</span>
      </p>
      <p class="-right">
        <span class="number">0123455</span>
        <span>관계사 - 조직 - 프로젝트</span>
      </p>
    </div>

    <span class="date">
      2021.10.29 11:51
    </span>
  </div>
</template>

<script>
export default {
  name: 'WorkTicket',
  props: {
    title: {
      type: String,
      default: undefined
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-works-comp-wrapper {
  border-radius: 6px;
  height: 80px;
  box-sizing: border-box;
  background: $white;
  padding: 20px 25px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: $text-black;
  margin-bottom: $gap-s;

  .-info {
    display: flex;
    p {
      display: flex;
      flex-direction: column;
    }

    .-left {
      align-items: center;
      margin-right: $gap-s;
      justify-content: center;

      .status {
        font-size: 12px;
        display: inline-block;
        text-align: center;
        line-height: 22px;
        padding: 0 10px;
        border-radius: 25px;
        margin-bottom: 5px;
      }
    }

    .-right {
      justify-content: space-between;

      .number {
        color: #727797;
        line-height: 22px;
        // border: 1px solid red;
      }
    }
  }
}
</style>
