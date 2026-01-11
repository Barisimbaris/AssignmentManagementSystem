import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as scheduleAPI from '../../api/endpoints/schedules';
import { colors } from '../../theme/colors';

const CreateScheduleScreen = ({ route, navigation }) => {
  const { classId, className } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    classId: classId,
    dayOfWeek: 0, // 0: Sunday, 1: Monday, etc.
    startTime: '',
    endTime: '',
    roomNumber: '',
    building: '',
    notes: '',
    isActive: true,
  });

  const days = [
    { value: 0, label: 'Pazar' },
    { value: 1, label: 'Pazartesi' },
    { value: 2, label: 'Salı' },
    { value: 3, label: 'Çarşamba' },
    { value: 4, label: 'Perşembe' },
    { value: 5, label: 'Cuma' },
    { value: 6, label: 'Cumartesi' },
  ];

  const handleCreate = async () => {
    if (!formData.startTime || !formData.endTime) {
      Alert.alert('Hata', 'Başlangıç ve bitiş saati gereklidir');
      return;
    }

    try {
      setIsLoading(true);
      
      // TimeSpan formatı: "HH:mm:ss"
      const startTimeSpan = `${formData.startTime}:00`;
      const endTimeSpan = `${formData.endTime}:00`;

      const response = await scheduleAPI.createSchedule({
        classId: formData.classId,
        dayOfWeek: formData.dayOfWeek,
        startTime: startTimeSpan,
        endTime: endTimeSpan,
        roomNumber: formData.roomNumber || null,
        building: formData.building || null,
        notes: formData.notes || null,
        isActive: formData.isActive,
      });

      if (response.isSuccess) {
        Alert.alert(
          'Başarılı! 🎉',
          'Schedule başarıyla oluşturuldu',
          [
            {
              text: 'Tamam',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Hata', response.message || 'Schedule oluşturulamadı');
      }
    } catch (error) {
      console.error('❌ Schedule oluşturma hatası:', error);
      Alert.alert('Hata', error.message || 'Schedule oluşturulamadı');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Geri</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Schedule</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>📚 {className}</Text>
        </View>

        {/* Day of Week */}
        <View style={styles.section}>
          <Text style={styles.label}>Gün *</Text>
          <View style={styles.daysContainer}>
            {days.map((day) => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayButton,
                  formData.dayOfWeek === day.value && styles.dayButtonSelected,
                ]}
                onPress={() => setFormData({ ...formData, dayOfWeek: day.value })}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    formData.dayOfWeek === day.value && styles.dayButtonTextSelected,
                  ]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Start Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Başlangıç Saati * (HH:mm)</Text>
          <TextInput
            style={styles.input}
            placeholder="09:00"
            value={formData.startTime}
            onChangeText={(text) => setFormData({ ...formData, startTime: text })}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* End Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Bitiş Saati * (HH:mm)</Text>
          <TextInput
            style={styles.input}
            placeholder="10:30"
            value={formData.endTime}
            onChangeText={(text) => setFormData({ ...formData, endTime: text })}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Room Number */}
        <View style={styles.section}>
          <Text style={styles.label}>Oda Numarası</Text>
          <TextInput
            style={styles.input}
            placeholder="A-101"
            value={formData.roomNumber}
            onChangeText={(text) => setFormData({ ...formData, roomNumber: text })}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Building */}
        <View style={styles.section}>
          <Text style={styles.label}>Bina</Text>
          <TextInput
            style={styles.input}
            placeholder="A Blok"
            value={formData.building}
            onChangeText={(text) => setFormData({ ...formData, building: text })}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Notlar</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ek notlar..."
            value={formData.notes}
            onChangeText={(text) => setFormData({ ...formData, notes: text })}
            multiline
            numberOfLines={4}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Is Active */}
        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Aktif</Text>
            <Switch
              value={formData.isActive}
              onValueChange={(value) => setFormData({ ...formData, isActive: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreate}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.createButtonText}>Schedule Oluştur</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    fontSize: 16,
    color: colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
  },
  infoBox: {
    backgroundColor: colors.backgroundSecondary,
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  section: {
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayButtonText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  dayButtonTextSelected: {
    color: colors.white,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 20,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CreateScheduleScreen;
