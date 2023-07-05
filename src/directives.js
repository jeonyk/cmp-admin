/**
 * Dialog 내부 마우스 이벤트
 */
function handleMouseDown (e, component) {
  component.isMouseDown = true
}

/**
 * Dialog 내부 마우스 이벤트
 */
function handleMouseUp (e, component) {
  component.isMouseDown = false
}

/**
 * Dialog Wrapper 마우스 이벤트
 */
function handleMouseUpWrapper (e, component) {
  if (component.isMouseDown) {
    setTimeout(() => (component.isMouseDown = false))
  }
}

export default {
  install (Vue) {
    Vue.directive('drag-outside', {
      inserted (el, binding, vNode) {
        // if (typeof vNode.componentInstance.beforeClose !== 'function') {
        vNode.componentInstance.isMouseDown = false
        el.addEventListener('mouseup', (e) => handleMouseUpWrapper(e, vNode.componentInstance))
        const temp = vNode.componentInstance.handleWrapperClick
        vNode.componentInstance.handleWrapperClick = () => {
          if (vNode.componentInstance.isMouseDown) return
          temp()
        }
        const { dialog } = vNode.componentInstance.$refs
        dialog.addEventListener('mousedown', (e) => handleMouseDown(e, vNode.componentInstance))
        dialog.addEventListener('mouseup', (e) => handleMouseUp(e, vNode.componentInstance))
        // }
      }
    })
  }
}
