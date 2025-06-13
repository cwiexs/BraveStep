import { useSession } from "next-auth/react";
import useSWR from "swr";

const fetcher = (url) => fetch(url).then((r) => r.json());

export default function Dashboard() {
  // Saugus variantas: priskirk numatytą reikšmę, jei useSession() grąžina undefined
  const sessionData = useSession?.();
  const session = sessionData?.data;
  const status = sessionData?.status || "loading";
  const { data, error } = useSWR(session ? "/api/my-plans" : null, fetcher);

  if (status === "loading") return <div>Kraunasi...</div>;
  if (!session) return <div>Prisijunkite, kad matytumėte savo planus.</div>;
  if (error) return <div>Klaida: {error.message}</div>;

  return (
    <main style={{ fontFamily: "sans-serif", padding: 32 }}>
      <h1>Jūsų sporto planai</h1>
      <ul>
        {(data?.plans || []).map((plan) => (
          <li key={plan.id}>
            <pre>{plan.data.plan}</pre>
            <small>{new Date(plan.createdAt).toLocaleString()}</small>
          </li>
        ))}
      </ul>
      <a href="/"><button>Atgal</button></a>
    </main>
  );
}
