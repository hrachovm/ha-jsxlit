const _nameValid = _name => true
const _htmlDecode = text => typeof text !== 'string' ? text : text.replace('&quot;', '"')

const lastNodesNames = stack => {
  const lastNode = stack.findLast(item => Array.isArray(item))
  return !lastNode ? [] : [lastNode[0], ...lastNodesNames(lastNode[2] || [])]
}

const parse = (strs, vals, { nameValid = _nameValid, htmlDecode = _htmlDecode }) => {
  const stack = [], TEXT = 1, NODE = 2, PROPS = 3, VALUE = 4
  let mode = TEXT,
    buffer = '',
    name = '',
    node = [],
    newline = false,
    slash = false

  const errMsg = msg => `JSX Error: <${lastNodesNames(stack[0]).map(name => typeof name === 'string' ? name : `c#${name}`).join('><')}${msg}`

  const ws = ch => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r'

  const setMode = m => {
    mode = m
    name = buffer = ''
    if (mode === TEXT) newline = false
    if (mode === NODE) slash = false
  }

  const push = item => {
    node.push(item)
    stack.push(node)
    node = node.at(-1)
  }

  const pushText = (txt, trim) => {
    if (typeof txt !== 'string') return node.push(txt)
    if (txt === '') return
    if (trim) txt = txt.trimEnd()
    if (txt !== '') node.push(txt)
  }

  const pushContent = () => push([])

  const pushNode = name => {
    if (typeof name === 'string' && !nameValid(buffer)) throw new Error()
    return push([name, [{}, {}]])
  }

  const popNode = (name, autoclosed = false) => {
    if (!autoclosed) { // self-closing node
      if (!stack.length) throw new Error()
      node = stack.pop() // node points to the parent node
      if (node.length !== 3) throw new Error()
      if (!Object.keys(node[1][1]).length) node[1][1] = false // no vProps
      if (!node[2].length) node.pop() // no content
    }

    if (typeof node[0] === 'string') {
      if (node[0] !== name) throw new Error(errMsg(`></${name}>`)) // <a></b>
    } else {
      if (name !== '/' && vals[node[0]] !== vals[name]) throw new Error() // <${a}></${b}> + support for <${a}>...<//>
    }

    if (!stack.length) throw new Error()
    node = stack.pop() // node points to the parent content
  }

  const setProp = (name, val) => {
    if (typeof val === 'string') val = htmlDecode(val)
    if (typeof name !== 'string') node[1].push(name) // ${name}
    else node[1][typeof val === 'number' ? 1 : 0][name] = val // name=${val} : name | name="val"
  }

  for (let i = 0; i < strs.length; i++) {
    for (const ch of strs[i]) {
      switch (mode) {
        case TEXT: // whitespace handling in JSX based on new line usage is complicated...
          if (ch === '<') {
            pushText(buffer, newline)
            setMode(NODE)
          } else if (ch === '\n') {
            if (!newline && buffer.length) {
              buffer = buffer.trimEnd()
            }
            newline = true
          } else if (newline) {
            if (!ws(ch)) {
              if (buffer !== '') buffer += ' '
              buffer += ch
              newline = false
            }
          } else {
            buffer += ch
          }
          break
        case NODE: // closing nodes | < name>
          if (ch === '<') {
            throw new Error() // < <
          } else if (ch === '>') { // < / name > | < / / > | < name>
            if (buffer === '') throw new Error() // < > | < / >
            if (slash) { // < / name > | < / / >
              popNode(buffer)
            } else { // < name> - it's more conveniet to handle it here than passing to PROPS
              pushNode(buffer)
              pushContent()
            }
            setMode(TEXT)
          } else if (ch === '/') { // < name / | < / | < / /
            if (slash) {
              if (buffer !== '') throw new Error() // < name / / | < / / /
              buffer = '/' // < / /
            } else {
              slash = true
              if (buffer !== '') { // < name/
                pushNode(buffer)
                setMode(PROPS)
              }
            }
          } else if (ws(ch)) {
            if (buffer !== '') {
              if (slash) { // < / name ...
                name = buffer
              } else { // < name ...
                pushNode(buffer)
                setMode(PROPS)
              }
            }
          } else {
            if (name !== '') throw new Error() // < name ... | < / name ...
            if (typeof buffer !== 'string') throw new Error() // < ${val}n
            buffer += ch
          }
          break
        case PROPS:
          if (ch === '<') {
            throw new Error() // < <
          } else if (ch === '>') { // props> | props/> | name > | name/ >
            if (name !== '') throw new Error() // prop = > prop = / >
            if (buffer !== '') {
              setProp(buffer, true)
            }
            if (slash) { // props / > | name/ >
              popNode(node[0], true)
            } else {
              pushContent()
            }
            setMode(TEXT)
          } else if (ch === '/') { // name p / >
            if (slash) throw new Error() // // name p / / >
            slash = true
          } else if (ch === '=') {
            if (buffer === '') throw new Error() // < name = | < name prop = "val" =
            if (name !== '') throw new Error() // prop = =
            name = buffer
            buffer = ''
          } else if (ch === '"') {
            if (name === '') throw new Error() // prop" | prop "
            mode = VALUE
          } else if (ws(ch)) {
            if (buffer !== '') {
              setProp(buffer, true) // prop p
              buffer = ''
            }
          } else {
            if (slash) throw new Error() // // ... / p >
            if (name !== '') throw new Error() // prop = v
            buffer += ch
          }
          break
        case VALUE:
          if (ch === '"') {
            setProp(name, buffer)
            setMode(PROPS)
          } else {
            if (typeof buffer !== 'string') throw new Error() // name = "${foo}x
            buffer += ch
          }
          break
      }
    }

    if (i < vals.length) {
      if (mode === TEXT) {
        pushText(buffer, newline)
        pushText(i)
        setMode(TEXT) // resets state
      } else { // NODE, PROPS, VALUE
        if (buffer !== '') throw new Error() // name${val}
        buffer = i
      }
    }
  }

  if (stack.length) throw new Error() // `a<b>c`
  pushText(buffer, newline)
  return node.length ? node : false
}

const cache = new WeakMap()
const selfOrFirst = a => a.length > 1 ? a : a[0]

export const getJsxlit = (h, text, { noCache, noEvaluate, ...options } = {}) => {
  const textify = t => ['string', 'number', 'bigint'].includes(typeof t) ? text(t) : t

  const evaluate = (hNodes, vals) => hNodes && selfOrFirst(hNodes.map(hNode => {
    if (typeof hNode === 'string') return text(hNode)
    if (!Array.isArray(hNode)) return textify(vals[hNode])

    const valProps = () => vProps && Object.fromEntries(Object.entries(vProps).map(([k, i]) => [k, vals[i]]))
    const [name, [cProps, vProps, ...sProps]] = hNode, children = evaluate(hNode[2], vals)
    const props = sProps.reduce((acc, sProp) => ({ ...acc, ...vals[sProp] }), { ...cProps, ...valProps() })
    return typeof name === 'string' ? h(name, props, children) : vals[name](props, children)
  }))

  const hNodes = (strs, vals) => {
    if (noCache) return parse(strs, vals, options)
    return cache.has(strs) ? cache.get(strs) : cache.set(strs, parse(strs, vals, options)).get(strs)
  }
  return (strs, ...vals) => noEvaluate ? hNodes(strs, vals) : evaluate(hNodes(strs, vals), vals)
}
