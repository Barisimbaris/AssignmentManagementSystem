import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CreateAssignmentScreen = () => {
  return (
    <View style={styles.container}>
      <Text>CreateAssignmentScreen Sayfasi</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});

export default CreateAssignmentScreen;
