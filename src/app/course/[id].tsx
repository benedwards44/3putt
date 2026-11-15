import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert } from 'react-native';

import { CourseForm } from '@/components/course-form';
import { EmptyState, Screen } from '@/components/ui';
import { useStore } from '@/store/useStore';

export default function EditCourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const course = useStore((s) => s.courses.find((c) => c.id === id));
  const updateCourse = useStore((s) => s.updateCourse);
  const deleteCourse = useStore((s) => s.deleteCourse);

  if (!course) {
    return (
      <Screen>
        <EmptyState icon="alert-circle" title="Course not found" message="This course may have been deleted." />
      </Screen>
    );
  }

  return (
    <CourseForm
      initial={course}
      onSave={(patch) => {
        updateCourse({ ...course, ...patch });
        router.back();
      }}
      onDelete={() =>
        Alert.alert('Delete course?', `${course.name} will be removed. Past rounds keep their scores.`, [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              router.back();
              deleteCourse(course.id);
            },
          },
        ])
      }
    />
  );
}
