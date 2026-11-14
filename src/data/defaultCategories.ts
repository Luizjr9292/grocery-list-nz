import { GroceryCategory } from '../types/grocery';

export interface RawCategoryDefinition {
  id: string;
  name: string;
  items: string[];
}

export const DEFAULT_CATEGORY_DEFINITIONS: RawCategoryDefinition[] = [
  {
    id: 'cat-fruits-vegetables',
    name: 'Fruits and Vegetables',
    items: [
      'Banana',
      'Apple',
      'Orange',
      'Broccoli',
      'Pineapple',
      'Kiwi',
      'Cucumber',
      'Tomato',
      'Potatoes',
      'Carrots',
      'Onion',
      'Ginger',
      'Garlic',
      'Green Onion',
      'Corn',
      'Kumara',
      'Asparagus',
      'Grape',
      'Apricot',
      'Spinach',
      'Avocado',
      'Cabbage',
      'Green Beans',
      'Rock melon',
      'Mung beans',
      'Capsicum',
      'Baby Carrots',
    ],
  },
  {
    id: 'cat-bread-cereal-rice',
    name: 'Bread, Cereal and Rice',
    items: ['Bread', 'Rice', 'Egg', 'Pasta', 'Weetbix', 'Noodles', 'Oats', 'Soup'],
  },
  {
    id: 'cat-dairy',
    name: 'Dairy',
    items: ['Milk', 'Yoghurt', 'Butter', 'Almond Butter', 'Black Beans'],
  },
  {
    id: 'cat-drinks',
    name: 'Drinks',
    items: ['Coffee', 'Hot Chocolate', 'Prune juice', 'Up & go breakfast drink'],
  },
  {
    id: 'cat-household',
    name: 'Household',
    items: [
      'Dish Soap',
      'Toilet Paper',
      'Tissues',
      'Hand Soap',
      'Washing Liquid',
      'Drain Unblocker',
      'Shoe Powder',
      'Cling Wrap',
      'Paper Towel',
      'Toilet cleaner',
      'Toothpaste',
      'Baking Paper',
      'Bleach bathroom spray',
      'Fire Matches',
    ],
  },
  {
    id: 'cat-cooking-ingredients',
    name: 'Cooking Ingredients',
    items: [
      'Oil',
      'Soy Sauce',
      'Coconut Milk',
      'Pasta Sauce',
      'Sesame Oil',
      'White Vinegar',
      'Black Vinegar',
    ],
  },
  {
    id: 'cat-meat',
    name: 'Meat',
    items: [
      'Fish',
      'Chicken',
      'Beef',
      'Pork',
      'Prawn',
      'Sandwich Ham',
      'Canned Sardine',
      'Chicken nibble',
    ],
  },
  {
    id: 'cat-snacks',
    name: 'Snacks',
    items: ['Nuts Mix', 'Dried Strawberries', 'Snack Bag', 'Brazilian Nuts', 'Raisins'],
  },
  {
    id: 'cat-dannis-personal',
    name: "Danni's Personal",
    items: [
      'Period Pads/Tampons',
      'Baby Wipes',
      'Skin Care',
      'Mouthwash',
      'Eye Wash',
      'Make-Up Cleaner',
      'Savacol Mouth Wash',
      'Body wash',
      'Shampoo',
    ],
  },
  {
    id: 'cat-chinese-supermarket',
    name: 'Chinese Supermarket',
    items: [
      'Lotus',
      'Chinese Buns',
      'Chinese Black Vinegar',
      'Frozen Corn',
      'Chinese Snacks',
      'Tofu',
      'Fish Fillets',
      'Frozen Beef Slices',
      'Thai Rice',
      'Singapore Soy Sauce',
      'Chinese Bok Choy',
    ],
  },
  {
    id: 'cat-two-dollar-shopping',
    name: 'Two dollar shopping',
    items: ['Scissors'],
  },
  {
    id: 'cat-frozen',
    name: 'Frozen',
    items: [
      'Frozen Beans',
      'Frozen berries',
      'Frozen Chicken tender',
      'Frozen Pea',
      'Freeze bags',
    ],
  },
];

export function createDefaultCategories(): GroceryCategory[] {
  return DEFAULT_CATEGORY_DEFINITIONS.map((cat) => ({
    id: cat.id,
    name: cat.name,
    collapsed: false,
    items: cat.items.map((itemName, index) => ({
      id: `${cat.id}-item-${index}`,
      name: itemName,
      selected: false,
      quantity: 1,
      bought: false,
    })),
  }));
}
