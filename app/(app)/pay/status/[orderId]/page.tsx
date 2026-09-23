import { OrderStatusView } from "@/components/pay/OrderStatusView";

export default async function StatusPage({ params }: PageProps<"/pay/status/[orderId]">) {
  const { orderId } = await params;
  return <OrderStatusView orderId={orderId} />;
}
