import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import auth from '@react-native-firebase/auth';
import Screen from '../components/layout/Screen';
import { colors } from '../theme/colors';
import { screenPadding } from '../theme/spacing';
import { typography } from '../theme/typography';

const SignupSchema = Yup.object().shape({
  email: Yup.string().trim().email('Invalid email').required('Required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Required'),
});

const SignupScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);

  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      validationSchema={SignupSchema}
      onSubmit={async values => {
        setLoading(true);
        try {
          await auth().createUserWithEmailAndPassword(
            values.email.trim(),
            values.password,
          );
          Alert.alert('Success', 'User account created!');
        } catch (error: any) {
          console.error(error);
          Alert.alert('Sign Up Error', error.message);
        } finally {
          setLoading(false);
        }
      }}
    >
      {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
        <Screen edges={['top', 'left', 'right', 'bottom']}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.hero}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Join our community today</Text>
              </View>

              <View style={styles.form}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  placeholder="you@example.com"
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  value={values.email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                  placeholderTextColor={colors.textMuted}
                />
                {touched.email && errors.email ? (
                  <Text style={styles.error}>{errors.email}</Text>
                ) : null}

                <Text style={styles.label}>Password</Text>
                <TextInput
                  placeholder="At least 6 characters"
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  value={values.password}
                  secureTextEntry
                  style={styles.input}
                  placeholderTextColor={colors.textMuted}
                />
                {touched.password && errors.password ? (
                  <Text style={styles.error}>{errors.password}</Text>
                ) : null}

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => handleSubmit()}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Sign Up</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>
                    Already have an account?{' '}
                    <Text style={styles.linkText}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Screen>
      )}
    </Formik>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: screenPadding,
    paddingVertical: 32,
  },
  hero: { marginBottom: 32 },
  title: { ...typography.h1, marginBottom: 8 },
  subtitle: { ...typography.body, color: colors.textSecondary },
  form: { gap: 4 },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.background,
    fontSize: 16,
    color: colors.text,
  },
  error: { color: colors.danger, marginBottom: 8, fontSize: 12, marginLeft: 4 },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: { marginTop: 24, alignItems: 'center' },
  secondaryButtonText: { color: colors.textSecondary, fontSize: 14 },
  linkText: { color: colors.primary, fontWeight: '700' },
});

export default SignupScreen;
