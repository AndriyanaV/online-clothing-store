import { Material } from "../constants/product";
import { ProductFilter } from "../types/product";

export function buildProductFilter({
  material,
  discountPrice,
  minPrice,
  maxPrice,
}: {
  material?: Material;
  discountPrice?: string;
  minPrice?: string;
  maxPrice?: string;
}) {
  const productFilter: ProductFilter = { isActive: true };

  // Parsing query parameters
  const min = minPrice ? Number(minPrice) : undefined;
  const max = maxPrice ? Number(maxPrice) : undefined;

  const discount = discountPrice === "true";

  if (material) productFilter.material = material;

  if (discount) productFilter.discountPrice = { $gt: 0 };

  if (min && max) {
    productFilter.price = { $gt: min, $lt: max };
  } else if (min) {
    productFilter.price = { $gt: min };
  } else if (max) {
    productFilter.price = { $lt: max };
  }

  return productFilter;
}
