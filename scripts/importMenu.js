require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const fs = require('fs').promises;
const path = require('path');

const menuItems = [
    {
        displayTitle: "招牌拿鐵",
        smallDescription: "本店採用公平咖啡豆，咖啡師精選各地特色咖啡豆手工研磨，自家烘焙，口感細緻，香氣四溢。",
        foodImage: "/images/menu1.jpg",
        ingredients: ["精選咖啡豆", "鮮奶"],
        startDate: new Date(),
        endDate: new Date(2026, 11, 31),
        nowProvid: true
    },
    {
        displayTitle: "特色拉花咖啡",
        smallDescription: "本店咖啡師除為顧客精選調配特色咖啡外，還可為顧客特製拉花，配合顧客心情。",
        foodImage: "/images/menu2.jpg",
        ingredients: ["精選咖啡豆", "鮮奶"],
        startDate: new Date(),
        endDate: new Date(2026, 11, 31),
        nowProvid: true
    },
    {
        displayTitle: "巧手威靈頓鮭魚",
        smallDescription: "皮脆香口，水潤肉嫩，菇香，菜甜，椒爽。口感無與倫比。",
        foodImage: "/images/巧手威靈頓鮭魚.jpg",
        ingredients: ["鮭魚", "蘑菇", "酥皮"],
        startDate: new Date(),
        endDate: new Date(2026, 11, 31),
        nowProvid: true
    },
    {
        displayTitle: "火燄櫻桃",
        smallDescription: "甜酸爽脆，純纯酒香，加上火燄的美，暖心窩，令人陶醉。",
        foodImage: "/images/火燄櫻桃.jpg",
        ingredients: ["櫻桃", "烈酒"],
        startDate: new Date(),
        endDate: new Date(2026, 11, 31),
        nowProvid: true
    },
    {
        displayTitle: "紅棗合桃撻",
        smallDescription: "養生紅棗，跟上補腦合桃，絕配。口感軟糯脆脆。",
        foodImage: "/images/紅棗合桃撻.jpg",
        ingredients: ["紅棗", "合桃", "撻皮"],
        startDate: new Date(),
        endDate: new Date(2026, 11, 31),
        nowProvid: true
    },
    {
        displayTitle: "反斗蘋果蛋糕",
        smallDescription: "爽爽蘋果，淡淡焦香，濃濃蛋香，在口中翻來覆去，合成美妙的變奏曲。",
        foodImage: "/images/反斗蘋果蛋糕.jpg",
        ingredients: ["蘋果", "雞蛋", "麵粉"],
        startDate: new Date(),
        endDate: new Date(2026, 11, 31),
        nowProvid: true
    },
    {
        displayTitle: "七彩迷你茄茄芝士波凍凍",
        smallDescription: "白白芝士波，酸酸七彩迷你茄茄，凉凉茄啫喱夏日，素食恩物。",
        foodImage: "/images/七彩迷你茄茄芝士波凍凍.jpg",
        ingredients: ["迷你茄茄", "芝士", "啫喱"],
        startDate: new Date(),
        endDate: new Date(2026, 11, 31),
        nowProvid: true
    },
    {
        displayTitle: "焗十色蔬菜片",
        smallDescription: "常言道：不時不吃，焗十色蔬菜片，集十色蔬菜力量，隨時為健康補充正能量。",
        foodImage: "/images/焗十色蔬菜片.jpg",
        ingredients: ["各式蔬菜"],
        startDate: new Date(),
        endDate: new Date(2026, 11, 31),
        nowProvid: true
    },
    {
        displayTitle: "莓莓幸褔",
        smallDescription: "檸檸撻遇上幸福莓莓，充滿幸福的滿足感。",
        foodImage: "/images/莓莓幸褔.jpg",
        ingredients: ["草莓", "檸檬", "撻皮"],
        startDate: new Date(),
        endDate: new Date(2026, 11, 31),
        nowProvid: true
    },
    {
        displayTitle: "經典焗方利魚",
        smallDescription: "嫩滑方利填滿帆立貝慕士，經烈火烤香，淋上經典牛油白汁(sauce de beurre blanc)",
        foodImage: "/images/經典焗方利魚.jpg",
        ingredients: ["方利魚", "帆立貝", "牛油白汁"],
        startDate: new Date(),
        endDate: new Date(2026, 11, 31),
        nowProvid: true
    },
    {
        displayTitle: "Cassoulet卡酥來砂鍋",
        smallDescription: "來自南法的地道菜，油封鴨脾，腩肉，肉腸碰上白豆，鹹香滿滿，口感濃濃。",
        foodImage: "/images/Cassoulet卡酥來砂鍋.jpg",
        ingredients: ["鴨脾", "腩肉", "肉腸", "白豆"],
        startDate: new Date(),
        endDate: new Date(2026, 11, 31),
        nowProvid: true
    },
    {
        displayTitle: "甜咸鬼馬馬卡龍",
        smallDescription: "焦糖鹹魚馬卡龍?! 紅絲絨松露朱古力?! 兩種滋味，味覺衝擊，難以形容的體驗。",
        foodImage: "/images/甜咸鬼馬馬卡龍.jpg",
        ingredients: ["焦糖", "鹹魚", "紅絲絨", "松露朱古力"],
        startDate: new Date(),
        endDate: new Date(2026, 11, 31),
        nowProvid: true
    },
    {
        displayTitle: "歐洲白戀人",
        smallDescription: "冬日戀人，甜美雪白的荷蘭時令白士多啤梨，配上淡淡的慕絲，鬆脆的餅底。",
        foodImage: "/images/歐洲白戀人.jpg",
        ingredients: ["白士多啤梨", "慕絲", "餅底"],
        startDate: new Date(),
        endDate: new Date(2026, 11, 31),
        nowProvid: true
    }
];

async function importMenuItems() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4
        });
        console.log('Connected to MongoDB');

        // Clear existing menu items
        await MenuItem.deleteMany({});
        console.log('Cleared existing menu items');

        // Import new menu items
        const result = await MenuItem.insertMany(menuItems);
        console.log(`Successfully imported ${result.length} menu items`);

        // Copy images if they don't exist in the destination
        const sourceDir = path.join(__dirname, '..', 'public', 'images');
        const destDir = path.join(__dirname, '..', 'public', 'images', 'menu');

        for (const item of menuItems) {
            const imageName = path.basename(item.foodImage);
            const sourcePath = path.join(sourceDir, imageName);
            const destPath = path.join(destDir, imageName);

            try {
                await fs.access(destPath);
                console.log(`Image ${imageName} already exists in destination`);
            } catch {
                try {
                    await fs.copyFile(sourcePath, destPath);
                    console.log(`Copied ${imageName} to menu folder`);
                } catch (err) {
                    console.error(`Error copying ${imageName}:`, err);
                }
            }
        }

        console.log('Import completed successfully');
    } catch (error) {
        console.error('Import failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

importMenuItems();
