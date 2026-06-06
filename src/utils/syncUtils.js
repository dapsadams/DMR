// import { supabase } from '../supabaseClient';

// export const syncMaterials = async (shop, materials) => {
//   try {
//     console.log('🔄 Syncing materials...');

//     for (const material of materials) {
//       // Only send columns we know exist
//       const { error } = await supabase
//         .from('materials')
//         .insert([{
//           id: material.id,
//           shop: shop,
//           name: material.name,
//           category: material.category,
//           unit: material.unit,
//           variants: JSON.stringify(material.variants)
//         }])
//         .select();

//       if (error) {
//         console.log('Insert failed, updating...');
//         await supabase
//           .from('materials')
//           .update({
//             name: material.name,
//             category: material.category,
//             variants: JSON.stringify(material.variants)
//           })
//           .eq('id', material.id);
//       }
//     }
    
//     console.log('✅ Sync complete');
//     return true;
//   } catch (error) {
//     console.error('❌ Sync error:', error);
//     return false;
//   }
// };

// export const loadMaterialsFromCloud = async (shop) => {
//   try {
//     const { data, error } = await supabase
//       .from('materials')
//       .select('*')
//       .eq('shop', shop);

//     if (error) return [];

//     return data?.map(item => ({
//       ...item,
//       variants: typeof item.variants === 'string' ? JSON.parse(item.variants) : item.variants
//     })) || [];
//   } catch (error) {
//     return [];
//   }
// };

// export const syncCategories = async (shop, categories) => {
//   try {
//     for (const cat of categories) {
//       await supabase
//         .from('categories')
//         .insert([{
//           id: `${shop}_${cat.name}`,
//           shop,
//           name: cat.name,
//           emoji: cat.emoji
//         }])
//         .select();
//     }
//     return true;
//   } catch (error) {
//     return false;
//   }
// };

// export const loadCategoriesFromCloud = async (shop) => {
//   try {
//     const { data } = await supabase
//       .from('categories')
//       .select('*')
//       .eq('shop', shop);
    
//     return data?.map(d => ({ name: d.name, emoji: d.emoji })) || [];
//   } catch (error) {
//     return [];
//   }
// };

// export const recordSaleToCloud = async (shop, sale) => {
//   try {
//     await supabase.from('sales').insert([{
//       id: sale.id,
//       shop,
//       materialId: sale.materialId,
//       materialName: sale.materialName,
//       color: sale.color,
//       quantity: sale.quantity,
//       reason: sale.reason,
//       costPrice: sale.costPrice,
//       sellingPrice: sale.sellingPrice,
//       timestamp: sale.timestamp,
//       date: new Date().toISOString().split('T')[0]
//     }]);
//     return true;
//   } catch (error) {
//     return false;
//   }
// };

// export const recordPriceChange = async (shop, materialId, variantIndex, change) => {
//   try {
//     await supabase.from('price_history').insert([{
//       id: `${materialId}_${variantIndex}_${Date.now()}`,
//       shop,
//       materialId,
//       variantIndex,
//       oldCostPrice: change.oldCostPrice,
//       oldSellingPrice: change.oldSellingPrice,
//       newCostPrice: change.newCostPrice,
//       newSellingPrice: change.newSellingPrice,
//       changedAt: new Date().toISOString(),
//       changedDate: new Date().toISOString().split('T')[0]
//     }]);
//     return true;
//   } catch (error) {
//     return false;
//   }
// };

// export const loadSalesReport = async (shop) => {
//   try {
//     const { data } = await supabase
//       .from('sales')
//       .select('*')
//       .eq('shop', shop);
//     return data || [];
//   } catch (error) {
//     return [];
//   }
// };