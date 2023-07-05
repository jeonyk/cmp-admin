<!--
  * 파일명 : SetOSIcon.vue
  * 파일 기능 :
  * 작성자 : 김진범 외 2명
  * 최종 작성일 : 2021-01-18
  * License By Shinsegae I&C
  * 2021-01-18 오류 수정
 -->

<template>
  <div class="set-os-type">
    <img
      v-if="getImg"
      :src="getImg"
      class="os-image"
    >
    {{ typeCheck(osName) }}
  </div>
</template>

<script>
export default {
  name: 'SetOSIcon',
  props: {
    osName: {
      type: String,
      default: undefined
    }
  },
  methods: {
    typeCheck (osName = this.osName) {
      if (!osName) {
        this.getImg = ''
        return osName
      }
      const isCentos = ['centos', 'cent']
      const isWindow = ['window']
      const isOracle = ['oracle']
      const isRedhat = ['rhel', 'redhat']
      const isUbuntu = ['ubuntu']
      const isLinux = ['linux']

      const including = (arr, name) => {
        return arr.some(check => this.osName.toLowerCase().includes(check)) ? name : ''
      }
      const centos = including(isCentos, 'centos')
      const window = including(isWindow, 'window')
      const oracle = including(isOracle, 'oracle')
      const redhat = including(isRedhat, 'redhat')
      const ubuntu = including(isUbuntu, 'ubuntu')
      const linux = including(isLinux, 'linux')

      if (window) this.getImg = this.image.window
      else if (centos) this.getImg = this.image.centos
      else if (oracle) this.getImg = this.image.oracle
      else if (redhat) this.getImg = this.image.redhat
      else if (ubuntu) this.getImg = this.image.ubuntu
      else if (linux) this.getImg = this.image.linux
      else this.getImg = ''

      return osName
    }
  },
  data () {
    return {
      getImg: '',
      image: {
        centos: require('@/assets/images/osicons/centos.png'),
        window: require('@/assets/images/osicons/microsoft.png'),
        oracle: require('@/assets/images/osicons/linux-oracle.png'),
        redhat: require('@/assets/images/osicons/redhat.png'),
        ubuntu: require('@/assets/images/osicons/ubuntu.png'),
        linux: require('@/assets/images/osicons/linux.png')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.set-os-type {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  white-space: nowrap;
  .os-image {
    width: 15px;
    margin-right: 5px;
  }
}
</style>
