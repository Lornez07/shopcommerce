import { Container } from '@/components/ui';
import { MagicLinkForm } from '@/components/auth/MagicLinkForm';

export const metadata = {
  title: 'Sign in'
};

export default function LoginPage({
  searchParams
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const redirectParam = searchParams?.redirect;
  const redirectTo =
    typeof redirectParam === 'string' && redirectParam.startsWith('/') ? redirectParam : '/';

  const errorParam = searchParams?.error;
  const errorMessage = typeof errorParam === 'string' ? errorParam : null;

  return (
    <Container size="sm" className="py-16">
      <h1 className="font-display text-3xl font-bold text-text-primary">Sign in</h1>
      <p className="mt-2 text-text-muted">
        We will email you a link. No password to remember.
      </p>

      {errorMessage ? (
        <p
          role="alert"
          className="mt-6 rounded-sm border border-error/30 bg-surface p-3 text-sm text-error"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-8">
        <MagicLinkForm redirectTo={redirectTo} />
      </div>
    </Container>
  );
}
