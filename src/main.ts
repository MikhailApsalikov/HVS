import { bootstrap } from './bootstrap.js';

const root = document.getElementById('app');
if (!root) throw new Error('Root element #app not found');
const dispose = bootstrap(root);
if (import.meta.hot) import.meta.hot.dispose(dispose);
