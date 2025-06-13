import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  // Saugus variantas: priskirk numatytą reikšmę, jei useSession() grąžina undefined
  const sessionData = useSession?.();
  const session = sessionData?.data;

  return (
    <main style={{ fontFamily: "sans-serif", padding: 32 }}>
      <h1>BraveStep</h1>
      {session ? (
        <>
          <p>Prisijungęs kaip {session.user.email}</p>
          <button onClick={() => signOut()}>Atsijungti</button>
          <a href="/dashboard"><button>Mano planai</button></a>
        </>
      ) : (
        <>
          <button onClick={() => signIn("google")}>Prisijungti su Google</button>
          <button onClick={() => signIn("facebook")}>Prisijungti su Facebook</button>
          {/* <button onClick={() => signIn("email")}>Prisijungti el. paštu</button> */}
        </>
      )}
    </main>
  );
}
