import { getJsxlit } from "./jsxlit.js" // used inside dynamically generated code only

const shouldThrow = value => ([first, ...rest]) => [first, value, ...rest]

const okNodes = [
  ['Simple node with text', '[["a",[{},false],["foo"]]]', '<a>foo</a>'],
].map(shouldThrow(false))

const okPropsDynamic = [
  ['Dynamic props value/01', '[["a",[{},{"x":0}],["foo"]]]', '<a x=${"val"}>foo</a>'],
  ['Dynamic props value/02', '[["a",[{},{"x":0}],["foo"]]]', '<a x=${"val"} >foo</a>'],
  ['Spread props/01', '[["a",[{},false,0],["foo"]]]', '<a ${{x:0}}>foo</a>'],
].map(shouldThrow(false))

const errUnsorted = [
  ['Attribute after node closing/01', 'JSX Error: <u f', '<u></u foo>'],
  ['Attribute after node closing/02', 'JSX Error: <u f', '<u></u foo >'],
  ['Attribute after node closing/03', 'JSX Error: <u></u${"c#0"}', '<u></u ${"foo"}>'],
  ['Attribute after node closing/04', 'JSX Error: <u></u${"c#0"}', '<u></u ${"foo"} >'],
  ['Attribute after node self-closing/01', 'JSX Error: <u / f', '<u / foo>'],
  ['Attribute after node self-closing/02', 'JSX Error: <u / f', '<u / foo >'],
  ['Attribute after node self-closing/03', '...', '<u / ${"foo"}>'],
  ['Attribute after node self-closing/04', 'JSX Error: <u / ${"c#0"}', '<u / ${"foo"} >'],
  ['Attribute - missing quotes #01', 'JSX Error: <a><b x= >', '<a><b x=></b></a>'],
  ['Attribute - missing quotes #02', 'JSX Error: <a><b x= >', '<a><b x= b="s"></b></a>'],
  ['Attribute - dynamic name', '...', '<a><b ${"name"}="s"></b></a>'],
  ['Props after node-closing slash', 'JSX Error: <a><u / f', '<a><u / foo></a>'],
  ['Props (spread) after node-closing slash', '...', '<a><u / ${"x"}></a>'],
  ['Missing closing element', '...', '<a><b>foo</b>'],
  ['*Used <//> to close non-component element', 'JSX Error: <a><b><//>', '<a><b>foo<//>'],
  ['Bad node name #01', '...', '<a><n${"c#0"}>foo<//></a>'],
  ['Bad node name #02', '...', '<a><${"c#0"}n>foo<//></a>'],
  ['Bad name of closing node #01', '...', '<a><${"c#0"}>foo</${"c#0"}n></a>'],
  ['Bad name of closing node #02', 'JSX Error: <a><c#0></n${"c#1"}', '<a><${"c#0"}>foo</n${"c#0"}></a>'],
  ['Missing prop value/01', 'JSX Error: <a b= >', '<a b= ></a>'],
  ['Missing prop value/02', 'JSX Error: <a b= >', '<a b=></a>'],
  ['Missing prop value/03', 'JSX Error: <a b= />', '<a b=/>'],
  ['Missing prop value/04', 'JSX Error: <a b= />', '<a b= />'],
  ['Crossed nodes', 'JSX Error: <a><d><f></g>', `
  <u></u>
  <a>
    <b>
      <c></c>
    </b>
    <d>
      <e></e>
      <f></g>
    </d>
  </a>`],
  ['Crossed nodes - component ', true, 'JSX Error: <a><d><c#0></g>', `
  <u></u>
  <a>
    <b>
      <c></c>
    </b>
    <d>
      <e></e>
      <\${'c#0'}></g>
    </d>
  </a>`],
].map(shouldThrow(true))

// --- evaluate ---
export const jsxTests = () => [
  ...okNodes,
  ...okPropsDynamic,
  ...errUnsorted
].forEach(([label, shouldThrow, expected, lit], index) => {
  const log = (status, msg) => console.log(
    `#${('00' + (index + 1)).slice(-3)} [${status}]`, `${label}:`,
    status === 'ERR' ? msg : `Passed. expected: '${msg}';`,
    `test data: \`${lit}\``
  )
  const [ok, actual] = eval(`(() => {
      try {
        const jsxtest = getJsxlit(undefined, undefined, { noEvaluate: true })
        return [true, JSON.stringify(jsxtest\`${lit}\`)] 
      } catch (e) { return [false, e.message] }
    })()`
  )

  if (ok && shouldThrow) log('ERR', `Expected exception, but none caught (JSXtree: '${actual}').`)
  else if (!ok && !shouldThrow) log('ERR', `Unexpected exception '${actual}'.`)
  else if (actual !== expected) log('ERR', `Expected '${expected}', but got '${actual}'.`)
  else log('OK', actual)
})
