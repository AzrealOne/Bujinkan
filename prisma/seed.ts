import { PrismaClient, CategoryKind } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ryuha = [
  ["togakure-ryu", "Togakure Ryū Ninpō Taijutsu"],
  ["gyokko-ryu", "Gyokko Ryū Kosshijutsu"],
  ["koto-ryu", "Kotō Ryū Koppōjutsu"],
  ["shinden-fudo-ryu", "Shinden Fudō Ryū Dakentaijutsu"],
  ["kukishinden-ryu", "Kukishinden Ryū Happō Bikenjutsu"],
  ["takagi-yoshin-ryu", "Takagi Yōshin Ryū Jūtaijutsu"],
  ["gikan-ryu", "Gikan Ryū Koppōjutsu"],
];

const waffen = [
  ["bo", "Rokushakubō"],
  ["jo", "Jō"],
  ["hanbo", "Hanbō"],
  ["katana", "Katana / Kenjutsu"],
  ["kodachi", "Kodachi / Shōtō"],
  ["tanto", "Tantō"],
  ["yari", "Yari"],
  ["naginata", "Naginata"],
  ["bisento", "Bisentō"],
  ["kusarifundo", "Kusarifundō"],
  ["kyoketsu-shoge", "Kyoketsu Shōge"],
  ["kusarigama", "Kusarigama"],
  ["shuriken", "Shuriken"],
  ["tessen", "Tessen"],
];

async function main() {
  for (const [i, [slug, name]] of ryuha.entries()) {
    await prisma.category.upsert({
      where: { slug },
      update: { name, sortOrder: i },
      create: { slug, name, kind: CategoryKind.RYUHA, sortOrder: i },
    });
  }
  for (const [i, [slug, name]] of waffen.entries()) {
    await prisma.category.upsert({
      where: { slug },
      update: { name, sortOrder: i },
      create: { slug, name, kind: CategoryKind.WAFFE, sortOrder: i },
    });
  }

  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (!exists) {
      await prisma.user.create({
        data: {
          email,
          name: process.env.SEED_ADMIN_NAME || "Admin",
          passwordHash: await bcrypt.hash(password, 12),
          role: "ADMIN",
          status: "ACTIVE",
        },
      });
      console.log(`Admin angelegt: ${email}`);
    }
  } else {
    console.log("SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD fehlen, kein Admin angelegt.");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
