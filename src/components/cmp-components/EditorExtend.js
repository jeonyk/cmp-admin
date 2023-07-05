import { Node } from 'tiptap'
import { toggleBlockType } from 'tiptap-commands'

export class Alignment extends Node {
  get name () {
    return 'alignment'
  }

  get defaultOptions () {
    return {
      textAlign: ['left', 'center', 'right']
    }
  }

  get schema () {
    return {
      attrs: {
        textAlign: {
          default: 'left'
        }
      },
      content: 'inline*',
      group: 'block',
      defining: true,
      draggable: false,
      parseDOM: [
        {
          tag: 'p',
          getAttrs: (node) => ({
            textAlign: node.style.textAlign || 'left'
          })
        }
      ],
      toDOM: (node) => ['p', { style: `text-align: ${node.attrs.textAlign}` }, 0]
    }
  }

  commands ({ type, schema }) {
    return attrs => toggleBlockType(type, schema.nodes.alignment, attrs)
  }
}
