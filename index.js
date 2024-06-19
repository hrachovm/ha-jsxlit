import { getHyperlit } from "./hyperlit/to-test.js"
import { getJsxlit } from "./jsxlit.js"
import { jsxTests } from "./jsxlit-tests.js"

const h = (name, props, children) => `<${name} ${JSON.stringify(props)}>${Array.isArray(children) ? `[${children.join(', ')}]` : children}</${name}>`
const text = t => `~${t}~`

const testHyperlit = () => {
  const hyperlit = getHyperlit(h, text)

  const title = ({ label, color }) => hyperlit`<div f="bar" c="${color}">${label}</div>`

  const todoList = ({ label, items }) => hyperlit`   <main>   aaaa
  bbbb
  cccc
    <${title} ${{ label, color: 'c' }}></${title}>  <div />
    dddd
    eeee
    <ul>
      ${items.map(item => hyperlit`<li>${item}</li>`)}
    </ul>
  </main>   `

  console.log(todoList({ label: 'TODOs', items: ['milk', 'butter', 'bread'] }))
}

const testJsxlit = () => {
  const jsxtest = getJsxlit(h, text, { noEvaluate: true })
  const jsxlit = getJsxlit(h, text)

  console.log('debug:', JSON.stringify(jsxtest`<a x=${"val"}/>`))
  return

  console.log(`<div>
    ${2}  e
  </div>`)
  console.log(jsxtest`<div>
    ${2}  e
  </div>`)


  console.log(`      
  <div>   fff
  ggg   hhh   
  aaa   ${1}pppp
  ddd ${2}
  </div>        
`)
  console.log(jsxtest`      
  <div>   fff
  ggg   hhh   
  aaa   ${1}pppp
  ddd ${2}
  </div>        
`)

  console.log(`00 <${'k'}>11</${'k'}> <${'l'}>22<//> aaa ${4}<x ${7} e f="g" h="${2}" >bbb</x >ccc<y></y>ddd`)
  console.log(jsxtest`00 <${'k'}>11</${'k'}> <${'l'}>22<//> aaa ${4}<x ${7} e f="g" h="${2}" >bbb</x >ccc<y></y>ddd`)

  const nTitle = ({ label, color }) => jsxtest`<div f="bar" c="${color}">${label}</div>`
  const title = ({ label, color }) => jsxlit`<div f="bar" c="${color}">${label}</div>`

  const nTodoList = ({ label, items }) => jsxtest`  
  <main>   aaaa
  bbbb
  cccc
    <${title} ${{ label, color: 'c' }}></${title}>  <div />
    dddd
    eeee
    <ul>
      ${items.map(item => jsxtest`<li>${item}</li>`)}
    </ul>
  </main>  
  `

  const todoList = ({ label, items }) => jsxlit`  
  <main>   aaaa
  bbbb
  cccc
    <${title} ${{ label, color: 'c' }}></${title}>  <div />
    dddd
    eeee
    <ul>
      ${items.map(item => jsxlit`<li>${item}</li>`)}
    </ul>
  </main>  
  `

  console.log(nTitle({ label: 'lbl', color: 'col' }))
  console.log(title({ label: 'lbl', color: 'col' }))
  console.log(nTodoList({ label: 'TODOs', items: ['milk', 'butter', 'bread'] }))
  console.log(todoList({ label: 'TODOs', items: ['milk', 'butter', 'bread'] }))
}

testJsxlit()
jsxTests()
// testHyperlit()
