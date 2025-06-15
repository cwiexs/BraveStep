import { getProviders, signIn } from 'next-auth/react';

export default function SignIn({ providers }) {
  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 20 }}>
      <h1>Prisijungimas</h1>
      {Object.values(providers).map((provider) => (
        <div key={provider.name} style={{ margin: '10px 0' }}>
          <button onClick={() => signIn(provider.id)} style={{ width: '100%', padding: 10 }}>
            Prisijungti per {provider.name}
          </button>
        </div>
      ))}
    </div>
  );
}

export async function getServerSideProps() {
  const providers = await getProviders();
  return { props: { providers } };
}

