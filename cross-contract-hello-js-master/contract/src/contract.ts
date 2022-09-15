import {
  NearBindgen,
  initialize,
  call,
  near,
  bytes,
  NearPromise,
} from "near-sdk-js";
import { ONE_YOCTO } from "near-sdk-js/lib/types";

const FIVE_TGAS = BigInt("50000000000000");
const NO_DEPOSIT = BigInt(0);
const NO_ARGS = bytes(JSON.stringify({}));

@NearBindgen({})
class CrossContractCall {
  hello_account: string = "hello-nearverse.testnet";

  @initialize({})
  init({ hello_account }: { hello_account: string }) {
    this.hello_account = hello_account;
  }

  @call({ payableFunction: true })
  query_greeting() {
    const promise = NearPromise.new("skillsharedao.mintspace2.testnet")
      .functionCall(
        "nft_batch_mint",
        bytes(
          JSON.stringify({
            owner_id: "new_member6578.testnet",
            metadata: {
              reference: `https://arweave.net/hdhdbhdh`,
              extra: "ticket",
            },
            num_to_mint: 1,
            royalty_args: {
              split_between: {
                "skillsharedao.testnet": 10000,
              },
              percentage: 200,
            },
            split_owners: null,
          })
        ),
        ONE_YOCTO,
        FIVE_TGAS
      )
      .then(
        NearPromise.new(near.currentAccountId()).functionCall(
          "query_greeting_callback",
          NO_ARGS,
          NO_DEPOSIT,
          FIVE_TGAS
        )
      );

    return promise.asReturn();
  }

  @call({ privateFunction: true })
  query_greeting_callback() {
    // const greeting = near.promise(0) as String;
    // return greeting.substring(1, greeting.length - 1);
  }

  @call({})
  change_greeting({ new_greeting }: { new_greeting: string }) {
    const promise = NearPromise.new(this.hello_account)
      .functionCall(
        "set_greeting",
        bytes(JSON.stringify({ greeting: new_greeting })),
        NO_DEPOSIT,
        FIVE_TGAS
      )
      .then(
        NearPromise.new(near.currentAccountId()).functionCall(
          "change_greeting_callback",
          NO_ARGS,
          NO_DEPOSIT,
          FIVE_TGAS
        )
      );

    return promise.asReturn();
  }

  @call({ privateFunction: true })
  change_greeting_callback() {
    if (near.promiseResultsCount() == BigInt(1)) {
      near.log("Promise was successful!");
      return true;
    } else {
      near.log("Promise failed...");
      return false;
    }
  }
}
