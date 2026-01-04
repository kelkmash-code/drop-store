const setupDb = require('./db');

const fruits = [
    { "name": "Rocket", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/f/fb/Rocket.png/revision/latest/scale-to-width-down/150", "rarity": "Common", "price": 5000 },
    { "name": "Spin", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/4/45/Spin.png/revision/latest/scale-to-width-down/150", "rarity": "Common", "price": 7500 },
    { "name": "Blade", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/a/ad/Blade.png/revision/latest/scale-to-width-down/150", "rarity": "Common", "price": 30000 },
    { "name": "Spring", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/9/9c/Spring.png/revision/latest/scale-to-width-down/150", "rarity": "Common", "price": 60000 },
    { "name": "Bomb", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/3/3b/Bomb.png/revision/latest/scale-to-width-down/150", "rarity": "Common", "price": 80000 },
    { "name": "Smoke", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/c/c6/Smoke.png/revision/latest/scale-to-width-down/150", "rarity": "Common", "price": 100000 },
    { "name": "Spike", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/d/de/Spike.png/revision/latest/scale-to-width-down/150", "rarity": "Common", "price": 180000 },
    { "name": "Flame", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/9/9f/Flame.png/revision/latest/scale-to-width-down/150", "rarity": "Uncommon", "price": 250000 },
    { "name": "Falcon", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/0/06/Falcon.png/revision/latest/scale-to-width-down/150", "rarity": "Uncommon", "price": 300000 },
    { "name": "Ice", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/7/77/Ice.png/revision/latest/scale-to-width-down/150", "rarity": "Uncommon", "price": 350000 },
    { "name": "Sand", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/a/a7/Sand.png/revision/latest/scale-to-width-down/150", "rarity": "Uncommon", "price": 420000 },
    { "name": "Dark", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/0/0e/Dark.png/revision/latest/scale-to-width-down/150", "rarity": "Uncommon", "price": 500000 },
    { "name": "Diamond", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/e/ea/Diamond.png/revision/latest/scale-to-width-down/150", "rarity": "Uncommon", "price": 600000 },
    { "name": "Light", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/a/a6/Light.png/revision/latest/scale-to-width-down/150", "rarity": "Rare", "price": 650000 },
    { "name": "Rubber", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/8/8e/Rubber.png/revision/latest/scale-to-width-down/150", "rarity": "Rare", "price": 750000 },
    { "name": "Barrier", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/c/cc/Barrier.png/revision/latest/scale-to-width-down/150", "rarity": "Rare", "price": 800000 },
    { "name": "Ghost", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/a/ab/Ghost.png/revision/latest/scale-to-width-down/150", "rarity": "Rare", "price": 940000 },
    { "name": "Magma", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/f/f9/Magma.png/revision/latest/scale-to-width-down/150", "rarity": "Rare", "price": 850000 },
    { "name": "Quake", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/b/b4/Quake.png/revision/latest/scale-to-width-down/150", "rarity": "Legendary", "price": 1000000 },
    { "name": "Buddha", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/8/88/Buddha.png/revision/latest/scale-to-width-down/150", "rarity": "Legendary", "price": 1200000 },
    { "name": "Love", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/a/ac/Love.png/revision/latest/scale-to-width-down/150", "rarity": "Legendary", "price": 1300000 },
    { "name": "Spider", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/8/84/Spider.png/revision/latest/scale-to-width-down/150", "rarity": "Legendary", "price": 1500000 },
    { "name": "Sound", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/e/ee/Sound.png/revision/latest/scale-to-width-down/150", "rarity": "Legendary", "price": 1700000 },
    { "name": "Phoenix", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/c/c1/Phoenix.png/revision/latest/scale-to-width-down/150", "rarity": "Legendary", "price": 1800000 },
    { "name": "Portal", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/9/9d/Portal.png/revision/latest/scale-to-width-down/150", "rarity": "Legendary", "price": 1900000 },
    { "name": "Rumble", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/e/e6/Rumble.png/revision/latest/scale-to-width-down/150", "rarity": "Legendary", "price": 2100000 },
    { "name": "Pain", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/5/54/Pain.png/revision/latest/scale-to-width-down/150", "rarity": "Legendary", "price": 2300000 },
    { "name": "Blizzard", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/3/39/Blizzard.png/revision/latest/scale-to-width-down/150", "rarity": "Legendary", "price": 2400000 },
    { "name": "Gravity", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/1/1a/Gravity.png/revision/latest/scale-to-width-down/150", "rarity": "Mythical", "price": 2500000 },
    { "name": "Mammoth", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/a/a5/Mammoth.png/revision/latest/scale-to-width-down/150", "rarity": "Mythical", "price": 2700000 },
    { "name": "T-Rex", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/f/f8/T-Rex.png/revision/latest/scale-to-width-down/150", "rarity": "Mythical", "price": 2700000 },
    { "name": "Dough", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/0/08/Dough.png/revision/latest/scale-to-width-down/150", "rarity": "Mythical", "price": 2800000 },
    { "name": "Shadow", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/8/8e/Shadow.png/revision/latest/scale-to-width-down/150", "rarity": "Mythical", "price": 2900000 },
    { "name": "Venom", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/8/8a/Venom.png/revision/latest/scale-to-width-down/150", "rarity": "Mythical", "price": 3000000 },
    { "name": "Control", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/e/e5/Control.png/revision/latest/scale-to-width-down/150", "rarity": "Mythical", "price": 3200000 },
    { "name": "Spirit", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/9/97/Spirit.png/revision/latest/scale-to-width-down/150", "rarity": "Mythical", "price": 3400000 },
    { "name": "Dragon", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/c/c7/Dragon.png/revision/latest/scale-to-width-down/150", "rarity": "Mythical", "price": 3500000 },
    { "name": "Leopard", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/f/f5/Leopard.png/revision/latest/scale-to-width-down/150", "rarity": "Mythical", "price": 5000000 },
    { "name": "Kitsune", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/0/04/Kitsune.png/revision/latest/scale-to-width-down/150", "rarity": "Mythical", "price": 8000000 },
    { "name": "Gas", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/7/78/Gas.png/revision/latest/scale-to-width-down/150", "rarity": "Mythical", "price": 4000000 },
    { "name": "Yeti", "url": "https://static.wikia.nocookie.net/roblox-blox-piece/images/7/7d/Yeti.png/revision/latest/scale-to-width-down/150", "rarity": "Mythical", "price": 4500000 }
];

async function seed() {
    try {
        const db = await setupDb();
        console.log(`Seeding ${fruits.length} Blox Fruits...`);

        for (const fruit of fruits) {
            // Check if exists
            const existing = await db.get('SELECT * FROM blox_fruits WHERE name = ?', [fruit.name]);

            if (existing) {
                // Update image and rarity if needed, keep quantity
                await db.run(
                    'UPDATE blox_fruits SET image_url = ?, rarity = ?, price = ? WHERE name = ?',
                    [fruit.url, fruit.rarity, fruit.price, fruit.name]
                );
                console.log(`Updated ${fruit.name}`);
            } else {
                // Insert new
                await db.run(
                    'INSERT INTO blox_fruits (name, image_url, quantity, rarity, price) VALUES (?, ?, ?, ?, ?)',
                    [fruit.name, fruit.url, 0, fruit.rarity, fruit.price]
                );
                console.log(`Inserted ${fruit.name}`);
            }
        }

        console.log('Seeding complete!');
    } catch (err) {
        console.error('Seeding failed:', err);
    }
}

seed();
