import { redirect } from 'next/navigation';

export default function MarketPlayerRedirect({ params }: { params: { id: string } }) {
  redirect(`/players/${params.id}`);
}
