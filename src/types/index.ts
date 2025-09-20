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
  cakeText: string;
  phoneNumber: string;
  email: string;
  acceptTerms: boolean;
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