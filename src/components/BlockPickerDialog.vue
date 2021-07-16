<template>
  <v-dialog :value="dialog" :max-width="maxWidth" @input="$emit('input', null)">
    <v-card>
      <v-container class="pa-8">
        <v-row justify="center">
          <h2 class="text-center">Caculate Block Number from Time</h2>
        </v-row>
      </v-container>
      <v-container class="pa-8">
        <v-row justify="center">
          <v-col cols="12" sm="6">
            <v-row justify="center">
              <v-date-picker v-model="date" :max="today"></v-date-picker>
            </v-row>
          </v-col>
          <v-col cols="12" sm="6">
            <v-row justify="center">
              <v-time-picker v-model="time" format="ampm"></v-time-picker>
            </v-row>
          </v-col>
        </v-row>
        <v-row justify="center" class="mt-4" v-if="result">
          <div class="text-center">
            <span class="info--text">Block number is</span><br />
            <h1>{{ result }}</h1>
            <a :href="`https://bscscan.com/block/${result}`" target="_blank"
              >View on Bscscan</a
            >
          </div>
        </v-row>
        <v-row class="mt-8" justify="center">
          <v-progress-circular
            class="my-4"
            v-if="isLoading"
            indeterminate
            color="primary"
          />
          <v-col v-else cols="12" sm="6" md="4">
            <v-btn
              :disabled="!date || !time"
              large
              block
              color="primary"
              @click="obtainClosestBlockNumber"
              >Calculate Block</v-btn
            >
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-dialog>
</template>
<script>
export default {
  props: {
    value: null,
    negativeMessage: null,
    positiveMessage: null,
    maxWidth: {
      default: 800,
    },
  },
  computed: {
    today: () => new Date().toISOString().substr(0, 10),
  },
  watch: {
    value(newVal) {
      this.dialog = newVal !== null;
    },
  },
  data() {
    return {
      dialog: false,
      date: null,
      time: null,
      isLoading: false,
      result: null,
    };
  },
  methods: {
    negativeClick() {
      this.dialog = null;
      this.$emit("negative");
    },
    positiveClick() {
      this.dialog = null;
      this.$emit("positive");
    },
    async obtainClosestBlockNumber() {
      this.isLoading = true;
      console.log(this.date);
      console.log(this.time);
      const timeStamp = new Date(`${this.date} ${this.time}`).getTime();

      try {
        const response = await fetch(
          `https://api.bscscan.com/api?module=block&action=getblocknobytime&timestamp=${
            timeStamp / 1000
          }&closest=before&apikey=${process.env.VUE_APP_BSC_SCAN_API_KEY}`
        ).then((response) => response.json());
        if (response.status === "1") {
          this.result = response.result;
        } else {
          this.$emit("error", response.result);
        }
      } catch (error) {
        this.$emit("error", error);
      }
      this.isLoading = false;
    },
  },
};
</script>
<style>
</style>