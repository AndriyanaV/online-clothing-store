export function sortFilter({
  discount,
  sortOption,
}: {
  discount: boolean;
  sortOption?: "asc" | "desc";
}) {
  // Sort
  let sortQuery: any = { createdAt: -1 };
  if (sortOption === "asc") {
    sortQuery = discount ? { discountPrice: 1 } : { price: 1 };
  } else if (sortOption === "desc") {
    sortQuery = discount ? { discountPrice: -1 } : { price: -1 };
  }

  return sortQuery;
}
