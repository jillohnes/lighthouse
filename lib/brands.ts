export const ALL_BRANDS_LABEL = "All Brands";

export const PRODUCT_BRANDS = [
  "Baileys",
  "Buchanan's",
  "Bulleit",
  "Captain Morgan",
  "Casamigos",
  "Crown Royal",
  "Deleon",
  "DonJulio",
  "Guinness",
  "Johnnie Walker",
  "Ketel One",
  "Mr Black",
  "Smirnoff",
  "Tanqueray",
] as const;

export const BRAND_OPTIONS = [ALL_BRANDS_LABEL, ...PRODUCT_BRANDS] as const;

export type ProductBrand = (typeof PRODUCT_BRANDS)[number];
export type BrandFilter = (typeof BRAND_OPTIONS)[number];
