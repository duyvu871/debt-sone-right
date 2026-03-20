import { CreditorDetailPage } from "@/widgets/CreditorDetailPage";

export default async function CreditorDetailRoute(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return <CreditorDetailPage creditorId={id} />;
}
