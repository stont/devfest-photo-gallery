import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearCommunities() {
  const communitiesRef = collection(db, 'communities');
  const snapshot = await getDocs(communitiesRef);
  
  if (snapshot.empty) {
    console.log("No communities to delete.");
    return;
  }

  const deletePromises = [];
  snapshot.forEach(doc => {
    deletePromises.push(deleteDoc(doc.ref));
  });

  await Promise.all(deletePromises);
  console.log("All communities have been deleted.");
}

clearCommunities().catch(console.error);
