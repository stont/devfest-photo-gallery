const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const communitiesData = require('./communities.json');

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// A simple slug generator
function createSlug(name, country) {
  const slugName = name.toLowerCase().replace(/\s+/g, '-');
  const slugCountry = country.toLowerCase().replace(/\s+/g, '-');
  return `${slugName}-${slugCountry}`;
}

async function seedCommunities() {
  const communitiesCollection = db.collection('communities');

  console.log('Starting to seed communities...');

  for (const community of communitiesData) {
    // Extract the community name from the URL
    const urlParts = community.url.split('/');
    const rawName = urlParts[urlParts.length - 2].replace(/-/g, ' ');

    const newCommunity = {
      name: rawName,
      country: community.country,
      slug: createSlug(rawName, community.country),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      qrCodeUrl: '', // These will be generated when a user creates one from the app
      uploadUrl: '',
    };

    try {
      // Add a new document with a generated id.
      await communitiesCollection.add(newCommunity);
      console.log(`Added community: ${newCommunity.name}`);
    } catch (error) {
      console.error(`Error adding community ${newCommunity.name}:`, error);
    }
  }

  console.log('Seeding complete!');
}

seedCommunities();
