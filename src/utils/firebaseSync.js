import { database } from '../firebaseConfig';
import { ref, set, get } from 'firebase/database';

export const syncMaterialsToFirebase = async (shop, materials) => {
  try {
    if (!materials || materials.length === 0) return true;

    for (const material of materials) {
      const materialRef = ref(database, `${shop}/materials/${material.id}`);
      await set(materialRef, material);
    }
    
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
      return Object.values(snapshot.val()).filter(m => m);
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
    return true;
  } catch (error) {
    console.error('❌ Sale error:', error);
    return false;
  }
};