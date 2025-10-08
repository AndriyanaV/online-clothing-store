export enum Material {
  COTTON = "Cotton",
  POLYESTER = "Polyester",
  LINEN = "Linen",
  VISCOSE = "Viscose",
}

export enum CareInstructions {
  MACHINE_WASH = "Machine vash",
  HAND_WASH = "Hand wash",
  DRY_CLEAN_ONLY = "Dry clean only",
}

export enum CountryBrand {
  ITALY = "Italy",
  FRANCE = "France",
  GERMANY = "Germany",
  SERBIA = "Serbia",
  TURKEY = "Turkey",
}

export enum BaseColor {
  RED = "red",
  BLUE = "blue",
  GREEN = "green",
  YELLOW = "yellow",
  BLACK = "black",
  WHITE = "white",
  ORANGE = "orange",
  PURPLE = "purple",
  BROWN = "brown",
  GRAY = "gray",
}

export enum ExtendedColor {
  CYAN = "cyan",
  MAGENTA = "magenta",
  LIME = "lime",
  PINK = "pink",
  NAVY = "navy",
  OLIVE = "olive",
  TEAL = "teal",
  MAROON = "maroon",
  SILVER = "silver",
  GOLD = "gold",
}

export enum Size {
  XS = "XS",
  S = "S",
  M = "M",
  L = "L",
  XL = "XL",
  XXL = "XXL",
  XXXL = "XXXL",
}

//Organization of individual products based on tags in addition to categories
export enum ProductTag {
  AUTUMN_COLLECTION = "autumn_collection",
  WINTER_COLLECTION = "winter_collection",
  SUMMER_COLLECTION = "summer_collection",
  NEW_ARRIVAL = "new_arrival",
  BEST_SELLER = "best_seller",
  MODERN = "modern",
  LIMITED_EDITION = "limited_edition",
  SALE = "sale",
  EXCLUSIVE = "exclusive",
}

//use it to return the available tags when editing the product
export const productTagsArray = Object.values(ProductTag);

//use it to return the available colors when editing the product (want to add more colors) - first layer to avoid misakes
export const allColorsArray = [
  ...Object.values(BaseColor),
  ...Object.values(ExtendedColor),
];
