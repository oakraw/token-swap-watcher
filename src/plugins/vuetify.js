import Vue from "vue";
import Vuetify from "vuetify/lib/framework";

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    themes: {
      light: {
        primary: "#3A6D8C",
        secondary: "#D9A036",
        accent: "#D94E41",
        error: "#D94E41",
        info: "#D9CCC1",
        success: "#91BE6E",
      },
    },
  },
});
