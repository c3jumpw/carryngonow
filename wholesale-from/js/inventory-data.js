/**
 * INVENTORY DATA
 * ------------------------------------------------------------------
 * This is the single source of truth for what shows up in Step 1.
 *
 * NEXT VERSION: this hard-coded array should be replaced with a live
 * fetch from either:
 *   1) A published Google Sheet / CSV export ("CNG Master Inventory"),
 *      polled on page load, e.g. via Papaparse against a published
 *      sheet URL, or
 *   2) A ClickUp List, via the ClickUp API
 *      (GET https://api.clickup.com/api/v2/list/{list_id}/task)
 *      mapped into the same shape below.
 *
 * Whichever source wins, keep the shape of each item identical to
 * what's below so nothing else in script.js has to change - only
 * this file (or the function that populates it) does.
 */

const INVENTORY = [
  {
    sku: "A-001",
    name: "Egusi (Melon Seeds)",
    description: "Ground melon seeds for thickening Nigerian soups",
    category: "Staples & Grains",
  },
  {
    sku: "A-002",
    name: "Palm Oil",
    description: "Traditional red palm oil for stews and sauces",
    category: "Oils & Seasoning",
  },
  {
    sku: "A-003",
    name: "Maggi Seasoning Cubes",
    description: "Savory flavor cubes common in West African meals",
    category: "Oils & Seasoning",
  },
  {
    sku: "A-004",
    name: "Ogbono (Wild Mango)",
    description: "Ground seeds used to make draw soup",
    category: "Staples & Grains",
  },
  {
    sku: "A-005",
    name: "Dried Crayfish",
    description: "Ground dried crayfish for flavor enhancement",
    category: "Staples & Grains",
  },
  {
    sku: "A-006",
    name: "Jollof Seasoning",
    description: "Seasoning blend used for jollof rice",
    category: "Oils & Seasoning",
  },
  {
    sku: "A-007",
    name: "Dettol (Small)",
    description: "Antiseptic and disinfectant product",
    category: "Household",
  },
  {
    sku: "A-008",
    name: "Moi Moi Bowls",
    description: "Bowls used for making moi moi",
    category: "Kitchen & Prep",
  },
  {
    sku: "A-009",
    name: "Indomie Noodles",
    description: "Instant noodles",
    category: "Pantry & Snacks",
  },
  {
    sku: "A-010",
    name: "Brown Beans",
    description: "Brown small beans",
    category: "Staples & Grains",
  },
  {
    sku: "A-011",
    name: "Garri Ijebu",
    description: "Flour made from cassava",
    category: "Staples & Grains",
  },
  {
    sku: "A-012",
    name: "Ground Egusi",
    description: "Dried and ground melon seeds",
    category: "Staples & Grains",
  },
  {
    sku: "A-013",
    name: "Black Soap",
    description: "Handmade using ashes from plantain",
    category: "Household",
  },
  {
    sku: "A-014",
    name: "Tiger Nuts",
    description: "Made from Cyperus esculentus plant",
    category: "Pantry & Snacks",
  },
  {
    sku: "A-015",
    name: "Ovaltine",
    description: "Malt-flavored beverage",
    category: "Beverages",
  },
  {
    sku: "A-016",
    name: "Milo",
    description: "Malt-flavored beverage",
    category: "Beverages",
  },
  {
    sku: "A-017",
    name: "Black Soap Box (20)",
    description: "Case of 20 - black soap bar bundle",
    category: "Household",
  },
];

/**
 * WHOLESALE QUANTITY RANGES
 * ------------------------------------------------------------------
 * Applied per selected item in Step 2. "minUnits" of 0 with
 * belowMinimum:true is the range that trips the error message.
 * Tune this per-category later if some items need a higher case
 * minimum than others (e.g. Black Soap Box already sells in a case
 * of 20, so its real-world minimum might differ from a loose item
 * like Egusi).
 */
const QUANTITY_RANGES = [
  { value: "", label: "Select a quantity range\u2026", belowMinimum: false },
  { value: "below-min", label: "1 \u2013 11 units", belowMinimum: true },
  { value: "12-24", label: "12 \u2013 24 units", belowMinimum: false },
  { value: "25-49", label: "25 \u2013 49 units", belowMinimum: false },
  { value: "50-99", label: "50 \u2013 99 units", belowMinimum: false },
  { value: "100-249", label: "100 \u2013 249 units", belowMinimum: false },
  { value: "250-plus", label: "250+ units", belowMinimum: false },
];

const WHOLESALE_MINIMUM_UNITS = 12;
