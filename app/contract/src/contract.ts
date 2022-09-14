import {
  NearBindgen,
  view,
  initialize,
  call,
  near,
  bytes,
  NearPromise,
} from "near-sdk-js";

const _100_mNEAR = BigInt("100000000000000000000000");
const _1_mNEAR = BigInt("1000000000000000000000");
const FIVE_TGAS = BigInt("50000000000000");
const _200_TGAS = BigInt("2000000000000000");
const NO_DEPOSIT = BigInt(0);
const NO_ARGS = bytes(JSON.stringify({}));

export interface Skill {
  title: string;
  description: string;
  image?: string;
  tags: string[];
  rate: number; // in NEAR
}

export interface Booking {
  // mentor_account: string;
  // mentee_account: string;
  // skill: Skill;
  metadataId: string;
  boooking_fee: number; // in NEAR
  timestamp: number;
  receipt?: Receipt;
}

export interface Receipt {
  rating: number; // 1..5
  review: string;
}

const MOCK_SKILL: Skill = {
  title: "Business coach",
  description: "The one & only!",
  rate: 10,
  tags: [],
};

const MOCK_BOOKING: Booking = {
  mentor_account: "a1",
  mentee_account: "a2",
  // skill: {},
  booking_nft_id: "nft1id",
  boooking_fee: 1,
  timestamp: 12345,
  receipt: {
    rating: 5, // 1..5
    review: "You were great!",
  },
};

@NearBindgen({})
class HelloNear {
  nft_addr: string = "skillsharedao.mintspace2.testnet";

  bookings: Booking[];

  // get_greeting(): string {
  //   return this.greeting;
  // }

  mint({ metadataId }) {
    this.bookings.length;
    const promise = NearPromise.new(this.nft_addr)
      .functionCall(
        "nft_batch_mint",
        bytes(
          JSON.stringify({
            owner_id: "new_member6578.testnet",
            metadata: {
              reference: `https://arweave.net/${metadataId}`,
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
        _100_mNEAR,
        _200_TGAS
      )
      .functionCall(
        "nft_approve",
        bytes(
          JSON.stringify({
            token_id: "3",
            account_id: "market.mintbase1.near",
            msg: JSON.stringify({
              price: "5000000000000000000000000",
              autotransfer: true,
            }),
          })
        ),
        _1_mNEAR,
        _200_TGAS
      );
    // .then(
    //   NearPromise.new(near.currentAccountId()).functionCall(
    //     "mint_callback",
    //     NO_ARGS,
    //     NO_DEPOSIT,
    //     FIVE_TGAS
    //   )
    // );

    return promise.asReturn();
  }

  @view({}) // This method is read-only and can be called for free
  get_my_skills({}): Skill[] {
    return [MOCK_SKILL];
  }

  @call({}) // This method changes the state, for which it cost gas
  add_skill(
    { metadataId, notes, timestamp } = {
      metadataId: String,
      notes: String,
      timestamp: Number,
    }
  ): Booking {
    return MOCK_BOOKING;
  }
  @view({}) // This method is read-only and can be called for free
  get_mentor_bookings({}): Booking[] {
    return [MOCK_BOOKING];
  }

  @view({}) // This method is read-only and can be called for free
  get_mentee_bookings({}): Booking[] {
    return [MOCK_BOOKING];
  }

  @call({}) // This method changes the state, for which it cost gas
  book_mentoring_session(
    { metadataId, notes, timestamp } = {
      metadataId: String,
      notes: String,
      timestamp: Number,
    }
  ): Booking {
    return MOCK_BOOKING;
  }

  // Must send the remainder (rate - booking_fee)
  @call({}) // This method changes the state, for which it cost gas
  start_mentoring_session(
    { metadataId } = {
      metadataId: String,
    }
  ): Booking {
    return MOCK_BOOKING;
  }

  @call({}) // This method changes the state, for which it cost gas
  end_mentoring_session(
    { metadataId, rating, review } = {
      metadataId: String,
      rating: Number,
      review: String,
    }
  ): Booking {
    // near.log(`Saving greeting ${message}`);
    return MOCK_BOOKING;
  }
}
