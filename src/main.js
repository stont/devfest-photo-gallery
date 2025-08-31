import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { ObserveVisibility } from 'vue-observe-visibility'; 

const app = createApp(App)

// Register the v-observe-visibility directive globally
app.directive('observe-visibility', ObserveVisibility);

app.use(router)
app.mount('#app')
