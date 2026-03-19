// test_vulgar_words.js
import { prisma } from "./lib/db.js";

async function run() {
    try {
        console.log("Creating a vulgar word...");
        const word1 = await prisma.vulgar_words.create({
            data: { word: "TestWord", is_ai: false }
        });
        console.log("Created:", word1);

        console.log("Fetching words...");
        const words = await prisma.vulgar_words.findMany();
        console.log(`Found ${words.length} words.`);

        console.log("Updating word...");
        const updated = await prisma.vulgar_words.update({
            where: { vulgar_word_id: word1.vulgar_word_id },
            data: { word: "UpdatedTestWord" }
        });
        console.log("Updated:", updated);

        console.log("Deleting word...");
        await prisma.vulgar_words.delete({
            where: { vulgar_word_id: word1.vulgar_word_id }
        });
        console.log("Deleted.");
        
    } catch(err) {
        console.error("Test failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

run();
