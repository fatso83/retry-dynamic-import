import './index.css'

import retryLazy from '@fatso83/retry-dynamic-import/react-lazy'

(async () => {
const module  =  await retryLazy(() => import('./my-module'))

const root = document.getElementById("root") as HTMLElement;
console.log(module)
root.innerHTML = `The answer is ${module}`

})();
