import { redirect } from 'next/navigation';

import { GUIDE_DEVICE_ID } from '@/lib/demo-data';

export default function CustomerIndex() {
  redirect(`/demo/kupac/${GUIDE_DEVICE_ID}`);
}
