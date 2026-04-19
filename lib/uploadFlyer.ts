import { supabase } from '@/lib/supabase';

export async function uploadFlyerImage(file: File, restaurantId: string, category: string, style: string) {
  const filePath = `${restaurantId}/${category}/${style}-${Date.now()}.webp`;

  const { error: uploadError } = await supabase.storage
    .from('flyers')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('flyers')
    .getPublicUrl(filePath);

  const imageUrl = data.publicUrl;

  const { error: dbError } = await supabase
    .from('flyer_assets')
    .upsert({
      restaurant_id: restaurantId,
      category,
      style,
      image_url: imageUrl,
    });

  if (dbError) throw dbError;

  return imageUrl;
}