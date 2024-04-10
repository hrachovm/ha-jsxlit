import { getJsxlit } from "./jsxlit.js" // used inside dynamically generated code only

// [test_name, should_throw, expexted_result, tested _literal],
const testDataset = [
  // valid JSX
  ['Simple node with text', false, '[["a",[{},false],["foo"]]]', '<a>foo</a>'],
  // invalid JSX
  ['Attribute - in closing node', true, 'JSX Error: <u f', `<u></u foo>`],
  ['Attribute - missing quotes #01', true, 'JSX Error: <a><b x= >', '<a><b x=></b></a>'],
  ['Attribute - missing quotes #02', true, 'JSX Error: <a><b x= >', '<a><b x= b="s"></b></a>'],
  ['Attribute - dynamic name', '...', true, '<a><b ${"name"}="s"></b></a>'],
  ['Text after node-closing slash', true, 'JSX Error: <a><u / f', `<a><u / foo></a>`],
  ['Missing closing element', true, '...', `<a><b>foo</b>`],
  ['*Used <//> to close non-component element', true, '...', `<a><b>foo<//>`],
  ['Bad node name #01', true, '...', '<a><n${"c#0"}>foo<//></a>'],
  ['Bad node name #02', true, '...', '<a><${"c#0"}n>foo<//></a>'],
  ['Bad name of closing node #01', true, '...', '<a><${"c#0"}>foo</${"c#0"}n></a>'],
  ['Bad name of closing node #02', true, '...', '<a><${"c#0"}>foo</n${"c#0"}></a>'],
  ['Crossed nodes', true, 'JSX Error: <a><d><f></g>', `
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
]

export const jsxTests = () => testDataset.forEach(([label, shouldThrow, expected, lit]) => {
  const log = (status, msg) => console.log(
    `[${status}]`, `${label}:`,
    ...(status === 'ERR' ? [msg, `test data: ${lit}`] : ['Passed.'])
  )
  const [ok, actual] = eval(`(() => {
      try {
        const jsxtest = getJsxlit(undefined, undefined, { noEvaluate: true })
        return [true, JSON.stringify(jsxtest\`${lit}\`)] 
      } catch (e) { return [false, e.message] }
    })()`
  )

  if (ok && shouldThrow) log('ERR', 'Expected exception, but none caught.')
  else if (!ok && !shouldThrow) log('ERR', `Unexpected exception '${actual}'.`)
  else if (actual !== expected) log('ERR', `Expected '${expected}', but got '${actual}'.`)
  else log('OK')
})
