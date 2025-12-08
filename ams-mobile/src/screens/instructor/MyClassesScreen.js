import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MyClassesScreen = () => {
  return (
    <View style={styles.container}>
      <Text>MyClassesScreen Sayfasi</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default MyClassesScreen;
