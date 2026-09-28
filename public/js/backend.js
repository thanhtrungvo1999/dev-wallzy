let supabaseClient=null;
function getR2PublicUrl(){return "https://img.wallzy.org";}
function buildImageUrl(row){const r2=getR2PublicUrl();const path=String(row.storage_path||"").trim();if(r2&&path){if(path.startsWith("http://")||path.startsWith("https://"))return path;return r2+"/"+path.replace(/^\/+/, "");}return row.public_url||row.url||"";}
async function getSupabase(){if(supabaseClient)return supabaseClient;const c=window.__wallzySupabaseConfig||{};if(!c.url||!c.key)throw new Error("Supabase environment variables are missing.");if(!window.supabase?.createClient){await new Promise((resolve,reject)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";s.async=true;s.dataset.wallzySupabase="1";s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}supabaseClient=window.supabase.createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});window.__wallzySupabase=supabaseClient;return supabaseClient}
function normalize(row){return{id:String(row.id),url:buildImageUrl(row),title:row.title||row.name||"",category:row.category||"Other",keywords:Array.isArray(row.keywords)?row.keywords:[],timestamp:row.created_at||row.timestamp||"",quality:"",storage_path:row.storage_path||""}}
export async function initBackend({onImagesLoaded,onImagesError,onCategoriesLoaded,onAuthUser,onFavorites,onGradients,onLoadMoreReady}={}){const sb=await getSupabase();let loading=false,exhausted=false,totalCount=null;const pageSize=20;const sampleSize=5;const seenIds=new Set();const usedRanges=new Set();let fallbackOffset=0;
async function getTotalCount(){if(totalCount!==null)return totalCount;const{count,error}=await sb.from("wallpapers").select("id",{count:"exact",head:true});if(error)throw error;totalCount=Number(count||0);return totalCount}
function randomStart(maxStart){return maxStart<=0?0:Math.floor(Math.random()*(maxStart+1))}
async function loadRandomBatch(){const total=await getTotalCount();if(total<=0)return[];if(seenIds.size>=total)return[];
const collected=[];const maxStart=Math.max(0,total-sampleSize);let attempts=0;
while(collected.length<pageSize&&attempts<8&&seenIds.size<total){attempts++;const start=randomStart(maxStart);const rangeKey=`${start}:${Math.min(start+sampleSize-1,total-1)}`;if(usedRanges.has(rangeKey)&&attempts<8)continue;usedRanges.add(rangeKey);
const end=Math.min(start+sampleSize-1,total-1);const{data,error}=await sb.from("wallpapers").select("id,category,keywords,storage_path,public_url,created_at").order("created_at",{ascending:false}).order("id",{ascending:false}).range(start,end);if(error)throw error;
for(const row of data||[]){const id=String(row.id);if(seenIds.has(id))continue;seenIds.add(id);collected.push(normalize(row));if(collected.length>=pageSize)break}}
if(collected.length<pageSize&&seenIds.size<total){const start=Math.min(fallbackOffset,total-1);const end=Math.min(start+pageSize-1,total-1);fallbackOffset=end+1;const{data,error}=await sb.from("wallpapers").select("id,category,keywords,storage_path,public_url,created_at").order("created_at",{ascending:false}).order("id",{ascending:false}).range(start,end);if(error)throw error;for(const row of data||[]){const id=String(row.id);if(seenIds.has(id))continue;seenIds.add(id);collected.push(normalize(row));if(collected.length>=pageSize)break}}
return collected}
async function loadPage(){if(loading||exhausted)return{images:[],hasMore:false};loading=true;try{const images=await loadRandomBatch();exhausted=images.length===0||seenIds.size>=Number(totalCount||0);return{images,hasMore:!exhausted,nextOffset:seenIds.size}}finally{loading=false}}
async function searchWallpapers(query,category='all',offset=0){
    const raw=String(query||'').trim().toLowerCase();
    if(!raw)return{images:[],hasMore:false};
    const pageSize=20;
    const startOffset=Math.max(0,Number(offset)||0);
    const endOffset=startOffset+pageSize-1;
    const terms=raw.replace(/[%,()]/g," ").split(/\s+/).filter(Boolean).slice(0,8);
    const filters=[];
    const textNeedle=raw.replace(/[%,()]/g," ").replace(/\s+/g," ").trim();
    if(textNeedle){
        filters.push(`category.ilike.%${textNeedle}%`);
        filters.push(`storage_path.ilike.%${textNeedle}%`);
        filters.push(`public_url.ilike.%${textNeedle}%`);
    }
    // keywords is an array column; PostgREST supports array containment
    // here, while a cast expression such as keywords::text.ilike is not
    // valid in a regular .or() filter.
    for(const term of terms){
        const safe=term.replace(/[{}(),]/g,"");
        if(safe)filters.push(`keywords.cs.{${safe}}`);
    }
    let q=sb.from("wallpapers")
        .select("id,category,keywords,storage_path,public_url,created_at",{count:"exact"})
        .order("created_at",{ascending:false})
        .order("id",{ascending:false});
    // Search is intentionally global: the active category tab must not
    // hide valid results from other categories. Category navigation is
    // still used when there is no search query.
    if(filters.length)q=q.or(filters.join(","));
    const {data,error,count}=await q.range(startOffset,endOffset);
    if(error)throw error;

    // Keep the database pagination stable so Load more never jumps into
    // an unrelated/random database range. Randomize only the returned page.
    const images=(data||[]).map(normalize);
    for(let i=images.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [images[i],images[j]]=[images[j],images[i]];
    }

    return{images,hasMore:(Number(count||0)>endOffset+1)};
}
try{const{data,error}=await sb.from("wallpapers").select("category");if(!error)onCategoriesLoaded?.([...new Set((data||[]).map(x=>String(x.category||"").trim()).filter(Boolean))])}catch(e){console.warn("[Wallzy] Categories:",e)}
try{const first=await loadPage();onImagesLoaded?.(first.images,first.hasMore);onLoadMoreReady?.(loadPage)}catch(e){console.error("[Wallzy] Supabase images:",e);onImagesError?.(e)}
const{data:{user}}=await sb.auth.getUser();onAuthUser?.(user);
const loadFavorites=async u=>{let items=[];if(u){try{const{data,error}=await sb.from("favorites").select("items").eq("user_id",u.id).maybeSingle();if(!error&&Array.isArray(data?.items))items=data.items}catch(e){console.warn("[Wallzy] Favorites load failed:",e)}}onFavorites?.(Array.isArray(items)?items:[])};
const loadGradients=async u=>{if(!u){onGradients?.({exists:()=>false,data:()=>({})});return}try{const{data,error}=await sb.from("gradients").select("items").eq("user_id",u.id).maybeSingle();onGradients?.({exists:()=>!error&&!!data,data:()=>data||{}})}catch{onGradients?.({exists:()=>false,data:()=>({})})}};
async function saveGradient(user,gradient){if(!user)throw new Error("Login required");const{data:current,error:readError}=await sb.from("gradients").select("items").eq("user_id",user.id).maybeSingle();if(readError)throw readError;const existing=Array.isArray(current?.items)?current.items:[];const items=[gradient,...existing].slice(0,50);const{error}=await sb.from("gradients").upsert({user_id:user.id,items},{onConflict:"user_id"});if(error)throw error;onGradients?.({exists:()=>true,data:()=>({items})});return items}await loadFavorites(user);await loadGradients(user);sb.auth.onAuthStateChange((_e,session)=>{const u=session?.user||null;onAuthUser?.(u);loadFavorites(u);loadGradients(u)});window.__wallzySupabase=sb;return{app:sb,db:sb,auth:sb.auth,appId:"wallzy-supabase",loadMoreImages:async()=>{const p=await loadPage();onImagesLoaded?.(p.images,p.hasMore);return p},saveGradient:async gradient=>saveGradient((await sb.auth.getUser()).data.user,gradient),deleteGradient:async gradientId=>{const user=(await sb.auth.getUser()).data.user;if(!user)throw new Error("Login required");const{data:current,error:readError}=await sb.from("gradients").select("items").eq("user_id",user.id).maybeSingle();if(readError)throw readError;const existing=Array.isArray(current?.items)?current.items:[];const items=existing.filter(item=>String(item?.id)!==String(gradientId));const{error}=await sb.from("gradients").upsert({user_id:user.id,items},{onConflict:"user_id"});if(error)throw error;return items},getImageById:async id=>{const{data,error}=await sb.from("wallpapers").select("id,category,keywords,storage_path,public_url,created_at").eq("id",String(id)).maybeSingle();return error||!data?null:normalize(data)},searchWallpapers}}
export{getSupabase};