export default function PlanResult({ plan }: { plan: string }) {
  return (
    <section className="mt-8 whitespace-pre-wrap p-4 border rounded bg-white shadow">
      {plan}
    </section>
  );
}