/**
  * tree 데이터를 순회하며 title을 찾습니다.
  * @param {array} nodes 순회 할 treeData
  * @param {string} matchingKey 찾을 ID 값
  * @param {string} value 검사 할 value
  * @return child[marchingKey] = value인 child를 반환합니다.
  */
export function treeFindChild (nodes, matchingKey = 'idx', value) {
  if (!nodes || !value) return null

  let child

  const check = (element, key, val) => {
    if (element[key] === val) return element
    else if (element?.children?.length) {
      let result = null
      for (let i = 0; !result && i < element.children.length; i++) result = check(element.children[i], key, val)
      return result
    }
    return null
  }

  for (let i = 0; i < nodes.length; i++) {
    if (check(nodes[i], matchingKey, value)) {
      child = check(nodes[i], matchingKey, value)
      break
    }
  }

  return child || null
}
