  <!--
  * 파일명 : ExternalDiskModal.vue
  * 파일 기능 : [ExternalDisk]를 설정할 수 있는 모달입니다. 이미 선택되어있는 ExternalDisk 데이터를 받아 팝업이 뜰 때 선택된 값을 보여줄 수 있습니다.
  * 작성자 : 이경환 외 3명
  * 최종 작성일 : 2021-02-24
  * License By Shinsegae I&C
  * 2021-02-24 fix: 사전 협의 자원변경 모달 버그 수정
 -->

<template>
  <el-dialog
    :title="title"
    :visible.sync="active"
    width="880px"
    @close="close"
    class="external-disk-modal"
    top="15vh"
    :before-close="close"
  >
    <small
      class="title-reference"
      v-html="this.$t('common.ALERT.COMP.071', { size: step + 'GB', field: title })"
    />

    <section
      v-if="data && active"
      class="modal-body"
    >
      <resource-range-input
        :os-system="osSystem"
        :data-length="onlyVolume ? null : 1"
        :data="diskData"
        @range-data="disk => diskData = disk"
        :only-volume="onlyVolume"
        :valid-disk-name="orderType !== 'change'"
        :step="step"
        ref="rangeSlider"
      />
    </section>

    <section class="modal-footer big-button-area">
      <button
        class="button"
        type="is-anti"
        @click="close"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button"
        type="is-primary"
        @click="save"
      >
        {{ $t('common.BTN.confirm') }}
      </button>
    </section>
  </el-dialog>
</template>
<script>
import { ResourceRangeInput } from '@sd-fe/cmp-core'

