import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  console.log("Starting safe cleanup of duplicate interactions (with pagination)...");

  // Fetch all interactions using pagination
  let allInteractions: any[] = [];
  let from = 0;
  const PAGE_SIZE = 1000;
  let hasMore = true;

  while (hasMore) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('cobranza_interacciones')
      .select('id, socio_id, fecha_gestion, descripcion, created_at')
      .range(from, to);

    if (error) {
      console.error(`Error fetching batch [${from}-${to}]:`, error.message);
      return;
    }

    if (data && data.length > 0) {
      allInteractions = [...allInteractions, ...data];
      if (data.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        from += PAGE_SIZE;
      }
    } else {
      hasMore = false;
    }
  }

  console.log(`Fetched ${allInteractions.length} total interactions.`);

  // Group interactions by (socio_id, fecha_gestion, descripcion)
  const groups: { [key: string]: typeof allInteractions } = {};
  allInteractions.forEach(item => {
    const key = `${item.socio_id}_${item.fecha_gestion}_${item.descripcion}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
  });

  const duplicateGroups = Object.entries(groups).filter(([_, items]) => items.length > 1);
  console.log(`Found ${duplicateGroups.length} duplicate groups.`);

  let totalDeleted = 0;

  for (const [key, items] of duplicateGroups) {
    const ids = items.map(item => item.id);
    console.log(`\nProcessing duplicate group: "${key}" (${items.length} items)`);

    // Check if any of these IDs are referenced in cobranza_promesas
    const { data: linkedPromises, error: errProm } = await supabase
      .from('cobranza_promesas')
      .select('id, interaccion_id')
      .in('interaccion_id', ids);

    if (errProm) {
      console.error(`Error querying linked promises for group: ${errProm.message}`);
      continue;
    }

    let keepId = ids[0];
    if (linkedPromises && linkedPromises.length > 0) {
      // Keep the ID that is linked to a promise
      const linkedId = linkedPromises[0].interaccion_id;
      if (linkedId) {
        keepId = linkedId;
        console.log(`  -> Keeping ID ${keepId} because it is referenced in a promise.`);
      }
    } else {
      // Keep the oldest created interaction
      const sortedByAge = [...items].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      keepId = sortedByAge[0].id;
      console.log(`  -> Keeping the oldest ID ${keepId}.`);
    }

    // Determine IDs to delete
    const idsToDelete = ids.filter(id => id !== keepId);

    // If there were other promises referencing any of the deleted IDs (very unlikely), update them to point to keepId
    const otherLinkedPromises = linkedPromises?.filter(p => p.interaccion_id !== keepId) || [];
    for (const promise of otherLinkedPromises) {
      console.log(`  -> Updating promise ${promise.id} to point to keepId ${keepId}`);
      const { error: errUpdate } = await supabase
        .from('cobranza_promesas')
        .update({ interaccion_id: keepId })
        .eq('id', promise.id);

      if (errUpdate) {
        console.error(`  -> Failed to update promise reference: ${errUpdate.message}`);
      }
    }

    // Delete duplicates
    console.log(`  -> Deleting ${idsToDelete.length} duplicate rows...`);
    const { error: errDel } = await supabase
      .from('cobranza_interacciones')
      .delete()
      .in('id', idsToDelete);

    if (errDel) {
      console.error(`  -> Error deleting duplicates: ${errDel.message}`);
    } else {
      console.log(`  -> Successfully deleted ${idsToDelete.length} rows.`);
      totalDeleted += idsToDelete.length;
    }
  }

  console.log(`\nCleanup finished. Total duplicate rows deleted: ${totalDeleted}`);
}

run();
