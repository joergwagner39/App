// Maps common sports outfitter brand names to their Simple Icons slug
// (https://simpleicons.org, served via cdn.simpleicons.org). Icons are
// rendered in the brand's official color automatically.
const BRAND_SLUGS: Record<string, string> = {
  nike: 'nike',
  adidas: 'adidas',
  puma: 'puma',
  'under armour': 'underarmour',
  underarmour: 'underarmour',
  'new balance': 'newbalance',
  newbalance: 'newbalance',
  reebok: 'reebok',
  asics: 'asics',
  kappa: 'kappa',
  umbro: 'umbro',
  lotto: 'lotto',
  joma: 'joma',
  hummel: 'hummel',
  mizuno: 'mizuno',
}

function normalize(brand: string): string {
  return brand
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, '') // strip "(Beispiel)" etc.
    .trim()
}

export function getBrandLogoUrl(brand: string): string | null {
  const slug = BRAND_SLUGS[normalize(brand)]
  return slug ? `https://cdn.simpleicons.org/${slug}` : null
}
