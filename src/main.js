import { createApp } from 'vue'
import './style.css'
import VueTippy from 'vue-tippy'

import 'tippy.js/dist/tippy.css'
import 'tippy.js/themes/light-border.css'

import App from './App.vue'

createApp(App).use(VueTippy, {
    directive: 'tippy',
    defaultProps: {
        theme: 'light-border',
        arrow: false,
        offest: [0, 10],
        placement: 'bottom'
    }
}).mount('#app')