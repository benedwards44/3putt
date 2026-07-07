import { useRouter } from 'expo-router';
import React from 'react';

import { CourseForm } from '@/components/course-form';
import { useStore } from '@/store/useStore';

export default function NewCourseScreen() {
  const router = useRouter();
  const addCourse = useStore((s) => s.addCourse);
  return (
    <CourseForm
      onSave={(course) => {
        addCourse(course);
        router.back();
      }}
    />
  );
}
