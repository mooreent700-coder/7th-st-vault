'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { supabase } from '@/lib/supabase';

type CampaignType =
  | 'New Drop'
  | 'Limited Release'
  | 'Restock Alert'
  | 'VIP Early Access'
  | 'Flash Sale'
  | 'Lookbook Promo';

type StoreRow = {
  id: string;
  owner_id?: string | null;
  user_id?: string | null;
  name?: string | null;
  slug?: string | null;
};

type CampaignDraft = {
  campaign_type: CampaignType;
  title: string;
  message: string;
  cta_text: string;
  discount_code: string;
  discount_value: string;
  media_url: string;
  media_type: 'image' | 'video';
  active: boolean;
};

type CampaignRow = {
  id: string;
  restaurant_id?: string | null;
  owner_id?: string | null;
  promo_type?: string | null;
  campaign_type?: string | null;
  title?: string | null;
  details?: string | null;
  message?: string | null;
  cta_text?: string | null;
  button_text?: string | null;
  discount_code?: string | null;
  discount_value?: string | null;
  media_url?: string | null;
  media_type?: string | null;
  store_url?: string | null;
  active?: boolean | null;
  created_at?: string | null;
};

const CAMPAIGN_TYPES: Array<{
  type: CampaignType;
  title: string;
  message: string;
  cta: string;
}> = [
  {
    type: 'New Drop',
    title: 'New Drop Just Landed',
    message: 'Shop the newest pieces before they sell out.',
    cta: 'Shop New Drop',
  },
  {
    type: 'Limited Release',
    title: 'Limited Release Available Now',
    message: 'A small-batch release is live. Once it is gone, it is gone.',
    cta: 'View Limited Release',
  },
  {
    type: 'Restock Alert',
    title: 'Best Sellers Restocked',
    message: 'Your favorite pieces are back in stock for a limited time.',
    cta: 'Shop Restock',
  },
  {
    type: 'VIP Early Access',
    title: 'VIP Early Access',
    message: 'Give loyal customers early access before the public drop.',
    cta: 'Unlock VIP Access',
  },
  {
    type: 'Flash Sale',
    title: 'Flash Sale Live',
    message: 'A limited-time fashion deal is live right now.',
    cta: 'Shop Flash Sale',
  },
  {
    type: 'Lookbook Promo',
    title: 'New Lookbook Is Live',
    message: 'Show customers the full look and send them straight to shop.',
    cta: 'View Lookbook',
  },
];

const EMPTY_DRAFT: CampaignDraft = {
  campaign_type: 'New Drop',
  title: 'New Drop Just Landed',
  message: 'Shop the newest pieces before they sell out.',
  cta_text: 'Shop New Drop',
  discount_code: '',
  discount_value: '',
  media_url: '',
  media_type: 'image',
  active: true,
};

function isVideoFile(value: string) {
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(value);
}

function cleanFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function getCampaignMediaPath(publicUrl?: string | null) {
  if (!publicUrl) return '';

  const marker = '/storage/v1/object/public/campaign-media/';
  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex >= 0) {
    return decodeURIComponent(publicUrl.slice(markerIndex + marker.length).split('?')[0]);
  }

  const fallbackMarker = '/campaign-media/';
  const fallbackIndex = publicUrl.indexOf(fallbackMarker);

  if (fallbackIndex >= 0) {
    return decodeURIComponent(publicUrl.slice(fallbackIndex + fallbackMarker.length).split('?')[0]);
  }

  return '';
}

