import { useEffect, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

const GOLD = '#F0C040', GOLD_DIM = '#B8972A', CREAM = '#F5F1E6', CYAN = '#35D0E0', MUTED = '#9DA8C0', PANEL = '#0E1530';
const MEDAILE = ['🥇', '🥈', '🥉'];

type Hrac = { userId: string; nick: string; body: number };
type Medaile = { userId: string; nick: string; g: number; s: number; b: number };

export default function Zebricek() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [perTurnaj, setPerTurnaj] = useState<Record<string, Hrac[]>>({});
  const [celkove, setCelkove] = useState<Medaile[]>([]);
  const [medalMap, setMedalMap] = useState<Record<string, Medaile>>({});
  const [vybrano, setVybrano] = useState('CELKOVÉ');
  const [profilId, setProfilId] = useState<string | null>(null);
  const [profil, setProfil] = useState<any>(null);

  useEffect(() => { nacti(); }, []);
  useEffect(() => { if (profilId) nactiProfil(profilId); }, [profilId]);

  async function nacti() {
    setLoading(true);
    const { data } = await supabase.from('tipy_nadeje').select('user_id, body_ziskane, profiles(nickname), zapasy(turnaj)');
    const turnaje: Record<string, Record<string, Hrac>> = {};
    (data || []).forEach((r: any) => {
      const turnaj = r.zapasy?.turnaj;
      if (!turnaj) return;
      const nick = r.profiles?.nickname || '???';
      if (!turnaje[turnaj]) turnaje[turnaj] = {};
      if (!turnaje[turnaj][r.user_id]) turnaje[turnaj][r.user_id] = { userId: r.user_id, nick, body: 0 };
      turnaje[turnaj][r.user_id].body += r.body_ziskane || 0;
    });

    const perT: Record<string, Hrac[]> = {};
    const medaile: Record<string, Medaile> = {};
    Object.entries(turnaje).forEach(([turnaj, hraci]) => {
      const serazeni = Object.values(hraci).sort((a, b) => b.body - a.body);
      perT[turnaj] = serazeni;
      serazeni.forEach((h, i) => {
        if (h.body <= 0 || i > 2) return;
        if (!medaile[h.userId]) medaile[h.userId] = { userId: h.userId, nick: h.nick, g: 0, s: 0, b: 0 };
        if (i === 0) medaile[h.userId].g++;
        else if (i === 1) medaile[h.userId].s++;
        else medaile[h.userId].b++;
      });
    });

    const celk = Object.values(medaile).sort((a, b) => b.g - a.g || b.s - a.s || b.b - a.b);
    setPerTurnaj(perT);
    setCelkove(celk);
    setMedalMap(medaile);
    setLoading(false);
  }

  async function nactiProfil(id: string) {
    setProfil(null);
    const { data: p } = await supabase.from('profiles').select('first_name,last_name,nickname').eq('id', id).single();
    const { data: tips } = await supabase.from('tipy_nadeje').select('body_ziskane, zapasy(vysledek_domaci)').eq('user_id', id);
    const vyhodnocene = (tips || []).filter((t: any) => t.zapasy?.vysledek_domaci !== null);
    const body = (tips || []).reduce((sum: number, t: any) => sum + (t.body_ziskane || 0), 0);
    const trefene = vyhodnocene.filter((t: any) => (t.body_ziskane || 0) > 0).length;
    const uspesnost = vyhodnocene.length > 0 ? Math.round((trefene / vyhodnocene.length) * 100) : 0;
    const med = medalMap[id] || { g: 0, s: 0, b: 0 };
    setProfil({ ...p, body, tipu: vyhodnocene.length, trefene, uspesnost, med });
  }

  const turnajeList = Object.keys(perTurnaj);
  const taby = ['CELKOVÉ', ...turnajeList];

  return (
    <LinearGradient colors={['#0B1230', '#070B1A', '#05080F']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll}>
          <Pressable onPress={() => router.back()} style={s.back}><Text style={s.backText}>← ZPĚT</Text></Pressable>
          <Text style={s.eyebrow}>SK NADĚJE</Text>
          <Text style={s.title}>ŽEBŘÍČEK</Text>

          {loading && <Text style={s.info}>Načítám…</Text>}

          {!loading && (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <View style={s.pills}>
                  {taby.map(t => (
                    <Pressable key={t} style={[s.pill, vybrano === t && s.pillActive]} onPress={() => setVybrano(t)}>
                      <Text style={[s.pillText, vybrano === t && s.pillTextActive]}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              {vybrano === 'CELKOVÉ' ? (
                celkove.length === 0 ? <Text style={s.info}>Zatím žádné výsledky.</Text> : (
                  <View style={s.box}>
                    {celkove.map((m, i) => (
                      <Pressable key={m.userId} style={({ pressed }) => [s.radek, i < 3 && s.radekTop, pressed && { opacity: 0.7 }]} onPress={() => setProfilId(m.userId)}>
                        <Text style={s.rank}>{i < 3 ? MEDAILE[i] : i + 1}</Text>
                        <Text style={s.nick}>{m.nick}</Text>
                        <Text style={s.medaileText}>🥇{m.g}  🥈{m.s}  🥉{m.b}</Text>
                      </Pressable>
                    ))}
                  </View>
                )
              ) : (
                <View style={s.box}>
                  {(perTurnaj[vybrano] || []).map((h, i) => (
                    <Pressable key={h.userId} style={({ pressed }) => [s.radek, i < 3 && s.radekTop, pressed && { opacity: 0.7 }]} onPress={() => setProfilId(h.userId)}>
                      <Text style={s.rank}>{i < 3 ? MEDAILE[i] : i + 1}</Text>
                      <Text style={s.nick}>{h.nick}</Text>
                      <Text style={s.body}>{h.body} b</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>

        <Modal visible={profilId !== null} transparent animationType="fade" onRequestClose={() => setProfilId(null)}>
          <View style={s.profilOverlay}>
            <View style={s.profilBox}>
              <Pressable style={s.profilClose} onPress={() => setProfilId(null)}><Text style={s.profilCloseText}>✕</Text></Pressable>
              {!profil ? <Text style={s.info}>Načítám…</Text> : (
                <>
                  <View style={s.avatar}><Text style={s.avatarText}>{(profil.nickname || '?')[0].toUpperCase()}</Text></View>
                  <Text style={s.profilNick}>{profil.nickname}</Text>
                  <Text style={s.profilJmeno}>{profil.first_name} {profil.last_name}</Text>
                  <View style={s.statRow}>
                    <View style={s.statBox}><Text style={s.statCislo}>{profil.body}</Text><Text style={s.statLabel}>BODŮ</Text></View>
                    <View style={s.statBox}><Text style={s.statCislo}>{profil.tipu}</Text><Text style={s.statLabel}>TIPŮ</Text></View>
                    <View style={s.statBox}><Text style={s.statCislo}>{profil.uspesnost}%</Text><Text style={s.statLabel}>ÚSPĚŠNOST</Text></View>
                  </View>
                  <View style={s.medaileBox}>
                    <Text style={s.medaileVelke}>🥇 {profil.med.g}    🥈 {profil.med.s}    🥉 {profil.med.b}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 60 },
  back: { marginBottom: 16 }, backText: { color: GOLD_DIM, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  eyebrow: { color: GOLD_DIM, fontSize: 11, fontWeight: '700', letterSpacing: 3 },
  title: { color: GOLD, fontSize: 24, fontWeight: '900', letterSpacing: 1, marginTop: 4, marginBottom: 20 },
  info: { color: 'rgba(255,255,255,0.4)', fontSize: 15, textAlign: 'center', marginTop: 40 },
  pills: { flexDirection: 'row', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(240,192,64,0.3)', backgroundColor: 'rgba(255,255,255,0.04)' },
  pillActive: { backgroundColor: GOLD, borderColor: '#FFE08A' },
  pillText: { color: MUTED, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }, pillTextActive: { color: '#080C1A' },
  box: { backgroundColor: PANEL, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(240,192,64,0.15)', padding: 8 },
  radek: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 10, borderRadius: 12, gap: 12 },
  radekTop: { backgroundColor: 'rgba(240,192,64,0.06)' },
  rank: { color: GOLD, fontSize: 16, fontWeight: '900', width: 30, textAlign: 'center' },
  nick: { color: CREAM, fontSize: 15, fontWeight: '700', flex: 1 },
  body: { color: '#5DCAA5', fontSize: 15, fontWeight: '900' },
  medaileText: { color: CREAM, fontSize: 13, fontWeight: '700' },
  profilOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  profilBox: { backgroundColor: PANEL, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(240,192,64,0.25)', padding: 28, width: '100%', maxWidth: 360, alignItems: 'center' },
  profilClose: { position: 'absolute', top: 12, right: 16, padding: 6, zIndex: 5 }, profilCloseText: { color: MUTED, fontSize: 20, fontWeight: '700' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#0A1830', borderWidth: 2, borderColor: CYAN, alignItems: 'center', justifyContent: 'center', marginBottom: 14, shadowColor: CYAN, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6 },
  avatarText: { color: CYAN, fontSize: 30, fontWeight: '900' },
  profilNick: { color: GOLD, fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  profilJmeno: { color: MUTED, fontSize: 14, fontWeight: '600', marginTop: 2, marginBottom: 22 },
  statRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  statCislo: { color: CREAM, fontSize: 20, fontWeight: '900' },
  statLabel: { color: GOLD_DIM, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  medaileBox: { backgroundColor: 'rgba(240,192,64,0.08)', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, width: '100%', alignItems: 'center' },
  medaileVelke: { color: CREAM, fontSize: 16, fontWeight: '800' },
});