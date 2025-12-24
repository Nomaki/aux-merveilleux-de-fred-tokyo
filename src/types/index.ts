export interface CartItem {
  id: string;
  cakeType: 'merveilleux' | 'incroyable' | 'plate';
  cakeSize?: '4-6' | '6-8';
  serviceType?: 'takeout' | 'takein';
  cakeText: string;
  price: number;
  quantity: number;
}

export interface CakeOrder {
  nameKanji: string;
  familyNameKanji: string;
  nameKatakana: string;
  familyNameKatakana: string;
  deliveryDateTime: Date;
  cartItems: CartItem[];
  phoneNumber: string;
  email: string;
  acceptTerms: boolean;
  // Optional take-in fields
  candleCount?: string;
  visitorCount?: string;
}

export interface ReservationConfirmation {
  reservationCode: string;
  order: CakeOrder;
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}

export type Language = 'ja' | 'en';

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
}

// Database types for Supabase
export interface DatabaseOrder {
  id?: string;
  reservation_code: string;
  payment_intent_id: string | null;
  customer_name_kanji: string;
  customer_name_katakana: string;
  email: string;
  phone_number: string;
  delivery_date_time: string; // ISO string
  cart_items: CartItem[];
  total_amount: number;
  payment_status: 'pending' | 'completed' | 'failed';
  created_at?: string;
  updated_at?: string;
}

// Order capacity check response
export interface CapacityResponse {
  available: boolean;
  count: number;
  limit: number;
  remaining: number;
  date: string;
}