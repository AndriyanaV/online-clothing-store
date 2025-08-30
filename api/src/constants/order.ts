export enum PaymentStatus {
  PENDING = "Pending",
  PAID = "Paid",
  REFUNDED = "Refunded",
  CANCELED = "Canceled",
}

export enum DeliveryStatus {
  PENDING = "Pending",
  SHIPPED = "Shipped",
  DELIVERED = "Delivered",
  CANCELED = "Canceled",
}

export enum City {
  BEOGRAD = "Beograd",
  NOVI_SAD = "Novi Sad",
  NIS = "Niš",
  KRAGUJEVAC = "Kragujevac",
}

// Mapa grad → niz validnih poštanskih brojeva (primer)
export const postalCodesByCity: Record<City, string[]> = {
  [City.BEOGRAD]: ["11000", "11010", "11020", "11030", "11040"],
  [City.NOVI_SAD]: ["21000", "21001", "21002"],
  [City.NIS]: ["18000", "18001", "18002"],
  [City.KRAGUJEVAC]: ["34000", "34001", "34002"],
};

export enum PaymentMethod {
  PAY_ON_DELIVERY = "Pay on delivery",
  CARD = "Card",
}
