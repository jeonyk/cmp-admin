<template>
  <li
    class="card"
  >
    <section class="card__header">
      <h3>{{ data.startIp + '~' + data.endIp }}</h3>
      <p>{{ $v('서브넷 별칭') }}</p>
    </section>
    <section class="card__body">
      <div>
        <p>{{ $v('가용영역') }}</p>
        <p>{{ data.availabilityZone }}</p>
      </div>
      <div>
        <p>{{ $v('서브넷 ID') }}</p>
        <p>{{ data.subnetId }}</p>
      </div>
      <div v-if="data.routeTableId">
        <p>{{ $v('라우팅 테이블') }}</p>
        <p>{{ data.routeTableId }}</p>
      </div>
      <div>
        <p>{{ $v('라우팅 분류') }}</p>
        <p>{{ data.isPublic ? 'Public' : 'Private' }}</p>
      </div>
    </section>
  </li>
</template>

<script>
export default {
  created () {
    console.log('SUBdata__COMPONENT :', this.data)
  },
  props: {
    data: {
      type: Object,
      default: () => {}
    }
  }
}
</script>

<style scoped>

.card {
  width:390px;
  height:210px;
  border-radius: 6px;
  background:#0A0C20;
  padding:22px;
  overflow:hidden;
  box-sizing: border-box;
}

.card__header {
}

.card__header p {
  margin-top:12px;
  margin-bottom:10px;
  font-weight:500;
  font-size:16px;
}
.card__header h3 {
  color:#3E57C9;
}
.card__body {
  position:relative;
  color:#fff;
}

.card__body::before {
  content:'';
  width:100%;
  height:1px;
  background:#2A2D44;
  position:absolute;
  top:0px;
}

.card__body div:first-child {
  padding-top:10px;
}
.card__body > div {
  display:flex;
  justify-content: space-between;
}
.card__body > div:not(:first-child){
  margin-top:10px;
}

.card__body > div > p:first-child {
  width:30%;
  font-size:13px;
}
.card__body > div > p:last-child {
  width:70%;
  font-size:14px;
  text-align: right;
}
</style>