export default {
  name: 'ExternalDiskModal',
  components: { ResourceRangeInput },
  props: {
    title: {
      type: String,
      default: 'ExternalDisk'
    },
    active: {
      type: Boolean,
      default: false
    },
    data: {
      type: Object,
      default: () => {}
    },
    onlyVolume: {
      type: Boolean,
      default: false
    },
    orderType: { // 신규 new / 변경 change / 삭제 delete
      type: String,
      default: ''
    },
    step: { // input number step
      type: Number,
      default: 50
    }
  },
  computed: {
    osSystem () {
      const osSystem = this.data.osSystem ? this.data.osSystem.toUpperCase() : null
      const osType = this.data.osType ? this.data.osType.toUpperCase() : null // 추후에 삭제 (osSystem 이 넘어오지 않았던 시절을 대비)
      const osStr = osSystem || osType
      return osStr ? ['WINDOWS', 'LINUX', 'UBUNTU', 'CENTOS', 'RHEL'].find(os => osStr.includes(os)) : null
    }
  },
  watch: {
    active (active) {
      if (active) {
        this.resetData = true
        this.externalDisks = []
      }

      // console.log(this.data)
      if (this.onlyVolume) this.setDefaultRootDisks(this.data)
      else this.setDefaultLocalDisks(this.data)

      this.maskClickEvent(active)
    },
    externalDisks (disk) {
      const clone = JSON.parse(JSON.stringify(disk))

      this.rootDiskInfo = clone?.find(disk => disk?.deviceIndex === 0 && disk?.deviceBus === 'SCSI') // rootDisk: SCSI.0
      this.diskData = this.rootDiskInfo ? clone?.filter(disk => !(disk?.deviceIndex === 0 && disk?.deviceBus === 'SCSI')) : clone
    }
  },
  methods: {
    /**
     * 기본 설정되어있는 디스크 세팅
     * @param {Object} item cloneData 정보
     */
    setDefaultLocalDisks (item) {
      if (!Object.keys(item).length) {
        this.externalDisks = []
        return
      }

      const diskList = item.externalDiskList ? item.externalDiskList : item.diskList
      this.externalDisks = !diskList ? [] : diskList.map(disk => {
        return {
          ...disk,
          diskName: disk.diskName, // 서버쪽으로 보내는 디스크 명
          name: disk.diskName || disk.name || (disk.deviceBus + '.' + disk.deviceIndex), // UI상에 보여주는 디스크 명
          data: `${disk.diskSize} GB`,
          size: disk.diskSize
        }
      })
    },
    setDefaultRootDisks (item) {
      const disks = (item.rootDiskSize) ? [item.rootDiskSize] : item.diskList.map(({ diskSize }) => diskSize)

      this.externalDisks = disks.map(disk => {
        return {
          diskName: '/app', // 옛날 코드들이 있어서 하드코딩으로 넣어둠
          name: '/app',
          data: `${disk} GB`,
          size: disk
        }
      })

      // const rootDisk = item.rootDiskSize || 0
      // this.externalDisks = [{
      //   diskName: '/app', // 옛날 코드들이 있어서 하드코딩으로 넣어둠
      //   name: '/app',
      //   data: `${rootDisk} GB`,
      //   size: rootDisk
      // }]
    },

    /**
     * 저장 action
     */
    save () {
      const returnDiskList = this.diskData.map(disk => {
        return !this.onlyVolume ? {
          ...disk,
          diskName: disk.diskName,
          name: disk.name,
          diskSize: disk.size
        } : { diskSize: disk.size }
      })

      // strage 는 크기(신청용량) 필수
      const tag = this.$parent.$vnode.componentOptions.tag
      const regex = /task-storage/g

      // [필수*] 인 경우 vs 필수가 아닌 경우 판단
      const validator = regex.test(tag) ? (returnDiskList.length <= 0) : (returnDiskList.length < 0)

      // 'ExternalDisk 는 50GB 단위로 설정 가능합니다.'
      if (validator) return this.$alert(this.$t('common.ALERT.COMP.071', { size: '50GB', field: 'Local Disk' }), { dangerouslyUseHTMLString: true })

      if (this.rootDiskInfo) returnDiskList.push(this.rootDiskInfo)

      // this.$emit('save', { disk: returnDiskList, id: this.data.cell.index })
      this.$emit('save', { disk: returnDiskList })
      this.close()
    },

    /**
     * 이건 뭐지?
     * @param {Boolean} active 모달 on/off
     */
    maskClickEvent (active) {
      const wrapper = this.$el
      const inner = wrapper.querySelector('[role=dialog]')

      const maskClickEvent = (e) => {
        if (!inner.contains(e.target)) {
          if (this.$refs.rangeSlider && this.$refs.rangeSlider.isDragging) return
          this.close()
        }
      }

      if (active) this.$nextTick(() => wrapper.addEventListener('click', maskClickEvent))
      else wrapper.removeEventListener('click', maskClickEvent)
    },

    /**
     * ExternalDisk 모달 닫기
     */
    close () {
      this.removeTooltips('slider-tooltip-app')
      this.removeTooltips('slider-tooltip-custom')
      this.$emit('close')
    },

    /**
     * 떠있는 툴팁을 지웁니다.
     */
    removeTooltips (className) {
      const _event = new MouseEvent('mouseleave')
      const tooltipEl = document.querySelector(className)

      if (tooltipEl) tooltipEl.dispatchEvent(_event)
    }
  },
  data () {
    return {
      resetData: false,
      externalDisks: [],
      diskData: [],
      rootDiskInfo: null,
      disk: {
        UBUNTU: {
          defaultPath: '/app'
        },
        LINUX: {
          defaultPath: '/app'
        },
        CENTOS: {
          defaultPath: '/app'
        },
        RHEL: {
          defaultPath: '/app'
        },
        WINDOWS: {
          defaultPath: 'D:\\'
        }
      }
    }
  }
}
</script>

<style scoped lang="scss">
.title-reference {
  position: absolute;
  top: 55px;
  left: 30px;
  white-space: pre-wrap;
  word-break: keep-all;
  color: $input-placeholder;
  font-size: 12px;
}
</style>
