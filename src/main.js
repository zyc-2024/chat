import { createApp } from "vue";
import App from "./App.vue";
import router from "./router/index.js";
import "katex/dist/katex.min.css";
import "highlight.js/styles/a11y-light.css";
import "./styles/base.css";

createApp(App).use(router).mount("#app");