function formatDate(value?: string | null) {
  if (!value) return 'Just now';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getCampaignKind(campaign: CampaignRow) {
  return campaign.promo_type || campaign.campaign_type || 'Drop Campaign';
}

function getCampaignMessage(campaign: CampaignRow) {
  return campaign.details || campaign.message || 'Fashion campaign ready for your storefront.';
}

function getCampaignButtonText(campaign: CampaignRow) {
  return campaign.cta_text || campaign.button_text || 'Shop Now';
}

export default function DropCampaignsPage() {
  const [store, setStore] = useState<StoreRow | null>(null);
  const [ownerId, setOwnerId] = useState('');
  const [draft, setDraft] = useState<CampaignDraft>(EMPTY_DRAFT);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');

  const storeUrl = useMemo(() => {
    if (!store?.slug || typeof window === 'undefined') return '';
    return `${window.location.origin}/store/${store.slug}`;
  }, [store?.slug]);

  const loadCampaigns = useCallback(async (storeId: string) => {
    setListError('');

    const { data, error: campaignsError } = await supabase
      .from('drop_campaigns')
      .select('*')
      .eq('restaurant_id', storeId)
      .order('created_at', { ascending: false })
      .limit(25);

    if (campaignsError) {
      setCampaigns([]);
      setListError(campaignsError.message);
      return;
    }

    setCampaigns((data || []) as CampaignRow[]);
  }, []);

  useEffect(() => {
    async function loadOwnerStore() {
      setError('');

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Please log in again.');
        return;
      }

      setOwnerId(user.id);

      const { data, error: storeError } = await supabase
        .from('restaurants')
        .select('id,owner_id,user_id,name,slug')
        .or(`owner_id.eq.${user.id},user_id.eq.${user.id}`)
        .limit(1)
        .maybeSingle();

      if (storeError) {
        setError(storeError.message);
        return;
      }

      if (data?.id) {
        setStore(data as StoreRow);
        await loadCampaigns(data.id);
      }
    }

    void loadOwnerStore();
  }, [loadCampaigns]);

  function selectCampaign(type: CampaignType) {
    const selected = CAMPAIGN_TYPES.find((item) => item.type === type);
    if (!selected) return;

    setDraft((current) => ({
      ...current,
      campaign_type: selected.type,
      title: selected.title,
      message: selected.message,
      cta_text: selected.cta,
    }));
    setSaved(false);
    setError('');
  }

  function handleMediaChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setMediaFile(file);
    setSaved(false);
    setError('');

    if (!file) {
      setMediaPreview('');
      return;
    }

    if (mediaPreview) URL.revokeObjectURL(mediaPreview);

    const previewUrl = URL.createObjectURL(file);
    setMediaPreview(previewUrl);
    setDraft((current) => ({
      ...current,
      media_type: file.type.startsWith('video') || isVideoFile(file.name) ? 'video' : 'image',
    }));
  }

  async function uploadCampaignMedia() {
    if (!mediaFile || !store?.id) return draft.media_url;

    const bucket = 'campaign-media';
    const ext = mediaFile.name.split('.').pop() || (draft.media_type === 'video' ? 'mp4' : 'jpg');
    const filePath = `campaigns/${store.id}/${Date.now()}-${cleanFileName(mediaFile.name || `drop-campaign.${ext}`)}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, mediaFile, {
        cacheControl: '3600',
        upsert: true,
        contentType: mediaFile.type || undefined,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl || '';
  }

  async function saveCampaign() {
    setSaving(true);
    setSaved(false);
    setError('');

    try {
      if (!store?.id || !ownerId) {
        setError('Store not loaded yet. Refresh and try again.');
        return;
      }

      const publicMediaUrl = await uploadCampaignMedia();

      const payload = {
        restaurant_id: store.id,
        owner_id: ownerId,
        promo_type: draft.campaign_type,
        title: draft.title,
        details: draft.message,
        cta_text: draft.cta_text,
        discount_code: draft.discount_code || null,
        discount_value: draft.discount_value || null,
        media_url: publicMediaUrl || null,
        media_type: draft.media_type,
        store_url: storeUrl || null,
        active: draft.active,
      };

      const { error: dbError } = await supabase.from('drop_campaigns').insert(payload);

      if (dbError) {
        const localCampaigns = JSON.parse(window.localStorage.getItem('vault_drop_campaigns') || '[]');
        window.localStorage.setItem(
          'vault_drop_campaigns',
          JSON.stringify([{ ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...localCampaigns])
        );
        setError(`Saved locally. Supabase table needs checking: ${dbError.message}`);
        setSaved(true);
        return;
      }

      setSaved(true);
      setMediaFile(null);
      if (mediaPreview) {
        URL.revokeObjectURL(mediaPreview);
        setMediaPreview('');
      }
      await loadCampaigns(store.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save campaign.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteCampaign(campaign: CampaignRow) {
    if (!campaign.id || !store?.id) return;

    const confirmed = window.confirm('Delete this drop campaign? This removes it from the storefront and dashboard.');
    if (!confirmed) return;

    setDeletingId(campaign.id);
    setError('');
    setListError('');

    try {
      const { error: deleteError } = await supabase
        .from('drop_campaigns')
        .delete()
        .eq('id', campaign.id)
        .eq('restaurant_id', store.id);

      if (deleteError) throw deleteError;

      const mediaPath = getCampaignMediaPath(campaign.media_url);

      if (mediaPath) {
        await supabase.storage.from('campaign-media').remove([mediaPath]);
      }

      setCampaigns((current) => current.filter((item) => item.id !== campaign.id));
      setSaved(false);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Could not delete campaign.');
    } finally {
      setDeletingId('');
    }
  }

  return (
    <main className="page">
      <section className="shell">
        <Link href="/dashboard/owner" className="back">← Back to Dashboard</Link>

        <div className="hero">
          <div>
            <p className="eyebrow">7TH ST VAULT SELLER CAMPAIGNS</p>
            <h1>Drop Campaigns</h1>
            <p className="lead">
              One clean place to promote new drops, restocks, VIP access, flash sales, and lookbooks with photo or video.
            </p>
          </div>

          <div className="storeCard">
            <span>Storefront link</span>
            <strong>{store?.slug ? `/store/${store.slug}` : 'Loading store...'}</strong>
          </div>
        </div>

        <div className="layout">
          <section className="panel">
            <div className="panelTop">
              <div>
                <p className="eyebrow">Campaign Type</p>
                <h2>Choose one drop campaign</h2>
              </div>
            </div>

            <div className="campaignGrid">
              {CAMPAIGN_TYPES.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  className={draft.campaign_type === item.type ? 'campaign active' : 'campaign'}
                  onClick={() => selectCampaign(item.type)}
                >
                  <strong>{item.type}</strong>
                  <span>{item.message}</span>
                </button>
              ))}
            </div>

            <div className="form">
              <label>Campaign Title</label>
              <input
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              />

              <label>Campaign Message</label>
              <textarea
                value={draft.message}
                onChange={(event) => setDraft((current) => ({ ...current, message: event.target.value }))}
              />

              <div className="two">
                <div>
                  <label>Discount Code Optional</label>
                  <input
                    value={draft.discount_code}
                    placeholder="DROP20"
                    onChange={(event) => setDraft((current) => ({ ...current, discount_code: event.target.value }))}
                  />
                </div>
                <div>
                  <label>Discount / Unlock Value Optional</label>
                  <input
                    value={draft.discount_value}
                    placeholder="20% off / VIP only"
                    onChange={(event) => setDraft((current) => ({ ...current, discount_value: event.target.value }))}
                  />
                </div>
              </div>

              <label>Button Text</label>
              <input
                value={draft.cta_text}
                onChange={(event) => setDraft((current) => ({ ...current, cta_text: event.target.value }))}
              />

              <label>Upload Campaign Photo or Video</label>
              <input className="fileInput" type="file" accept="image/*,video/*" onChange={handleMediaChange} />

              {error ? <div className={error.startsWith('Saved locally') ? 'warning' : 'error'}>{error}</div> : null}
              {saved ? <div className="success">Drop campaign saved.</div> : null}

              <button type="button" className="saveBtn" disabled={saving} onClick={saveCampaign}>
                {saving ? 'Saving Campaign...' : 'Save Drop Campaign'}
              </button>
            </div>
          </section>

          <aside className="preview">
            <p className="eyebrow">Live Preview</p>
            <div className="phoneCard">
              <div className="mediaBox">
                {mediaPreview ? (
                  draft.media_type === 'video' ? (
                    <video src={mediaPreview} autoPlay muted loop playsInline />
                  ) : (
                    <img src={mediaPreview} alt="Campaign preview" />
                  )
                ) : (
                  <div className="emptyMedia">Upload photo or video</div>
                )}
                <div className="shade" />
                <div className="previewCopy">
                  <span>{draft.campaign_type}</span>
                  <h3>{draft.title}</h3>
                  <p>{draft.message}</p>
                  <button type="button">{draft.cta_text}</button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <section className="managerPanel">
          <div className="managerTop">
            <div>
              <p className="eyebrow">Campaign Manager</p>
              <h2>Uploaded drop campaigns</h2>
            </div>
            <button type="button" className="refreshBtn" disabled={!store?.id} onClick={() => store?.id && loadCampaigns(store.id)}>
              Refresh
            </button>
          </div>

          {listError ? <div className="error">{listError}</div> : null}

          {campaigns.length ? (
            <div className="campaignList">
              {campaigns.map((campaign) => {
                const isVideo = campaign.media_type === 'video' || isVideoFile(campaign.media_url || '');
                const deleting = deletingId === campaign.id;

                return (
                  <article key={campaign.id} className="savedCampaign">
                    <div className="savedMedia">
                      {campaign.media_url ? (
                        isVideo ? (
                          <video src={campaign.media_url} autoPlay muted loop playsInline />
                        ) : (
                          <img src={campaign.media_url} alt={campaign.title || 'Drop campaign'} />
                        )
                      ) : (
                        <div className="emptyThumb">No Media</div>
                      )}
                    </div>

                    <div className="savedInfo">
                      <div className="savedMeta">
                        <span>{getCampaignKind(campaign)}</span>
                        <span>{campaign.active === false ? 'Inactive' : 'Active'}</span>
                        <span>{formatDate(campaign.created_at)}</span>
                      </div>
                      <h3>{campaign.title || 'Untitled campaign'}</h3>
                      <p>{getCampaignMessage(campaign)}</p>
                      <div className="savedTags">
                        {campaign.discount_code ? <strong>{campaign.discount_code}</strong> : null}
                        {campaign.discount_value ? <strong>{campaign.discount_value}</strong> : null}
                        <strong>{getCampaignButtonText(campaign)}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="deleteBtn"
                      disabled={deleting}
                      onClick={() => deleteCampaign(campaign)}
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="emptyList">
              No drop campaigns yet. Upload one campaign above and it will show here with a delete button.
            </div>
          )}
        </section>
      </section>

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
.page{min-height:100vh;background:radial-gradient(circle at 20% 0%,rgba(68,56,255,.26),transparent 34%),linear-gradient(135deg,#070812,#101331 55%,#05060c);color:#fff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:28px}
.shell{max-width:1280px;margin:0 auto}
.back{display:inline-flex;color:#e5e7eb;text-decoration:none;font-weight:900;margin-bottom:22px}
.hero{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:26px}
.eyebrow{margin:0 0 10px;color:#a7b7ff;font-size:12px;font-weight:1000;letter-spacing:.2em;text-transform:uppercase}
h1{margin:0;font-size:clamp(44px,6vw,76px);line-height:.92;font-weight:1000;letter-spacing:-.07em}
.lead{max-width:760px;color:#cbd5e1;font-size:18px;line-height:1.55;font-weight:750}
.storeCard{min-width:250px;padding:18px;border-radius:24px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14)}
.storeCard span{display:block;color:#a7b7ff;font-size:12px;font-weight:950;text-transform:uppercase;letter-spacing:.16em}
.storeCard strong{display:block;margin-top:8px;font-size:18px}
.layout{display:grid;grid-template-columns:minmax(0,1.1fr) 390px;gap:24px;align-items:start}
.panel,.preview,.managerPanel{border-radius:32px;background:rgba(12,15,34,.78);border:1px solid rgba(255,255,255,.14);box-shadow:0 30px 80px rgba(0,0,0,.28);padding:24px}
.panelTop,.managerTop{display:flex;align-items:center;justify-content:space-between;gap:18px}
h2{margin:0;font-size:30px;line-height:1;font-weight:1000;letter-spacing:-.04em}
.campaignGrid{margin-top:20px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.campaign{text-align:left;min-height:118px;border:1px solid rgba(255,255,255,.13);border-radius:22px;background:rgba(255,255,255,.055);color:#fff;padding:16px;cursor:pointer;transition:transform .16s ease,border-color .16s ease,background .16s ease}
.campaign:hover{transform:translateY(-2px);border-color:rgba(96,165,250,.55)}
.campaign.active{background:linear-gradient(135deg,#2563eb,#7c3aed);border-color:rgba(255,255,255,.32);box-shadow:0 16px 42px rgba(79,70,229,.35)}
.campaign strong{display:block;font-size:18px;font-weight:1000;letter-spacing:-.02em}
.campaign span{display:block;margin-top:8px;color:rgba(255,255,255,.78);font-size:13px;line-height:1.35;font-weight:750}
.form{margin-top:22px;display:grid;gap:13px}
label{font-size:12px;font-weight:1000;letter-spacing:.14em;text-transform:uppercase;color:#cbd5e1}
input,textarea{width:100%;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.075);color:#fff;border-radius:18px;padding:16px;font-size:16px;font-weight:800;outline:none}
textarea{min-height:136px;resize:vertical}
.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.fileInput{padding:13px;background:rgba(255,255,255,.1)}
.saveBtn{height:64px;border:0;border-radius:20px;background:linear-gradient(135deg,#0ea5e9,#7c3aed);color:#fff;font-size:19px;font-weight:1000;cursor:pointer;box-shadow:0 18px 44px rgba(79,70,229,.36)}
.saveBtn:disabled,.refreshBtn:disabled,.deleteBtn:disabled{opacity:.6;cursor:not-allowed}
.success,.warning,.error{font-weight:950;padding:14px;border-radius:16px}
.success{background:rgba(34,197,94,.12);color:#86efac}
.warning{background:rgba(251,191,36,.12);color:#fcd34d}
.error{background:rgba(239,68,68,.12);color:#fca5a5}
.preview{position:sticky;top:24px}
.phoneCard{margin-top:16px;border-radius:34px;padding:12px;background:#050712;border:1px solid rgba(255,255,255,.12)}
.mediaBox{position:relative;overflow:hidden;border-radius:26px;min-height:560px;background:linear-gradient(135deg,#111827,#312e81)}
.mediaBox img,.mediaBox video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.emptyMedia{position:absolute;inset:0;display:grid;place-items:center;color:#cbd5e1;font-weight:1000}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.04),rgba(0,0,0,.72))}
.previewCopy{position:absolute;left:22px;right:22px;bottom:22px}
.previewCopy span{display:inline-flex;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.16);font-size:11px;font-weight:1000;text-transform:uppercase;letter-spacing:.16em}
.previewCopy h3{margin:14px 0 0;font-size:34px;line-height:.96;font-weight:1000;letter-spacing:-.05em}
.previewCopy p{color:#e5e7eb;font-weight:750;line-height:1.45}
.previewCopy button{height:48px;border:0;border-radius:15px;background:#fff;color:#111827;padding:0 18px;font-weight:1000}
.managerPanel{margin-top:24px}
.refreshBtn{height:46px;border:1px solid rgba(255,255,255,.16);border-radius:16px;background:rgba(255,255,255,.08);color:#fff;padding:0 18px;font-weight:1000;cursor:pointer}
.campaignList{margin-top:20px;display:grid;gap:14px}
.savedCampaign{display:grid;grid-template-columns:150px minmax(0,1fr) auto;gap:18px;align-items:center;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.055);border-radius:24px;padding:14px}
.savedMedia{height:112px;border-radius:18px;background:#050712;overflow:hidden;border:1px solid rgba(255,255,255,.12)}
.savedMedia img,.savedMedia video{width:100%;height:100%;object-fit:cover;display:block}
.emptyThumb{height:100%;display:grid;place-items:center;color:#94a3b8;font-weight:1000;font-size:12px;text-transform:uppercase;letter-spacing:.14em}
.savedMeta,.savedTags{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.savedMeta span,.savedTags strong{display:inline-flex;border-radius:999px;padding:7px 10px;background:rgba(255,255,255,.1);color:#dbeafe;font-size:11px;font-weight:1000;text-transform:uppercase;letter-spacing:.1em}
.savedInfo h3{margin:10px 0 4px;font-size:24px;line-height:1;font-weight:1000;letter-spacing:-.04em}
.savedInfo p{margin:0 0 12px;color:#cbd5e1;font-weight:750;line-height:1.4}
.deleteBtn{height:48px;border:0;border-radius:16px;background:linear-gradient(135deg,#ef4444,#be123c);color:#fff;padding:0 18px;font-weight:1000;cursor:pointer;box-shadow:0 16px 34px rgba(239,68,68,.22)}
.emptyList{margin-top:18px;border:1px dashed rgba(255,255,255,.2);border-radius:22px;padding:26px;text-align:center;color:#cbd5e1;font-weight:900}
@media(max-width:980px){.hero{display:block}.layout{grid-template-columns:1fr}.preview{position:static}.campaignGrid{grid-template-columns:1fr 1fr}.two{grid-template-columns:1fr}.savedCampaign{grid-template-columns:110px minmax(0,1fr)}.deleteBtn{grid-column:1/-1}}
@media(max-width:640px){.page{padding:16px}.campaignGrid{grid-template-columns:1fr}.panel,.preview,.managerPanel{padding:18px;border-radius:24px}.mediaBox{min-height:420px}.savedCampaign{grid-template-columns:1fr}.savedMedia{height:220px}}
`;
