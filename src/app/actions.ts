'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateSchedule() {
  revalidatePath('/') // Очистить кэш главной
  revalidatePath('/planner') // Очистить кэш планера
  console.log('Cache revalidated');
}