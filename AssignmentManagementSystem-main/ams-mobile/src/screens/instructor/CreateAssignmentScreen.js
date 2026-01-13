import { useEffect, useState } from 'react';
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
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext'; // ← EKLE
import { colors } from '../../theme/colors';

const CreateAssignmentScreen = ({ navigation }) => {
  const { user } = useAuth(); // ← EKLE
  const [isLoading, setIsLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    type: 1, // 1: Individual, 2: Group
    dueDate: '',
    maxScore: '100',
    allowLateSubmission: false,
    allowResubmission: true,
  });

  useEffect(() => {
    if (user && user.id) {
      fetchClasses();
    }
  }, [user]);

  const fetchClasses = async () => {
    try {
      console.log('📥 Instructor sınıfları getiriliyor...');
      console.log('👤 User:', user);
      
      if (!user || !user.id) {
        console.error('❌ User bilgisi yok!');
        Alert.alert('Hata', 'Kullanıcı bilgisi alınamadı');
        return;
      }
      
      // Instructor'ın kendi sınıflarını çek
      const response = await apiClient.get(`/Class/instructor/${user.id}`);
      console.log('✅ Sınıflar geldi:', response.data);
      
      if (response.data.isSuccess) {
        const classList = response.data.data || [];
        console.log('📚 Instructor sınıf sayısı:', classList.length);
        setClasses(classList);
      }
    } catch (error) {
      console.error('❌ Sınıflar yüklenemedi:', error);
      Alert.alert('Hata', 'Sınıflar yüklenemedi');
    }
  };

  const handleCreate = async () => {
    // Validasyon
    if (!formData.title.trim()) {
      Alert.alert('Hata', 'Başlık gerekli');
      return;
    }
    if (!formData.description.trim()) {
      Alert.alert('Hata', 'Açıklama gerekli');
      return;
    }
    if (!formData.classId) {
      Alert.alert('Hata', 'Sınıf seçiniz');
      return;
    }
    if (!formData.dueDate) {
      Alert.alert('Hata', 'Son tarih gerekli (örn: 2025-12-31)');
      return;
    }

    try {
      setIsLoading(true);
      
      const payload = {
        title: formData.title,
        description: formData.description,
        classId: parseInt(formData.classId),
        type: formData.type,
        dueDate: formData.dueDate + 'T23:59:59Z', // ISO format
        maxScore: parseInt(formData.maxScore),
        allowLateSubmission: formData.allowLateSubmission,
        allowResubmission: formData.allowResubmission,
      };

      console.log('📤 Ödev oluşturuluyor:', payload);

      const response = await apiClient.post('/Assignment', payload);

      if (response.data.isSuccess) {
        Alert.alert('Başarılı! 🎉', 'Ödev oluşturuldu', [
          {
            text: 'Tamam',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      console.error('❌ Ödev oluşturma hatası:', error);
      Alert.alert('Hata', error.message || 'Ödev oluşturulamadı');
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
        <Text style={styles.headerTitle}>Yeni Ödev</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Title */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Başlık *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ödev başlığı"
            value={formData.title}
            onChangeText={(text) => setFormData({ ...formData, title: text })}
          />
        </View>

        {/* Description */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Açıklama *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ödev açıklaması"
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Class */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Sınıf * {classes.length > 0 && `(${classes.length} sınıf)`}</Text>
          {classes.length === 0 ? (
            <Text style={styles.noClassText}>Sınıf yükleniyor...</Text>
          ) : (
            <View style={styles.classButtons}>
              {classes.map((cls) => (
                <TouchableOpacity
                  key={cls.id}
                  style={[
                    styles.classButton,
                    formData.classId === cls.id.toString() && styles.classButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, classId: cls.id.toString() })}
                >
                  <Text style={[
                    styles.classButtonText,
                    formData.classId === cls.id.toString() && styles.classButtonTextActive
                  ]}>
                    {cls.className || `Class ${cls.id}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Type */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tür</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[styles.typeButton, formData.type === 1 && styles.typeButtonActive]}
              onPress={() => setFormData({ ...formData, type: 1 })}
            >
              <Text style={[styles.typeButtonText, formData.type === 1 && styles.typeButtonTextActive]}>
                👤 Bireysel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.typeButton, formData.type === 2 && styles.typeButtonActive]}
              onPress={() => setFormData({ ...formData, type: 2 })}
            >
              <Text style={[styles.typeButtonText, formData.type === 2 && styles.typeButtonTextActive]}>
                👥 Grup
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Due Date */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Son Tarih * (YYYY-MM-DD)</Text>
          <TextInput
            style={styles.input}
            placeholder="2025-12-31"
            value={formData.dueDate}
            onChangeText={(text) => setFormData({ ...formData, dueDate: text })}
          />
        </View>

        {/* Max Score */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Maksimum Puan</Text>
          <TextInput
            style={styles.input}
            placeholder="100"
            value={formData.maxScore}
            onChangeText={(text) => setFormData({ ...formData, maxScore: text })}
            keyboardType="numeric"
          />
        </View>

        {/* Allow Late Submission */}
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Geç Teslim İzin Ver</Text>
          <Switch
            value={formData.allowLateSubmission}
            onValueChange={(value) => setFormData({ ...formData, allowLateSubmission: value })}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        {/* Allow Resubmission */}
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Yeniden Teslim İzin Ver</Text>
          <Switch
            value={formData.allowResubmission}
            onValueChange={(value) => setFormData({ ...formData, allowResubmission: value })}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
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
            <Text style={styles.createButtonText}>Oluştur</Text>
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
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  noClassText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    paddingVertical: 12,
  },
  classButtons: {
    gap: 12,
  },
  classButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  classButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  classButtonText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  classButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  footer: {
    padding: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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

export default CreateAssignmentScreen;