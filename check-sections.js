const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function checkSections() {
  try {
    const sections = await prisma.section.findMany({
      orderBy: {
        order_index: 'asc'
      }
    });

    console.log('Current sections in database:');
    sections.forEach(section => {
      console.log(`ID: ${section.id}, Name: ${section.section_name}, Order: ${section.order_index}`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkSections();