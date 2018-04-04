import '../css/base.css'
import '../css/index.css'
import print from './lib/print'
import print3 from './lib/print3'
import print4 from './lib/print4'
import _ from 'lodash'
import axios from 'axios'
import qs from 'qs'

async function test () {
  const res = await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(`123`)
    }, 2000)
  })
  console.log(res)
}
test()
print()
print3()
print4()
console.log(_.join(['a', 'b', 'c']))

axios.post('/data/normal.json', qs.stringify({
  firstName: 'Fred',
  lastName: 'Flintstone'
})).then(({data}) => {
  console.log(data)
}).catch(err => {
  console.log(err)
})
