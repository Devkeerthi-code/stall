/** The two DEMO shops: seeded into the database and also used by the static GitHub Pages demo. */
export type DemoProduct = {
  name: string; category: string; description: string; variants: [string, number][];
  stock?: number; featured?: boolean; out?: boolean;
};

export type DemoShop = {
  slug: string; owner: string; name: string; emphasis: string; tagline: string; accentHex: string;
  address: string; deliveryNote: string; delivery: boolean; products: DemoProduct[];
};

export const DEMO_SHOPS: DemoShop[] = [
  {
    slug: "demo-meeras-oven", owner: "demo-bakery@stall.invalid", name: "Meera's Oven", emphasis: "Oven",
    tagline: "Eggless cakes and cookies, baked to order at home. (DEMO shop)", accentHex: "#E07A4F",
    address: "Jayanagar, Bengaluru (demo address)", delivery: true,
    deliveryNote: "Pickup from home, or delivery within 5 km. Order cakes a day ahead. (Demo details)",
    products: [
      { name: "Eggless chocolate truffle cake", category: "Cakes", description: "Dark chocolate ganache on a soft sponge. Order a day ahead.", variants: [["1/2 kg", 650], ["1 kg", 1200]] },
      { name: "Dry fruit plum cake", category: "Cakes", description: "Soaked raisins, dates and cashews, baked slow.", variants: [["500 g", 520]], featured: true },
      { name: "Ragi jaggery cookies", category: "Cookies", description: "Crisp finger-millet cookies sweetened with jaggery. Box of 12.", variants: [["", 220]], stock: 18 },
      { name: "Badam milk cookies", category: "Cookies", description: "Almond and cardamom, like a glass of badam milk. Box of 12.", variants: [["", 260]], stock: 10 },
      { name: "Brownie box", category: "Gift boxes", description: "Fudgy brownies in a kraft box with a ribbon.", variants: [["6 pieces", 450], ["12 pieces", 850]], featured: true },
      { name: "Banana walnut loaf", category: "Breads", description: "Ripe bananas, toasted walnuts, a little cinnamon. 400 g.", variants: [["", 380]] },
      { name: "Coconut milk bread", category: "Breads", description: "Soft sandwich bread made with coconut milk. 400 g, sliced.", variants: [["", 110]], out: true },
    ],
  },
  {
    slug: "demo-kaveri-threads", owner: "demo-boutique@stall.invalid", name: "Kaveri Threads", emphasis: "Threads",
    tagline: "Hand-block cotton kurtis and blouses, stitched in Mysuru. (DEMO shop)", accentHex: "#2F855A",
    address: "Mysuru (demo address)", delivery: true,
    deliveryNote: "Courier anywhere in Karnataka, charge shared on WhatsApp. Pickup on Saturdays. (Demo details)",
    products: [
      { name: "Indigo block-print kurti", category: "Kurtis", description: "Soft mul cotton, three-quarter sleeves, side pockets.", variants: [["S", 890], ["M", 890], ["L", 940], ["XL", 990]], stock: 12, featured: true },
      { name: "Mustard straight kurti", category: "Kurtis", description: "Hand-block print with a mandarin collar.", variants: [["M", 790], ["L", 790]], stock: 6 },
      { name: "Kalamkari blouse, made to measure", category: "Blouses", description: "Send your measurements on WhatsApp after ordering. Ready in 5 days.", variants: [["Cotton", 1150], ["Silk-cotton", 1650]] },
      { name: "Cotton dupatta", category: "Dupattas", description: "2.25 m, tassels on both ends.", variants: [["Rust", 450], ["Teal", 450], ["Ivory", 450]], stock: 20 },
      { name: "Kids' frock, block print", category: "Kids", description: "Ages 2 to 6. Breathable cotton.", variants: [["2-3 y", 520], ["4-6 y", 580]], out: true },
    ],
  },
];
