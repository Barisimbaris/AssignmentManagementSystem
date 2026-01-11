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
import GroupsListScreen from '../screens/instructor/GroupsListScreen';
import GroupDetailScreen from '../screens/instructor/GroupDetailScreen';
import MyClassesScreen from '../screens/instructor/MyClassesScreen';
import ClassStudentsScreen from '../screens/instructor/ClassStudentsScreen';
import ClassSchedulesScreen from '../screens/instructor/ClassSchedulesScreen';
import ClassAssignmentsScreen from '../screens/instructor/ClassAssignmentsScreen';
import AssignmentDetailScreen from '../screens/instructor/AssignmentDetailScreen';
import CreateScheduleScreen from '../screens/instructor/CreateScheduleScreen';
import AnalyticsScreen from '../screens/instructor/AnalyticsScreen';

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
      <Stack.Screen name="GroupsList" component={GroupsListScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <Stack.Screen name="AssignmentDetail" component={AssignmentDetailScreen} />
    </Stack.Navigator>
  );
};

// Classes Stack
const ClassesStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyClasses" component={MyClassesScreen} />
      <Stack.Screen name="ClassStudents" component={ClassStudentsScreen} />
      <Stack.Screen name="ClassSchedules" component={ClassSchedulesScreen} />
      <Stack.Screen name="ClassAssignments" component={ClassAssignmentsScreen} />
      <Stack.Screen name="CreateSchedule" component={CreateScheduleScreen} />
      <Stack.Screen name="AssignmentDetail" component={AssignmentDetailScreen} />
    </Stack.Navigator>
  );
};

// Profile Stack (Analytics eklemek için)
const ProfileStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
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
          } else if (route.name === 'MyClasses') {
            iconName = focused ? 'school' : 'school-outline';
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
        name="MyClasses" 
        component={ClassesStack}
        options={{ tabBarLabel: 'Derslerim' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
};

export default InstructorNavigator;
