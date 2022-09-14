import {
  NearBindgen,
  view,
  // initialize,
  call,
  near,
  bytes,
  NearPromise,
  assert,
} from "near-sdk-js";

const _100_mNEAR = BigInt("100000000000000000000000");
const _1_mNEAR = BigInt("1000000000000000000000");
const FIVE_TGAS = BigInt("50000000000000");
const _200_TGAS = BigInt("2000000000000000");
const NO_DEPOSIT = BigInt(0);
const NO_ARGS = bytes(JSON.stringify({}));

interface Skill {
  owner_addr: string;
  title: string;
  description?: string;
  image_url?: string;
  tags?: string[];
  rate?: number; // in NEAR
  booking_fee?: number; // in NEAR
  disabled?: boolean;
}

interface Booking {
  mentor_addr: string;
  mentee_addr: string;
  skill_id: string;
  token_id: string;
  timestamp: number;
  notes?: string;
  receipt?: Receipt;
}

interface Receipt {
  rating: number; // 1..5
  review?: string;
}

const MOCK_SKILL: Skill = {
  title: "Business coach",
  description: "The one & only!",
  rate: 10,
  tags: [],
  owner_addr: "new_member6578.testnet",
};

const MOCK_BOOKING: Booking = {
  mentor_addr: "new_member6578.testnet",
  mentee_addr: "a2.testnet",
  skill_id: "0",
  token_id: "1",
  timestamp: 12345,
  notes: "Notes",
  receipt: {
    rating: 5, // 1..5
    review: "You were great!",
  },
};

@NearBindgen({})
class HelloNear {
  nft_addr: string = "skillsharedao.mintspace2.testnet";

  @view({}) // This method is read-only and can be called for free
  get_greeting(): string {
    return this.nft_addr;
  }

  @call({}) // This method changes the state, for which it cost gas
  set_greeting({ message }: { message: string }): void {
    // Record a log permanently to the blockchain!
    near.log(`Saving greeting ${message}`);
    this.nft_addr = message;
  }
}

// @NearBindgen({})
// class HelloNear {
//   nft_addr: string = "skillsharedao.mintspace2.testnet";
//   // bookings: Booking[] = [MOCK_BOOKING];
//   // skills: Skill[] = [MOCK_SKILL];

//   // @initialize({})
//   // init({
//   //   nft_addr = "skillsharedao.mintspace2.testnet2",
//   // }: {
//   //   nft_addr: string;
//   // }) {
//   //   this.nft_addr = nft_addr;
//   //   this.bookings = [MOCK_BOOKING];
//   //   this.skills = [MOCK_SKILL];
//   // }

//   @view({}) // This method is read-only and can be called for free
//   get_my_skills(): string {
//     return this.nft_addr;
//   }

//   // @call({}) // This method changes the state, for which it cost gas
//   // set_greeting({ message }: { message: string }): void {
//   //   // Record a log permanently to the blockchain!
//   //   near.log(`Saving greeting ${message}`);
//   //   this.greeting = message;
//   // }

//   // mint({ metadata_id }: { metadata_id: string }) {
//   //   this.bookings.length;
//   //   const promise = NearPromise.new(this.nft_addr).functionCall(
//   //     "nft_batch_mint",
//   //     bytes(
//   //       JSON.stringify({
//   //         owner_id: "new_member6578.testnet",
//   //         metadata: {
//   //           reference: `https://arweave.net/${metadata_id}`,
//   //           extra: "ticket",
//   //         },
//   //         num_to_mint: 1,
//   //         royalty_args: {
//   //           split_between: {
//   //             "skillsharedao.testnet": 10000,
//   //           },
//   //           percentage: 200,
//   //         },
//   //         split_owners: null,
//   //       })
//   //     ),
//   //     _100_mNEAR,
//   //     _200_TGAS
//   //   );
//   //   // .functionCall(
//   //   //   "nft_approve",
//   //   //   bytes(
//   //   //     JSON.stringify({
//   //   //       token_id,
//   //   //       account_id: "market.mintbase1.near",
//   //   //       msg: JSON.stringify({
//   //   //         price: "5000000000000000000000000",
//   //   //         autotransfer: true,
//   //   //       }),
//   //   //     })
//   //   //   ),
//   //   //   _1_mNEAR,
//   //   //   _200_TGAS
//   //   // );
//   //   // .then(
//   //   //   NearPromise.new(near.currentAccountId()).functionCall(
//   //   //     "mint_callback",
//   //   //     NO_ARGS,
//   //   //     NO_DEPOSIT,
//   //   //     FIVE_TGAS
//   //   //   )
//   //   // );

