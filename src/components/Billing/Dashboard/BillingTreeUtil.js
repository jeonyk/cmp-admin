/**
 * 트리야 여행 떠나자
 */
export function traverse (tree, callback, childrenKey = 'children') {
  if (typeof callback !== 'function') return
  if (Array.isArray(tree)) return tree.forEach(node => traverse(node, callback, childrenKey))
  if (tree[childrenKey] && tree[childrenKey].length) tree[childrenKey].forEach(child => traverse(child, callback, childrenKey))
  callback(tree)
}
