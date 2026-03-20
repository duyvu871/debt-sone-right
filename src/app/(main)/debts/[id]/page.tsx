import { DebtDetailPage } from "@/widgets/DebtDetailPage";

export default async function DebtDetailRoute(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <DebtDetailPage debtId={id} />;
}
