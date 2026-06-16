import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

const GOLD = '#F0C040', GOLD_DIM = '#B8972A', CREAM = '#F5F1E6', CYAN = '#35D0E0', MUTED = '#9DA8C0', PANEL = '#0E1530';
const MEDAILE = ['🥇', '🥈', '🥉'];
const FOND = 5;

function rozlozBody(body: number) {
  return { skore: body >= 6, strelec: body === 3 || body === 4 || body === 9, trend: body === 1 || body === 4 || body === 6 || body === 9 };
}

type Hrac = { userId: string; nick: string; body: number; skore: number; strelec: number; trend: number; vyhry: number };
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
    const { data } = await supabase.from('tipy_nadeje').select('user_id, body_ziskane, tip_domaci, tip_hoste, tip_strelec, zapas_id, profiles(nickname), zapasy(turnaj, cena_tip, vysledek_domaci, vysledek_hoste, strelci, datum)');

    const turnaje: Record<string, Record<string, Hrac>> = {};
    const zapasyMap: Record<string, any> = {};

    (data || []).forEach((r: any) => {
      const turnaj = r.zapasy?.turnaj;
      if (!turnaj) return;
      const nick = r.profiles?.nickname || '???';
      if (!turnaje[turnaj]) turnaje[turnaj] = {};
      if (!turnaje[turnaj][r.user_id]) turnaje[turnaj][r.user_id] = { userId: r.user_id, nick, body: 0, skore: 0, strelec: 0, trend: 0, vyhry: 0 };
      const h = rozlozBody(r.body_ziskane || 0);
      const u = turnaje[turnaj][r.user_id];
      u.body += r.body_ziskane || 0;
      if (h.skore) u.skore++;
      if (h.strelec) u.strelec++;
      if (h.trend) u.trend++;
      if (!zapasyMap[r.zapas_id]) zapasyMap[r.zapas_id] = { turnaj, cena: r.zapasy?.cena_tip ?? 20, vd: r.zapasy?.vysledek_domaci, vh: r.zapasy?.vysledek_hoste, strelci: r.zapasy?.strelci || '', datum: r.zapasy?.datum, tips: [] };
      zapasyMap[r.zapas_id].tips.push({ userId: r.user_id, tipD: r.tip_domaci, tipH: r.tip_hoste, strelec: r.tip_strelec || '' });
    });

    // BANK: po každém zápase shrábne přesný výsledek (přednost trefený střelec), jinak se převádí
    const podleTurnaje: Record<string, any[]> = {};
    Object.values(zapasyMap).forEach((m: any) => {
      if (m.vd === null || m.vd === undefined) return;
      if (!podleTurnaje[m.turnaj]) podleTurnaje[m.turnaj] = [];
      podleTurnaje[m.turnaj].push(m);
    });
    Object.values(podleTurnaje).forEach((zapasyT: any[]) => {
      zapasyT.sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime());
      let carry = 0;
      zapasyT.forEach((m: any) => {
        const pot = m.tips.length * Math.max(0, m.cena - FOND) + carry;
        const strelciList = m.strelci.toLowerCase().split(',').map((x: string) => x.trim()).filter(Boolean);
        const presny = m.tips.filter((t: any) => t.tipD === m.vd && t.tipH === m.vh);
        const seStrelcem = presny.filter((t: any) => {
          const p = (t.strelec || '').toLowerCase().trim();
          return p.length > 0 && strelciList.some((r: string) => r.includes(p) || p.includes(r));
        });
        const vitezove = seStrelcem.length > 0 ? seStrelcem : presny;
        if (vitezove.length > 0) {
          const podil = Math.floor(pot / vitezove.length);
          vitezove.forEach((v: any) => { const u = turnaje[m.turnaj]?.[v.userId]; if (u) u.vyhry += podil; });
          carry = 0;
        } else {
          carry = pot;
        }
      });
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

    setPerTurnaj(perT);
    setCelkove(Object.values(medaile).sort((a, b) => b.g - a.g || b.s - a.s || b.b - a.b));
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

  const taby = ['CELKOVÉ', ...Object.keys(perTurnaj)];

  function Board({ titul, items, hodnota, jednotka }: { titul: string; items: Hrac[]; hodnota: (h: Hrac) => number; jednotka: string }) {
    if (items.length === 0) return null;
    return (
      <View style={s.statCard}>
        <Text style={s.statCardTitle}>{titul}</Text>
        {items.map((h, i) => (
          <Pressable key={h.userId} style={({ pressed }) => [s.radek, i < 3 && s.radekTop, pressed && { opacity: 0.7 }]} onPress={() => setProfilId(h.userId)}>
            <Text style={s.rank}>{i < 3 ? MEDAILE[i] : i + 1}</Text>
            <Text style={s.nick}>{h.nick}</Text>
            <Text style={s.body}>{hodnota(h)}{jednotka}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  const arr = perTurnaj[vybrano] || [];
  const index = [...arr].filter(h => h.body > 0).sort((a, b) => b.body - a.body);
  const lupici = [...arr].filter(h => h.vyhry > 0).sort((a, b) => b.vyhry - a.vyhry);
  const vysledky = [...arr].filter(h => h.skore > 0).sort((a, b) => b.skore - a.skore || b.body - a.body);
  const strelci = [...arr].filter(h => h.strelec > 0).sort((a, b) => b.strelec - a.strelec || b.body - a.body);
  const trendy = [...arr].filter(h => h.trend > 0).sort((a, b) => b.trend - a.trend || b.body - a.body);

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
                  <View style={s.statCard}>
                    <Text style={s.statCardTitle}>⭐ CELKOVÉ POŘADÍ (MEDAILE)</Text>
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
                <>
                  {index.length === 0 && <Text style={s.info}>V této soutěži zatím nikdo neboduje.</Text>}
                  <Board titul="⭐ NADĚJE INDEX" items={index} hodnota={h => h.body} jednotka=" b" />
                  <Board titul="💰 BANKOVNÍ LUPIČI" items={lupici} hodnota={h => Math.round(h.vyhry)} jednotka=" Kč" />
                  <Board titul="🥅 MISTŘI VÝSLEDKŮ" items={vysledky} hodnota={h => h.skore} jednotka="×" />
                  <Board titul="🎯 KRÁLOVÉ STŘELCŮ" items={strelci} hodnota={h => h.strelec} jednotka="×" />
                  <Board titul="🧠 EXPERTI (TRENDY)" items={trendy} hodnota={h => h.trend} jednotka="×" />
                </>
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
                    <View style={s.statBox}><Text style={s.statCislo}>{profil.body}</Text><Text style={s.statLabelP}>BODŮ</Text></View>
                    <View style={s.statBox}><Text style={s.statCislo}>{profil.tipu}</Text><Text style={s.statLabelP}>TIPŮ</Text></View>
                    <View style={s.statBox}><Text style={s.statCislo}>{profil.uspesnost}%</Text><Text style={s.statLabelP}>ÚSPĚŠNOST</Text></View>
                  </View>
                  <View style={s.medaileBox}><Text style={s.medaileVelke}>🥇 {profil.med.g}    🥈 {profil.med.s}    🥉 {profil.med.b}</Text></View>
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
  info: { color: 'rgba(255,255,255,0.4)', fontSize: 15, textAlign: 'center', marginTop: 30 },
  pills: { flexDirection: 'row', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(240,192,64,0.3)', backgroundColor: 'rgba(255,255,255,0.04)' },
  pillActive: { backgroundColor: GOLD, borderColor: '#FFE08A' },
  pillText: { color: MUTED, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }, pillTextActive: { color: '#080C1A' },
  statCard: { backgroundColor: PANEL, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(240,192,64,0.15)', padding: 12, marginBottom: 18 },
  statCardTitle: { color: CYAN, fontSize: 13, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10, marginLeft: 4 },
  radek: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, gap: 12 },
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
  statLabelP: { color: GOLD_DIM, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  medaileBox: { backgroundColor: 'rgba(240,192,64,0.08)', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, width: '100%', alignItems: 'center' },
  medaileVelke: { color: CREAM, fontSize: 16, fontWeight: '800' },
});