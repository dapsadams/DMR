import { supabase } from '../supabaseClient';

// Sync materials to Supabase
export const syncMaterials = async (shop, materials) => {
  try {
    for (const material of materials) {
      await supabase
        .from('materials')
        .upsert(
          {
            id: material.id,
            shop: shop,
            name: material.name,
            category: material.category,
            categoryEmoji: material.categoryEmoji,
            unit: material.unit,
            lowStockWarning: material.lowStockWarning,
            variants: material.variants,
            updatedAt: new Date().toISOString()
          },
          { onConflict: 'id,shop' }
        );
    }
    console.log('✅ Materials synced to cloud');
    return true;
  } catch (error) {
    console.error('❌ Sync error:', error);
    return false;
  }
};

// Load materials from Supabase
export const loadMaterialsFromCloud = async (shop) => {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('shop', shop);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('❌ Load error:', error);
    return [];
  }
};

// Sync categories
export const syncCategories = async (shop, categories) => {
  try {
    for (const category of categories) {
      await supabase
        .from('categories')
        .upsert(
          {
            id: `${shop}_${category.name}`,
            shop: shop,
            name: category.name,
            emoji: category.emoji,
            createdAt: category.createdAt || new Date().toISOString()
          },
          { onConflict: 'id' }
        );
    }
    console.log('✅ Categories synced');
    return true;
  } catch (error) {
    console.error('❌ Category sync error:', error);
    return false;
  }
};

// Load categories from cloud
export const loadCategoriesFromCloud = async (shop) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('shop', shop);

    if (error) throw error;

    return data.map(item => ({
      name: item.name,
      emoji: item.emoji,
      createdAt: item.createdAt
    })) || [];
  } catch (error) {
    console.error('❌ Load categories error:', error);
    return [];
  }
};

// Record a sale
export const recordSaleToCloud = async (shop, saleRecord) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    await supabase
      .from('sales')
      .insert({
        id: saleRecord.id,
        shop: shop,
        materialId: saleRecord.materialId,
        materialName: saleRecord.materialName,
        color: saleRecord.color,
        quantity: saleRecord.quantity,
        reason: saleRecord.reason,
        costPrice: saleRecord.costPrice,
        sellingPrice: saleRecord.sellingPrice,
        timestamp: saleRecord.timestamp,
        date: today
      });

    console.log('✅ Sale recorded to cloud');
    return true;
  } catch (error) {
    console.error('❌ Sale record error:', error);
    return false;
  }
};

// Record price change
export const recordPriceChange = async (shop, materialId, variantIndex, change) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const historyId = `${materialId}_${variantIndex}_${Date.now()}`;

    await supabase
      .from('price_history')
      .insert({
        id: historyId,
        shop: shop,
        materialId: materialId,
        variantIndex: variantIndex,
        oldCostPrice: change.oldCostPrice,
        oldSellingPrice: change.oldSellingPrice,
        newCostPrice: change.newCostPrice,
        newSellingPrice: change.newSellingPrice,
        changedAt: new Date().toISOString(),
        changedDate: today
      });

    console.log('✅ Price change recorded');
    return true;
  } catch (error) {
    console.error('❌ Price history error:', error);
    return false;
  }
};

// Load sales report
export const loadSalesReport = async (shop, dateFilter = 'all') => {
  try {
    let query = supabase
      .from('sales')
      .select('*')
      .eq('shop', shop)
      .eq('reason', 'Sold');

    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      query = query.eq('date', today);
    } else if (dateFilter === 'week') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      query = query.gte('date', sevenDaysAgo);
    } else if (dateFilter === 'month') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      query = query.gte('date', thirtyDaysAgo);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('❌ Sales report error:', error);
    return [];
  }
};