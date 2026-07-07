import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, EmptyState, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStore } from '@/store/useStore';
import { Course } from '@/types';

export default function CoursesScreen() {
  const router = useRouter();
  const t = useTheme();
  const courses = useStore((s) => s.courses);
  const deleteCourse = useStore((s) => s.deleteCourse);

  const confirmDelete = (course: Course) =>
    Alert.alert('Delete course?', `${course.name} will be removed. Past rounds keep their scores.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCourse(course.id) },
    ]);

  return (
    <Screen>
      <FlatList
        data={courses}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two, paddingBottom: 120 }}
        ListEmptyComponent={
          <EmptyState
            icon="flag"
            title="No courses yet"
            message="Add a course with its holes, pars, stroke indexes and tees. It'll be saved for every future round."
          />
        }
        renderItem={({ item }) => {
          const par = item.holes.reduce((s, h) => s + h.par, 0);
          return (
            <Pressable onPress={() => router.push(`/course/${item.id}`)} onLongPress={() => confirmDelete(item)}>
              <Card>
                <Text style={{ color: t.text, fontSize: 17, fontWeight: '700' }}>{item.name}</Text>
                <Text style={{ color: t.textSecondary, fontSize: 13, marginTop: 4 }}>
                  {item.holes.length} holes · Par {par}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  {item.tees.map((tee) => (
                    <View key={tee.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: tee.color,
                          borderWidth: StyleSheet.hairlineWidth,
                          borderColor: t.border,
                        }}
                      />
                      <Text style={{ color: t.textSecondary, fontSize: 12 }}>
                        {tee.name} {tee.courseRating}/{tee.slopeRating}
                      </Text>
                    </View>
                  ))}
                </View>
              </Card>
            </Pressable>
          );
        }}
      />
      <View style={{ position: 'absolute', left: Spacing.three, right: Spacing.three, bottom: Spacing.four }}>
        <Button title="Add Course" icon="add" onPress={() => router.push('/course/new')} />
      </View>
    </Screen>
  );
}
