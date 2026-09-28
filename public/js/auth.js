function syncReactAuthUser(user) {
    window.__wallzySetAuthUser?.(user || null);
}

export function createAuthController({getAuth,onSuccess=()=>{},onError=()=>{}}={}) {
    const auth=getAuth;
    const updateAuthUIState=user=>{
        syncReactAuthUser(user);
        const b=document.getElementById("authButtonText");
        if(b)b.innerText=user?.user_metadata?.full_name?.split(" ")[0]||"Account";
    };
    window.loginWithGoogleReal=async()=>{
        if(!auth)return;
        try{
            const{error}=await auth.signInWithOAuth({provider:"google",options:{redirectTo:location.origin+location.pathname}});
            if(error)throw error;
            onSuccess();
        }catch(e){
            window.__wallzyShowMessage?.("Login failed: "+(e?.message||e));
            onError(e);
        }
    };
    window.logoutUser=async()=>{
        try{
            const{error}=await auth.signOut();
            if(error)throw error;
            syncReactAuthUser(null);
            window.__wallzyCloseAuthModal?.();
            window.__wallzyShowMessage?.("Signed out successfully.");
            onSuccess();
        }catch(e){
            window.__wallzyShowMessage?.("Error signing out.");
            onError(e);
        }
    };
    return{updateAuthUIState};
}
