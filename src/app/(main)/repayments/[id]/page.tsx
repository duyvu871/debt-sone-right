import { RepaymentDetailPage } from "@/widgets/RepaymentDetailPage";

export default async function RepaymentDetailRoute(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <RepaymentDetailPage repaymentId={id} />;
}
