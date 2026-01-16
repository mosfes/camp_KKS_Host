
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Fetching all camps (raw)...");
        const allCamps = await prisma.camp.findMany();
        console.log("Total camps in DB:", allCamps.length);
        if (allCamps.length > 0) {
            console.log("First camp sample:", JSON.stringify(allCamps[0], null, 2));
        }

        console.log("\nFetching camps with deletedAt: null...");
        const activeCamps = await prisma.camp.findMany({
            where: { deletedAt: null }
        });
        console.log("Active camps count:", activeCamps.length);

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
