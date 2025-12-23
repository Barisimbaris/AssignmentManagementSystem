import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';

// Screens
import ProfileScreen from '../screens/common/ProfileScreen';
import AssignmentListScreen from '../screens/instructor/AssignmentListScreen';
import CreateAssignmentScreen from '../screens/instructor/CreateAssignmentScreen';
import GradeSubmissionScreen from '../screens/instructor/GradeSubmissionScreen';
import InstructorDashboard from '../screens/instructor/InstructorDashboard';
import StudentsScreen from '../screens/instructor/StudentsScreen';
import SubmissionsListScreen from '../screens/instructor/SubmissionsListScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Assignments Stack
const AssignmentsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AssignmentList" component={AssignmentListScreen} />
      <Stack.Screen name="CreateAssignment" component={CreateAssignmentScreen} />
      <Stack.Screen name="SubmissionsList" component={SubmissionsListScreen} />
      <Stack.Screen name="GradeSubmission" component={GradeSubmissionScreen} />
    </Stack.Navigator>
  );
};

const InstructorNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Assignments') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Students') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={InstructorDashboard}
        options={{ tabBarLabel: 'Ana Sayfa' }}
      />
      <Tab.Screen 
        name="Assignments" 
        component={AssignmentsStack}
        options={{ tabBarLabel: 'Ödevler' }}
      />
      <Tab.Screen 
        name="Students" 
        component={StudentsScreen}
        options={{ tabBarLabel: 'Öğrenciler' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
};

export default InstructorNavigator;