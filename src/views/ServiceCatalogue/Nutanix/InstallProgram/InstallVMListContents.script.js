import { SetOSIcon, CMPCodeEditor } from '@sd-fe/cmp-core'

// 공통 Props (ㅇㅅㅇ)
const props = {
  props: {
    data: {
      type: Object,
      default: () => {}
    }
  }
}

// 🟧 CSS 는 InstallProgram.vue 에 정의되어있음

/**
 * [VM 상태]
 */
export const VMStatus = {
  ...props,
  render (h) {
    if (!this.data) return
    const { powerState } = this.data

    const contents = {
      POWERED_OFF: 'OFF', // 이렇게 들어오는 경우가 있음;
      POWERED_ON: 'ON', // 이렇게 들어오는 경우가 있음;
      OFF: 'OFF',
      ON: 'ON'
    }[powerState]

    const type = contents === 'ON' ? 'is-blue' : 'is-undefined'

    return (
      <cmp-status-tag
        line-style
        type={ type }
        style="width: 55px"
        contents={contents}
      />
    )
  }
}

/**
 * [OS 버전 (Bits)]
 */
export const OSVersion = {
  ...props,
  components: {
    'set-os-icon': SetOSIcon
  },
  render (h) {
    if (!this.data) return
    const { osType, bits } = this.data

    return osType ? (
      <div class="flex-wrap center">
        <set-os-icon os-name={osType} />
        ({ bits })
      </div>
    ) : '-'
  }
}

/**
 * [기본사양] 데이터 세팅
 */
export const BasicSpec = {
  ...props,
  components: {
    'set-os-icon': SetOSIcon
  },
  render (h) {
    if (!this.data) return

    const { cpu, memory, disk, externalDiskDisplay } = this.data
    if (!externalDiskDisplay) return

    const { externalDisk, externalDisks } = externalDiskDisplay

    const text1 = `vCPU : ${cpu}Core, RAM : ${memory}GB,`
    const text2 = `Disk ${disk}GB, External Disk(${externalDisks ? externalDisks.length : 0}EA) : ${externalDisk}GB`

    return (
      <div>
        <p>{text1}</p>
        <p>{text2}</p>
      </div>
    )
  }
}

/**
 * [Script 수행 가능 여부]
 */
export const ScriptExecute = {
  props: {
    ...props.props,
    useTooltip: {
      type: Boolean,
      default: false
    }
  },
  render (h) {
    if (!this.data) return
    const { isMinion, isNetworkCategory } = this.data

    const center = this.useTooltip ? 'flex-wrap center' : ''

    // Script 수행 가능 여부 (실패 사유)
    const minionFail = this.$v('Salt agent 설치 및 연결이 필요합니다.')
    const categoryFail = this.$v('해당 네트워크 카테고리가 IT Automation에 설정되어 있지 않습니다.<br>IT Automation에 해당 네트워크 카테고리를 추가해 주세요.')
    let scriptexcute = { status: true, message: undefined }

    if (!isMinion) scriptexcute = { status: false, message: minionFail }
    if (!isNetworkCategory) scriptexcute = { status: false, message: `${minionFail}<br> ${categoryFail}` }

    const label = scriptexcute.status ? this.$v('가능') : this.$v('불가능')

    const tooltip = (
      <el-tooltip
        effect="light"
        style="margin-left: 10px;"
      >
        <i class="mdi mdi-information-outline" />
        <div slot="content">
          { scriptexcute.message }
        </div>
      </el-tooltip>
    )

    return (
      <div class={ center }>
        <span>{ label }</span>

        { (this.useTooltip && scriptexcute.message) ? tooltip : null }
      </div>
    )
  }
}

/**
 * [설치 / 삭제 Script 수행 상태] 간단하게 키값으로만 확인
 */
export const ScriptStatusSimple = {
  props: {
    ...props.props,
    binding: {
      type: String,
      default: 'status'
    }
  },
  render (h) {
    if (!this.data) return
    const state = this.data[this.binding]

    // 상태값 :: FAILED, SUCCESS, IN_PROGRESS
    // 수행 상태 간단한 값만
    // console.log(state)

    const data = state ? {
      IN_PROGRESS: { value: this.$v('진행중'), type: 'is-wait' },
      SUCCESS: { value: this.$v('성공'), type: 'is-success' },
      FAILED: { value: this.$v('실패'), type: 'is-fail' }
    }[state] : undefined

    if (!data) return

    return (
      <cmp-status-tag
        line-style
        style="width: 55px"
        type={ data.type }
        contents={ data.value }
      />
    )
  }
}
/**
 * [설치 / 삭제 Script 수행 상태]
 */
export const ScriptStatus = {
  props: {
    ...props.props,
    binding: {
      type: String,
      default: 'INSTALL' // INSTALL / UNINSTALL
    }
  },
  render (h) {
    if (!this.data) return
    const { progressList } = this.data

    if (progressList.length === 0) return '-'

    // 설치 / 삭제 Script 수행 상태
    const states = { INSTALL: undefined, UNINSTALL: undefined }
    if (progressList && progressList.length) {
      progressList.forEach(({ type, state }) => (states[type] = state))
    }

    // 상태값 :: FAILED, SUCCESS, IN_PROGRESS
    // 설치Script 수행상태 :: progressList.type이 INSTALL인 state값
    // 삭제Script 수행상태 :: progressList.type이 UNINSTALL인 state값

    const state = states[this.binding]

    const data = state ? {
      IN_PROGRESS: { value: this.$v('진행중'), type: 'is-wait' },
      SUCCESS: { value: this.$v('성공'), type: 'is-success' },
      FAILED: { value: this.$v('실패'), type: 'is-fail' }
    }[state] : undefined

    if (!data) return '-'

    return (
      <cmp-status-tag
        line-style
        style="width: 55px"
        type={ data.type }
        contents={ data.value }
      />
    )
  }
}

/**
 * [진행상황] 버튼
 */
export const ProcessButtton = {
  ...props,
  emits: ['click'],
  render (h) {
    if (!this.data) return
    const css = ['mdi mdi-chevron-down', { '-open': this.data._open }]

    const onClick = e => {
      e.stopPropagation()
      return this.$emit('click')
    }

    return (
      <div class="install-button-wrap">
        <button
          style="width: 90px;"
          class="button install-button"
          type="is-primary"
          onClick={ onClick }
        >
          <span class="span">
            { this.$v('진행상황') }
            <i class={ css } />
          </span>
        </button>
      </div>
    )
  }
}

/**
 * [설치 결과화면 (진행상황)]
 */
export const InstallingResult = {
  ...props,
  components: {
    CMPCodeEditor
  },
  render (h) {
    if (!this.data) return
    const { location, installing, installResult } = this.data

    if (!installing) return (<span>{location}</span>)

    return (
      <div class="script-install-execute">
        <div class="shell-script-area">
          <CMPCodeEditor values={installResult} />
        </div>
      </div>
    )
  }
}
