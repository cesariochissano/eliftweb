export type TripStatus = 'IDLE' | 'REQUESTING' | 'ACCEPTED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type TripDetails = {
    id: string;
    serviceId: string;
    origin: string;
    destination: string;
    price: number;
    distance: string; // km
    duration: string; // min
    passengerId?: string;
    driverId?: string;
    paymentMethod?: 'CASH' | 'WALLET';
    originLat?: number;
    originLng?: number;
    destLat?: number;
    destLng?: number;
    waitingTimeMin?: number;
    waitingTimeCost?: number;
    stops?: any[];
    securityPin?: string;
    isCriticalZone?: boolean;
    basePrice?: number;
    routeAdjustmentCost?: number;
    tipAmount?: number;
    guestName?: string;
    guestPhone?: string;
    notes?: string;
};

export type Message = {
    id: string;
    trip_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    status: 'sending' | 'sent' | 'delivered' | 'read';
    delivered_at?: string;
    read_at?: string;
};

export type PromoCode = {
    id: string;
    code: string;
    description: string;
    type: 'PERCENT' | 'FIXED_AMOUNT';
    value: number;
};

export type SavedPlace = {
    id: string;
    name: string; // 'Casa', 'Trabalho', etc.
    address: string;
    lat: number;
    lng: number;
    type: 'home' | 'work' | 'other';
};
