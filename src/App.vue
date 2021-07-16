<template>
  <v-app>
    <v-main>
      <v-container class="fill-height">
        <v-container class="py-8">
          <v-row justify="center">
            <h1 class="primary--text text-center">
              🧐 Token Swap Watcher (BSC)
            </h1>
          </v-row>
          <v-row
            v-if="history.length > 0"
            class="mt-8 mx-4"
            justify="center"
            align="center"
          >
            <span class="primary--text mr-2">Suggested:</span>
            <v-chip
              v-for="(item, index) in history"
              :key="index"
              class="ml-2 my-2 clickable"
              @click="selectFromHistory(item)"
            >
              {{ item.symbol }}
            </v-chip>
          </v-row>
          <v-row class="mt-4">
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
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="blockStart"
                label="⏳ Block Number Start"
                type="number"
                outlined
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="6">
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
            <v-btn
              text
              color="accent"
              @click="isShowBloackDialog = true"
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
          <div v-if="filteredResult">
            <v-row class="mt-12" justify="space-between" align="center">
              <h2>{{ tokenSymbol }}'s swap history</h2>
              <vue-json-to-csv
                :json-data="filteredResult"
                :csv-title="`${tokenSymbol}-swap-history`"
              >
                <v-btn color="secondary">
                  Export
                  <i class="mdi mdi-export-variant" aria-hidden="true"></i>
                </v-btn>
              </vue-json-to-csv>
            </v-row>
            <v-row align="center">
              <span class="primary--text mr-2">Filter:</span>
              <v-chip class="ml-2 my-2 clickable" @click="setFilter(null)">
                All
              </v-chip>
              <v-chip class="ml-2 my-2 clickable" @click="setFilter('buy')">
                Buy
              </v-chip>
              <v-chip class="ml-2 my-2 clickable" @click="setFilter('sell')">
                Sell
              </v-chip>
            </v-row>
            <v-combobox
              v-model="excludedAddress"
              :items="[tokenAddress]"
              chips
              class="mt-4"
              clearable
              label="Exclude Address"
              multiple
              prepend-icon="mdi-filter-variant"
              outlined
            >
              <template v-slot:selection="{ attrs, item, selected }">
                <v-chip
                  v-bind="attrs"
                  :input-value="selected"
                  close
                  @click:close="removeExcludedAddress(item)"
                >
                  <span>{{ item }}</span>
                </v-chip>
              </template>
            </v-combobox>
            <v-row>
              <v-data-table
                style="width: 100%"
                :headers="headers"
                :items="filteredResult"
                :items-per-page="10"
                class="elevation-1 mt-2"
              ></v-data-table>
            </v-row>
          </div>
        </v-container>
      </v-container>
    </v-main>
    <div class="error-wrapper" v-if="error">
      <v-alert type="error"> {{ error }} </v-alert>
    </div>
    <block-picker-dialog v-model="isShowBloackDialog" @error="showError"/>
  </v-app>
</template>

<script>
import BigNumber from "bignumber.js";
import VueJsonToCsv from "vue-json-to-csv";
import BlockPickerDialog from '@/components/BlockPickerDialog.vue';
export default {
  name: "App",

  components: {
    VueJsonToCsv,
    BlockPickerDialog,
  },

  computed: {
    filteredResult() {
      let result = this.result;
      if (this.filter) {
        result = (this.result || []).filter(
          (item) =>
            (item.status || "").toLowerCase() === this.filter.toLowerCase()
        );
      }
      if (this.excludedAddress && this.excludedAddress.length > 0) {
        result = result.filter((item) => {
          const matchedExcludeItem = this.excludedAddress.filter((exclude) =>
            (item.address || "").includes(exclude)
          );
          return matchedExcludeItem.length === 0;
        });
      }

      return result;
    },
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
    history: [],
    filter: null,
    excludedAddress: [],
    isShowBloackDialog: false,
  }),

  created() {
    this.fetchHistory();
  },

  methods: {
    openNewTab(url) {
      window.open(url, "_blank");
    },
    selectFromHistory(item) {
      this.tokenAddress = item.tokenAddress;
      this.lpAddress = item.lpAddress;
    },
    removeExcludedAddress(item) {
      const index = this.excludedAddress.indexOf(item);
      this.excludedAddress.splice(index, 1);
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
      let sortedResult = raw.sort((a, b) => b.timeStamp - a.timeStamp);

      this.tokenSymbol =
        sortedResult.length > 0 ? sortedResult[0].tokenSymbol : null;
      const onlyLPTrading = sortedResult.filter(
        (tx) => tx.from === this.lpAddress || tx.to === this.lpAddress
      );

      this.result = onlyLPTrading.map((tx) => {
        let address = tx.from === this.lpAddress ? tx.to : tx.from;
        if (address === this.tokenAddress) {
          address = `(🪙${tx.tokenName}) ${address}`;
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

      this.saveHistory(this.tokenSymbol, this.tokenAddress, this.lpAddress);
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
    setFilter(filter) {
      this.filter = filter;
    },
    fetchHistory() {
      const json = window.localStorage.getItem("history");
      this.history = JSON.parse(json) || [];
    },
    saveHistory(symbol, tokenAddress, lpAddress) {
      const duplicateInHistory = this.history.find(
        (item) =>
          item.symbol === symbol &&
          item.tokenAddress === tokenAddress &&
          item.lpAddress === lpAddress
      );

      if (!duplicateInHistory) {
        let save = [
          ...(this.history || []),
          {
            symbol,
            tokenAddress,
            lpAddress,
            timeStamp: new Date().getTime(),
          },
        ];
        save = save.sort((a, b) => b.timeStamp - a.timeStamp).slice(0, 8);
        window.localStorage.setItem("history", JSON.stringify(save));
      }
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
.clickable {
  cursor: pointer;
}
</style>