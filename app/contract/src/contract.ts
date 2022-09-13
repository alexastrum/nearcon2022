import { NearBindgen, near, call, view } from "near-sdk-js";

@NearBindgen({})
class HelloNear {
  greeting: string = "Hello";

  @view({}) // This method is read-only and can be called for free
  get_greeting(): string {
    return this.greeting;
  }

  get_bookings({}) {
    return [
      {
        booking_id: "nft1id",
        timestamp: 12345,
        receipt_id: "nft2id", // or undefined
        rating: 5, // 1..5
      },
    ];
  }

  @call({}) // This method changes the state, for which it cost gas
  set_greeting({ message }: { message: string }): void {
    // Record a log permanently to the blockchain!
    near.log(`Saving greeting ${message}`);
    this.greeting = message;
  }
}
