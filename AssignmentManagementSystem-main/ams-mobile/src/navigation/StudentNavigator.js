import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

// Screens
import StudentDashboard from '../screens/student/StudentDashboard';
import AssignmentListScreen from '../screens/student/AssignmentListScreen';
import AssignmentDetailScreen from '../screens/student/AssignmentDetailScreen';
import SubmissionsScreen from '../screens/student/SubmissionsScreen';
import GradesScreen from '../screens/student/GradesScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import ClassScheduleScreen from '../screens/student/ClassScheduleScreen';
import NotificationsScreen from '../screens/student/NotificationsScreen'; // ✅ YENİ

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Screens
import CreateGroupScreen from '../screens/student/CreateGroupScreen';

// Dashboard Stack Navigator (Notifications için)
const DashboardStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={StudentDashboard} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} /> 
    </Stack.Navigator>
  );
};

// Assignments Stack Navigator
const AssignmentsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AssignmentList" component={AssignmentListScreen} />
      <Stack.Screen name="AssignmentDetail" component={AssignmentDetailScreen} />
      <Stack.Screen name="CreateGroup" component={CreateGroupScreen} />
    </Stack.Navigator>
  );
};

const StudentNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Assignments') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Submissions') {
            iconName = focused ? 'cloud-upload' : 'cloud-upload-outline';
          } else if (route.name === 'Grades') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'ClassSchedule') {
            iconName = focused ? 'calendar' : 'calendar-outline';
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
        component={DashboardStack} 
        options={{ tabBarLabel: 'Ana Sayfa' }}
      />
      <Tab.Screen 
        name="Assignments" 
        component={AssignmentsStack}
        options={{ tabBarLabel: 'Ödevler' }}
      />
      <Tab.Screen 
        name="Submissions" 
        component={SubmissionsScreen}
        options={{ tabBarLabel: 'Teslimler' }}
      />
      <Tab.Screen 
        name="Grades" 
        component={GradesScreen}
        options={{ tabBarLabel: 'Notlar' }}
      />
      <Tab.Screen 
        name="ClassSchedule" 
        component={ClassScheduleScreen}
        options={{ tabBarLabel: 'Program' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profil' }}
      />
    </Tab.Navigator>
  );
};

export default StudentNavigator;