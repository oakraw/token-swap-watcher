<template>
  <v-app>
    <v-main>
      <v-container class="fill-height">
        <v-container class="pa-8">
          <v-row justify="center">
            <h1 class="primary--text text-center">🧐 Token Swap Watcher (BSC)</h1>
          </v-row>
          <v-row class="mt-8">
            <v-col cols="12">
              <v-text-field
                v-model="tokenAddress"
                label="🪙 Token Address"
                outlined
                hide-details
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="lpAddress"
                label="🤘 LP Address"
                outlined
                hide-details
              />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="blockStart"
                label="⏳ Block Number Start"
                type="number"
                outlined
                hide-details
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="blockEnd"
                label="⌛️ Block Number End"
                type="number"
                outlined
                hide-details
              />
            </v-col>
          </v-row>

          <v-row justify="center" class="mt-4">
            <v-btn text color="accent" @click="openNewTab('https://bscscan.com/blocks')"
              >Looking for block number?</v-btn
            >
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
                :disabled="!tokenAddress || !blockStart || !blockEnd"
                large
                block
                color="primary"
                @click="watch"
                >Watch</v-btn
              >
            </v-col>
          </v-row>
          <v-row class="my-4" justify="center">
            <span class="info--text">created by oakraw</span>
          </v-row>
          <v-row
            class="mt-12"
            justify="space-between"
            align="center"
            v-if="result"
          >
            <h2>{{ tokenSymbol }}'s swap history</h2>
            <vue-json-to-csv
              :json-data="result"
              :csv-title="`${tokenSymbol}-swap-history`"
            >
              <v-btn color="secondary">
                Export <i class="mdi mdi-export-variant" aria-hidden="true"></i>
              </v-btn>
            </vue-json-to-csv>
          </v-row>
          <v-row class="mt-4" v-if="result">
            <v-data-table
              style="width: 100%"
              :headers="headers"
              :items="result"
              :items-per-page="10"
              class="elevation-1 mt-2"
            ></v-data-table>
          </v-row>
        </v-container>
      </v-container>
    </v-main>
    <div class="error-wrapper" v-if="error">
      <v-alert type="error"> {{ error }} </v-alert>
    </div>
  </v-app>
</template>

<script>
import BigNumber from "bignumber.js";
import VueJsonToCsv from "vue-json-to-csv";

export default {
  name: "App",

  components: {
    VueJsonToCsv,
  },

  data: () => ({
    tokenAddress: null,
    lpAddress: null,
    blockStart: null,
    blockEnd: null,
    // tokenAddress: "0x30dfdefe4b5c2ef1bcb82fd1d6e62f9a8580a05a",
    // lpAddress: "0xbdedc3bfa7eb830d001a89093b470cdd35faa238",
    // blockStart: 8544055,
    // blockEnd: 10444055,
    isLoading: false,
    error: null,
    headers: [
      { text: "Address", value: "address" },
      { text: "Status", value: "status" },
      { text: "Amount", value: "amount" },
      { text: "Date", value: "date" },
    ],
    result: null,
    tokenSymbol: null,
  }),

  methods: {
    openNewTab(url) {
      window.open(url, "_blank");
    },
    async watch() {
      this.isLoading = true;
      try {
        const response = await fetch(
          `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${this.tokenAddress}&startblock=${this.blockStart}&endblock=${this.blockEnd}&sort=asc&apikey=${process.env.VUE_APP_BSC_SCAN_API_KEY}`
        ).then((response) => response.json());
        if (response.status === "1") {
          this.renderResult(response.result);
        } else {
          this.showError(`${response.message} ${response.result}`);
        }
      } catch (error) {
        this.showError(error);
      }
      this.isLoading = false;
    },
    renderResult(raw) {
      this.tokenSymbol = raw.length > 0 ? raw[0].tokenSymbol : null;
      const onlyLPTrading = raw.filter(
        (tx) => tx.from === this.lpAddress || tx.to === this.lpAddress
      );
      this.result = onlyLPTrading.map((tx) => {
        let address = tx.from === this.lpAddress ? tx.to : tx.from;
        if (address === this.tokenAddress) {
          address = tx.tokenName;
        }
        return {
          address,
          status: tx.from === this.lpAddress ? "Buy" : "Sell",
          amount: `${new BigNumber(tx.value)
            .div(10 ** tx.tokenDecimal)
            .toString()} ${tx.tokenSymbol}`,
          date: new Date(parseInt(tx.timeStamp) * 1000).toLocaleString("us"),
        };
      });
      this.scrollToResult();
    },
    scrollToResult() {
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "smooth",
        });
      }, 500);
    },
    showError(message) {
      this.error = message;
      setTimeout(() => {
        this.error = null;
      }, 3000);
    },
  },
};
</script>
<style scoped>
.error-wrapper {
  position: fixed;
  margin: 1rem;
  right: 0;
}
</style>