import { SessionPage } from "@/components/SessionPage";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function SessionRoute({ params }: Props) {
  const { token } = await params;
  return <SessionPage token={token} />;
}
