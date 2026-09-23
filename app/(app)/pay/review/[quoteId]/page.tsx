import { ReviewQuote } from "@/components/pay/ReviewQuote";

export default async function ReviewPage({ params }: PageProps<"/pay/review/[quoteId]">) {
  const { quoteId } = await params;
  return <ReviewQuote quoteId={quoteId} />;
}