//   //   return promise.asReturn();
//   // }

//   // @view({}) // This method is read-only and can be called for free
//   // get_my_skills(): Skill[] {
//   //   return this.skills.filter(
//   //     (b) => b.owner_addr === near.signerAccountId() && !b.disabled
//   //   );
//   // }

//   // @call({}) // This method changes the state, for which it cost gas
//   // add_skill(skill: Skill) {
//   //   this.skills.push({ ...skill, owner_addr: near.predecessorAccountId() });
//   // }

//   // @call({}) // This method changes the state, for which it cost gas
//   // disable_skill({ skill_id }: { skill_id: string }) {
//   //   const skill = this.skills[skill_id];
//   //   assert(
//   //     skill.owner_addr === near.predecessorAccountId() && !skill.disabled,
//   //     "Invalid skill_id"
//   //   );
//   //   skill.disabled = true;
//   //   return skill;
//   // }

//   // @view({}) // This method is read-only and can be called for free
//   // get_mentor_bookings(): Booking[] {
//   //   return this.bookings.filter(
//   //     (b) => b.mentor_addr === near.signerAccountId()
//   //   );
//   // }

//   // @view({}) // This method is read-only and can be called for free
//   // get_mentee_bookings(): Booking[] {
//   //   return this.bookings.filter(
//   //     (b) => b.mentee_addr === near.signerAccountId()
//   //   );
//   // }

//   // @call({}) // This method changes the state, for which it cost gas
//   // book_mentoring_session({
//   //   token_id,
//   //   notes = "",
//   //   timestamp = 0,
//   // }: {
//   //   token_id: string;
//   //   notes?: string;
//   //   timestamp?: number;
//   // }): Booking {
//   //   const booking = this.bookings.find((b) => b.token_id === token_id);
//   //   assert(
//   //     !booking.mentee_addr ||
//   //       booking.mentee_addr === near.predecessorAccountId(),
//   //     "Invalid booking"
//   //   );
//   //   // TODO: Check token_id burnt
//   //   booking.timestamp = timestamp;
//   //   booking.notes = notes;
//   //   return booking;
//   // }

//   // // Must send the remainder (rate - booking_fee)
//   // @call({}) // This method changes the state, for which it cost gas
//   // start_mentoring_session({ token_id }: { token_id: string }): Booking {
//   //   const booking = this.bookings.find((b) => b.token_id === token_id);
//   //   assert(
//   //     booking.mentee_addr === near.predecessorAccountId(),
//   //     "Invalid booking"
//   //   );
//   //   return booking;
//   // }

//   // @call({}) // This method changes the state, for which it cost gas
//   // end_mentoring_session({
//   //   token_id,
//   //   rating,
//   //   review = "",
//   // }: {
//   //   token_id: string;
//   //   rating: number;
//   //   review?: string;
//   // }): Booking {
//   //   const booking = this.bookings.find((b) => b.token_id === token_id);
//   //   assert(
//   //     booking.mentee_addr === near.predecessorAccountId(),
//   //     "Invalid booking"
//   //   );
//   //   booking.receipt = { rating, review };
//   //   // near.log(`Saving greeting ${message}`);
//   //   return booking;
//   // }
// }
