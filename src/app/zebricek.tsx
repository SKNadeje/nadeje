import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

const GOLD = '#F0C040', GOLD_DIM = '#B8972A', CREAM = '#F5F1E6', CYAN = '#35D0E0', MUTED = '#9DA8C0', PANEL = '#0E1530';
const MEDAILE = ['🥇', '🥈', '🥉'];

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
  const [fondMap, setFondMap] = useState<Record<string, number>>({});
  const [globalMap, setGlobalMap] = useState<Record<string, any>>({});
  const [rankMap, setRankMap] = useState<Record<string, any>>({});
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
        const pot = m.tips.length * 20 + carry;
        const strelciList = m.strelci.toLowerCase().split(',').map((x: string) => x.trim()).filter(Boolean);
        const presny = m.tips.filter((t: any) => t.tipD === m.vd && t.tipH === m.vh);
        const seStrelcem = presny.filter((t: any) => { const p = (t.strelec || '').toLowerCase().trim(); return p.length > 0 && strelciList.some((r: string) => r.includes(p) || p.includes(r)); });
        const vitezove = seStrelcem.length > 0 ? seStrelcem : presny;
        if (vitezove.length > 0) {
          const podil = Math.floor(pot / vitezove.length);
          vitezove.forEach((v: any) => { const u = turnaje[m.turnaj]?.[v.userId]; if (u) u.vyhry += podil; });
          carry = 0;
        } else { carry = pot; }
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
        if (i === 0) medaile[h.userId].g++; else if (i === 1) medaile[h.userId].s++; else medaile[h.userId].b++;
      });
    });

    // GLOBÁLNÍ součty + pozice v žebříčcích
    const global: Record<string, any> = {};
    Object.values(turnaje).forEach(hraci => {
      Object.values(hraci).forEach((h: any) => {
        if (!global[h.userId]) global[h.userId] = { userId: h.userId, nick: h.nick, body: 0, skore: 0, strelec: 0, trend: 0, vyhry: 0 };
        const g = global[h.userId];
        g.body += h.body; g.skore += h.skore; g.strelec += h.strelec; g.trend += h.trend; g.vyhry += h.vyhry;
      });
    });
    const rankOf = (arr: any[], id: string) => { const i = arr.findIndex((x: any) => x.userId === id); return i >= 0 ? i + 1 : null; };
    const byBody = Object.values(global).filter((g: any) => g.body > 0).sort((a: any, b: any) => b.body - a.body);
    const byVyhry = Object.values(global).filter((g: any) => g.vyhry > 0).sort((a: any, b: any) => b.vyhry - a.vyhry);
    const byScore = Object.values(global).filter((g: any) => g.skore > 0).sort((a: any, b: any) => b.skore - a.skore);
    const byTrend = Object.values(global).filter((g: any) => g.trend > 0).sort((a: any, b: any) => b.trend - a.trend);
    const ranks: Record<string, any> = {};
    Object.keys(global).forEach(id => { ranks[id] = { index: rankOf(byBody, id), lupic: rankOf(byVyhry, id), vysledky: rankOf(byScore, id), trendy: rankOf(byTrend, id) }; });

    const { data: zapData } = await supabase.from('zapasy').select('turnaj, pocet_tipu');
    const fondT: Record<string, number> = {};
    (zapData || []).forEach((z: any) => { fondT[z.turnaj] = (fondT[z.turnaj] || 0) + (z.pocet_tipu || 0) * 5; });

    setFondMap(fondT);
    setGlobalMap(global);
    setRankMap(ranks);
    setPerTurnaj(perT);
    setCelkove(Object.values(medaile).sort((a, b) => b.g - a.g || b.s - a.s || b.b - a.b));
    setMedalMap(medaile);
    setLoading(false);
  }

  async function nactiProfil(id: string) {
    setProfil(null);
    const { data: p } = await supabase.from('profiles').select('first_name,last_name,nickname').eq('id', id).single();
    const { data: tips } = await supabase.from('tipy_nadeje').select('body_ziskane, tip_domaci, tip_hoste, tip_strelec, zapasy(domaci,hoste,vysledek_domaci,vysledek_hoste,datum)').eq('user_id', id);
    const vyhod = (tips || []).filter((t: any) => t.zapasy?.vysledek_domaci !== null).sort((a: any, b: any) => new Date(b.zapasy.datum).getTime() - new Date(a.zapasy.datum).getTime());
    const g = globalMap[id] || { body: 0, skore: 0, strelec: 0, trend: 0, vyhry: 0 };
    const tipu = vyhod.length;
    const trefene = vyhod.filter((t: any) => (t.body_ziskane || 0) > 0).length;
    const uspesnost = tipu > 0 ? Math.round(trefene / tipu * 100) : 0;
    const pct = (n: number) => tipu > 0 ? Math.round(n / tipu * 100) : 0;
    const forma = vyhod.slice(0, 5).map((t: any) => (t.body_ziskane || 0) > 0);
    const r = rankMap[id] || {};
    let title = 'Tipér', best = 999;
    ([['lupic', '💰 Bankovní lupič'], ['index', '⭐ Pán Naděje indexu'], ['vysledky', '🥅 Mistr výsledků'], ['trendy', '🧠 Expert na trendy']] as [string, string][]).forEach(([k, name]) => { const rr = r[k]; if (rr && rr < best) { best = rr; title = name; } });
    setProfil({ ...p, body: g.body, vyhry: Math.round(g.vyhry), skore: g.skore, strelec: g.strelec, trend: g.trend, tipu, uspesnost, pctSkore: pct(g.skore), pctStrelec: pct(g.strelec), pctTrend: pct(g.trend), forma, ranks: r, title, historie: vyhod });
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

  const Bar = ({ label, count, pct, barva }: { label: string; count: number; pct: number; barva: string }) => (
    <View style={s.barRow}>
      <View style={s.barTop}><Text style={s.barLabel}>{label}</Text><Text style={s.barVal}>{count}× · {pct}%</Text></View>
      <View style={s.barBg}><View style={[s.barFill, { width: (pct + '%') as any, backgroundColor: barva }]} /></View>
    </View>
  );

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
                  <View style={s.fondCard}>
                    <Text style={s.fondTitle}>💎 FOND NADĚJE</Text>
                    <Text style={s.fondCelkem}>{fondMap[vybrano] || 0} Kč</Text>
                    <View style={s.fondRow}>
                      <Text style={s.fondPodil}>🥇 {Math.floor((fondMap[vybrano] || 0) * 0.5)} Kč</Text>
                      <Text style={s.fondPodil}>🥈 {Math.floor((fondMap[vybrano] || 0) * 0.3)} Kč</Text>
                      <Text style={s.fondPodil}>🥉 {Math.floor((fondMap[vybrano] || 0) * 0.2)} Kč</Text>
                    </View>
                  </View>
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

        <Modal visible={profilId !== null} transparent animationType="slide" onRequestClose={() => setProfilId(null)}>
          <View style={s.profilOverlay}>
            <View style={s.profilBox}>
              <Pressable style={s.profilClose} onPress={() => setProfilId(null)}><Text style={s.profilCloseText}>✕</Text></Pressable>
              {!profil ? <Text style={s.info}>Načítám…</Text> : (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={s.pHead}>
                    <View style={s.avatar}><Text style={s.avatarText}>{(profil.nickname || '?')[0].toUpperCase()}</Text></View>
                    <Text style={s.profilNick}>{profil.nickname}</Text>
                    <Text style={s.profilJmeno}>{profil.first_name} {profil.last_name}</Text>
                    <View style={s.titleBadge}><Text style={s.titleText}>{profil.title}</Text></View>
                  </View>

                  <View style={s.statRow}>
                    <View style={s.statBox}><Text style={s.statCislo}>{profil.body}</Text><Text style={s.statLabelP}>NB BODŮ</Text></View>
                    <View style={s.statBox}><Text style={[s.statCislo, { color: GOLD }]}>{profil.vyhry}</Text><Text style={s.statLabelP}>VÝHRY Kč</Text></View>
                    <View style={s.statBox}><Text style={[s.statCislo, { color: CYAN }]}>{profil.uspesnost}%</Text><Text style={s.statLabelP}>ÚČAST</Text></View>
                  </View>

                  <Text style={s.sekce}>⚡ FORMA (POSLEDNÍCH 5)</Text>
                  <View style={s.formaRow}>
                    {profil.forma.length === 0 ? <Text style={s.formaEmpty}>Zatím nic.</Text> :
                      profil.forma.map((w: boolean, i: number) => (
                        <View key={i} style={[s.formaChip, w ? s.formaWin : s.formaLoss]}><Text style={s.formaIcon}>{w ? '✓' : '✕'}</Text></View>
                      ))}
                  </View>

                  <Text style={s.sekce}>📊 ÚSPĚŠNOST</Text>
                  <Bar label="🥅 Přesné skóre" count={profil.skore} pct={profil.pctSkore} barva="#35D0E0" />
                  <Bar label="🎯 Střelci" count={profil.strelec} pct={profil.pctStrelec} barva="#F0C040" />
                  <Bar label="🧠 Trendy" count={profil.trend} pct={profil.pctTrend} barva="#C04AE0" />

                  <Text style={s.sekce}>🏆 POZICE V ŽEBŘÍČCÍCH</Text>
                  <View style={s.pozGrid}>
                    <View style={s.pozBox}><Text style={s.pozRank}>{profil.ranks.index ? profil.ranks.index + '.' : '—'}</Text><Text style={s.pozLabel}>NADĚJE INDEX</Text></View>
                    <View style={s.pozBox}><Text style={s.pozRank}>{profil.ranks.lupic ? profil.ranks.lupic + '.' : '—'}</Text><Text style={s.pozLabel}>BANKOVNÍ LUPIČI</Text></View>
                    <View style={s.pozBox}><Text style={s.pozRank}>{profil.ranks.vysledky ? profil.ranks.vysledky + '.' : '—'}</Text><Text style={s.pozLabel}>MISTŘI VÝSLEDKŮ</Text></View>
                    <View style={s.pozBox}><Text style={s.pozRank}>{profil.ranks.trendy ? profil.ranks.trendy + '.' : '—'}</Text><Text style={s.pozLabel}>EXPERTI TRENDŮ</Text></View>
                  </View>

                  <Text style={s.sekce}>📜 HISTORIE TIPŮ ({profil.historie.length})</Text>
                  {profil.historie.map((t: any, i: number) => {
                    const b = t.body_ziskane || 0;
                    return (
                      <View key={i} style={[s.histRow, b > 0 && s.histWin]}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.histZapas} numberOfLines={1}>{t.zapasy.domaci} vs {t.zapasy.hoste}</Text>
                          <Text style={s.histTip}>Tip {t.tip_domaci}:{t.tip_hoste} · {t.tip_strelec || '—'} | Výsl. {t.zapasy.vysledek_domaci}:{t.zapasy.vysledek_hoste}</Text>
                        </View>
                        <Text style={[s.histBody, b === 0 && s.histBodyNula]}>{b > 0 ? '+' + b : '0'}</Text>
                      </View>
                    );
                  })}
                </ScrollView>
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
  fondCard: { backgroundColor: 'rgba(53,208,224,0.08)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(53,208,224,0.3)', padding: 16, marginBottom: 18, alignItems: 'center' },
  fondTitle: { color: CYAN, fontSize: 13, fontWeight: '900', letterSpacing: 1.5, marginBottom: 6 },
  fondCelkem: { color: GOLD, fontSize: 30, fontWeight: '900', marginBottom: 12 },
  fondRow: { flexDirection: 'row', gap: 16 },
  fondPodil: { color: CREAM, fontSize: 14, fontWeight: '800' },
  profilOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  profilBox: { backgroundColor: PANEL, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(240,192,64,0.25)', padding: 22, width: '100%', maxWidth: 400, maxHeight: '90%' },
  profilClose: { position: 'absolute', top: 12, right: 16, padding: 6, zIndex: 5 }, profilCloseText: { color: MUTED, fontSize: 20, fontWeight: '700' },
  pHead: { alignItems: 'center', marginBottom: 18 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#0A1830', borderWidth: 2, borderColor: CYAN, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: CYAN, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6 },
  avatarText: { color: CYAN, fontSize: 28, fontWeight: '900' },
  profilNick: { color: GOLD, fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  profilJmeno: { color: MUTED, fontSize: 14, fontWeight: '600', marginTop: 2 },
  titleBadge: { backgroundColor: 'rgba(240,192,64,0.12)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5, marginTop: 10, borderWidth: 1, borderColor: 'rgba(240,192,64,0.3)' },
  titleText: { color: GOLD, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  statCislo: { color: CREAM, fontSize: 20, fontWeight: '900' },
  statLabelP: { color: GOLD_DIM, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 4 },
  sekce: { color: GOLD_DIM, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10, marginTop: 6 },
  formaRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  formaChip: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  formaWin: { backgroundColor: 'rgba(29,158,117,0.25)', borderWidth: 1, borderColor: '#5DCAA5' },
  formaLoss: { backgroundColor: 'rgba(122,26,26,0.25)', borderWidth: 1, borderColor: '#7A1A1A' },
  formaIcon: { color: CREAM, fontSize: 15, fontWeight: '900' },
  formaEmpty: { color: MUTED, fontSize: 13 },
  barRow: { marginBottom: 14 },
  barTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barLabel: { color: CREAM, fontSize: 13, fontWeight: '700' },
  barVal: { color: MUTED, fontSize: 12, fontWeight: '700' },
  barBg: { height: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 999 },
  pozGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  pozBox: { width: '47%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 14, flexGrow: 1 },
  pozRank: { color: GOLD, fontSize: 22, fontWeight: '900' },
  pozLabel: { color: MUTED, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },
  histRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 10, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: 'rgba(255,255,255,0.1)' },
  histWin: { backgroundColor: 'rgba(29,158,117,0.14)', borderLeftColor: '#5DCAA5' },
  histZapas: { color: CREAM, fontSize: 13, fontWeight: '800' },
  histTip: { color: MUTED, fontSize: 11, marginTop: 2 },
  histBody: { color: '#5DCAA5', fontSize: 15, fontWeight: '900', marginLeft: 10 },
  histBodyNula: { color: '#6B7488' },
});