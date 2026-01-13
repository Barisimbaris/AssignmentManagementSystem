import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const typography = () => {
  return (
    <View style={styles.container}>
      <Text>typography Sayfasi</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default typography;
