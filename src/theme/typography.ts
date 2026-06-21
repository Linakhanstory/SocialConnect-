import { wp } from '../hooks/useResponsive';
import { colors } from './colors';

export const typography = {
  h1: { fontSize: wp('7%'), fontWeight: '800' as const, color: colors.text },
  h2: { fontSize: wp('5.5%'), fontWeight: '800' as const, color: colors.text },
  h3: { fontSize: wp('4.5%'), fontWeight: '700' as const, color: colors.text },
  body: { fontSize: wp('4%'), color: colors.text },
  caption: { fontSize: wp('3.5%'), color: colors.textSecondary },
  label: { fontSize: wp('3.8%'), fontWeight: '600' as const, color: colors.primary },
};
