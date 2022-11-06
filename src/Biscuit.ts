import './style.css'

function getCaretCoordinates() {
  const selection = window.getSelection()
  if (selection && selection.rangeCount !== 0) {
    const range = selection.getRangeAt(0).cloneRange()
    range.collapse(true)
    const { x, y } = range.getClientRects()?.[0]
    return { x, y } 
  }
}

const diveToFirstText = (node: Node) => {
  while (node?.childNodes?.length) {
    node = node.childNodes[0]
  }

  return node
}

const getElements = () => {
  const selection = window.getSelection()
  const node = selection?.focusNode as Text
  if (!node.parentNode) throw new Error('Elements are not attached to the DOM')
  const offset = selection?.focusOffset

  const isAtStart = offset === 0
  const isAtEnd = offset === node.length
  const children = Array.from(node.parentNode.childNodes)

  let left = null, right = null
  if (isAtStart) {
    right = node
    const index = children.indexOf(node)

    if (index !== 0) {
      left = children[index - 1]
    }
    else {
      let parent: any = node.parentNode
      while (!left && parent) {
        if (parent.previousSibling) left = parent.previousSibling
        parent = parent.parentNode
      }
    }
  }
  else if (isAtEnd) {
    left = node
    const index = children.indexOf(node)

    if (index !== children.length - 1) {
      right = children[index + 1]
    }
    else {
      let parent: any = node.parentNode
      while (!right && parent) {
        if (parent.nextSibling) right = parent.nextSibling
        parent = parent.parentNode
      }
    }
  }

  return {
    left: diveToFirstText(left),
    right: diveToFirstText(right)
  }
}

const elementToStyleMapping: any = {
  'EM': 'i',
  'STRONG': 'b',
}
const getStyles = (node: Node, stopAt: HTMLElement) => {
  let parent = node.parentNode
  const types = []

  while (parent && parent !== stopAt && node.parentElement !== document.body) {
    if (elementToStyleMapping[parent.nodeName]) {
      types.push(elementToStyleMapping[parent.nodeName])
    }
    parent = parent.parentNode
  }

  return types
}

export class Biscuit {
  
  horizontalCaret: HTMLDivElement

  nextStop = ''

  constructor (element: HTMLElement) {
    const isSupported = window.getSelection !== undefined

    if (!isSupported) throw new Error('Biscuit is not supported in this browser.')

    this.horizontalCaret = document.createElement('div')
    this.horizontalCaret.classList.add('biscuit-caret')
    this.horizontalCaret.style.setProperty('--opacity', '0')
    element.appendChild(this.horizontalCaret)

    element.addEventListener('keydown', (event) => {
      const direction = event.key === 'ArrowLeft' ? 'left' : 'right'

      if (['ArrowLeft', 'ArrowRight'].includes(event.key) && this.nextStop === direction) {
        event.preventDefault()
      }
      else {
        this.nextStop = ''
      }
    })

    element.addEventListener('keyup', (event) => {
      const { left, right } = getElements()
      const position = getCaretCoordinates()

      if (position && left && right && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        const direction = event.key === 'ArrowLeft' ? 'left' : 'right'
        const oppositeDirection = event.key === 'ArrowLeft' ? 'right' : 'left'

        this.horizontalCaret.style.setProperty('--x', position.x + 'px')
        this.horizontalCaret.style.setProperty('--y', position.y + 'px')
        this.horizontalCaret.style.setProperty('--opacity', '1')

        if (this.nextStop === direction) {
          this.horizontalCaret.dataset.position = direction
          this.nextStop = ''
        }
        else {
          this.nextStop = direction
          this.horizontalCaret.dataset.position = oppositeDirection
        }
  
        event.preventDefault()
      }
      else {
        this.horizontalCaret.style.setProperty('--opacity', '0')
      }
    })
  }
}