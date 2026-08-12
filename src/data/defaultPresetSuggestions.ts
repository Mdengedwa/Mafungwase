export interface PresetSuggestion {
  id: string;
  title: string;
  category: string;
  accompaniments: string[];
  isCustom?: boolean;
}

export const DEFAULT_PRESET_SUGGESTIONS: PresetSuggestion[] = [
  // Curries & Stews
  {
    id: 'preset-1',
    title: 'Traditional Durban Mutton Curry Platter',
    category: 'Curries & Stews',
    accompaniments: ['Steamed Basmati Rice', 'Mutton Curry', 'Tomato & Onion Sambal', 'Mint Yoghurt Raita', 'Butter Roti'],
  },
  {
    id: 'preset-2',
    title: 'Creamy Butter Chicken & Naan Meal',
    category: 'Curries & Stews',
    accompaniments: ['Fragrant Cumin Rice', 'Butter Chicken Fillets', 'Garlic Naan Bread', 'Cucumber Cucumber Sambal'],
  },
  {
    id: 'preset-3',
    title: 'Traditional Oxtail & Dombolo Feast',
    category: 'Curries & Stews',
    accompaniments: ['Steamed Bread (Dombolo)', 'Slow Braised Oxtail', 'Butter Glazed Carrots', 'Creamy Spinach'],
  },
  {
    id: 'preset-4',
    title: 'Beef Samp & Beans Comfort Bowl',
    category: 'Curries & Stews',
    accompaniments: ['Savory Samp & Sugar Beans', 'Tender Beef Stew', 'Steamed Cabbage', 'Chakalaka Dip'],
  },
  {
    id: 'preset-5',
    title: 'Cape Malay Bobotie & Yellow Rice',
    category: 'Curries & Stews',
    accompaniments: ['Cape Yellow Rice with Raisins', 'Baked Beef Bobotie', 'Fruit Chutney', 'Banana & Coconut Sambal'],
  },
  {
    id: 'preset-6',
    title: 'Vegetable & Chickpea Korma Platter',
    category: 'Curries & Stews',
    accompaniments: ['Basmati Rice', 'Chickpea & Mixed Veg Korma', 'Roti Bread', 'Mango Pickle'],
  },
  {
    id: 'preset-7',
    title: 'Thai Green Chicken Curry',
    category: 'Curries & Stews',
    accompaniments: ['Jasmine Rice', 'Thai Green Chicken Curry', 'Crispy Wonton Chips', 'Asian Slaw'],
  },
  {
    id: 'preset-8',
    title: 'Spicy Lamb Vindaloo & Roti',
    category: 'Curries & Stews',
    accompaniments: ['Turmeric Basmati Rice', 'Spicy Lamb Vindaloo', 'Flaky Roti', 'Onion & Tomato Salad'],
  },

  // Roasts & Grills
  {
    id: 'preset-9',
    title: 'Executive Gourmet Roast Beef Box',
    category: 'Roasts & Grills',
    accompaniments: ['Garlic & Herb Roast Potatoes', 'Slow Roast Beef Rump', 'Creamed Spinach', 'Rich Red Wine Gravy', 'Packaging Box'],
  },
  {
    id: 'preset-10',
    title: 'Slow-Roasted Pork Belly & Crackling',
    category: 'Roasts & Grills',
    accompaniments: ['Creamy Potato Mash', 'Crispy Pork Belly', 'Apple Cider Reduction', 'Roasted Root Vegetables'],
  },
  {
    id: 'preset-11',
    title: 'Garlic & Herb Roast Chicken Feast',
    category: 'Roasts & Grills',
    accompaniments: ['Savory Roast Potatoes', 'Roast Chicken Quarters', 'Pan Gravy', 'Steamed Green Beans & Bacon'],
  },
  {
    id: 'preset-12',
    title: 'Sticky BBQ Pork Rib Platter',
    category: 'Roasts & Grills',
    accompaniments: ['Potato Wedges', 'Sticky BBQ Pork Ribs', 'Creamy Coleslaw', 'Grilled Corn on Cob'],
  },
  {
    id: 'preset-13',
    title: 'Braised Lamb Shanks & Mash',
    category: 'Roasts & Grills',
    accompaniments: ['Parmesan Potato Mash', 'Slow Braised Lamb Shank', 'Rosemary Jus', 'Honey Glazed Baby Carrots'],
  },
  {
    id: 'preset-14',
    title: 'Rosemary & Garlic Roast Lamb Leg',
    category: 'Roasts & Grills',
    accompaniments: ['Minted Baby Potatoes', 'Sliced Roast Lamb Leg', 'Mint Jelly Sauce', 'Mediterranean Vegetables'],
  },
  {
    id: 'preset-15',
    title: 'Honey Glazed Gammon Platter',
    category: 'Roasts & Grills',
    accompaniments: ['Potato Salad with Chives', 'Honey Mustard Gammon Slices', 'Pineapple & Cherry Sambal', 'Dinner Rolls'],
  },

  // Braai & South African
  {
    id: 'preset-16',
    title: 'Ultimate Shisa Nyama & Pap Platter',
    category: 'Braai & South African',
    accompaniments: ['Stiff White Pap', 'Beef Chuck Steak', 'Traditional Boerewors', 'Spicy Chakalaka', 'Tomato & Onion Gravy'],
  },
  {
    id: 'preset-17',
    title: 'Traditional Braai & Salad Feast',
    category: 'Braai & South African',
    accompaniments: ['Fluffy Pap', 'Grilled Chicken Thighs', 'Braaiwors Slices', 'Mixed Garden Salad', 'Chakalaka Dip'],
  },
  {
    id: 'preset-18',
    title: 'Boerewors Roll & Chakalaka Combo',
    category: 'Braai & South African',
    accompaniments: ['Fresh Hot Dog Rolls', 'Grilled Boerewors', 'Caramelized Onions', 'Warm Chakalaka', 'Crispy Potato Chips'],
  },
  {
    id: 'preset-19',
    title: 'Flame-Grilled Peri-Peri Chicken',
    category: 'Braai & South African',
    accompaniments: ['Spicy Savory Rice', 'Peri-Peri Chicken Halves', 'Garlic Butter Bread', 'Three Bean Salad'],
  },
  {
    id: 'preset-20',
    title: 'Beef & Chicken Skewer Kebabs',
    category: 'Braai & South African',
    accompaniments: ['Yellow Herb Rice', 'Marinated Beef Kebabs', 'Chicken & Pepper Kebabs', 'Tzatziki Dip'],
  },

  // Platters & Finger Food
  {
    id: 'preset-21',
    title: 'Corporate Executive Sandwich & Wrap Platter',
    category: 'Platters & Finger Food',
    accompaniments: ['Assorted Gourmet Wraps', 'Club Sandwich Triangles', 'Crispy Tortilla Chips', 'Guacamole Dip'],
  },
  {
    id: 'preset-22',
    title: 'Savory Finger Food Party Board',
    category: 'Platters & Finger Food',
    accompaniments: ['Mini Cocktail Sausage Rolls', 'Chicken Wings', 'Beef Meatballs', 'Sweet Chilli Dip', 'Garlic Mayo'],
  },
  {
    id: 'preset-23',
    title: 'Artisan Cheese & Charcuterie Platter',
    category: 'Platters & Finger Food',
    accompaniments: ['Assorted Cheeses', 'Salami & Ham Cured Meats', 'Crackers & Breadsticks', 'Grapes & Fig Preserves', 'Nuts'],
  },
  {
    id: 'preset-24',
    title: 'Mini Slider & Burger Box',
    category: 'Platters & Finger Food',
    accompaniments: ['Mini Beef Cheese Sliders', 'Mini Pulled Pork Sliders', 'Seasoned Potato Wedges', 'BBQ Dipping Sauce'],
  },
  {
    id: 'preset-25',
    title: 'Cocktail Pie & Quiche Selection',
    category: 'Platters & Finger Food',
    accompaniments: ['Mini Pepper Steak Pies', 'Mini Spinach & Feta Quiches', 'Chicken Sausage Bites', 'Tomato Relish'],
  },

  // Street Food & Fast Casual
  {
    id: 'preset-26',
    title: 'Gourmet Beef Burger & Loaded Chips',
    category: 'Street Food & Fast Casual',
    accompaniments: ['Brioche Burger Buns', 'Pure Beef Burger Patties', 'Cheddar & Bacon Slice', 'Loaded Cheese Fries'],
  },
  {
    id: 'preset-27',
    title: 'Durban Mutton Bunny Chow',
    category: 'Street Food & Fast Casual',
    accompaniments: ['Quarter Unsliced Bread Loaf', 'Spicy Mutton Bunny Curry', 'Carrot & Chilli Salad', 'Sambal'],
  },
  {
    id: 'preset-28',
    title: 'Crispy Fried Chicken Bucket Meal',
    category: 'Street Food & Fast Casual',
    accompaniments: ['Crispy Fried Chicken Drumsticks', 'Spicy Potato Wedges', 'Tangy Coleslaw', 'Honey Mustard Sauce'],
  },
  {
    id: 'preset-29',
    title: 'Mexican Taco & Nacho Fiesta',
    category: 'Street Food & Fast Casual',
    accompaniments: ['Hard & Soft Taco Shells', 'Spicy Ground Beef', 'Tortilla Nacho Chips', 'Guacamole & Salsa', 'Sour Cream'],
  },
  {
    id: 'preset-30',
    title: 'Middle Eastern Shawarma Pocket',
    category: 'Street Food & Fast Casual',
    accompaniments: ['Pita Pockets', 'Grilled Shaved Chicken', 'Garlic Hummus', 'Tahini Dip', 'Pickled Cucumber & Turnips'],
  },
  {
    id: 'preset-31',
    title: 'Pulled Pork Sliders & Sweet Potato Chips',
    category: 'Street Food & Fast Casual',
    accompaniments: ['Soft Mini Brioche Buns', 'Slow Cooked Pulled Pork', 'Smoky BBQ Sauce', 'Crispy Sweet Potato Chips'],
  },

  // Seafood Specials
  {
    id: 'preset-32',
    title: 'Grilled Linefish & Lemon Butter Rice',
    category: 'Seafood Specials',
    accompaniments: ['Lemon Herb Savory Rice', 'Grilled Hake Fillets', 'Garlic Lemon Butter Sauce', 'Steamed Broccoli'],
  },
  {
    id: 'preset-33',
    title: 'Garlic Butter Prawn Platter',
    category: 'Seafood Specials',
    accompaniments: ['Basmati Rice', 'Pan Seared Garlic Butter Prawns', 'Peri-Peri Cream Dip', 'Crispy French Loaf'],
  },
  {
    id: 'preset-34',
    title: 'Seafood Paella & Green Salad',
    category: 'Seafood Specials',
    accompaniments: ['Saffron Seafood Paella (Prawns & Mussels)', 'Crispy Garlic Crostini', 'Fresh Citrus Green Salad'],
  },
  {
    id: 'preset-35',
    title: 'Deep Fried Calamari Rings & Chips',
    category: 'Seafood Specials',
    accompaniments: ['Crispy Golden Calamari Rings', 'French Fries', 'Tartare Sauce', 'Lemon Wedges'],
  },

  // Pasta & Italian
  {
    id: 'preset-36',
    title: 'Creamy Chicken & Mushroom Fettuccine',
    category: 'Pasta & Italian',
    accompaniments: ['Fettuccine Pasta', 'Creamy Chicken & Wild Mushroom Sauce', 'Grated Parmesan Cheese', 'Garlic Ciabatta Slice'],
  },
  {
    id: 'preset-37',
    title: 'Classic Beef Lasagne & Garlic Bread',
    category: 'Pasta & Italian',
    accompaniments: ['Baked Beef Lasagne', 'Cheesy Garlic Bread', 'Italian Side Salad'],
  },
  {
    id: 'preset-38',
    title: 'Penne Arrabbiata & Parmesan Salad',
    category: 'Pasta & Italian',
    accompaniments: ['Penne Pasta', 'Spicy Tomato Arrabbiata Sauce', 'Fresh Basil Leaves', 'Garlic Rolls'],
  },
  {
    id: 'preset-39',
    title: 'Baked Macaroni Cheese & Bacon Crumble',
    category: 'Pasta & Italian',
    accompaniments: ['Three-Cheese Baked Macaroni', 'Crispy Bacon Bits', 'Steamed Green Beans'],
  },

  // Breakfast & Brunch
  {
    id: 'preset-40',
    title: 'Full English Breakfast Box',
    category: 'Breakfast & Brunch',
    accompaniments: ['Scrambled Eggs', 'Grilled Back Bacon', 'Pork Sausages', 'Grilled Tomato & Mushrooms', 'Toast Slices'],
  },
  {
    id: 'preset-41',
    title: 'Executive Continental Brunch Platter',
    category: 'Breakfast & Brunch',
    accompaniments: ['Butter Croissants', 'Mini Danish Pastries', 'Sliced Cold Cuts & Cheese', 'Fresh Fruit Cups', 'Butter & Jam Portions'],
  },
  {
    id: 'preset-42',
    title: 'Breakfast Wrap & Fruit Skewer Box',
    category: 'Breakfast & Brunch',
    accompaniments: ['Scrambled Egg & Bacon Tortilla Wrap', 'Golden Hashbrowns', 'Fresh Fruit Skewers'],
  },
  {
    id: 'preset-43',
    title: 'Sunrise Omelette & Muffin Set',
    category: 'Breakfast & Brunch',
    accompaniments: ['Three-Egg Cheese Omelette', 'Pan-Seared Bacon', 'Blueberry Muffin'],
  },

  // Salads & Healthy Bowls
  {
    id: 'preset-44',
    title: 'Grilled Halloumi & Quinoa Power Bowl',
    category: 'Salads & Healthy Bowls',
    accompaniments: ['Herbed Quinoa Base', 'Seared Halloumi Cheese', 'Roasted Sweet Potato Cubes', 'Tahini Lemon Dressing'],
  },
  {
    id: 'preset-45',
    title: 'Chicken Caesar Salad Box',
    category: 'Salads & Healthy Bowls',
    accompaniments: ['Cos Lettuce & Grilled Chicken', 'Crispy Bacon Bits', 'Garlic Herb Croutons', 'Caesar Dressing', 'Parmesan Shavings'],
  },
  {
    id: 'preset-46',
    title: 'Mediterranean Couscous & Veggie Bowl',
    category: 'Salads & Healthy Bowls',
    accompaniments: ['Fluffy Couscous', 'Grilled Zucchini & Peppers', 'Feta Cheese & Olives', 'Tzatziki Dressing'],
  },

  // Desserts & Sweet Platters
  {
    id: 'preset-47',
    title: 'Traditional Malva Pudding & Custard Set',
    category: 'Desserts & Sweet Platters',
    accompaniments: ['Baked Malva Pudding', 'Warm Vanilla Custard', 'Whipped Cream Portion'],
  },
  {
    id: 'preset-48',
    title: 'Mini Dessert & Pastry Platter',
    category: 'Desserts & Sweet Platters',
    accompaniments: ['Mini Chocolate Brownie Bites', 'Mini Lemon Tartlets', 'Mini Milk Tarts', 'Berry Skewers'],
  },
  {
    id: 'preset-49',
    title: 'Cape Milk Tart & Koeksister Board',
    category: 'Desserts & Sweet Platters',
    accompaniments: ['Sliced Cape Milk Tart', 'Traditional Syrup Koeksisters', 'Cinnamon Powder'],
  },
  {
    id: 'preset-50',
    title: 'Chocolate Mousse & Fruit Tartlet Box',
    category: 'Desserts & Sweet Platters',
    accompaniments: ['Rich Dark Chocolate Mousse Cups', 'Mini Fruit Tartlets', 'Chocolate Shavings'],
  },
];
