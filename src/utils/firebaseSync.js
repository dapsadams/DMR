import { database } from '../firebaseConfig';
import { ref, set, get, remove, update } from 'firebase/database';

// Sync materials to Firebase
export const syncMaterialsToFirebase = async (shop, materials) => {
  try {
    console.log('🔄 Syncing to Firebase...');
    
    const materialsRef = ref(database, `${shop}/materials`);
    
    // Convert to object for Firebase
    const materialsObj = {};
    materials.forEach(material => {
      materialsObj[material.id] = material;
    });

    await set(materialsRef, materialsObj);
    console.log('✅ Materials synced to Firebase');
    return true;
  } catch (error) {
    console.error('❌ Firebase sync error:', error);
    return false;
  }
};

// Load materials from Firebase
export const loadMaterialsFromFirebase = async (shop) => {
  try {
    console.log('📥 Loading from Firebase...');
    
    const materialsRef = ref(database, `${shop}/materials`);
    const snapshot = await get(materialsRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const materials = Object.values(data);
      console.log('✅ Loaded', materials.length, 'materials');
      return materials;
    }

    console.log('⚠️ No materials in Firebase');
    return [];
  } catch (error) {
    console.error('❌ Firebase load error:', error);
    return [];
  }
};

// Sync categories
export const syncCategoriesToFirebase = async (shop, categories) => {
  try {
    console.log('🔄 Syncing categories...');
    
    const categoriesRef = ref(database, `${shop}/categories`);
    const categoriesObj = {};
    
    categories.forEach(cat => {
      categoriesObj[cat.name] = cat;
    });

    await set(categoriesRef, categoriesObj);
    console.log('✅ Categories synced');
    return true;
  } catch (error) {
    console.error('❌ Category sync error:', error);
    return false;
  }
};

// Load categories
export const loadCategoriesFromFirebase = async (shop) => {
  try {
    const categoriesRef = ref(database, `${shop}/categories`);
    const snapshot = await get(categoriesRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data);
    }

    return [];
  } catch (error) {
    console.error('❌ Load categories error:', error);
    return [];
  }
};

// Record sale
export const recordSaleToFirebase = async (shop, sale) => {
  try {
    console.log('💰 Recording sale...');
    
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

// Record price change
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

// Load sales report
export const loadSalesReportFromFirebase = async (shop) => {
  try {
    const salesRef = ref(database, `${shop}/sales`);
    const snapshot = await get(salesRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const allSales = [];
      
      Object.keys(data).forEach(date => {
        Object.values(data[date]).forEach(sale => {
          allSales.push(sale);
        });
      });

      return allSales;
    }

    return [];
  } catch (error) {
    console.error('❌ Sales report error:', error);
    return [];
  }
};