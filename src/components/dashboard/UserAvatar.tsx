import { useState, useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function UserAvatar() {
  const { user, profile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const avatarUrl = profile?.avatar_url;

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      const url = `${publicUrl}?t=${Date.now()}`;

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('user_id', user.id);

      if (updateErr) throw updateErr;

      // Force re-fetch of auth context profile
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
      {avatarUrl ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-8 h-8 rounded-full overflow-hidden border border-white/10 hover:border-brand-orange/40 transition-colors relative"
        >
          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            </div>
          )}
        </button>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-8 h-8 rounded-full bg-white/5 border border-dashed border-white/15 hover:border-brand-orange/40 hover:bg-brand-orange/5 transition-colors flex items-center justify-center"
          title="Adicionar foto"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 text-white/40 animate-spin" />
          ) : (
            <Camera className="w-3.5 h-3.5 text-white/25 group-hover:text-brand-orange/60 transition-colors" />
          )}
        </button>
      )}
    </div>
  );
}
