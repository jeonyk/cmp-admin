<!--
  * 파일명 : SCRangeInput.vue
  * 파일 기능 : ExternalDisk 용량을 관리(추가, 변경, 삭제)하는 컴포넌트입니다. 슬라이더를 이용해 용량을 관리합니다.
  * 작성자 : 이경환 외 3명
  * 최종 작성일 : 2021-02-24
  * License By Shinsegae I&C
  * 2021-02-24 fix: 사전 협의 자원변경 모달 버그 수정
 -->

<template>
  <article class="disk-cont-wrap">
    <h6 class="skip-article-header">
      ExternalDisk 메모리 설정
    </h6>

    <div
      class="disk-section"
      v-if="isSlider"
    >
      <div class="disk-contents">
        <p
          v-if="!onlyVolume"
          :class="['app-name', { disabled }]"
        >
          <!-- / {{ appMemoryName }} -->
          <span>{{ appMemoryName }}</span>
        </p>

        <div class="slider">
          <el-slider
            v-model="appMemory"
            tooltip-class="slider-tooltip
            slider-tooltip-app"
            :disabled="disabled"
            :step="step"
            :min="dataAppRange.min"
            :max="dataAppRange.max"
            :range="false"
            class="range-text"
            @change="roundValue(...arguments, dataAppRange,'appMemory')"
            @input="isDragging = true"
          />

          <span class="-range -min">{{ dataAppRange.min }}</span>
          <span class="-range -max">{{ dataAppRange.max }}</span>
        </div>

        <div class="range-registration">
          <el-input-number
            @blur="onBlurInput(true)"
            @focus="onFocusInput(true)"
            @change="changeDiskInputSize(...arguments,dataAppRange, 'appMemory')"
            v-model="appMemory"
            :disabled="disabled"
            class="number-input"
            size="small"
            :min="dataAppRange.min"
            :controls="false"
            :class="{ 'focus': focusAppMemoryInput }"
          />
          <!-- @change="e => changeRange(e)" -->
          <button
            class="button adddisk"
            type="is-dark"
            :disabled="disabled"
            @click="appRegister"
          >
            <!-- 적용 -->
            {{ $t('common.BTN.apply') }}
          </button>
        </div>
      </div>

      <div
        v-if="!onlyVolume && !onlyDisk"
        class="disk-contents -custom"
      >
        <el-input
          v-model="customMemoryName"
          class="app-name _name-custom"
          size="small"
          :placeholder="osType === 'WINDOWS' ? 'E:\\' : '/data'"
          :disabled="disabled"
        />
        <!-- @keydown.native.enter="setCustomName" -->

        <div class="slider -custom">
          <el-slider
            tooltip-class="slider-tooltip
            slider-tooltip-custom"
            v-model="customMemory"
            :disabled="disabled"
            :step="step"
            :min="dataCustomRange.min"
            :max="dataCustomRange.max"
            class="range-text"
            @change="roundValue(...arguments,dataCustomRange, 'customMemory')"
            @input="isDragging = true"
          />
          <span class="-range -min">{{ dataCustomRange.min }}</span>
          <span class="-range -max">{{ dataCustomRange.max }}</span>
        </div>

        <div class="range-registration">
          <el-input-number
            @blur="onBlurInput(false)"
            @focus="onFocusInput(false)"
            @change="changeDiskInputSize(...arguments,dataCustomRange, 'customMemory')"
            v-model="customMemory"
            :disabled="disabled"
            class="number-input"
            size="small"
            :min="dataCustomRange.min"
            :controls="false"
            :class="{ 'focus': focusCustomMemoryInput }"
          />
          <button
            class="button adddisk"
            type="is-dark"
            :disabled="disabled"
            @click="setCustomName"
          >
            <!-- 적용 -->
            {{ $t('common.BTN.apply') }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="externalDiskTags.length"
      class="tag-lists"
    >
      <g-input-tags
        :only-volume="onlyVolume"
        :tag-data="externalDiskTags"
        @select-data="selectTag"
        @emit-data="exDiskTags"
      />
    </div>
  </article>
</template>

<script>
import GInputTags from '@/components/common/g-text-input-tags/g-input-tags.vue'

export default {
  name: 'SCRangeInput',
  components: {
    'g-input-tags': GInputTags
  },
  props: {
    // compute - app/custom (app만 길이 조절)
    // mp - app/custom (app만 길이 조절)
    // storage - app :: onlyVolume
    // database - app :: onlyVolume

    // 신청용량만 사용하는 경우
    onlyDisk: { // app 만 사용합니다 > 결과 값은 '/app: 500GB', ... 입니다
      type: Boolean,
      default: false
    },
    onlyVolume: { // 결과값은 '500GB', ... 입니다
      type: Boolean,
      default: false
    },
    // setUnit: { // unit 설정..^^...
    //   type: String,
    //   default: 'GB'
    // },
    disabled: { // 변경하지 않도록하려면 true로 변경합니다.
      type: Boolean,
      default: false
    },
    dataLength: { // 저장할 수 있는 app 데이터의 최대 길이를 설정합니다
      type: Number,
      default: null
    },
    appRange: { // app 의 min, max 값을 설정합니다 [min, max] 값
      type: Object,
      default: () => { return { min: 50, max: 1000 } }
    },
    customRange: { // custom의 min, max 값을 설정합니다.
      type: Object,
      default: () => { return { min: 50, max: 1000 } }
    },
    step: {
      type: Number,
      default: 100
    },
    osType: {
      type: String,
      default: null
    },
    disks: {
      type: Array,
      default: () => { return [] }
    },
    type: {
      type: String,
      default: () => { return 'db' }
    },
    isSlider: {
      type: Boolean,
      default: true
    },
    data: { // 기본 데이터
      type: Array,
      default: () => []
    },
    useCustomRange: {
      type: Boolean,
      default: true
    },
    editable: {
      type: Boolean,
      default: true
    }
  },
  watch: {
    data (lists) {
      this.setInitData(lists)
    },
    // setUnit (newVal) {
    //   this.appMemoryName = newVal
    // },
    disks (newVal) {
      this.settingExternalDiskTagByDisks()
    },
    osType (newVal) {
      this.init()
    }
  },
  created () {
    // this.appMemoryName = this.onlyVolume ? this.setUnit : 'app'
    this.init()
    if (this.data.length) this.setInitData(this.data)

    this.$nextTick(function () {
      document.addEventListener('mouseup', this.mouseUpEv)
    })
  },
  destroyed () {
    document.removeEventListener('mouseup', this.mouseUpEv)
  },
  methods: {
    setInitData (data) {
      // ⭐️ 이부분은 업무 > 사전협의에서 기본값을 추가할때 필요합니다
      // this.externalDiskTags = [...data]
      this.externalDiskTags = data.map(disk => {
        return {
          ...disk,
          data: disk.size < 1 && disk.diskSizeBytes
            ? this.$options.filters.byte(disk.diskSizeBytes) // 1GB가 되지 않는 자원 보여주기 위함
            : disk.size + ' GB'
        }
      })
      // console.log(this.externalDiskTags)
    },
    init () {
      this.dataAppRange = JSON.parse(JSON.stringify(this.appRange))
      this.dataCustomRange = JSON.parse(JSON.stringify(this.customRange))
      this.appMemoryName = this.defaultPath[this.osType] || 'db_' + this.appIdx++
      this.appMemory = this.dataAppRange.min
      this.customMemory = this.dataCustomRange.min
      this.settingExternalDiskTagByDisks()
    },
    selectTag (tag, idx) {
      if (!this.editable) return
      if (tag?.fixed) return // fixed 된 태그는 변경 불가능

      const disk = this.externalDiskList.find(data => data.name === tag.name)
      let minSize = disk ? disk.min : 0
      if (!this.osType || tag.name === this.defaultPath[this.osType]) {
        minSize = !minSize ? this.appRange.min : minSize
        this.dataAppRange.min = minSize
        this.appMemoryName = tag.name
        this.appMemory = +tag.size
      } else {
        minSize = !minSize ? this.customRange.min : minSize
        this.dataCustomRange.min = minSize
        this.customMemoryName = tag.name
        this.customMemory = +tag.size
      }
    },
    settingExternalDiskTagByDisks () {
      this.externalDiskTags = []
      this.externalDiskList = JSON.parse(JSON.stringify(this.disks))
      if (this.disks && this.disks.length) {
        for (let i = 0; i < this.disks.length; i++) {
          if (this.osType && this.disks[i].name === this.defaultPath[this.osType]) {
            // this.dataAppRange.min = this.disks[i].min || this.appRange.min
            this.dataAppRange.min = this.useCustomRange ? this.disks[i].min || this.appRange.min : this.appRange.min
            this.dataAppRange.max = this.useCustomRange ? (this.disks[i].max + this.dataAppRange.min) || this.appRange.max : this.appRange.max
          }

          this.externalDiskTags.push({
            ...this.disks[i],
            name: this.disks[i].name,
            type: this.osType || 'db',
            size: this.disks[i].size,
            // 1GB가 되지 않으며, 'diskSizeBytes' 값이 있을 때는 다른 단위 사용
            data: this.disks[i].size < 1 && this.disks[i].diskSizeBytes
              ? this.$options.filters.byte(this.disks[i].diskSizeBytes)
              : this.disks[i].size + ' GB',
            default: this.disks[i].default,
            id: this.disks[i].id,
            min: this.disks[i].min,
            max: this.disks[i].max
          })
        }
      }
      // this.externalDiskTags.push({ name, data: `${size} GB`, size })
    },
    roundData (num) {
      num = Math.round((num * 0.1)) * 10
      if (!(num % 50)) return num
      num = Math.round((num * 0.01)) * 100
      return num
    },
    roundValue (value, data, model) {
      if (data.max - 100 <= value) {
        data.max = value + 1000
      }
      const size = this.roundData(value)
      this[model] = size
      this.$forceUpdate()
      this.isDragging = false
    },
    changeDiskInputSize (newVal, oldVal, data, model) {
      if (data.max - 100 <= newVal) {
        data.max = newVal + 1000
      }
      const size = this.roundData(newVal)
      this[model] = size
    },
    // 떠있는 툴팁을 지웁니다.
    removeTooltips (className) {
      const _event = new MouseEvent('mouseleave')
      const tooltipEl = document.querySelector(className)

      if (tooltipEl) {
        // tooltipEl.forEach(node => node.dispatchEvent(_event))
        tooltipEl.dispatchEvent(_event)
      }
    },
    // App Local Disk 추가
    appRegister (e) {
      this.removeTooltips('.slider-tooltip-app')

      const disk = this.externalDiskList.find(disk => disk.name === this.appMemoryName)
      if (disk?.fixed) return

      return this.addAppMemory()
    },
    addAppMemory (name = this.appMemoryName, data = this.appMemory) {
      if (!this.appMemory) {
        // 용량을 확인해주세요
        this.$alert(this.$t('common.ALERT.PROJECT.055'), '', { confirmButtonText: this.$t('common.BTN.confirm') }) // 확인
        return
      }
      if (this.dataLength) {
        const dbLen = this.externalDiskTags.filter(disk => disk.type === 'db').length
        const alertMessage = (message) => {
          // ${message} 최대 ${this.dataLength}개 까지 추가 가능합니다.
          return this.$alert(this.$t('common.ALERT.PROJECT.056', { message, n: this.dataLength }), '', {
            confirmButtonText: this.$t('common.BTN.confirm'), // 확인,
            callback: () => false
          })
        }

        // const disk = this.externalDiskList.find(disk => disk.name === name)
        // const min = (disk && disk.min) ? disk.min : this.dataAppRange.min
        const min = this.dataAppRange.min
        if (min > data) {
          // ${name}은 ${data}GB 이상 신청 가능합니다.
          this.$alert(this.$t('common.ALERT.PROJECT.031', { name, data }), '', {
            confirmButtonText: this.$t('common.BTN.confirm'), // 확인,
            callback: () => false
          })
          return
        }
        const appIdx = this.externalDiskTags.findIndex(data => data.name === this.defaultPath[this.osType])
        if (appIdx >= 0) {
          this.externalDiskTags[appIdx].size = data
          this.externalDiskTags[appIdx].data = data + ' GB'

          // 기본 external Disk 변경 시 알람 띄울 때 적용
          // if (parseInt(this.externalDiskTags[appIdx].size) === parseInt(data)) return

          // const message = this.$t('common.ALERT.COMP.072', { // {name}(기본 Local Disk)의 용량을 변경하시겠습니까? ( {before}GB → {after}GB )
          //   name: name,
          //   before: this.externalDiskTags[appIdx].size,
          //   after: data
          // })
          // this.$confirm(message, {
          //   dangerouslyUseHTMLString: true
          // }).then(async () => {
          //   this.externalDiskTags[appIdx].size = data
          //   this.externalDiskTags[appIdx].data = data + ' GB'

          //   return this.emitData()
          // }).catch(() => false)
        } else if (dbLen >= this.dataLength) {
          alertMessage(this.$t('common.ALERT.BASE.051')) // DB Size는
        } else {
          this.pushData(name, data)
        }
      } else {
        const disk = this.externalDiskList.find(disk => disk.name === name)
        const min = (disk && disk.min) ? disk.min : this.dataAppRange.min
        if (min > data) {
          // ${name}은 ${data}GB 이상 신청 가능합니다.
          this.$alert(this.$t('common.ALERT.PROJECT.031', { name, data }), '', {
            confirmButtonText: this.$t('common.BTN.confirm'), // 확인,
            callback: () => false
          })
          return
        }
        const appIdx = this.externalDiskTags.findIndex(data => data.name === name)
        if (appIdx >= 0) {
          this.externalDiskTags[appIdx].size = data
          this.externalDiskTags[appIdx].data = data + ' GB'
          // alertMessage(`${this.defaultPath[this.osType]}은`)
        } else {
          this.pushData(name, data)
        }
        // this.pushData(name, data)
      }

      // -------
      // if (this.dataLength && this.externalDiskTags.length >= this.dataLength) {
      //   this.$alert(`최대 ${this.dataLength}개 까지 추가 가능합니다.`, '', {
      //     confirmButtonText: this.$t('common.BTN.confirm'), // 확인,
      //     callback: () => false
      //   })
      // } else this.externalDiskTags.push({ name, data: `${data} GB`, size: data })
      // this.externalDiskTags.push({ name, data: `${data} GB`, size: data })
      if (!this.osType) {
        this.appMemoryName = 'db_' + this.appIdx++
      }

      this.dataAppRange = JSON.parse(JSON.stringify(this.appRange))
      this.appMemory = 0

      return this.emitData()
    },
    pushData (name, data) {
      const size = this.roundData(data)
      this.externalDiskTags.push({ name, diskName: name, data: `${size} GB`, size, type: this.osType || 'db' })
    },
    // custom Local Disk 추가
    setCustomName (e) {
      if (!this.customMemory) {
        this.$alert(this.$t('common.ALERT.PROJECT.055'), '', { // 용량을 확인해주세요.
          confirmButtonText: this.$t('common.BTN.confirm') // 확인
        })
        return
      }
      if (this.customMemoryName) {
        if (this.osType === 'WINDOWS') this.customMemoryName = this.customMemoryName.toUpperCase()
        this.customEnterKeypressEvent()
        this.removeTooltips('.slider-tooltip-custom')
      } else {
        // e.preventDefault()

        this.$alert(this.$t('common.ALERT.BASE.030'), '', { // 데이터 이름을 입력해주세요
          confirmButtonText: this.$t('common.BTN.confirm') // 확인
        })
        return false
      }
    },
    customEnterKeypressEvent (e) {
      const re = this.customMemoryName.match(this.regex[this.osType])
      if (re === null) {
        this.$alert(this.$t('common.ALERT.PROJECT.046', { path: this.customMemoryName }), () => false)
        // Local Disk Path로 '${this.customMemoryName}'은(는) 적합하지 않습니다.
        return
      }
      if (this.customMemoryName === this.defaultPath[this.osType]) {
        this.$alert(this.$t('common.ALERT.PROJECT.038', { path: this.customMemoryName }), () => false)
        // 입력하신 ${this.customMemoryName}'은(는) 기본 Local Disk Path입니다.
        return
      }
      if (this.systemList[this.osType].includes(this.customMemoryName)) {
        // 입력하신 '${this.customMemoryName}'은(는) ${this.osType}의 시스템 예약 파티션입니다.
        this.$alert(this.$t('common.ALERT.PROJECT.057', { path: this.customMemoryName, osType: this.osType }), () => false)
        return
      }
      // if (this.externalDiskTags.find(element => element.name === this.customMemoryName)) {
      //   this.$alert(`입력하신 ${this.customMemoryName}은(는) 이미 등록되어 있는 Local Disk Path입니다.`, () => false)
      //   return
      // }
      const disk = this.externalDiskList.find(data => {
        if (data.name === this.customMemoryName) return data
      })
      if (disk?.fixed) return
      const min = (disk && disk.min) ? disk.min : this.dataCustomRange.min
      if (min > this.customMemory) {
        // this.$alert(`${this.customMemoryName}은 ${disk.min}GB 이상 신청 가능합니다.`, '', {
        this.$alert(this.$t('common.ALERT.PROJECT.031', { name: this.customMemoryName, data: disk.min }), '', {
          confirmButtonText: this.$t('common.BTN.confirm'), // 확인,
          callback: () => false
        })
        return
      }
      return setTimeout(() => this.addCumstumMemory(this.customMemoryName), 10)
    },
    addCumstumMemory (name = this.customMemoryName, data = this.customMemory) {
      // if (this.dataLength && this.externalDiskTags.length >= this.dataLength) {
      //   this.$alert(`최대 ${this.dataLength}개 까지 추가 가능합니다.`, '알림', {
      //     confirmButtonText: this.$t('common.BTN.confirm'),
      //     callback: () => { return false }
      //   })
      // } else this.externalDiskTags.push({ name, data: `${data}GB` })
      const size = this.roundData(data)
      const appIdx = this.externalDiskTags.findIndex(tag => tag.name === name)
      if (appIdx >= 0) {
        this.externalDiskTags[appIdx].size = data
        this.externalDiskTags[appIdx].data = data + ' GB'
      } else {
        this.externalDiskTags.push({ name, diskName: name, data: `${size}GB`, size })
      }

      this.customMemoryName = ''
      this.customMemory = 0
      this.dataCustomRange.min = this.customRange.min
      this.dataCustomRange.max = this.customRange.max
      this.removeTooltips('.slider-tooltip-custom')
      return this.emitData()
    },
    /**
     * @function - input의 array 데이터를 태그로 등록합니다.
     */
    exDiskTags (innerData, b) {
      if (innerData) this.externalDiskTags = innerData

      return this.emitData()
    },
    emitData () {
      return this.$emit('range-data', this.externalDiskTags)
    },
    onFocusInput (isAppMemory) {
      if (isAppMemory) this.focusAppMemoryInput = true
      else this.focusCustomMemoryInput = true
    },
    onBlurInput (isAppMemory) {
      if (isAppMemory) this.focusAppMemoryInput = false
      else this.focusCustomMemoryInput = false
    },
    mouseUpEv (e) {
      if (!this.$el) return

      const elements = Array.from(this.$el.querySelectorAll('*'))
      const validator = [this.$el, ...elements].some(element => element === e.target)

      if (!validator) {
        return this.removeTooltips('.slider-tooltip')
      }
    }
  },
  data () {
    return {
      isDragging: false,
      focusAppMemoryInput: false,
      focusCustomMemoryInput: false,
      appIdx: 0,
      dataAppRange: {},
      dataCustomRange: {},
      appMemory: 0,
      customMemory: 0,
      appMemoryName: 'app',
      customMemoryName: '',
      // ********* 등록 입력 데이터 수집 *********
      externalDiskTags: [],
      externalDiskList: [],
      defaultPath: {
        WINDOWS: 'D:\\',
        LINUX: '/app',
        UBUNTU: '/app',
        CENTOS: '/app',
        RHEL: '/app'
      },
      regex: {
        // WINDOWS: /^[a-zA-Z]:\\[\\\S|*\S]?.*$/g,
        WINDOWS: /^[a-zA-Z]:\\{1}$/g,
        // LINUX: /^(\/|([\\/][\w\s@^!#$%&-]+)+(\.[a-z]+[\\/]?)?)$/i,
        LINUX: /^(\/|([\\/][\w\s@^!#$%&-]+)(\.[a-z]+[^\\/])?)$/i,
        UBUNTU: /^(\/|([\\/][\w\s@^!#$%&-]+)(\.[a-z]+[^\\/])?)$/i,
        CENTOS: /^(\/|([\\/][\w\s@^!#$%&-]+)(\.[a-z]+[^\\/])?)$/i,
        RHEL: /^(\/|([\\/][\w\s@^!#$%&-]+)(\.[a-z]+[^\\/])?)$/i
      },
      systemList: {
        WINDOWS: ['C:\\', 'A:\\', 'B:\\'],
        LINUX: ['/bin', '/boot', '/dev', '/etc', '/home', '/lib', '/lib64', '/media', '/mnt', '/opt', '/proc', '/root', '/run', '/sbin', '/srv', '/sys', '/tmp', '/usr', '/var', '/snap'],
        UBUNTU: ['/bin', '/boot', '/dev', '/etc', '/home', '/lib', '/lib64', '/media', '/mnt', '/opt', '/proc', '/root', '/run', '/sbin', '/srv', '/sys', '/tmp', '/usr', '/var', '/snap'],
        CENTOS: ['/bin', '/boot', '/dev', '/etc', '/home', '/lib', '/lib64', '/media', '/mnt', '/opt', '/proc', '/root', '/run', '/sbin', '/srv', '/sys', '/tmp', '/usr', '/var', '/snap'],
        RHEL: ['/bin', '/boot', '/dev', '/etc', '/home', '/lib', '/lib64', '/media', '/mnt', '/opt', '/proc', '/root', '/run', '/sbin', '/srv', '/sys', '/tmp', '/usr', '/var', '/snap']
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.disk-contents {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 35px;
  padding-bottom: 35px;
  border-bottom: 1px solid $border-color;

  &.-custom { margin-top: $gap }

  > .app-name {
    color: $white;
    font-size: 14px;
    letter-spacing: -0.45px;
    width: 90px;
    height: 32px;
    display: flex;
    align-items: center;

    // &.non-edit {
    //   > span {
    //     position: relative;
    //     &::after {
    //       position: absolute;
    //       content: "*";
    //       color: $main-red;
    //       display: inline-block;
    //       top: -2px;
    //       right: -10px;
    //     }
    //   }
    // }

    &.disabled { color: $disable; }
  }

  > .slider {
    flex: 1 1 auto;
    margin: 0 $gap;
    text-align: center;
    position: relative;
    height: 32px;
    // border: 1px solid red;

    > .-range {
      position: absolute;
      top: calc(100% + 7px);
      display: block;
      height: 10px;
      line-height: 10px;
      font-size: 10px;
      color: $text-gray;
      &.-min { left: 0; text-align: left; }
      &.-max { right: 0; text-align: right; }
    }
  }

  .range-registration {
    height: 32px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    .range-text {
      display: flex;
      align-items: center;
      position: relative;
      width: 70px;
      height: 32px;
      margin-right: $gap-s;

      &:after {
        content: 'GB';
        position: absolute;
        line-height: 32px;
        top: 0; right: 0;
        margin-right: $gap-s;
        font-weight: 400;
        font-size: 13px;
        letter-spacing: -0.5px;
      }
      &.disabled {
        &:after,
        &:before {
          color: $input-stroke;
        }
      }
    }
    .number-input {
      margin-right: $gap;
    }
  }
  .adddisk {
    height: 32px;
    line-height: 30px;
  }
}

.disk-section + .tag-lists {
  margin-top: 15px;
}

</style>
