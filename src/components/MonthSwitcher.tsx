import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatYearMonthLabel, shiftYearMonth } from '@/src/domain/month';

type Props = {
  yearMonth: string;
  onChange: (yearMonth: string) => void;
};

export function MonthSwitcher({ yearMonth, onChange }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel="Previous month"
        hitSlop={12}
        onPress={() => onChange(shiftYearMonth(yearMonth, -1))}
        style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.5 : 1 }]}>
        <SymbolView
          name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
          size={20}
          tintColor={colors.text}
        />
      </Pressable>
      <Text style={[styles.label, { color: colors.text }]}>
        {formatYearMonthLabel(yearMonth)}
      </Text>
      <Pressable
        accessibilityLabel="Next month"
        hitSlop={12}
        onPress={() => onChange(shiftYearMonth(yearMonth, 1))}
        style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.5 : 1 }]}>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={20}
          tintColor={colors.text}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  btn: {
    padding: 8,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
  },
});
