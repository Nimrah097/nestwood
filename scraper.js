const axios = require("axios");
const cheerio = require("cheerio");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const MONGO_URI = process.env.MONGODB_URI;
const PROPERTY_URLS = [
  "https://nestwoodrealty.com/property/sobha-hartland-estates",
  "https://nestwoodrealty.com/property/sobha-hartland-waves",
  "https://nestwoodrealty.com/property/310-riverside-crescent",
  "https://nestwoodrealty.com/property/creek-vistas-grande",
  "https://nestwoodrealty.com/property/nad-al-sheba-villas-townhouses",
  "https://nestwoodrealty.com/property/sobha-creek-vistas",
  "https://nestwoodrealty.com/property/sobha-one",
  "https://nestwoodrealty.com/property/golf-ridges",
  "https://nestwoodrealty.com/property/samana-mykonos",
  "https://nestwoodrealty.com/property/aqua-dimore",
  "https://nestwoodrealty.com/property/habtoor-grand-residences-apartments-penthouses",
  "https://nestwoodrealty.com/property/terra-golf-collection",
  "https://nestwoodrealty.com/property/damac-canal-crown",
  "https://nestwoodrealty.com/property/palm-jebel-ali-villas-in-dubai",
  "https://nestwoodrealty.com/property/aeternitas-london-gate",
  "https://nestwoodrealty.com/property/damac-casa",
  "https://nestwoodrealty.com/property/aeon-by-emaar",
  "https://nestwoodrealty.com/property/damac-lagoon-views-apartments",
  "https://nestwoodrealty.com/property/mercer-house-in-uptown-dubai",
  "https://nestwoodrealty.com/property/one-river-point-businessbay",
  "https://nestwoodrealty.com/property/armani-beach-residences-palm-jumeriah",
  "https://nestwoodrealty.com/property/reportage-bianca",
  "https://nestwoodrealty.com/property/damac-altitude",
  "https://nestwoodrealty.com/property/sobha-verde",
  "https://nestwoodrealty.com/property/azizi-beach-oasis",
  "https://nestwoodrealty.com/property/sobha-seahaven",
  "https://nestwoodrealty.com/property/woodland-residences",
];

async function scrapeProperty(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const name = $("h1.entry-title.entry-prop").text().trim();
    const price = $(".price_area").text().trim();
    const location = $(".property_categs").text().trim();
    const description = $("#wpestate_property_description_section").text().trim();
    const floorPlan = $("li:contains('Bedrooms')").text().trim();
    const propertyType = $("a[rel='tag'][href*='property-category']")
  .map((_, el) => $(el).text().trim())
  .get()
  .join(", ");



    const images = [];
    $(".gallery_wrapper .image_gallery").each((_, el) => {
      const style = $(el).attr("style");
      const match = style && style.match(/url\((.*?)\)/);
      if (match) images.push(match[1].replace(/["']/g, ""));
    });

    return {
      name,
      price,
      location,
      description,
      floorPlan,
      images,
      url,
      propertyType,
      scrapedAt: new Date(),
    };
  } catch (err) {
    console.error(`❌ Failed to scrape ${url}:`, err.message);
    return null;
  }
}

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db("nestwoodDB");
  const collection = db.collection("properties");

  let savedCount = 0;

  for (const url of PROPERTY_URLS) {
    const property = await scrapeProperty(url);
    if (!property) continue;

    try {
      await collection.replaceOne({ url }, property, { upsert: true });
      console.log(`✅ Saved: ${property.name || url}`);
      savedCount++;
    } catch (err) {
      console.error(`❌ DB insert error for ${url}:`, err.message);
    }
  }

  console.log(`🎉 Done. ${savedCount} properties saved.`);
  await client.close();
}

main();
