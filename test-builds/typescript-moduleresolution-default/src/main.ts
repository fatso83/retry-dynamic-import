import './index.css'

import { dynamicImportWithRetry } from '@fatso83/retry-dynamic-import'

(async () => {
const module  =  await dynamicImportWithRetry(() => import('./my-module'))

const root = document.getElementById("root") as HTMLElement;
console.log(module)
root.innerHTML = `The answer is ${module}`

})();
