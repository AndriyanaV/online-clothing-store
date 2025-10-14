import { BaseColor, ExtendedColor, Size } from "../constants/product";
import { ProductVariant, VariationFilter } from "../types/product";

export function buildVariationFilter({
  color,
  size,
}: {
  color?: BaseColor | ExtendedColor;
  size?: Size;
}) {
  const variationFilter: VariationFilter = {
    images: { $exists: true, $ne: [] },
    isActive: true,
  };

  if (color) variationFilter.color = color;
  if (size) variationFilter.size = size;

  return variationFilter;
}
