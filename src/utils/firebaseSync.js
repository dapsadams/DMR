import { database } from '../firebaseConfig';
import { ref, set, get } from 'firebase/database';

let lastSyncedData = {};

export const syncMaterialsToFirebase = async (shop, materials) => {
  try {
    const currentHash = JSON.stringify(
      materials.map(m => ({ 
        id: m.id, 
        qty: m.variants.map(v => v.quantity) 
      }))
    );
    
    if (lastSyncedData[shop] === currentHash) {
      console.log('⏭️ No changes, skipping sync');
      return true;
    }
    
    console.log('🔄 Syncing to Firebase...', materials.length, 'materials');
    
    for (const material of materials) {
      const materialRef = ref(database, `${shop}/materials/${material.id}`);
      await set(materialRef, material);
    }
    
    lastSyncedData[shop] = currentHash;
    console.log('✅ Sync complete');
    return true;
  } catch (error) {
    console.error('❌ Sync error:', error);
    return false;
  }
};

export const loadMaterialsFromFirebase = async (shop) => {
  try {
    const materialsRef = ref(database, `${shop}/materials`);
    const snapshot = await get(materialsRef);

    if (snapshot.exists()) {
      const data = Object.values(snapshot.val()).filter(m => m);
      console.log('✅ Loaded', data.length, 'materials from Firebase');
      return data;
    }
    return [];
  } catch (error) {
    console.error('❌ Load error:', error);
    return [];
  }
};

export const syncCategoriesToFirebase = async (shop, categories) => {
  try {
    for (const cat of categories) {
      const catRef = ref(database, `${shop}/categories/${cat.name}`);
      await set(catRef, cat);
    }
    return true;
  } catch (error) {
    console.error('❌ Category sync error:', error);
    return false;
  }
};

export const loadCategoriesFromFirebase = async (shop) => {
  try {
    const categoriesRef = ref(database, `${shop}/categories`);
    const snapshot = await get(categoriesRef);

    if (snapshot.exists()) {
      return Object.values(snapshot.val()).filter(c => c);
    }
    return [];
  } catch (error) {
    console.error('❌ Load categories error:', error);
    return [];
  }
};

export const recordSaleToFirebase = async (shop, sale) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const saleRef = ref(database, `${shop}/sales/${today}/${sale.id}`);
    await set(saleRef, sale);
    console.log('✅ Sale recorded');
    return true;
  } catch (error) {
    console.error('❌ Sale error:', error);
    return false;
  }
};

export const recordPriceChangeToFirebase = async (shop, materialId, variantIndex, change) => {
  try {
    console.log('📊 Recording price change...');
    
    const priceRef = ref(database, `${shop}/priceHistory/${materialId}_${variantIndex}_${Date.now()}`);
    
    await set(priceRef, {
      ...change,
      changedAt: new Date().toISOString()
    });
    console.log('✅ Price change recorded');
    return true;
  } catch (error) {
    console.error('❌ Price history error:', error);
    return false;
  }
};