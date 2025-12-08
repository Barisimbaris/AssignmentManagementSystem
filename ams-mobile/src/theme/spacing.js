import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const spacing = () => {
  return (
    <View style={styles.container}>
      <Text>spacing Sayfasi</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default spacing;
