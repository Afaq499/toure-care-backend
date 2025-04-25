import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/product.model';
import axios from 'axios';

dotenv.config();

// Function to generate search queries based on product name
const generateSearchQueries = (name: string): string[] => {
  const cleanName = name
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  // Extract location/country from name if possible
  const locationMatch = cleanName.match(/(?:in|at|to|of)\s+([a-zA-Z\s]+)$/);
  const location = locationMatch ? locationMatch[1].trim() : '';

  // Generate more specific search queries
  const queries = [
    `${cleanName} travel destination`,
    `${cleanName} tourism`,
    `${cleanName} landmark`,
    `${cleanName} attraction`,
    `${cleanName} sightseeing`,
    `${cleanName} vacation spot`,
    `${cleanName} tourist spot`,
    `${cleanName} holiday destination`,
    `${cleanName} tour package`,
    `${cleanName} travel package`
  ];

  // Add location-specific queries if location is found
  if (location) {
    queries.push(
      `${location} travel destination`,
      `${location} tourism`,
      `${location} landmark`,
      `${location} attraction`,
      `${location} sightseeing`,
      `${location} city`,
      `${location} town`,
      `${location} place`
    );
  }

  return queries;
};

// Function to get image URL from multiple sources
const getProductImage = async (name: string): Promise<string> => {
  try {
    const searchQueries = generateSearchQueries(name);
    console.log(`\nSearching images for: ${name}`);
    console.log(`Generated queries:`, searchQueries);

    // Try each search query until we find an image
    for (const query of searchQueries) {
      try {
        console.log(`\nTrying Pexels with query: "${query}"`);
        // Try Pexels API first
        const pexelsResponse = await axios.get(`https://api.pexels.com/v1/search`, {
          params: {
            query,
            per_page: 3, // Get more results to choose from
            orientation: 'landscape'
          },
          headers: {
            Authorization: process.env.PEXELS_API_KEY
          }
        });

        if (pexelsResponse.data.photos?.length > 0) {
          const selectedPhoto = pexelsResponse.data.photos[Math.floor(Math.random() * pexelsResponse.data.photos.length)];
          console.log(`Found image on Pexels: ${selectedPhoto.src.large}`);
          return selectedPhoto.src.large;
        }

        console.log(`No results on Pexels, trying Unsplash with query: "${query}"`);
        // If Pexels fails, try Unsplash
        const unsplashResponse = await axios.get(`https://api.unsplash.com/search/photos`, {
          params: {
            query,
            per_page: 3, // Get more results to choose from
            orientation: 'landscape'
          },
          headers: {
            Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
          }
        });

        if (unsplashResponse.data.results?.length > 0) {
          const selectedPhoto = unsplashResponse.data.results[Math.floor(Math.random() * unsplashResponse.data.results.length)];
          console.log(`Found image on Unsplash: ${selectedPhoto.urls.regular}`);
          return selectedPhoto.urls.regular;
        }
      } catch (error) {
        console.error(`Error with search query "${query}":`, error);
        continue;
      }
    }

    // If no image found, return a category-specific default image
    type ImageCategory = 'hotel' | 'resort' | 'beach' | 'mountain' | 'city' | 'default';
    const defaultImages: Record<ImageCategory, string[]> = {
      hotel: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
        'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8'
      ],
      resort: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8'
      ],
      beach: [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb',
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e'
      ],
      mountain: [
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
        'https://images.unsplash.com/photo-1519681393784-d120267933ba',
        'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b'
      ],
      city: [
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
        'https://images.unsplash.com/photo-1519501025264-65ba15a82390',
        'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b'
      ],
      default: [
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
        'https://images.unsplash.com/photo-1507608616759-54f48f0af0ee'
      ]
    };

    // Determine category based on product name
    const lowerName = name.toLowerCase();
    let category: ImageCategory = 'default';
    if (lowerName.includes('hotel')) category = 'hotel';
    if (lowerName.includes('resort')) category = 'resort';
    if (lowerName.includes('beach')) category = 'beach';
    if (lowerName.includes('mountain')) category = 'mountain';
    if (lowerName.includes('city') || lowerName.includes('urban')) category = 'city';

    const selectedImage = defaultImages[category][Math.floor(Math.random() * defaultImages[category].length)];
    console.log(`Using default ${category} image: ${selectedImage}`);
    return selectedImage;
  } catch (error) {
    console.error(`Error fetching image for ${name}:`, error);
    return 'https://images.unsplash.com/photo-1501785888041-af3ef285b470';
  }
};

const updateProductsWithImages = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tour-care');
    console.log('Connected to MongoDB');

    // Get all products that need images
    const products = await Product.find({
      // $or: [
      //   { image: { $exists: false } },
      //   { image: '' },
      //   { image: null }
      // ]
    });
    console.log(`Found ${products.length} products that need image updates`);

    // Process products in batches to avoid rate limiting
    const batchSize = 2;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      // Update each product with its image
      for (const product of batch) {
        // Skip if product already has a valid image
        if (product.image && 
            !product.image.includes('photo-1501785888041-af3ef285b470') && 
            product.image.startsWith('http')) {
          console.log(`Skipping product ${product.name} - already has a valid image`);
          continue;
        }

        const imageUrl = await getProductImage(product.name);
        product.image = imageUrl;
        await product.save();
        console.log(`Updated image for product: ${product.name}`);
      }
      
      console.log(`Processed batch ${i / batchSize + 1} of ${Math.ceil(products.length / batchSize)}`);
      
      // Add delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error updating products with images:', error);
    process.exit(1);
  }
};

updateProductsWithImages(); 