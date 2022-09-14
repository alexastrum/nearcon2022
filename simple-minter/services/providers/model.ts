export interface Skill {
  title: string; // 1.5
  description: string;
  image?: string;
}

export interface Booking {
  booking_id: string;
  timestamp: number;
  receipt?: Receipt;
}

export interface Receipt {
  rating: number; // 1..5
  review: string;
}
