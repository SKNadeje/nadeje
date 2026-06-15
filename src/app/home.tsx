import { SafeAreaView, View, Text, StyleSheet } from 'react-native';

export default function Home() {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.title}>VÍTEJ! 🏆</Text>
        <Text style={s.sub}>Jsi přihlášen.</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#080C1A' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#F0C040', fontSize: 32, fontWeight: '900', letterSpacing: 1 },
  sub: { color: 'rgba(255,255,255,0.5)', fontSize: 16, marginTop: 8 },
});
