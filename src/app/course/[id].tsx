import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

import { CourseForm } from '@/components/course-form';
import { EmptyState, Screen } from '@/components/ui';
import { useStore } from '@/store/useStore';

export default function EditCourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const course = useStore((s) => s.courses.find((c) => c.id === id));
  const updateCourse = useStore((s) => s.updateCourse);

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
    />
  );
}
