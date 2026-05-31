import { supabase } from '../supabaseClient';

export const syncMaterials = async (shop, materials) => {
  try {
    console.log('🔄 Starting sync for shop:', shop);
    console.log('📦 Materials to sync:', materials);

    if (!materials || materials.length === 0) {
      console.log('⚠️ No materials to sync');
      return true;
    }

    for (const material of materials) {
      console.log('📤 Syncing material:', material.name);
      
      const payloadData = {
        id: material.id,
        shop: shop,
        name: material.name,
        category: material.category,
        categoryEmoji: material.categoryEmoji || '📦',
        unit: material.unit || 'yards',
        lowStockWarning: material.lowStockWarning || 5,
        variants: JSON.stringify(material.variants || []),
        updatedAt: new Date().toISOString()
      };

      console.log('📋 Payload:', payloadData);

      const { data, error } = await supabase
        .from('materials')
        .insert([payloadData])
        .select();

      if (error) {
        console.error('❌ Insert error:', error);
        
        // Try update if insert fails
        const { data: updateData, error: updateError } = await supabase
          .from('materials')
          .update(payloadData)
          .eq('id', material.id)
          .select();

        if (updateError) {
          console.error('❌ Update error:', updateError);
          throw updateError;
        }
        
        console.log('✅ Updated existing material');
      } else {
        console.log('✅ Inserted new material:', data);
      }
    }
    
    console.log('✅ All materials synced successfully');
    return true;
  } catch (error) {
    console.error('❌ Sync failed:', error);
    return false;
  }
};

export const loadMaterialsFromCloud = async (shop) => {
  try {
    console.log('📥 Loading materials from cloud for shop:', shop);
    
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('shop', shop);

    if (error) {
      console.error('❌ Load error:', error);
      throw error;
    }

    console.log('✅ Loaded from cloud:', data?.length || 0, 'materials');
    
    // Parse variants if they're JSON strings
    const parsed = data?.map(item => ({
      ...item,
      variants: typeof item.variants === 'string' ? JSON.parse(item.variants) : item.variants
    })) || [];

    return parsed;
  } catch (error) {
    console.error('❌ Load error:', error);
    return [];
  }
};

export const syncCategories = async (shop, categories) => {
  try {
    console.log('🔄 Syncing categories for shop:', shop);

    for (const category of categories) {
      const { error } = await supabase
        .from('categories')
        .insert([{
          id: `${shop}_${category.name}`,
          shop: shop,
          name: category.name,
          emoji: category.emoji,
          createdAt: category.createdAt || new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error('❌ Category insert error:', error);
        
        // Try update
        await supabase
          .from('categories')
          .update({
            emoji: category.emoji
          })
          .eq('id', `${shop}_${category.name}`);
      }
    }
    
    console.log('✅ Categories synced');
    return true;
  } catch (error) {
    console.error('❌ Category sync error:', error);
    return false;
  }
};

export const loadCategoriesFromCloud = async (shop) => {
  try {
    console.log('📥 Loading categories for shop:', shop);
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('shop', shop);

    if (error) throw error;

    const formatted = data?.map(item => ({
      name: item.name,
      emoji: item.emoji,
      createdAt: item.createdAt
    })) || [];

    console.log('✅ Loaded categories:', formatted.length);
    return formatted;
  } catch (error) {
    console.error('❌ Load categories error:', error);
    return [];
  }
};

export const recordSaleToCloud = async (shop, saleRecord) => {
  try {
    console.log('💰 Recording sale to cloud');

    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('sales')
      .insert([{
        id: saleRecord.id,
        shop: shop,
        materialId: saleRecord.materialId,
        materialName: saleRecord.materialName,
        color: saleRecord.color,
        quantity: saleRecord.quantity,
        reason: saleRecord.reason,
        costPrice: parseFloat(saleRecord.costPrice),
        sellingPrice: parseFloat(saleRecord.sellingPrice),
        timestamp: saleRecord.timestamp,
        date: today
      }]);

    if (error) throw error;
    
    console.log('✅ Sale recorded');
    return true;
  } catch (error) {
    console.error('❌ Sale record error:', error);
    return false;
  }
};

export const recordPriceChange = async (shop, materialId, variantIndex, change) => {
  try {
    console.log('📊 Recording price change');

    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('price_history')
      .insert([{
        id: `${materialId}_${variantIndex}_${Date.now()}`,
        shop: shop,
        materialId: materialId,
        variantIndex: variantIndex,
        oldCostPrice: parseFloat(change.oldCostPrice),
        oldSellingPrice: parseFloat(change.oldSellingPrice),
        newCostPrice: parseFloat(change.newCostPrice),
        newSellingPrice: parseFloat(change.newSellingPrice),
        changedAt: new Date().toISOString(),
        changedDate: today
      }]);

    if (error) throw error;
    
    console.log('✅ Price change recorded');
    return true;
  } catch (error) {
    console.error('❌ Price history error:', error);
    return false;
  }
};

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