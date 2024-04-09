import { getJsxlit } from "./jsxlit.js"

const testDataset = [
  ['Crossed elements', '<a><d><f></g>', `
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
]

export const invalidJsx = (h, text) => {
  const jsxtest = getJsxlit(h, text, { noEvaluate: true }) // it is used in the dynamically generated code only
  const test = ([name, expected, lit]) => {
    const log = (ok, msg, input) => console.log(ok ? '[OK' : '[ERR]', name + ':', msg, !input ? '' : `input: ${input}`)
    const testLit = () => eval(`(() => {
        const input = \`${lit}\`
        try { jsxtest\`<u></u><a><b><c></c></b><d><e></e><f></g></d></a>\` }
        catch (e) { return [false, input, e.message] }
        return [true, input]
      })()`)

    const [ok, input, error] = testLit()
    if (ok) log(false, 'Expected exception, but none caught.', input)
    else {
      if (`JSX Error: ${expected}` === error) return log(true, 'Test passed.')
      log(false, `Expected 'JSX Error: ${expected}', but got '${error}.'`, input)
    }
  }

  testDataset.forEach(test)
}
